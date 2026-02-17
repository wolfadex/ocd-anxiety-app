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

    else
        Html.div
            [ Attr.style "height" "100%"
            , Attr.style "width" "100%"
            , Attr.style "background-color" "#1a1a2e"
            , Attr.style "color" "#eee"
            , Attr.style "display" "flex"
            , Attr.style "flex-direction" "column"
            , Attr.style "font-size" "7vw"
            ]
            (case model.safetyBehaviors of
                [] ->
                    [ Html.div
                        [ Attr.style "font-size" "10vw"
                        , Attr.style "align-self" "center"
                        , Attr.style "justify-self" "center"
                        ]
                        [ buttonPrimary "Start tracking"
                            ShowAddBehaviorClicked
                        ]
                    ]

                safetyBehaviors ->
                    List.indexedMap
                        viewBehaviorInList
                        safetyBehaviors
                        ++ [ Html.div
                                [ Attr.style "font-size" "10vw"
                                , Attr.style "align-self" "center"
                                , Attr.style "margin-top" "2rem"
                                ]
                                [ buttonPrimary "Add Behavior"
                                    ShowAddBehaviorClicked
                                ]
                           ]
            )


viewBehaviorInList : Int -> Behavior -> Html Msg
viewBehaviorInList index behavior =
    Html.div
        [ Attr.style "width" "100%"
        , Attr.style "padding-left" "1rem"
        , Attr.style "padding-right" "1rem"
        ]
        [ Html.span [] [ Html.text behavior.name ]
        , Html.div
            [ Attr.style "display" "flex"
            , Attr.style "justify-content" "space-between"
            ]
            [ Html.div
                [ Attr.style "font-size" "6vw"
                , Attr.style "align-self" "center"
                , Attr.style "margin-top" "2rem"
                ]
                [ buttonSecondary "Submit"
                    (SubmittedToBehavior index)
                ]
            , Html.div
                [ Attr.style "font-size" "6vw"
                , Attr.style "align-self" "center"
                , Attr.style "margin-top" "2rem"
                ]
                [ buttonSecondary "Resist"
                    (ResistedBehavior index)
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



-- MAIN


main : Program Flags Model Msg
main =
    Browser.document
        { init = init
        , update = update
        , view = viewport
        , subscriptions = always Sub.none
        }
