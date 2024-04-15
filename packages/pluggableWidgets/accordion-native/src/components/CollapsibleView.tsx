import { createElement, ReactElement, ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface CollapsibleViewProps {
    isExpanded: boolean;
    style: ViewStyle;
    children: ReactNode;
}

export function AnimatedCollapsibleView({ isExpanded, style, children }: CollapsibleViewProps): ReactElement {
    return <View style={{ overflow: "hidden" }}>{isExpanded && <View style={style}>{children}</View>}</View>;
}
