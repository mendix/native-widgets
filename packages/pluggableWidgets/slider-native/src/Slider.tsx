import { available, flattenStyles, toNumber, unavailable } from "@mendix/piw-native-utils-internal";
import { executeAction } from "@mendix/piw-utils-internal";
import { ValueStatus } from "mendix";
import RNSlider from "@react-native-community/slider";
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

    const decimalCount = useCallback(
        (val: Big | undefined): number => val?.toString().split(".")?.[1]?.length || 0,
        []
    );

    const onSlide = useCallback(
        (newValue: number): void => {
            if (newValue === null) {
                return;
            }

            if (props.stepSize.status === ValueStatus.Available) {
                props.valueAttribute.setValue(new Big(newValue.toFixed(decimalCount(props.stepSize.value))));
            }
        },
        [props.valueAttribute, props.stepSize, decimalCount]
    );

    const onChange = useCallback(
        (newValue: number): void => {
            if (newValue === null || lastValue.current === newValue) {
                return;
            }

            lastValue.current = newValue;
            if (props.stepSize.status === ValueStatus.Available) {
                props.valueAttribute.setValue(new Big(newValue.toFixed(decimalCount(props.stepSize.value))));
            }

            executeAction(props.onChange);
        },
        [lastValue, props.valueAttribute, props.onChange, props.stepSize, decimalCount]
    );

    return (
        <View style={styles.container} testID={props.name}>
            <RNSlider
                testID={`${props.name}$slider`}
                value={value != null ? value : undefined}
                minimumValue={validProps ? toNumber(props.minimumValue) : undefined}
                maximumValue={validProps ? toNumber(props.maximumValue) : undefined}
                step={validProps ? toNumber(props.stepSize) : undefined}
                disabled={!editable}
                minimumTrackTintColor={
                    editable
                        ? styles.sliderColors?.minimumTrackTintColor
                        : styles.sliderColors?.minimumTrackTintColorDisabled
                }
                maximumTrackTintColor={
                    editable
                        ? styles.sliderColors?.maximumTrackTintColor
                        : styles.sliderColors?.maximumTrackTintColorDisabled
                }
                thumbTintColor={
                    editable ? styles.sliderColors?.thumbTintColor : styles.sliderColors?.thumbTintColorDisabled
                }
                onValueChange={onSlide}
                onSlidingComplete={onChange}
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
