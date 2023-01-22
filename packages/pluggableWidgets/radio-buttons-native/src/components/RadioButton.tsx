import { createElement, ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { RadioButtonsStyle } from "../ui/Styles";
import { OrientationEnum } from "../../typings/RadioButtonsProps";

export interface RadioButtonProps {
    title: string;
    active: boolean;
    onSelect: (value: string) => void;
    styles: RadioButtonsStyle;
    name: string;
    disabled: boolean;
    orientation: OrientationEnum;
    accessible: boolean;
}

export function RadioButton({
    active,
    onSelect,
    title,
    styles,
    name,
    disabled,
    orientation,
    accessible
}: RadioButtonProps): ReactElement {
    return (
        <Pressable
            accessible={accessible}
            accessibilityLabel={title}
            accessibilityRole="radio"
            accessibilityState={{ disabled, selected: active }}
            style={[
                styles.radioButtonItemContainerStyle,
                orientation === "horizontal" && styles.radioButtonItemContainerHorizontalStyle,
                disabled && styles.radioButtonItemContainerDisabledStyle
            ]}
            onPress={() => onSelect(name)}
            testID={`radio-button-${name}`}
        >
            <View style={[styles.circularButtonStyle, disabled && styles.circularBtnDisabledStyle]}>
                {active && <View style={styles.activeButtonStyle} />}
            </View>
            <Text style={styles.radioButtonItemTitleStyle}>{title}</Text>
        </Pressable>
    );
}
