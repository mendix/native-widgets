import { ReactElement, Fragment } from "react";

import { BadgeProps } from "../typings/BadgeProps";
import { BadgeStyle } from "./ui/Styles";

export type Props = BadgeProps<BadgeStyle>;

export function Badge(props: BadgeProps<BadgeStyle>): ReactElement {
    console.log("Badge props", props);
    return <Fragment />;
}
