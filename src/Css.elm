module Css exposing (pushable, shadow, edge, front, edgeDanger, frontDanger, edgeSecondary, frontSecondary, frontSmall, frontIcon, loader)

import Html
import Html.Attributes


pushable : Html.Attribute msg
pushable =
    Html.Attributes.class "pushable"


shadow : Html.Attribute msg
shadow =
    Html.Attributes.class "shadow"


edge : Html.Attribute msg
edge =
    Html.Attributes.class "edge"


front : Html.Attribute msg
front =
    Html.Attributes.class "front"


edgeDanger : Html.Attribute msg
edgeDanger =
    Html.Attributes.class "edgeDanger"


frontDanger : Html.Attribute msg
frontDanger =
    Html.Attributes.class "frontDanger"


edgeSecondary : Html.Attribute msg
edgeSecondary =
    Html.Attributes.class "edgeSecondary"


frontSecondary : Html.Attribute msg
frontSecondary =
    Html.Attributes.class "frontSecondary"


frontSmall : Html.Attribute msg
frontSmall =
    Html.Attributes.class "frontSmall"


frontIcon : Html.Attribute msg
frontIcon =
    Html.Attributes.class "frontIcon"


loader : Html.Attribute msg
loader =
    Html.Attributes.class "loader"
