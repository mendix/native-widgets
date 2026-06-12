import { available, flattenStyles, toNumber, unavailable } from "@mendix/piw-native-utils-internal";
import { executeAction } from "@mendix/piw-utils-internal";
import { ValueStatus, Option } from "mendix";
import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { ReactElement, useCallback, useRef } from "react";
import { Text, View } from "react-native";
import { Big } from "big.js";

import { SliderProps } from "../typings/SliderProps";
import { defaultSliderStyle, SliderStyle } from "./ui/Styles";

export type Props = SliderProps<SliderStyle>;

export function Slider(props: Props): ReactElement {
    const lastValue = useRef<number | undefined>(toNumber(props.valueAttribute));

    const value = toNumber(props.valueAttribute);
    const validationMessages = validate(props);
    const validProps = validationMessages.length === 0;
    const editable = props.editable !== "never" && !props.valueAttribute.readOnly && validProps;
    const styles = flattenStyles(defaultSliderStyle, props.style);

    const decimalCount = useCallback((val: Option<Big>): number => val?.toString().split(".")?.[1]?.length || 0, []);

    const onValueChange = useCallback(
        (values: number[]): void => {
            if (values[0] === null || values[0] === undefined) {
                return;
            }

            if (props.stepSize.status === ValueStatus.Available) {
                props.valueAttribute.setValue(new Big(values[0].toFixed(decimalCount(props.stepSize.value))));
            }
        },
        [props.valueAttribute, props.stepSize, decimalCount]
    );

    const onSlidingComplete = useCallback(
        (values: number[]): void => {
            if (values[0] === null || values[0] === undefined || lastValue.current === values[0]) {
                return;
            }

            lastValue.current = values[0];
            if (props.stepSize.status === ValueStatus.Available) {
                props.valueAttribute.setValue(new Big(values[0].toFixed(decimalCount(props.stepSize.value))));
            }

            executeAction(props.onChange);
        },
        [lastValue, props.valueAttribute, props.onChange, props.stepSize, decimalCount]
    );

    return (
        <View style={styles.container} testID={props.name}>
            <RNSlider
                value={value != null ? value : 0}
                minimumValue={validProps ? toNumber(props.minimumValue) ?? 0 : 0}
                maximumValue={validProps ? toNumber(props.maximumValue) ?? 100 : 100}
                step={validProps ? toNumber(props.stepSize) ?? 1 : 1}
                disabled={!editable}
                trackStyle={editable ? styles.track : styles.trackDisabled}
                minimumTrackStyle={editable ? styles.minimumTrack : styles.minimumTrackDisabled}
                maximumTrackStyle={editable ? styles.maximumTrack : styles.maximumTrackDisabled}
                thumbStyle={editable ? styles.thumb : styles.thumbDisabled}
                onValueChange={onValueChange}
                onSlidingComplete={onSlidingComplete}
            />
            {!validProps && <Text style={styles.validationMessage}>{validationMessages.join("\n")}</Text>}
            {props.valueAttribute.validation && (
                <Text style={styles.validationMessage} testID={`${props.name}-validation-message`}>
                    {props.valueAttribute.validation}
                </Text>
            )}
        </View>
    );
}

function validate(props: Props): string[] {
    const messages: string[] = [];
    const { minimumValue, maximumValue, stepSize, valueAttribute } = props;

    if (unavailable(minimumValue)) {
        messages.push("No minimum value provided.");
    }
    if (unavailable(maximumValue)) {
        messages.push("No maximum value provided.");
    }
    if (unavailable(stepSize)) {
        messages.push("No step size provided.");
    }
    if (unavailable(valueAttribute)) {
        messages.push("The value attribute is not readable.");
    }
    if (available(minimumValue) && available(maximumValue) && available(stepSize) && available(valueAttribute)) {
        if (stepSize.value!.lte(0)) {
            messages.push("The step size can not be zero or less than zero.");
        }
        if (minimumValue.value!.gt(maximumValue.value!)) {
            messages.push("The minimum value can not be greater than the maximum value.");
        } else {
            if (minimumValue.value!.eq(maximumValue.value!)) {
                messages.push("The minimum value can not be equal to the maximum value.");
            }
            if (valueAttribute.value!.lt(minimumValue.value!)) {
                messages.push("The current value can not be less than the minimum value.");
            }
            if (valueAttribute.value!.gt(maximumValue.value!)) {
                messages.push("The current value can not be greater than the maximum value.");
            }
        }
    }

    return messages;
}
