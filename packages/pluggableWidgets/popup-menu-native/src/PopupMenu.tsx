import { ComponentType, ReactElement, useCallback } from "react";
import { PopupMenuProps } from "../typings/PopupMenuProps";
import { PopupMenuStyle } from "./ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";
import { MxMenu, MxMenuDivider, MxMenuItem, useMxMenu } from "@mendix/piw-native-utils-internal";
import {
    Platform,
    StyleSheet,
    TouchableNativeFeedback,
    TouchableNativeFeedbackProps,
    TouchableOpacity,
    View
} from "react-native";
import { ActionValue } from "mendix";

const TouchableButton: ComponentType<TouchableNativeFeedbackProps | typeof TouchableOpacity> =
    Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;

// Custom items hold whatever the app puts in them, so they do not get the minimum size of a text item
const customItemDefaults = { minHeight: 0, minWidth: 0, justifyContent: "flex-start" } as const;
const basicItemDefaults = { height: 48, maxWidth: 248 } as const;

export function PopupMenu(props: PopupMenuProps<PopupMenuStyle>): ReactElement {
    const styles = StyleSheet.flatten(props.style);

    const { anchorRef, anchor, visible, expanded, open, close } = useMxMenu();
    const handlePress = useCallback(
        (action?: ActionValue) => {
            close();
            // Set timeout needed since modal closes the alerts which might be shown in action
            setTimeout(() => {
                executeAction(action);
            }, 500);
        },
        [close]
    );

    let menuOptions: ReactElement[];
    if (props.popupRenderMode === "basic") {
        menuOptions = props.basicItems.map((item, index) => {
            const itemStyle = styles.basic?.itemStyle && styles.basic?.itemStyle[item.styleClass];
            return item.itemType === "divider" ? (
                <MxMenuDivider key={index} color={styles.basic?.dividerColor} testID={`${props.name}_divider`} />
            ) : (
                <MxMenuItem
                    key={index}
                    onPress={() => handlePress(item.action)}
                    textStyle={itemStyle}
                    ellipsizeMode={styles.basic?.itemStyle?.ellipsizeMode}
                    style={[basicItemDefaults, styles.basic?.container]}
                    {...getRippleColor(styles.basic?.itemStyle?.rippleColor)}
                    testID={`${props.name}_basic-item`}
                >
                    {item.caption}
                </MxMenuItem>
            );
        });
    } else {
        menuOptions = props.customItems.map((item, index) => (
            <MxMenuItem
                key={index}
                style={[customItemDefaults, styles.custom?.container]}
                onPress={() => handlePress(item.action)}
                {...getRippleColor(styles.custom?.itemStyle?.rippleColor)}
                testID={`${props.name}_custom-item`}
            >
                {item.content}
            </MxMenuItem>
        ));
    }

    return (
        <>
            <View ref={anchorRef} collapsable={false}>
                <TouchableButton
                    onPress={open}
                    testID={`${props.name}_trigger`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                >
                    <View style={styles.buttonContainer} pointerEvents="box-only">
                        <View pointerEvents="none">{props.menuTriggerer}</View>
                    </View>
                </TouchableButton>
            </View>
            <MxMenu
                visible={visible}
                anchor={anchor}
                onRequestClose={close}
                animationDuration={150}
                style={styles.container}
                returnFocusRef={anchorRef}
                testID={`${props.name}_menu`}
            >
                {menuOptions}
            </MxMenu>
        </>
    );
}

/**
 * One style key, two platform behaviours: rippleColor is the colour of the ripple on Android and the
 * background shown while an item is pressed on iOS. The menu item picks the one for its platform.
 */
function getRippleColor(color: string | undefined): { rippleColor: string; underlayColor: string } | undefined {
    return color ? { rippleColor: color, underlayColor: color } : undefined;
}
