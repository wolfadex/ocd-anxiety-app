module Css exposing (pushable, shadow, edge, front, edge_secondary, front_secondary, front_small, front_icon)

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


edge_secondary : Html.Attribute msg
edge_secondary =
    Html.Attributes.class "edge-secondary"


front_secondary : Html.Attribute msg
front_secondary =
    Html.Attributes.class "front-secondary"


front_small : Html.Attribute msg
front_small =
    Html.Attributes.class "front-small"


front_icon : Html.Attribute msg
front_icon =
    Html.Attributes.class "front-icon"
