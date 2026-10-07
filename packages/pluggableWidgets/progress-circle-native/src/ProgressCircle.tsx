import { Arc, available, flattenStyles, unavailable } from "@mendix/piw-native-utils-internal";
import { JSX } from "react";
import { Text, View, PixelRatio } from "react-native";
import { Svg } from "react-native-svg";

import { ProgressCircleProps } from "../typings/ProgressCircleProps";
import { defaultProgressCircleStyle, ProgressCircleStyle } from "./ui/Styles";

export type Props = ProgressCircleProps<ProgressCircleStyle>;

const CIRCLE = Math.PI * 2;

export function ProgressCircle(props: Props): JSX.Element {
    const styles = flattenStyles(defaultProgressCircleStyle, props.style);
    const validationMessages = validate(props);
    const progress = validationMessages.length === 0 ? calculateProgress(props) : 0;
    const showsText = props.circleText !== "none";

    // Update the progress size based on the device's font scale
    const size = Number(styles.circle.size) * PixelRatio.getFontScale();
    const border = Number(styles.circle.borderWidth) || 0;
    const thickness = Number(styles.fill.width);
    const color = styles.fill.backgroundColor;
    const strokeCap = styles.fill.lineCapRounded ? "round" : "square";

    const radius = size / 2 - border;
    const offset = { top: border, left: border };
    const textOffset = border + thickness;
    const textSize = size - textOffset * 2;
    const angle = progress * CIRCLE;

    const text = showsText ? formatText(progress, props) : "";

    return (
        <View
            style={[{ backgroundColor: "transparent", overflow: "hidden" }, styles.container]}
            testID={props.name}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Progress circle"
            accessibilityValue={{
                min: available(props.minimumValue) ? props.minimumValue.value!.toNumber() : 0,
                max: available(props.maximumValue) ? props.maximumValue.value!.toNumber() : 100,
                now: available(props.progressValue) ? props.progressValue.value!.toNumber() : 0,
                ...(showsText ? { text } : {})
            }}
        >
            <Svg width={size} height={size}>
                <Arc
                    testID={`${props.name}-arc`}
                    radius={radius}
                    offset={offset}
                    startAngle={0}
                    endAngle={angle}
                    stroke={color}
                    strokeCap={strokeCap}
                    strokeWidth={thickness}
                />
                {border > 0 && (
                    <Arc
                        testID={`${props.name}-border`}
                        radius={size / 2}
                        startAngle={0}
                        endAngle={CIRCLE}
                        stroke={styles.circle.borderColor || color}
                        strokeCap={strokeCap}
                        strokeWidth={border}
                    />
                )}
            </Svg>
            {showsText && (
                <View
                    style={{
                        position: "absolute",
                        left: textOffset,
                        top: textOffset,
                        width: textSize,
                        height: textSize,
                        borderRadius: textSize / 2,
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <Text style={[{ color, fontSize: textSize / 4.5, fontWeight: "300" as const }, styles.text]}>
                        {text}
                    </Text>
                </View>
            )}
            {validationMessages.length > 0 && (
                <Text style={styles.validationMessage}>{validationMessages.join("\n")}</Text>
            )}
        </View>
    );
}

function formatText(progress: number, props: Props): string {
    switch (props.circleText as "customText" | "percentage") {
        case "customText":
            return (props.customText && props.customText.value) || "";
        case "percentage":
            return `${Math.round(progress * 100)}%`;
        default:
            return "";
    }
}

function validate(props: Props): string[] {
    const messages: string[] = [];
    const { minimumValue, maximumValue, progressValue } = props;

    if (unavailable(minimumValue)) {
        messages.push("No minimum value provided.");
    }
    if (unavailable(maximumValue)) {
        messages.push("No maximum value provided.");
    }
    if (unavailable(progressValue)) {
        messages.push("No current value provided.");
    }
    if (available(minimumValue) && available(maximumValue) && available(progressValue)) {
        if (minimumValue.value!.gte(maximumValue.value!)) {
            messages.push("The minimum value must be equal or less than the maximum value.");
        } else {
            if (progressValue.value!.lt(minimumValue.value!)) {
                messages.push("The current value must be equal or greater than the minimum value.");
            }
            if (progressValue.value!.gt(maximumValue.value!)) {
                messages.push("The current value must be equal or less than the maximum value.");
            }
        }
    }

    return messages;
}

function calculateProgress(props: Props): number {
    const { minimumValue, maximumValue, progressValue } = props;

    if (!available(minimumValue) || !available(maximumValue) || !available(progressValue)) {
        return 0;
    }

    const numerator = progressValue.value!.minus(minimumValue.value!);
    const denominator = maximumValue.value!.minus(minimumValue.value!);
    return Number(numerator.div(denominator));
}
