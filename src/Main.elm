module Main exposing (main)

import AppUrl
import Browser
import Browser.Navigation
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
    , showAddBehavior : Bool
    , behaviorNameToAdd : String
    , showMenu : Bool
    }


type alias Behavior =
    { name : String
    , submits : List Time.Posix
    , resists : List Time.Posix
    }


type Route
    = HomeRoute
    | AddBehaviorRoute
    | SettingsRoute


routeToString : Route -> String
routeToString route =
    case route of
        HomeRoute ->
            "/"

        AddBehaviorRoute ->
            "/add-behavior"

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

        [ "add-behavior" ] ->
            AddBehaviorRoute

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
      , showAddBehavior = False
      , behaviorNameToAdd = ""
      , showMenu = False
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = UrlChanged Url
    | UrlRequested Browser.UrlRequest
    | ShowAddBehaviorClicked
    | DismissAddBehaviorClicked
    | AddBehavior
    | BehaviorNameToAddChanged String
    | SubmittedToBehavior Int
    | SubmittedToBehaviorAt Int Time.Posix
    | ResistedBehavior Int
    | ResistedBehaviorAt Int Time.Posix
    | ShowBehaviorEditor Int
    | HideBehaviorEditor
    | ShowMenu
    | HideMenu


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlChanged url ->
            ( { model | route = routeFromUrl url }, Cmd.none )

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

        ShowAddBehaviorClicked ->
            ( { model | showAddBehavior = True }, Cmd.none )

        DismissAddBehaviorClicked ->
            ( { model | showAddBehavior = False }, Cmd.none )

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

        ShowBehaviorEditor index ->
            ( model, Cmd.none )

        HideBehaviorEditor ->
            ( model, Cmd.none )

        ShowMenu ->
            ( { model | showMenu = True }, Cmd.none )

        HideMenu ->
            ( { model | showMenu = False }, Cmd.none )



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

        SettingsRoute ->
            viewMenu model


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
            [ buttonSecondarySmall "Back"
                HideMenu
            ]
        , Html.div
            [ Attr.style "height" "93vh"
            , Attr.style "overflow" "auto"
            ]
            [ Html.span [] [ Html.text "TODO: Stats" ]
            , Html.br [] []
            , Html.span [] [ Html.text "TODO: Edit behaviors (rename, remove)" ]
            , Html.br [] []
            , Html.span [] [ Html.text "TODO: Export (csv)" ]
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
            , buttonSecondaryIcon "✎"
                (ShowBehaviorEditor index)
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
            , Attr.style "padding-top" "8rem"
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
