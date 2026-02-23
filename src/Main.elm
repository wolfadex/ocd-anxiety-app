port module Main exposing (Application, Behavior, Flags, Model, Msg, Route, main)

import AppUrl
import Browser
import Browser.Navigation
import ConcurrentTask exposing (ConcurrentTask, UnexpectedError)
import Css
import Csv.Encode
import DateFormat
import Html exposing (Html)
import Html.Attributes as Attr
import Html.Events
import IndexedDb
import Json.Decode
import Json.Encode
import Random
import Rfc3339
import Task
import Time
import Time.Extra
import UUID exposing (UUID)
import Url exposing (Url)


main : Program Flags Application Msg
main =
    Browser.application
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        , onUrlChange = UrlChanged
        , onUrlRequest = UrlRequested
        }


type alias Flags =
    { seed1 : Int
    , seed2 : Int
    , seed3 : Int
    , seed4 : Int
    }


type Saving
    = Fresh
    | Saving
    | FailedToSave String


type Application
    = Initializing InitModel
    | StartupFailure
    | Initialized Model


type alias InitModel =
    { navKey : Browser.Navigation.Key
    , dbTasks : ConcurrentTask.Pool Msg
    , url : Url
    , seeds : UUID.Seeds
    }


type alias Model =
    { navKey : Browser.Navigation.Key
    , dbTasks : ConcurrentTask.Pool Msg
    , seeds : UUID.Seeds
    , db : IndexedDb.Db
    , route : Route
    , safetyBehaviors : List Behavior
    , behaviorNameToAdd : String
    , addingBehavior : Saving
    , behaviorEditing : Maybe BehaviorEditing
    , editingBehavior : Saving
    , confirmDelete : Maybe UUID
    , deleting : Bool
    }


type alias BehaviorEditing =
    { old : Behavior
    , new : Behavior
    , submitToInsert : String
    , resistToInsert : String
    }


type alias Behavior =
    { id : UUID
    , name : String
    , submits : List Time.Posix
    , resists : List Time.Posix
    }


type Route
    = HomeRoute
    | AddBehaviorRoute
    | EditBehaviorRoute UUID
    | SettingsRoute


routeToString : Route -> String
routeToString route =
    case route of
        HomeRoute ->
            "/"

        AddBehaviorRoute ->
            "/behavior/add"

        EditBehaviorRoute id ->
            "/behavior/" ++ UUID.toString id ++ "/edit"

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
            case UUID.fromString idStr of
                Err _ ->
                    HomeRoute

                Ok id ->
                    EditBehaviorRoute id

        [ "settings" ] ->
            SettingsRoute

        _ ->
            HomeRoute


behaviorStore : IndexedDb.Store IndexedDb.InlineKey
behaviorStore =
    IndexedDb.defineStore "safetyBehaviors"
        |> IndexedDb.withKeyPath "id"


appSchema : IndexedDb.Schema
appSchema =
    IndexedDb.schema "safetyBehaviorsTracking" 1
        |> IndexedDb.withStore behaviorStore


encodeBehavior : Behavior -> Json.Encode.Value
encodeBehavior behavior =
    Json.Encode.object
        [ ( "id", UUID.toValue behavior.id )
        , ( "name", Json.Encode.string behavior.name )
        , ( "submits", Json.Encode.list (Time.posixToMillis >> Json.Encode.int) behavior.submits )
        , ( "resists", Json.Encode.list (Time.posixToMillis >> Json.Encode.int) behavior.resists )
        ]


decodeBehavior : Json.Decode.Decoder Behavior
decodeBehavior =
    Json.Decode.map4 Behavior
        (Json.Decode.field "id" UUID.jsonDecoder)
        (Json.Decode.field "name" Json.Decode.string)
        (Json.Decode.field "submits" (Json.Decode.list (Json.Decode.map Time.millisToPosix Json.Decode.int)))
        (Json.Decode.field "resists" (Json.Decode.list (Json.Decode.map Time.millisToPosix Json.Decode.int)))



-- INIT


init : Flags -> Url -> Browser.Navigation.Key -> ( Application, Cmd Msg )
init flags url navKey =
    let
        ( dbTasks, cmd ) =
            ConcurrentTask.attempt
                { send = sendToDb
                , pool = ConcurrentTask.pool
                , onComplete = DbLoaded
                }
                loadBehaviors
    in
    ( Initializing
        { navKey = navKey
        , dbTasks = dbTasks
        , url = url
        , seeds =
            { seed1 = Random.initialSeed flags.seed1
            , seed2 = Random.initialSeed flags.seed2
            , seed3 = Random.initialSeed flags.seed3
            , seed4 = Random.initialSeed flags.seed4
            }
        }
    , cmd
    )


loadBehaviors : ConcurrentTask IndexedDb.Error ( IndexedDb.Db, List Behavior )
loadBehaviors =
    IndexedDb.open appSchema
        |> ConcurrentTask.andThen loadBehaviorsData


loadBehaviorsData : IndexedDb.Db -> ConcurrentTask IndexedDb.Error ( IndexedDb.Db, List Behavior )
loadBehaviorsData db =
    IndexedDb.getAll db behaviorStore decodeBehavior
        |> ConcurrentTask.map (Tuple.pair db)



-- SUBSCRIPTIONS


subscriptions : Application -> Sub Msg
subscriptions app =
    case app of
        StartupFailure ->
            Sub.none

        Initializing model ->
            ConcurrentTask.onProgress
                { send = sendToDb
                , receive = receiveFromDb
                , onProgress = OnDbProgress
                }
                model.dbTasks

        Initialized model ->
            ConcurrentTask.onProgress
                { send = sendToDb
                , receive = receiveFromDb
                , onProgress = OnDbProgress
                }
                model.dbTasks


port sendToDb : Json.Encode.Value -> Cmd msg


port receiveFromDb : (Json.Encode.Value -> msg) -> Sub msg



-- UPDATE


type Msg
    = UrlChanged Url
    | UrlRequested Browser.UrlRequest
      --
    | OnDbProgress ( ConcurrentTask.Pool Msg, Cmd Msg )
    | DbLoaded (ConcurrentTask.Response IndexedDb.Error ( IndexedDb.Db, List Behavior ))
      --
    | AddBehavior
    | BehaviorCreateResponded UUID (ConcurrentTask.Response IndexedDb.Error IndexedDb.Key)
    | BehaviorNameToAddChanged String
    | SubmittedToBehavior UUID
    | SubmittedToBehaviorAt UUID Time.Posix
    | ResistedBehavior UUID
    | ResistedBehaviorAt UUID Time.Posix
    | BehaviorNameEdited String
    | RemoveSubmit Time.Posix
    | SubmitToInsertChanged String
    | InsertSubmit
    | RemoveResist Time.Posix
    | ResistToInsertChanged String
    | InsertResist
    | SaveBehavior UUID
    | BehaviorSaveResponded UUID (ConcurrentTask.Response IndexedDb.Error IndexedDb.Key)
    | DeleteBehavior UUID
    | ConfirmDeleteBehavior UUID
    | BehaviorDeleteResponded UUID (ConcurrentTask.Response IndexedDb.Error ())
    | CancelDeleteBehavior
      --
    | Export


update : Msg -> Application -> ( Application, Cmd Msg )
update msg app =
    case app of
        StartupFailure ->
            ( app, Cmd.none )

        Initializing model ->
            case msg of
                UrlChanged url ->
                    ( Initializing
                        { model
                            | url = url
                        }
                    , Cmd.none
                    )

                UrlRequested urlRequest ->
                    case urlRequest of
                        Browser.Internal url ->
                            ( app
                            , Browser.Navigation.pushUrl model.navKey (Url.toString url)
                            )

                        Browser.External url ->
                            ( app
                            , Browser.Navigation.load url
                            )

                --
                OnDbProgress ( dbTasks, cmd ) ->
                    ( Initializing { model | dbTasks = dbTasks }, cmd )

                DbLoaded response ->
                    case response of
                        ConcurrentTask.Error err ->
                            let
                                _ =
                                    Debug.todo (Debug.toString err)
                            in
                            ( StartupFailure, Cmd.none )

                        ConcurrentTask.UnexpectedError err ->
                            let
                                _ =
                                    Debug.todo (Debug.toString err)
                            in
                            ( StartupFailure, Cmd.none )

                        ConcurrentTask.Success ( db, behaviors ) ->
                            let
                                route =
                                    routeFromUrl model.url
                            in
                            ( { navKey = model.navKey
                              , dbTasks = model.dbTasks
                              , db = db
                              , seeds = model.seeds
                              , route = route
                              , safetyBehaviors = behaviors
                              , behaviorNameToAdd = ""
                              , addingBehavior = Fresh
                              , behaviorEditing = Nothing
                              , editingBehavior = Fresh
                              , confirmDelete = Nothing
                              , deleting = False
                              }
                                |> (\m ->
                                        case route of
                                            EditBehaviorRoute key ->
                                                case findBehaviorById key m.safetyBehaviors of
                                                    Nothing ->
                                                        m

                                                    Just behavior ->
                                                        { m
                                                            | behaviorEditing =
                                                                Just
                                                                    { old = behavior
                                                                    , new = behavior
                                                                    , submitToInsert = ""
                                                                    , resistToInsert = ""
                                                                    }
                                                            , confirmDelete = Nothing
                                                            , deleting = False
                                                        }

                                            _ ->
                                                m
                                   )
                                |> Initialized
                            , Cmd.none
                            )

                _ ->
                    ( app, Cmd.none )

        Initialized model ->
            Tuple.mapFirst Initialized <|
                case msg of
                    UrlChanged url ->
                        let
                            route =
                                routeFromUrl url
                        in
                        case route of
                            EditBehaviorRoute key ->
                                case findBehaviorById key model.safetyBehaviors of
                                    Nothing ->
                                        ( { model
                                            | route = route
                                            , behaviorEditing = Nothing
                                            , deleting = False
                                          }
                                        , Cmd.none
                                        )

                                    Just behavior ->
                                        ( { model
                                            | route = route
                                            , behaviorEditing =
                                                Just
                                                    { old = behavior
                                                    , new = behavior
                                                    , submitToInsert = ""
                                                    , resistToInsert = ""
                                                    }
                                            , editingBehavior = Fresh
                                            , confirmDelete = Nothing
                                            , deleting = False
                                          }
                                        , Cmd.none
                                        )

                            AddBehaviorRoute ->
                                ( { model
                                    | route = route
                                    , addingBehavior = Fresh
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

                    --
                    OnDbProgress ( dbTasks, cmd ) ->
                        ( { model | dbTasks = dbTasks }, cmd )

                    DbLoaded _ ->
                        ( model, Cmd.none )

                    --
                    BehaviorNameToAddChanged name ->
                        ( { model | behaviorNameToAdd = name }, Cmd.none )

                    AddBehavior ->
                        case model.addingBehavior of
                            Saving ->
                                ( model, Cmd.none )

                            _ ->
                                if String.isEmpty model.behaviorNameToAdd then
                                    ( model, Cmd.none )

                                else
                                    let
                                        ( id, seeds ) =
                                            UUID.step model.seeds

                                        ( dbTasks, cmd ) =
                                            doDbTask
                                                (BehaviorCreateResponded id)
                                                (IndexedDb.add model.db
                                                    behaviorStore
                                                    (encodeBehavior
                                                        { id = id
                                                        , name = model.behaviorNameToAdd
                                                        , submits = []
                                                        , resists = []
                                                        }
                                                    )
                                                )
                                    in
                                    ( { model
                                        | addingBehavior = Saving
                                        , dbTasks = dbTasks
                                        , seeds = seeds
                                      }
                                    , cmd
                                    )

                    BehaviorCreateResponded id response ->
                        case response of
                            ConcurrentTask.Error err ->
                                ( { model
                                    | addingBehavior =
                                        FailedToSave <|
                                            case err of
                                                IndexedDb.AlreadyExists ->
                                                    "Already exists"

                                                IndexedDb.TransactionError e ->
                                                    e

                                                IndexedDb.QuotaExceeded ->
                                                    "Quota exceeded"

                                                IndexedDb.DatabaseError e ->
                                                    e
                                  }
                                , Cmd.none
                                )

                            ConcurrentTask.UnexpectedError _ ->
                                ( { model
                                    | addingBehavior = FailedToSave "Unexpected error"
                                  }
                                , Cmd.none
                                )

                            ConcurrentTask.Success _ ->
                                ( { model
                                    | behaviorNameToAdd = ""
                                    , safetyBehaviors =
                                        { id = id
                                        , name = model.behaviorNameToAdd
                                        , submits = []
                                        , resists = []
                                        }
                                            :: model.safetyBehaviors
                                  }
                                , Browser.Navigation.pushUrl model.navKey (routeToString HomeRoute)
                                )

                    SubmittedToBehavior key ->
                        ( model, Task.perform (SubmittedToBehaviorAt key) Time.now )

                    SubmittedToBehaviorAt id time ->
                        case findBehaviorById id model.safetyBehaviors of
                            Nothing ->
                                ( model, Cmd.none )

                            Just b ->
                                let
                                    ( dbTasks, cmd ) =
                                        doDbTask
                                            (BehaviorSaveResponded id)
                                            (IndexedDb.put model.db
                                                behaviorStore
                                                (encodeBehavior b)
                                            )
                                in
                                ( { model
                                    | dbTasks = dbTasks
                                    , safetyBehaviors =
                                        List.map
                                            (\behavior ->
                                                if behavior.id == id then
                                                    { behavior | submits = time :: behavior.submits }

                                                else
                                                    behavior
                                            )
                                            model.safetyBehaviors
                                  }
                                , cmd
                                )

                    ResistedBehavior key ->
                        ( model, Task.perform (ResistedBehaviorAt key) Time.now )

                    ResistedBehaviorAt id time ->
                        case findBehaviorById id model.safetyBehaviors of
                            Nothing ->
                                ( model, Cmd.none )

                            Just b ->
                                let
                                    ( dbTasks, cmd ) =
                                        doDbTask
                                            (BehaviorSaveResponded id)
                                            (IndexedDb.put model.db
                                                behaviorStore
                                                (encodeBehavior b)
                                            )
                                in
                                ( { model
                                    | dbTasks = dbTasks
                                    , safetyBehaviors =
                                        List.map
                                            (\behavior ->
                                                if behavior.id == id then
                                                    { behavior | resists = time :: behavior.resists }

                                                else
                                                    behavior
                                            )
                                            model.safetyBehaviors
                                  }
                                , cmd
                                )

                    BehaviorNameEdited name ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just ({ new } as behaviorEditing) ->
                                ( { model | behaviorEditing = Just { behaviorEditing | new = { new | name = name } } }, Cmd.none )

                    RemoveSubmit timestamp ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just ({ new } as behaviorEditing) ->
                                ( { model
                                    | behaviorEditing =
                                        Just
                                            { behaviorEditing
                                                | new =
                                                    { new
                                                        | submits =
                                                            List.filter
                                                                (\submit -> submit /= timestamp)
                                                                new.submits
                                                    }
                                            }
                                  }
                                , Cmd.none
                                )

                    SubmitToInsertChanged submitToInsert ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just behaviorEditing ->
                                ( { model | behaviorEditing = Just { behaviorEditing | submitToInsert = submitToInsert } }, Cmd.none )

                    InsertSubmit ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just ({ new } as behaviorEditing) ->
                                case Rfc3339.parse (behaviorEditing.submitToInsert ++ ":00") of
                                    Ok (Rfc3339.DateTimeLocal parts) ->
                                        ( { model
                                            | behaviorEditing =
                                                let
                                                    submits =
                                                        new.submits
                                                in
                                                Just
                                                    { behaviorEditing
                                                        | submitToInsert = ""
                                                        , new =
                                                            { new
                                                                | submits =
                                                                    (Time.Extra.partsToPosix Time.utc parts :: submits)
                                                                        |> List.sortBy Time.posixToMillis
                                                                        |> List.reverse
                                                            }
                                                    }
                                          }
                                        , Cmd.none
                                        )

                                    _ ->
                                        ( model, Cmd.none )

                    RemoveResist timestamp ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just ({ new } as behaviorEditing) ->
                                ( { model
                                    | behaviorEditing =
                                        Just
                                            { behaviorEditing
                                                | new =
                                                    { new
                                                        | resists =
                                                            List.filter
                                                                (\resist -> resist /= timestamp)
                                                                new.resists
                                                    }
                                            }
                                  }
                                , Cmd.none
                                )

                    ResistToInsertChanged resistToInsert ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just behaviorEditing ->
                                ( { model | behaviorEditing = Just { behaviorEditing | resistToInsert = resistToInsert } }, Cmd.none )

                    InsertResist ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just ({ new } as behaviorEditing) ->
                                case Rfc3339.parse (behaviorEditing.resistToInsert ++ ":00") of
                                    Ok (Rfc3339.DateTimeLocal parts) ->
                                        ( { model
                                            | behaviorEditing =
                                                let
                                                    resists =
                                                        new.resists
                                                in
                                                Just
                                                    { behaviorEditing
                                                        | resistToInsert = ""
                                                        , new =
                                                            { new
                                                                | resists =
                                                                    (Time.Extra.partsToPosix Time.utc parts :: resists)
                                                                        |> List.sortBy Time.posixToMillis
                                                                        |> List.reverse
                                                            }
                                                    }
                                          }
                                        , Cmd.none
                                        )

                                    _ ->
                                        ( model, Cmd.none )

                    SaveBehavior id ->
                        case model.behaviorEditing of
                            Nothing ->
                                ( model, Cmd.none )

                            Just { new } ->
                                if String.isEmpty new.name then
                                    ( model, Cmd.none )

                                else
                                    let
                                        ( dbTasks, cmd ) =
                                            doDbTask
                                                (BehaviorSaveResponded id)
                                                (IndexedDb.put model.db
                                                    behaviorStore
                                                    (encodeBehavior new)
                                                )
                                    in
                                    ( { model
                                        | dbTasks = dbTasks
                                        , safetyBehaviors =
                                            List.map
                                                (\behavior ->
                                                    if behavior.id == id then
                                                        new

                                                    else
                                                        behavior
                                                )
                                                model.safetyBehaviors
                                      }
                                    , Cmd.batch [ Browser.Navigation.pushUrl model.navKey (routeToString HomeRoute), cmd ]
                                    )

                    BehaviorSaveResponded id response ->
                        case response of
                            ConcurrentTask.Error err ->
                                ( { model
                                    | editingBehavior =
                                        FailedToSave <|
                                            case err of
                                                IndexedDb.AlreadyExists ->
                                                    "Already exists"

                                                IndexedDb.TransactionError e ->
                                                    e

                                                IndexedDb.QuotaExceeded ->
                                                    "Quota exceeded"

                                                IndexedDb.DatabaseError e ->
                                                    e
                                  }
                                , Cmd.none
                                )

                            ConcurrentTask.UnexpectedError _ ->
                                ( { model
                                    | editingBehavior = FailedToSave "Unexpected error"
                                  }
                                , Cmd.none
                                )

                            ConcurrentTask.Success _ ->
                                ( model
                                , Cmd.none
                                )

                    DeleteBehavior id ->
                        ( { model | confirmDelete = Just id }, Cmd.none )

                    ConfirmDeleteBehavior id ->
                        let
                            ( dbTasks, cmd ) =
                                doDbTask
                                    (BehaviorDeleteResponded id)
                                    (IndexedDb.delete model.db behaviorStore (uuidToKey id))
                        in
                        ( { model
                            | deleting = True
                            , dbTasks = dbTasks
                          }
                        , cmd
                        )

                    BehaviorDeleteResponded key response ->
                        case response of
                            ConcurrentTask.Error err ->
                                ( { model
                                    | editingBehavior =
                                        FailedToSave <|
                                            case err of
                                                IndexedDb.AlreadyExists ->
                                                    "Already exists"

                                                IndexedDb.TransactionError e ->
                                                    e

                                                IndexedDb.QuotaExceeded ->
                                                    "Quota exceeded"

                                                IndexedDb.DatabaseError e ->
                                                    e
                                  }
                                , Cmd.none
                                )

                            ConcurrentTask.UnexpectedError _ ->
                                ( { model
                                    | editingBehavior = FailedToSave "Unexpected error"
                                  }
                                , Cmd.none
                                )

                            ConcurrentTask.Success () ->
                                ( { model
                                    | confirmDelete = Nothing
                                    , deleting = False
                                    , safetyBehaviors = List.filter (\b -> b.id /= key) model.safetyBehaviors
                                  }
                                , Browser.Navigation.pushUrl model.navKey (routeToString HomeRoute)
                                )

                    CancelDeleteBehavior ->
                        ( { model | confirmDelete = Nothing }, Cmd.none )

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


uuidToKey : UUID -> IndexedDb.Key
uuidToKey uuid =
    IndexedDb.StringKey (UUID.toString uuid)


doDbTask : (ConcurrentTask.Response IndexedDb.Error a -> Msg) -> ConcurrentTask IndexedDb.Error a -> ( ConcurrentTask.Pool Msg, Cmd Msg )
doDbTask onComplete task =
    ConcurrentTask.attempt
        { pool = ConcurrentTask.pool
        , send = sendToDb
        , onComplete = onComplete
        }
        task


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


findBehaviorById : UUID -> List Behavior -> Maybe Behavior
findBehaviorById id behaviors =
    case behaviors of
        [] ->
            Nothing

        behavior :: rest ->
            if behavior.id == id then
                Just behavior

            else
                findBehaviorById id rest



-- VIEW


view : Application -> Browser.Document Msg
view app =
    { title = "OCD / Anxiety App"
    , body =
        [ viewApp app
        ]
    }


viewApp : Application -> Html Msg
viewApp app =
    case app of
        StartupFailure ->
            Html.div []
                [ Html.text "Initialization failure. Try reloading the page" ]

        Initializing _ ->
            Html.div
                [ Attr.style "width" "3rem"
                , Attr.style "height" "3rem"
                ]
                [ spinner ]

        Initialized model ->
            case model.route of
                HomeRoute ->
                    viewBehaviorList model

                AddBehaviorRoute ->
                    viewAddBehavior model

                EditBehaviorRoute id ->
                    viewEditBehavior id model

                SettingsRoute ->
                    viewMenu


viewEditBehavior : UUID -> Model -> Html Msg
viewEditBehavior id model =
    case model.behaviorEditing of
        Nothing ->
            Html.div
                [ Attr.style "padding" "1rem"
                ]
                [ linkSecondary "Sorry, looks like we made a mistake"
                    HomeRoute
                ]

        Just behaviorEditing ->
            Html.div
                [ Attr.style "height" "100svh"
                , Attr.style "width" "100dvw"
                , Attr.style "display" "flex"
                , Attr.style "flex-direction" "column"
                , Attr.style "align-items" "center"
                ]
                [ Html.h1 []
                    [ Html.span [] [ Html.text "Editing: " ]
                    , Html.span [ Attr.style "font-weight" "normal" ] [ Html.text behaviorEditing.old.name ]
                    ]
                , Html.form
                    [ Html.Events.onSubmit (SaveBehavior id)
                    , Attr.style "padding" "0 0.5rem"
                    , Attr.style "width" "calc(100vw - 1rem)"
                    , Attr.style "height" "100vh"
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
                            , Attr.required True
                            , setInvalid <|
                                case model.editingBehavior of
                                    FailedToSave err ->
                                        Just err

                                    _ ->
                                        Nothing
                            , Attr.value behaviorEditing.new.name
                            , Html.Events.onInput BehaviorNameEdited
                            ]
                            []
                        ]
                    , Html.details
                        [ Attr.style "width" "100%"
                        , Attr.style "padding" "1rem"
                        , Attr.style "border" "1px solid black"
                        , Attr.style "border-radius" "1rem"
                        ]
                        [ Html.summary [ Attr.style "font-size" "1.5rem" ] [ Html.text "Submits" ]
                        , behaviorEditing.new.submits
                            |> List.map
                                (\submit ->
                                    Html.li
                                        [ Attr.style "display" "flex"
                                        , Attr.style "justify-content" "space-between"
                                        , Attr.style "margin-top" "0.75rem"
                                        ]
                                        [ Html.text <| prettyDateFormatter Time.utc submit
                                        , buttonSecondarySmall "Remove"
                                            (RemoveSubmit submit)
                                        ]
                                )
                            |> (::)
                                (Html.li
                                    [ Attr.style "display" "flex"
                                    , Attr.style "justify-content" "space-between"
                                    , Attr.style "margin-top" "0.75rem"
                                    ]
                                    [ Html.input
                                        [ Attr.type_ "datetime-local"
                                        , Attr.value behaviorEditing.submitToInsert
                                        , Html.Events.onInput SubmitToInsertChanged
                                        ]
                                        []
                                    , buttonPrimarySmall "Insert"
                                        InsertSubmit
                                    ]
                                )
                            |> Html.ol
                                [ Attr.style "list-style" "none"
                                , Attr.style "display" "flex"
                                , Attr.style "flex-direction" "column"
                                ]
                        ]
                    , Html.details
                        [ Attr.style "width" "100%"
                        , Attr.style "padding" "1rem"
                        , Attr.style "border" "1px solid black"
                        , Attr.style "border-radius" "1rem"
                        ]
                        [ Html.summary [ Attr.style "font-size" "1.5rem" ] [ Html.text "Resists" ]
                        , behaviorEditing.new.resists
                            |> List.map
                                (\resist ->
                                    Html.li
                                        [ Attr.style "display" "flex"
                                        , Attr.style "justify-content" "space-between"
                                        , Attr.style "margin-top" "0.75rem"
                                        ]
                                        [ Html.text <| prettyDateFormatter Time.utc resist
                                        , buttonSecondarySmall "Remove"
                                            (RemoveResist resist)
                                        ]
                                )
                            |> (::)
                                (Html.li
                                    [ Attr.style "display" "flex"
                                    , Attr.style "justify-content" "space-between"
                                    , Attr.style "margin-top" "0.75rem"
                                    ]
                                    [ Html.input
                                        [ Attr.type_ "datetime-local"
                                        , Attr.value behaviorEditing.resistToInsert
                                        , Html.Events.onInput ResistToInsertChanged
                                        ]
                                        []
                                    , buttonPrimarySmall "Insert"
                                        InsertResist
                                    ]
                                )
                            |> Html.ol
                                [ Attr.style "list-style" "none"
                                , Attr.style "display" "flex"
                                , Attr.style "flex-direction" "column"
                                ]
                        ]
                    , Html.div
                        [ Attr.style "display" "flex"
                        , Attr.style "width" "100%"
                        , Attr.style "justify-content" "space-between"
                        ]
                        [ linkSecondary "Cancel"
                            HomeRoute
                        , buttonPrimary (Html.text "Save") (SaveBehavior id)
                        ]
                    , case model.confirmDelete of
                        Nothing ->
                            buttonDanger "Delete"
                                (DeleteBehavior id)

                        Just _ ->
                            Html.div
                                [ Attr.style "display" "flex"
                                , Attr.style "width" "100%"
                                , Attr.style "justify-content" "space-between"
                                ]
                                [ buttonSecondary "Keep"
                                    CancelDeleteBehavior
                                , buttonDanger "Yes, Delete"
                                    (ConfirmDeleteBehavior id)
                                ]
                    ]
                ]


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


viewMenu : Html Msg
viewMenu =
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
                    [ linkPrimarySmall "Add safety behavior"
                        AddBehaviorRoute
                    , linkSecondaryIcon "☰"
                        SettingsRoute
                    ]
                , Html.div
                    [ Attr.style "height" "93vh"
                    , Attr.style "overflow" "auto"
                    ]
                    (List.map
                        viewBehaviorInList
                        safetyBehaviors
                    )
                ]


viewBehaviorInList : Behavior -> Html Msg
viewBehaviorInList behavior =
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
                (EditBehaviorRoute behavior.id)
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
                    (SubmittedToBehavior behavior.id)
                ]
            , Html.div
                [ Attr.style "font-size" "6vw"
                , Attr.style "align-self" "center"
                ]
                [ buttonSecondary "Resist"
                    (ResistedBehavior behavior.id)
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
        [ Html.h1 [] [ Html.text "Safety behavior" ]
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
                    , Attr.required True
                    , setInvalid <|
                        case model.addingBehavior of
                            FailedToSave err ->
                                Just err

                            _ ->
                                Nothing
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
                , buttonSubmit
                    (Html.div
                        [ Attr.style "display" "flex"
                        , Attr.style "gap" "1rem"
                        ]
                        [ Html.text "Add"
                        , case model.addingBehavior of
                            Saving ->
                                Html.div
                                    [ Attr.style "width" "1rem"
                                    , Attr.style "height" "1rem"
                                    ]
                                    [ spinner ]

                            _ ->
                                noHtml
                        ]
                    )
                ]
            ]
        ]



--


setInvalid : Maybe String -> Html.Attribute msg
setInvalid error =
    Attr.property "___setCustomValidity" <|
        case error of
            Nothing ->
                Json.Encode.null

            Just err ->
                Json.Encode.string err


spinner : Html msg
spinner =
    Html.span [ Css.loader ] []


noHtml : Html msg
noHtml =
    Html.text ""


buttonPrimary : Html Msg -> Msg -> Html Msg
buttonPrimary label action =
    Html.button
        [ Css.pushable
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge ] []
        , Html.span [ Css.front ] [ label ]
        ]


buttonSubmit : Html msg -> Html msg
buttonSubmit label =
    Html.button
        [ Css.pushable
        , Attr.type_ "submit"
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge ] []
        , Html.span [ Css.front ] [ label ]
        ]


linkPrimary : String -> Route -> Html Msg
linkPrimary label route =
    Html.a
        [ Css.pushable
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge ] []
        , Html.span [ Css.front ] [ Html.text label ]
        ]


buttonPrimarySmall : String -> Msg -> Html Msg
buttonPrimarySmall label action =
    Html.button
        [ Css.pushable
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge ] []
        , Html.span [ Css.front, Css.frontSmall ] [ Html.text label ]
        ]


linkPrimarySmall : String -> Route -> Html Msg
linkPrimarySmall label route =
    Html.a
        [ Css.pushable
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge ] []
        , Html.span [ Css.front, Css.frontSmall ] [ Html.text label ]
        ]


buttonDanger : String -> Msg -> Html Msg
buttonDanger label action =
    Html.button
        [ Css.pushable
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeDanger ] []
        , Html.span [ Css.front, Css.frontDanger ] [ Html.text label ]
        ]


buttonSecondary : String -> Msg -> Html Msg
buttonSecondary label action =
    Html.button
        [ Css.pushable
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeSecondary ] []
        , Html.span [ Css.front, Css.frontSecondary ] [ Html.text label ]
        ]


linkSecondary : String -> Route -> Html Msg
linkSecondary label route =
    Html.a
        [ Css.pushable
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeSecondary ] []
        , Html.span [ Css.front, Css.frontSecondary ] [ Html.text label ]
        ]


buttonSecondarySmall : String -> Msg -> Html Msg
buttonSecondarySmall label action =
    Html.button
        [ Css.pushable
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeSecondary ] []
        , Html.span [ Css.front, Css.frontSecondary, Css.frontSmall ] [ Html.text label ]
        ]


linkSecondarySmall : String -> Route -> Html Msg
linkSecondarySmall label route =
    Html.a
        [ Css.pushable
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeSecondary ] []
        , Html.span [ Css.front, Css.frontSecondary, Css.frontSmall ] [ Html.text label ]
        ]


buttonSecondaryIcon : String -> Msg -> Html Msg
buttonSecondaryIcon label action =
    Html.button
        [ Css.pushable
        , Attr.type_ "button"
        , Html.Events.onClick action
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeSecondary ] []
        , Html.span [ Css.front, Css.frontSecondary, Css.frontIcon ] [ Html.text label ]
        ]


linkSecondaryIcon : String -> Route -> Html Msg
linkSecondaryIcon label route =
    Html.a
        [ Css.pushable
        , Attr.href (routeToString route)
        ]
        [ Html.span [ Css.shadow ] []
        , Html.span [ Css.edge, Css.edgeSecondary ] []
        , Html.span [ Css.front, Css.frontSecondary, Css.frontIcon ] [ Html.text label ]
        ]
