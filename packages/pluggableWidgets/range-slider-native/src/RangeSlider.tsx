import { available, flattenStyles, toNumber, unavailable } from "@mendix/piw-native-utils-internal";
import { Slider } from "@miblanchard/react-native-slider";
import { ReactElement, useCallback, useRef } from "react";
import { Text, View } from "react-native";
import { Big } from "big.js";

import { RangeSliderProps } from "../typings/RangeSliderProps";
import { defaultRangeSliderStyle, RangeSliderStyle } from "./ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = RangeSliderProps<RangeSliderStyle>;

export function RangeSlider(props: Props): ReactElement {
    const styles = flattenStyles(defaultRangeSliderStyle, props.style);

    const lastLowerValue = useRef<number | undefined>(toNumber(props.lowerValueAttribute));
    const lastUpperValue = useRef<number | undefined>(toNumber(props.upperValueAttribute));

    const lowerValue = toNumber(props.lowerValueAttribute);
    const upperValue = toNumber(props.upperValueAttribute);
    const validationMessages = validate(props);
    const validProps = validationMessages.length === 0;
    const editable = props.editable !== "never" && validProps;
    const enabledLower = editable && lowerValue !== undefined && !props.lowerValueAttribute.readOnly;
    const enabledUpper = editable && upperValue !== undefined && !props.upperValueAttribute.readOnly;
    const isEnabled = enabledLower || enabledUpper;

    const onValueChange = useCallback(
        (values: number[]): void => {
            if (values[0] === null || values[0] === undefined || values[1] === null || values[1] === undefined) {
                return;
            }
            props.lowerValueAttribute.setValue(new Big(values[0]));
            props.upperValueAttribute.setValue(new Big(values[1]));
        },
        [props.lowerValueAttribute, props.upperValueAttribute]
    );

    const onSlidingComplete = useCallback(
        (values: number[]): void => {
            if (
                values[0] === null ||
                values[0] === undefined ||
                values[1] === null ||
                values[1] === undefined ||
                (lastLowerValue.current === values[0] && lastUpperValue.current === values[1])
            ) {
                return;
            }

            lastLowerValue.current = values[0];
            lastUpperValue.current = values[1];
            props.lowerValueAttribute.setValue(new Big(values[0]));
            props.upperValueAttribute.setValue(new Big(values[1]));

            executeAction(props.onChange);
        },
        [props.lowerValueAttribute, props.upperValueAttribute, props.onChange]
    );

    return (
        <View style={styles.container} testID={props.name}>
            <Slider
                value={lowerValue != null && upperValue != null ? [lowerValue, upperValue] : [0, 100]}
                minimumValue={validProps ? toNumber(props.minimumValue) ?? 0 : 0}
                maximumValue={validProps ? toNumber(props.maximumValue) ?? 100 : 100}
                step={validProps ? toNumber(props.stepSize) ?? 1 : 1}
                disabled={!isEnabled}
                trackStyle={isEnabled ? styles.track : styles.trackDisabled}
                minimumTrackStyle={isEnabled ? styles.minimumTrack : styles.minimumTrackDisabled}
                maximumTrackStyle={isEnabled ? styles.maximumTrack : styles.maximumTrackDisabled}
                thumbStyle={isEnabled ? styles.thumb : styles.thumbDisabled}
                onValueChange={onValueChange}
                onSlidingComplete={onSlidingComplete}
            />
            {props.lowerValueAttribute.validation && (
                <Text style={styles.validationMessage}>{props.lowerValueAttribute.validation}</Text>
            )}
            {props.upperValueAttribute.validation && (
                <Text style={styles.validationMessage}>{props.upperValueAttribute.validation}</Text>
            )}
            {validationMessages.length > 0 && (
                <Text style={styles.validationMessage} testID={`${props.name}-validation-messages`}>
                    {validationMessages.join("\n")}
                </Text>
            )}
        </View>
    );
}

function validate(props: Props): string[] {
    const messages: string[] = [];
    const { minimumValue, maximumValue, stepSize, lowerValueAttribute, upperValueAttribute } = props;

    if (unavailable(minimumValue)) {
        messages.push("No minimum value provided.");
    }
    if (unavailable(maximumValue)) {
        messages.push("No maximum value provided.");
    }
    if (unavailable(stepSize)) {
        messages.push("No step size provided.");
    }
    if (unavailable(lowerValueAttribute)) {
        messages.push("The lower value attribute is not available.");
    }
    if (unavailable(upperValueAttribute)) {
        messages.push("The upper value attribute is not available.");
    }
    if (
        available(minimumValue) &&
        available(maximumValue) &&
        available(stepSize) &&
        available(lowerValueAttribute) &&
        available(upperValueAttribute)
    ) {
        if (stepSize.value!.lte(0)) {
            messages.push("The step size must be greater than zero.");
        }
        if (minimumValue.value!.gt(maximumValue.value!)) {
            messages.push("The minimum value must be less than the maximum value.");
        } else {
            if (lowerValueAttribute.value!.lt(minimumValue.value!)) {
                messages.push("The lower value must be equal or greater than the minimum value.");
            }
            if (lowerValueAttribute.value!.gt(maximumValue.value!)) {
                messages.push("The lower value must be less than the maximum value.");
            }
            if (upperValueAttribute.value!.lt(minimumValue.value!)) {
                messages.push("The upper value bust be greater than the minimum value.");
            }
            if (upperValueAttribute.value!.gt(maximumValue.value!)) {
                messages.push("The upper value must be equal or less than the maximum value.");
            }
        }
    }

    return messages;
}
