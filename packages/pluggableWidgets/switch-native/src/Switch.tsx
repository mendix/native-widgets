import { flattenStyles } from "@mendix/piw-native-utils-internal";
import React, { ReactElement, useCallback } from "react";
import { View, Text, Switch as SwitchComponent, Platform } from "react-native";
import { executeAction } from "@mendix/piw-utils-internal";
import { extractStyles } from "@mendix/pluggable-widgets-tools";

import { SwitchProps } from "../typings/SwitchProps";
import { SwitchStyle, defaultSwitchStyle, CheckBoxInputType } from "./ui/Styles";

export type Props = SwitchProps<SwitchStyle>;

export function Switch(props: Props): ReactElement {
    const { label, labelOrientation, showLabel, name, onChange, booleanAttribute, labelPosition } = props;
    const combinedStyles = flattenStyles(defaultSwitchStyle, props.style);
    const styles = processStyles(combinedStyles);
    const horizontalOrientation = showLabel && labelOrientation === "horizontal";
    const editable = !booleanAttribute.readOnly;
    const hasValidationMessage = !!booleanAttribute.validation;
    const onChangeCallback = useCallback(() => {
        if (booleanAttribute.status === "available") {
            booleanAttribute.setValue(!booleanAttribute.value);
            executeAction(onChange);
        }
    }, [booleanAttribute, onChange]);

    const containerStyles = editable ? styles.container : { ...styles.container, ...styles.containerDisabled };
    const labelStyles = editable ? styles.label : { ...styles.label, ...styles.labelDisabled };
    const inputProps = editable
        ? hasValidationMessage
            ? { ...styles.inputProps, ...styles.inputErrorProps }
            : styles.inputProps
        : { ...styles.inputProps, ...styles.inputDisabledProps };

    const inputStyle: CheckBoxInputType = editable
        ? hasValidationMessage
            ? [styles.input, styles.inputError]
            : styles.input
        : [styles.input, styles.inputDisabled];

    const labelValue = label?.status === "available" ? label.value : "";

    const switchElement = (
        <SwitchComponent
            disabled={!editable}
            testID={name}
            style={inputStyle}
            onValueChange={editable ? onChangeCallback : undefined}
            value={booleanAttribute.value}
            trackColor={{
                true: inputProps.trackColorOn,
                false: inputProps.trackColorOff
            }}
            thumbColor={booleanAttribute.value ? inputProps.thumbColorOn : inputProps.thumbColorOff}
            {...(Platform.OS === "ios" ? { ios_backgroundColor: inputProps.trackColorOff } : {})}
        />
    );

    const labelElement = showLabel ? (
        <Text testID={`${name}$label`} style={[labelStyles]}>
            {labelValue}
        </Text>
    ) : null;

    const validationMessage = hasValidationMessage ? (
        <Text testID={`${name}$alert`} style={styles.validationMessage}>
            {booleanAttribute.validation}
        </Text>
    ) : null;

    return (
        <View
            testID={`${name}$wrapper`}
            style={[containerStyles, { flexDirection: "column", alignItems: "flex-start" }]}
        >
            {horizontalOrientation ? (
                // Horizontal layout: label and switch in a row, validation message below
                <>
                    <View
                        testID={`${name}$horizontalContainer`}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                            justifyContent: "space-between"
                        }}
                    >
                        {labelPosition === "right" ? (
                            <>
                                {React.cloneElement(switchElement, { key: "switch" })}
                                <View
                                    style={{
                                        flexDirection: "column",
                                        alignItems: "flex-end"
                                    }}
                                >
                                    {labelElement && React.cloneElement(labelElement, { key: "label" })}
                                    {validationMessage}
                                </View>
                            </>
                        ) : (
                            <>
                                <View
                                    style={{
                                        flexDirection: "column",
                                        alignItems: "flex-start"
                                    }}
                                >
                                    {labelElement && React.cloneElement(labelElement, { key: "label" })}
                                    {validationMessage}
                                </View>
                                {React.cloneElement(switchElement, { key: "switch" })}
                            </>
                        )}
                    </View>
                </>
            ) : (
                // Vertical layout: label, switch, and validation message all in a column
                <>
                    {labelElement && React.cloneElement(labelElement, { key: "label" })}
                    {React.cloneElement(switchElement, { key: "switch" })}
                    {validationMessage}
                </>
            )}
        </View>
    );
}

function processStyles(style: SwitchStyle): any {
    const {
        input: inputStyle,
        inputDisabled: inputDisabledStyle,
        inputError: inputErrorStyle,
        label: labelStyle,
        ...others
    } = style;

    const inputPropsKeys: Array<keyof CheckBoxInputType> = [
        "thumbColorOn",
        "thumbColorOff",
        "trackColorOn",
        "trackColorOff"
    ];
    const [inputProps, input] = extractStyles(inputStyle, inputPropsKeys);
    const [inputDisabledProps, inputDisabled] = extractStyles(inputDisabledStyle, inputPropsKeys);
    const [inputErrorProps, inputError] = extractStyles(inputErrorStyle, inputPropsKeys);
    const [labelProps, label] = extractStyles(labelStyle, ["numberOfLines"]);

    return {
        inputProps,
        input,
        inputDisabledProps,
        inputDisabled,
        inputErrorProps,
        inputError,
        labelProps,
        label,
        ...others
    };
}
