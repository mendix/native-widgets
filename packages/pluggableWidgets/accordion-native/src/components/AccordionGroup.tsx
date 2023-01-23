import { createElement, ReactElement } from "react";
import { View, Pressable, Text } from "react-native";
import { DynamicValue, NativeIcon } from "mendix";

import { GroupIcon } from "./GroupIcon";
import { AnimatedCollapsibleView } from "./CollapsibleView";
import { GroupsType, IconEnum } from "../../typings/AccordionProps";
import { AccordionGroupStyle } from "../ui/Styles";

export interface AccordionGroupProps {
    index: number;
    collapsible: boolean;
    icon: IconEnum;
    iconCollapsed: DynamicValue<NativeIcon> | undefined;
    iconExpanded: DynamicValue<NativeIcon> | undefined;
    group: GroupsType;
    isExpanded: boolean;
    onPressGroupHeader: (group: GroupsType, index: number) => void;
    visible: boolean;
    style: AccordionGroupStyle;
}

export function AccordionGroup({
    index,
    collapsible,
    icon,
    iconCollapsed,
    iconExpanded,
    group,
    isExpanded,
    onPressGroupHeader,
    visible,
    style
}: AccordionGroupProps): ReactElement | null {
    const isAccessible = group.accessible === "yes";
    return visible ? (
        <View style={style.container}>
            <Pressable
                style={[style.header.container, icon === "left" && { flexDirection: "row-reverse" }]}
                onPress={collapsible ? () => onPressGroupHeader(group, index) : null}
                accessible={isAccessible}
                accessibilityLabel={
                    group.screenReaderCaption?.value ||
                    (group.headerRenderMode === "text" ? group.headerText.value : undefined)
                }
                accessibilityHint={group.screenReaderHint?.value}
                accessibilityState={{ expanded: isExpanded }}
            >
                {group.headerRenderMode === "text" ? (
                    <Text accessible={isAccessible} style={[style.header[group.headerTextRenderMode], { flex: 1 }]}>
                        {group.headerText.value}
                    </Text>
                ) : (
                    <View accessible={isAccessible} style={{ flex: 1 }}>
                        {group.headerContent}
                    </View>
                )}
                {icon !== "no" && collapsible ? (
                    <GroupIcon
                        accessible={isAccessible}
                        isExpanded={isExpanded}
                        iconCollapsed={iconCollapsed}
                        iconExpanded={iconExpanded}
                        style={style.header.icon}
                    />
                ) : null}
            </Pressable>
            <AnimatedCollapsibleView isExpanded={isExpanded} style={style.content}>
                {group.content}
            </AnimatedCollapsibleView>
        </View>
    ) : null;
}
