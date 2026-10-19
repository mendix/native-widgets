import { Bar, flattenStyles } from "@mendix/piw-native-utils-internal";
import { isAvailable } from "@mendix/piw-utils-internal";
import { Text, View } from "react-native";
import { JSX } from "react";

import { ProgressBarProps } from "../typings/ProgressBarProps";
import { defaultProgressBarStyle, ProgressBarStyle } from "./ui/Styles";

export type Props = ProgressBarProps<ProgressBarStyle>;

// iOS reads accessibilityValue as now / (max - min), ignoring min, so the value is always reported on a 0-100 scale
// to be announced correctly for any range (same approach as the Slider).
const ACCESSIBILITY_SCALE = 100;

export function ProgressBar(props: ProgressBarProps<ProgressBarStyle>): JSX.Element {
    const styles = flattenStyles(defaultProgressBarStyle, props.style);

    const validate = (): string[] => {
        const messages: string[] = [];
        const { minimumValue, maximumValue, progressValue } = props;

        if (!isAvailable(minimumValue)) {
            messages.push("No minimum value provided.");
        }
        if (!isAvailable(maximumValue)) {
            messages.push("No maximum value provided.");
        }
        if (!isAvailable(progressValue)) {
            messages.push("No current value provided.");
        }
        return messages;
    };

    const calculateProgress = (): number => {
        const { minimumValue, maximumValue, progressValue } = props;

        if (
            !isAvailable(minimumValue) ||
            !isAvailable(maximumValue) ||
            !isAvailable(progressValue) ||
            minimumValue.value!.gte(maximumValue.value!)
        ) {
            return 0;
        }

        if (progressValue.value!.gt(maximumValue.value!)) {
            return 1;
        } else if (progressValue.value!.lt(minimumValue.value!)) {
            return 0;
        }
        const numerator = progressValue.value!.minus(minimumValue.value!);
        const denominator = maximumValue.value!.minus(minimumValue.value!);
        return Number(numerator.div(denominator));
    };

    const validationMessages = validate();
    const progress = calculateProgress();

    return (
        <View style={styles.container}>
            <View
                accessible
                accessibilityRole="progressbar"
                accessibilityValue={{
                    min: 0,
                    max: ACCESSIBILITY_SCALE,
                    now: Math.round(progress * ACCESSIBILITY_SCALE)
                }}
                accessibilityLabel="Progress bar"
            >
                <Bar
                    testID={props.name}
                    height={Number(styles.bar.height)}
                    width={null}
                    progress={progress}
                    color={styles.fill.backgroundColor}
                    borderWidth={styles.bar.borderWidth as number | undefined}
                    borderColor={styles.bar.borderColor}
                    borderRadius={styles.bar.borderRadius as number | undefined}
                    unfilledColor={styles.bar.backgroundColor}
                />
            </View>
            {validationMessages.length > 0 && (
                <Text style={styles.validationMessage}>{validationMessages.join("\n")}</Text>
            )}
        </View>
    );
}
