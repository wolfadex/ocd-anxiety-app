port module Main exposing (main)

import AppUrl
import Browser
import Browser.Navigation
import Csv.Encode
import Date
import DateFormat
import Html exposing (Html)
import Html.Attributes as Attr
import Html.Events
import Task
import Time
import Url exposing (Url)


main : Program Flags Model Msg
main =
    Browser.application
        { init = init
        , update = update
        , view = viewport
        , subscriptions = always Sub.none
        , onUrlChange = UrlChanged
        , onUrlRequest = UrlRequested
        }


type alias Flags =
    ()


type alias Model =
    { navKey : Browser.Navigation.Key
    , route : Route
    , safetyBehaviors : List Behavior
    , behaviorNameToAdd : String
    , behaviorEditing : Maybe ( Behavior, Behavior )
    }


type alias Behavior =
    { name : String
    , submits : List Time.Posix
    , resists : List Time.Posix
    }


type Route
    = HomeRoute
    | AddBehaviorRoute
    | EditBehaviorRoute Int
    | SettingsRoute


routeToString : Route -> String
routeToString route =
    case route of
        HomeRoute ->
            "/"

        AddBehaviorRoute ->
            "/behavior/add"

        EditBehaviorRoute id ->
            "/behavior/" ++ String.fromInt id ++ "/edit"

        SettingsRoute ->
            "/settings"


routeFromUrl : Url -> Route
routeFromUrl url =
    let
        appUrl =
            AppUrl.fromUrl url
    in
    case appUrl.path of
        [] ->
            HomeRoute

        [ "behavior", "add" ] ->
            AddBehaviorRoute

        [ "behavior", idStr, "edit" ] ->
            case String.toInt idStr of
                Nothing ->
                    HomeRoute

                Just id ->
                    EditBehaviorRoute id

        [ "settings" ] ->
            SettingsRoute

        _ ->
            HomeRoute



-- INIT


init : Flags -> Url -> Browser.Navigation.Key -> ( Model, Cmd Msg )
init () url navKey =
    ( { navKey = navKey
      , route = routeFromUrl url
      , safetyBehaviors = []
      , behaviorNameToAdd = ""
      , behaviorEditing = Nothing
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = UrlChanged Url
    | UrlRequested Browser.UrlRequest
      --
    | AddBehavior
    | BehaviorNameToAddChanged String
    | SubmittedToBehavior Int
    | SubmittedToBehaviorAt Int Time.Posix
    | ResistedBehavior Int
    | ResistedBehaviorAt Int Time.Posix
    | BehaviorNameEdited String
    | RemoveSubmit Time.Posix
    | RemoveResist Time.Posix
    | SaveBehavior Int
      --
    | Export


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlChanged url ->
            let
                route =
                    routeFromUrl url
            in
            case route of
                EditBehaviorRoute id ->
                    case findBehaviorById id model.safetyBehaviors of
                        Nothing ->
                            ( { model
                                | route = route
                                , behaviorEditing = Nothing
                              }
                            , Cmd.none
                            )

                        Just behavior ->
                            ( { model
                                | route = route
                                , behaviorEditing = Just ( behavior, behavior )
                              }
                            , Cmd.none
                            )

                _ ->
                    ( { model
                        | route = route
                        , behaviorEditing = Nothing
                      }
                    , Cmd.none
                    )

        UrlRequested urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model
                    , Browser.Navigation.pushUrl model.navKey (Url.toString url)
                    )

                Browser.External url ->
                    ( model
                    , Browser.Navigation.load url
                    )

        BehaviorNameToAddChanged name ->
            ( { model | behaviorNameToAdd = name }, Cmd.none )

        AddBehavior ->
            if String.isEmpty model.behaviorNameToAdd then
                ( model, Cmd.none )

            else
                ( { model
                    | behaviorNameToAdd = ""
                    , safetyBehaviors = { name = model.behaviorNameToAdd, submits = [], resists = [] } :: model.safetyBehaviors
                  }
                , Browser.Navigation.pushUrl model.navKey (routeToString HomeRoute)
                )

        SubmittedToBehavior index ->
            ( model, Task.perform (SubmittedToBehaviorAt index) Time.now )

        SubmittedToBehaviorAt index time ->
            ( { model
                | safetyBehaviors =
                    List.indexedMap
                        (\idx behavior ->
                            if idx == index then
                                { behavior | submits = time :: behavior.submits }

                            else
                                behavior
                        )
                        model.safetyBehaviors
              }
            , Cmd.none
            )

        ResistedBehavior index ->
            ( model, Task.perform (ResistedBehaviorAt index) Time.now )

        ResistedBehaviorAt index time ->
            ( { model
                | safetyBehaviors =
                    List.indexedMap
                        (\idx behavior ->
                            if idx == index then
                                { behavior | resists = time :: behavior.resists }

                            else
                                behavior
                        )
                        model.safetyBehaviors
              }
            , Cmd.none
            )

        BehaviorNameEdited name ->
            case model.behaviorEditing of
                Nothing ->
                    ( model, Cmd.none )

                Just ( old, new ) ->
                    ( { model | behaviorEditing = Just ( old, { new | name = name } ) }, Cmd.none )

        RemoveSubmit timestamp ->
            case model.behaviorEditing of
                Nothing ->
                    ( model, Cmd.none )

                Just ( old, new ) ->
                    ( { model
                        | behaviorEditing =
                            Just
                                ( old
                                , { new
                                    | submits =
                                        List.filter
                                            (\submit -> submit /= timestamp)
                                            new.submits
                                  }
                                )
                      }
                    , Cmd.none
                    )

        RemoveResist timestamp ->
            case model.behaviorEditing of
                Nothing ->
                    ( model, Cmd.none )

                Just ( old, new ) ->
                    ( { model
                        | behaviorEditing =
                            Just
                                ( old
                                , { new
                                    | resists =
                                        List.filter
                                            (\resist -> resist /= timestamp)
                                            new.resists
                                  }
                                )
                      }
                    , Cmd.none
                    )

        SaveBehavior id ->
            case model.behaviorEditing of
                Nothing ->
                    ( model, Cmd.none )

                Just ( _, new ) ->
                    if String.isEmpty new.name then
                        ( model, Cmd.none )

                    else
                        ( { model
                            | safetyBehaviors =
                                List.indexedMap
                                    (\index behavior ->
                                        if index == id then
                                            new

                                        else
                                            behavior
                                    )
                                    model.safetyBehaviors
                          }
                        , Browser.Navigation.pushUrl model.navKey (routeToString HomeRoute)
                        )

        Export ->
            ( model
            , model.safetyBehaviors
                |> List.map
                    (\behavior ->
                        { name =
                            String.filter
                                (\char -> Char.isAlphaNum char || char == '_' || char == '-')
                                behavior.name
                                ++ "-safety-behavior-data.csv"
                        , type_ = "text/csv"
                        , data =
                            let
                                timestamps =
                                    List.map
                                        (\submit ->
                                            ( submit
                                            , "x"
                                            , ""
                                            )
                                        )
                                        behavior.submits
                                        ++ List.map
                                            (\resist ->
                                                ( resist
                                                , ""
                                                , "x"
                                                )
                                            )
                                            behavior.resists
                            in
                            timestamps
                                |> List.sortBy (\( t, _, _ ) -> Time.posixToMillis t)
                                |> Csv.Encode.encode
                                    { encoder =
                                        Csv.Encode.withFieldNames
                                            (\( date, submit, resist ) ->
                                                [ ( "date", exportDateFormatter Time.utc date )
                                                , ( "submit", submit )
                                                , ( "resist", resist )
                                                ]
                                            )
                                    , fieldSeparator = ','
                                    }
                        }
                    )
                |> export
            )


port export : List { name : String, data : String, type_ : String } -> Cmd msg


exportDateFormatter : Time.Zone -> Time.Posix -> String
exportDateFormatter =
    DateFormat.format
        [ DateFormat.dayOfMonthNumber
        , DateFormat.text "/"
        , DateFormat.monthNumber
        , DateFormat.text "/"
        , DateFormat.yearNumber
        , DateFormat.text " "
        , DateFormat.hourNumber
        , DateFormat.text ":"
        , DateFormat.minuteFixed
        , DateFormat.text " "
        , DateFormat.amPmUppercase
        ]


findBehaviorById : Int -> List Behavior -> Maybe Behavior
findBehaviorById id behaviors =
    behaviors
        |> List.drop id
        |> List.head



-- VIEW


viewport : Model -> Browser.Document Msg
viewport model =
    { title = "OCD / Anxiety App"
    , body =
        [ view model
        ]
    }


view : Model -> Html Msg
view model =
    case model.route of
        HomeRoute ->
            viewBehaviorList model

        AddBehaviorRoute ->
            viewAddBehavior model

        EditBehaviorRoute id ->
            viewEditBehavior id model

        SettingsRoute ->
            viewMenu model


viewEditBehavior : Int -> Model -> Html Msg
viewEditBehavior id model =
    case model.behaviorEditing of
        Nothing ->
            Html.div
                [ Attr.style "padding" "1rem"
                ]
                [ linkSecondary "Sorry, looks like we made a mistake"
                    HomeRoute
                ]

        Just ( current, edited ) ->
            Html.form
                [ Html.Events.onSubmit (SaveBehavior id)
                , Attr.style "padding" "8rem 0.5rem 0 0.5rem"
                , Attr.style "width" "calc(100vw - 1rem)"
                , Attr.style "display" "flex"
                , Attr.style "flex-direction" "column"
                , Attr.style "gap" "4rem"
                ]
                [ Html.h1 [] [ Html.span [] [ Html.text ("Editing: " ++ current.name) ] ]
                , Html.label
                    [ Attr.style "display" "flex"
                    , Attr.style "flex-direction" "column"
                    , Attr.style "align-items" "start"
                    ]
                    [ Html.span
                        [ Attr.style "font-size" "2rem"
                        ]
                        [ Html.text "Name" ]
                    , Html.input
                        [ Attr.style "font-size" "2rem"
                        , Attr.style "width" "100%"
                        , Attr.value edited.name
                        , Html.Events.onInput BehaviorNameEdited
                        ]
                        []
                    ]
                , Html.details
                    [ Attr.style "width" "100%"
                    , Attr.style "padding" "0 1rem"
                    ]
                    [ Html.summary [] [ Html.text "Submits" ]
                    , edited.submits
                        |> List.map
                            (\submit ->
                                Html.li []
                                    [ Html.text <| prettyDateFormatter Time.utc submit
                                    , buttonSecondarySmall "Remove"
                                        (RemoveSubmit submit)
                                    ]
                            )
                        |> Html.ol
                            [ Attr.style "list-style" "none"
                            ]
                    ]
                , Html.details
                    [ Attr.style "width" "100%"
                    , Attr.style "padding" "0 1rem"
                    ]
                    [ Html.summary [] [ Html.text "Resists" ]
                    , edited.resists
                        |> List.map
                            (\resist ->
                                Html.li []
                                    [ Html.text <| prettyDateFormatter Time.utc resist
                                    , buttonSecondarySmall "Remove"
                                        (RemoveResist resist)
                                    ]
                            )
                        |> Html.ol
                            [ Attr.style "list-style" "none"
                            ]
                    ]
                , Html.div
                    [ Attr.style "display" "flex"
                    , Attr.style "width" "100%"
                    , Attr.style "justify-content" "space-between"
                    ]
                    [ linkSecondary "Cancel"
                        HomeRoute
                    , buttonPrimary "Save" (SaveBehavior id)
                    ]
                ]


timePrettyPrint : Time.Posix -> String
timePrettyPrint time =
    let
        month =
            case Time.toMonth Time.utc time of
                Time.Jan ->
                    "Jan"

                Time.Feb ->
                    "Feb"

                Time.Mar ->
                    "Mar"

                Time.Apr ->
                    "Apr"

                Time.May ->
                    "May"

                Time.Jun ->
                    "Jun"

                Time.Jul ->
                    "Jul"

                Time.Aug ->
                    "Aug"

                Time.Sep ->
                    "Sep"

                Time.Oct ->
                    "Oct"

                Time.Nov ->
                    "Nov"

                Time.Dec ->
                    "Dec"

        day =
            Time.toDay Time.utc time
                |> String.fromInt

        year =
            Time.toYear Time.utc time
                |> String.fromInt

        hour =
            Time.toHour Time.utc time

        minute =
            Time.toMinute Time.utc time
                |> String.fromInt
                |> String.padLeft 2 '0'

        amPm =
            if hour > 11 then
                "PM"

            else
                "AM"

        hourStr =
            String.fromInt <|
                if hour == 0 then
                    12

                else if hour > 12 then
                    hour - 12

                else
                    hour
    in
    month ++ " " ++ day ++ ", " ++ year ++ " at " ++ hourStr ++ ":" ++ minute ++ " " ++ amPm


prettyDateFormatter : Time.Zone -> Time.Posix -> String
prettyDateFormatter =
    DateFormat.format
        [ DateFormat.monthNameAbbreviated
        , DateFormat.text " "
        , DateFormat.dayOfMonthSuffix
        , DateFormat.text ", "
        , DateFormat.yearNumber
        , DateFormat.text " at "
        , DateFormat.hourNumber
        , DateFormat.text ":"
        , DateFormat.minuteFixed
        , DateFormat.text " "
        , DateFormat.amPmUppercase
        ]


viewMenu : Model -> Html Msg
viewMenu model =
    Html.div
        [ Attr.style "height" "100vh"
        , Attr.style "width" "100vw"
        , Attr.style "display" "flex"
        , Attr.style "flex-direction" "column"
        , Attr.style "gap" "0.125rem"
        , Attr.style "font-size" "7vw"
        ]
        [ Html.div
            [ Attr.style "height" "7vh"
            , Attr.style "display" "flex"
            , Attr.style "align-items" "center"
            , Attr.style "justify-content" "space-between"
            , Attr.style "padding" "0.5rem"
            ]
            [ linkSecondarySmall "Back"
                HomeRoute
            ]
        , Html.div
            [ Attr.style "height" "93vh"
            , Attr.style "overflow" "auto"
            ]
            [ Html.span [] [ Html.text "TODO: Stats" ]
            , Html.br [] []
            , Html.span [] [ Html.text "TODO: Edit behaviors (rename, remove)" ]
            , Html.br [] []
            , buttonSecondary "Export (csv)"
                Export
            , Html.br [] []
            , Html.span [] [ Html.text "TODO: Import (csv)" ]
            ]
        ]


viewBehaviorList : Model -> Html Msg
viewBehaviorList model =
    case model.safetyBehaviors of
        [] ->
            Html.div
                [ Attr.style "height" "100vh"
                , Attr.style "width" "100vw"
                , Attr.style "display" "flex"
                , Attr.style "flex-direction" "column"
                , Attr.style "font-size" "7vw"
                , Attr.style "align-items" "center"
                , Attr.style "justify-content" "center"
                ]
                [ Html.h1 [] [ Html.span [] [ Html.text "Welcome!" ] ]
                , Html.div
                    [ Attr.style "font-size" "3rem"
                    ]
                    [ linkPrimary "Start tracking"
                        AddBehaviorRoute
                    ]
                ]

        safetyBehaviors ->
            Html.div
                [ Attr.style "height" "100vh"
                , Attr.style "width" "100vw"
                , Attr.style "display" "flex"
                , Attr.style "flex-direction" "column"
                , Attr.style "gap" "0.125rem"
                , Attr.style "font-size" "7vw"
                ]
                [ Html.div
                    [ Attr.style "height" "7vh"
                    , Attr.style "display" "flex"
                    , Attr.style "align-items" "center"
                    , Attr.style "justify-content" "space-between"
                    , Attr.style "padding" "0.5rem"
                    ]
                    [ linkPrimarySmall "Add behavior"
                        AddBehaviorRoute
                    , linkSecondaryIcon "☰"
                        SettingsRoute
                    ]
                , Html.div
                    [ Attr.style "height" "93vh"
                    , Attr.style "overflow" "auto"
                    ]
                    (List.indexedMap
                        viewBehaviorInList
                        safetyBehaviors
                    )
                ]


viewBehaviorInList : Int -> Behavior -> Html Msg
viewBehaviorInList index behavior =
    Html.div
        [ Attr.style "width" "calc(100% - 1rem)"
        , Attr.style "padding" "0.5rem 1rem 1rem 1rem"
        , Attr.style "margin" "0.5rem"
        , Attr.style "border-radius" "0.5rem"
        , Attr.style "background" "hsl(265deg, 100%, 95%)"
        ]
        [ Html.div
            [ Attr.style "display" "flex"
            , Attr.style "justify-content" "space-between"
            , Attr.style "align-items" "center"
            ]
            [ Html.span [] [ Html.text behavior.name ]
            , linkSecondaryIcon "✎"
                (EditBehaviorRoute index)
            ]
        , Html.div
            [ Attr.style "display" "flex"
            , Attr.style "justify-content" "space-between"
            , Attr.style "margin-top" "1rem"
            ]
            [ Html.div
                [ Attr.style "font-size" "6vw"
                , Attr.style "align-self" "center"
                ]
                [ buttonSecondary "Submit"
                    (SubmittedToBehavior index)
                ]
            , Html.div
                [ Attr.style "font-size" "6vw"
                , Attr.style "align-self" "center"
                ]
                [ buttonSecondary "Resist"
                    (ResistedBehavior index)
                ]
            ]
        ]


viewAddBehavior : Model -> Html Msg
viewAddBehavior model =
    Html.div
        [ Attr.style "height" "100svh"
        , Attr.style "width" "100dvw"
        , Attr.style "display" "flex"
        , Attr.style "flex-direction" "column"
        , Attr.style "align-items" "center"
        ]
        [ Html.h1 [] [ Html.text "Add behavior" ]
        , Html.form
            [ Html.Events.onSubmit AddBehavior
            , Attr.style "padding" "8rem 0.5rem 0 0.5rem"
            , Attr.style "width" "calc(100vw - 1rem)"
            , Attr.style "display" "flex"
            , Attr.style "flex-direction" "column"
            , Attr.style "gap" "4rem"
            ]
            [ Html.label
                [ Attr.style "display" "flex"
                , Attr.style "flex-direction" "column"
                , Attr.style "align-items" "start"
                ]
                [ Html.span
                    [ Attr.style "font-size" "2rem"
                    ]
                    [ Html.text "Name" ]
                , Html.input
                    [ Attr.style "font-size" "2rem"
                    , Attr.style "width" "100%"
                    , Attr.value model.behaviorNameToAdd
                    , Html.Events.onInput BehaviorNameToAddChanged
                    ]
                    []
                ]
            , Html.div
                [ Attr.style "display" "flex"
                , Attr.style "width" "100%"
                , Attr.style "justify-content" "space-between"
                ]
                [ linkSecondary "Cancel"
                    HomeRoute
                , buttonPrimary "Add" AddBehavior
                ]
            ]
        ]


buttonPrimary : String -> Msg -> Html Msg
buttonPrimary label action =
    Html.button
        [ Attr.class "pushable"
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge" ] []
        , Html.span [ Attr.class "front" ] [ Html.text label ]
        ]


linkPrimary : String -> Route -> Html Msg
linkPrimary label route =
    Html.a
        [ Attr.class "pushable"
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge" ] []
        , Html.span [ Attr.class "front" ] [ Html.text label ]
        ]


buttonPrimarySmall : String -> Msg -> Html Msg
buttonPrimarySmall label action =
    Html.button
        [ Attr.class "pushable"
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge" ] []
        , Html.span [ Attr.class "front front-small" ] [ Html.text label ]
        ]


linkPrimarySmall : String -> Route -> Html Msg
linkPrimarySmall label route =
    Html.a
        [ Attr.class "pushable"
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge" ] []
        , Html.span [ Attr.class "front front-small" ] [ Html.text label ]
        ]


buttonSecondary : String -> Msg -> Html Msg
buttonSecondary label action =
    Html.button
        [ Attr.class "pushable"
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge edge-secondary" ] []
        , Html.span [ Attr.class "front front-secondary" ] [ Html.text label ]
        ]


linkSecondary : String -> Route -> Html Msg
linkSecondary label route =
    Html.a
        [ Attr.class "pushable"
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge edge-secondary" ] []
        , Html.span [ Attr.class "front front-secondary" ] [ Html.text label ]
        ]


buttonSecondarySmall : String -> Msg -> Html Msg
buttonSecondarySmall label action =
    Html.button
        [ Attr.class "pushable"
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge edge-secondary" ] []
        , Html.span [ Attr.class "front front-secondary front-small" ] [ Html.text label ]
        ]


linkSecondarySmall : String -> Route -> Html Msg
linkSecondarySmall label route =
    Html.a
        [ Attr.class "pushable"
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge edge-secondary" ] []
        , Html.span [ Attr.class "front front-secondary front-small" ] [ Html.text label ]
        ]


buttonSecondaryIcon : String -> Msg -> Html Msg
buttonSecondaryIcon label action =
    Html.button
        [ Attr.class "pushable"
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge edge-secondary" ] []
        , Html.span [ Attr.class "front front-secondary front-icon" ] [ Html.text label ]
        ]


linkSecondaryIcon : String -> Route -> Html Msg
linkSecondaryIcon label route =
    Html.a
        [ Attr.class "pushable"
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Attr.class "shadow" ] []
        , Html.span [ Attr.class "edge edge-secondary" ] []
        , Html.span [ Attr.class "front front-secondary front-icon" ] [ Html.text label ]
        ]
