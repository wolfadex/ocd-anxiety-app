module Main exposing (main)

import Browser
import Html exposing (Html)
import Html.Attributes as Attr
import Html.Events
import Task
import Time


type alias Flags =
    { safeAreaTopInPx : Int
    }


type alias Model =
    { safeAreaTopInPx : Int
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



-- INIT


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { safeAreaTopInPx = flags.safeAreaTopInPx
      , safetyBehaviors = []
      , showAddBehavior = False
      , behaviorNameToAdd = ""
      , showMenu = False
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = ShowAddBehaviorClicked
    | DismissAddBehaviorClicked
    | AddBehavior
    | BehaviorNameToAddChanged String
    | SubmittedToBehavior Int
    | SubmittedToBehaviorAt Int Time.Posix
    | ResistedBehavior Int
    | ResistedBehaviorAt Int Time.Posix
    | ShowMenu
    | HideMenu


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
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
                    , showAddBehavior = False
                    , safetyBehaviors = { name = model.behaviorNameToAdd, submits = [], resists = [] } :: model.safetyBehaviors
                  }
                , Cmd.none
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

        ShowMenu ->
            ( { model | showMenu = True }, Cmd.none )

        HideMenu ->
            ( { model | showMenu = False }, Cmd.none )



-- VIEW


viewport : Model -> Browser.Document Msg
viewport model =
    { title = "OCD / Anxiety App"
    , body =
        [ safeAreaSpacer model.safeAreaTopInPx
        , view model
        ]
    }


safeAreaSpacer : Int -> Html msg
safeAreaSpacer topInPx =
    Html.div
        [ Attr.style "height" (String.fromInt topInPx ++ "px")
        , Attr.style "background-color" "#1a1a2e"
        ]
        []


view : Model -> Html Msg
view model =
    if model.showAddBehavior then
        viewAddBehavior model

    else if model.showMenu then
        viewMenu model

    else
        viewBehaviorList model


viewMenu : Model -> Html Msg
viewMenu model =
    Html.div
        [ Attr.style "height" "100vh"
        , Attr.style "width" "100vw"
        , Attr.style "background-color" "#1a1a2e"
        , Attr.style "color" "#eee"
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
                , Attr.style "background-color" "#1a1a2e"
                , Attr.style "color" "#eee"
                , Attr.style "display" "flex"
                , Attr.style "flex-direction" "column"
                , Attr.style "font-size" "7vw"
                , Attr.style "align-items" "center"
                , Attr.style "justify-content" "center"
                ]
                [ Html.div
                    [ Attr.style "font-size" "10vw"
                    ]
                    [ buttonPrimary "Start tracking"
                        ShowAddBehaviorClicked
                    ]
                ]

        safetyBehaviors ->
            Html.div
                [ Attr.style "height" "100vh"
                , Attr.style "width" "100vw"
                , Attr.style "background-color" "#1a1a2e"
                , Attr.style "color" "#eee"
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
                    [ buttonPrimarySmall "Add behavior"
                        ShowAddBehaviorClicked
                    , buttonSecondaryIcon "☰"
                        ShowMenu
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
        , Attr.style "background" "hsl(265deg, 4.4%, 26.6%)"
        ]
        [ Html.span [] [ Html.text behavior.name ]
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
        [ Attr.style "height" "100%"
        , Attr.style "width" "100%"
        , Attr.style "background-color" "#1a1a2e"
        , Attr.style "color" "#eee"
        , Attr.style "font-size" "10vw"
        , Attr.style "display" "flex"
        , Attr.style "flex-direction" "column"
        , Attr.style "align-items" "center"
        ]
        [ Html.h2 [] [ Html.text "Add behavior" ]
        , Html.form [ Html.Events.onSubmit AddBehavior ]
            [ Html.label
                []
                [ Html.span [ Attr.style "padding-left" "0.6rem" ] [ Html.text "Name" ]
                , Html.input
                    [ Attr.style "margin-left" "1rem"
                    , Attr.style "font-size" "6vw"
                    , Attr.value model.behaviorNameToAdd
                    , Html.Events.onInput BehaviorNameToAddChanged
                    ]
                    []
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



-- MAIN


main : Program Flags Model Msg
main =
    Browser.document
        { init = init
        , update = update
        , view = viewport
        , subscriptions = always Sub.none
        }
