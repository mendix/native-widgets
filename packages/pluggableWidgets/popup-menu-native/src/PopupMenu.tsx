import { ComponentType, createElement, ReactElement, Fragment, useState } from "react";
import { PopupMenuProps } from "../typings/PopupMenuProps";
import { PopupMenuStyle } from "./ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";
import {
    Platform,
    StyleSheet,
    TouchableHighlight,
    TouchableHighlightProps,
    TouchableNativeFeedback,
    TouchableNativeFeedbackProps,
    TouchableOpacity,
    View
} from "react-native";
import { ActionValue } from "mendix";
import { Menu, MenuDivider, MenuItem } from "react-native-material-menu";

const TouchableItem: ComponentType<TouchableNativeFeedbackProps | TouchableHighlightProps> =
    Platform.OS === "android" ? TouchableNativeFeedback : TouchableHighlight;

const TouchableButton: ComponentType<TouchableNativeFeedbackProps | TouchableOpacity> =
    Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;

export function PopupMenu(props: PopupMenuProps<PopupMenuStyle>): ReactElement {
    const styles = StyleSheet.flatten(props.style);
    const [visible, setVisible] = useState(false);

    const showMenu = () => setVisible(true);

    const handlePress = (action?: ActionValue) => {
        setVisible(false);
        // Set timeout needed since modal closes the alerts which might be shown in action
        setTimeout(() => {
            executeAction(action);
        }, 500);
    };

    let menuOptions: ReactElement[];
    if (props.renderMode === "basic") {
        menuOptions = props.basicItems.map((item, index) => {
            const itemStyle = styles.basic?.itemStyle && styles.basic?.itemStyle[item.styleClass];
            return item.itemType === "divider" ? (
                <MenuDivider key={index} color={styles.basic?.dividerColor} />
            ) : (
                <MenuItem
                    key={index}
                    onPress={() => handlePress(item.action)}
                    textStyle={itemStyle}
                    style={({ pressed }) => ({
                        ...styles.basic?.container,
                        ...(pressed ? { backgroundColor: styles.basic?.itemStyle?.rippleColor } : {})
                    })}
                    {...(Platform.OS === "android" && styles.basic?.itemStyle?.rippleColor
                        ? { android_ripple: { color: styles.basic.itemStyle.rippleColor, borderless: false } }
                        : undefined)}
                    testID={`${props.name}_basic-item`}
                >
                    {item.caption}
                </MenuItem>
            );
        });
    } else {
        menuOptions = props.customItems.map((item, index) => (
            <TouchableItem
                key={index}
                style={styles.custom?.container}
                onPress={() => handlePress(item.action)}
                {...getRippleColor(styles.custom?.itemStyle?.rippleColor)}
                testID={`${props.name}_custom-item`}
            >
                {Platform.OS === "android" ? (
                    <View style={styles.custom?.container}>{item.content}</View>
                ) : (
                    <Fragment>{item.content}</Fragment>
                )}
            </TouchableItem>
        ));
    }

    return (
        <Menu
            visible={visible}
            animationDuration={150}
            style={styles?.container as any}
            anchor={
                <TouchableButton onPress={showMenu} testID={`${props.name}_trigger`}>
                    <View pointerEvents="box-only" style={styles.buttonContainer}>
                        {props.menuTriggerer}
                    </View>
                </TouchableButton>
            }
        >
            <View style={{ overflow: "hidden", borderRadius: styles.container?.borderRadius }}>{menuOptions}</View>
        </Menu>
    );
}

function getRippleColor(color: string | undefined) {
    if (color) {
        return Platform.OS === "android"
            ? color && { background: TouchableNativeFeedback.Ripple(color, false) }
            : { underlayColor: color };
    }
    return undefined;
}
