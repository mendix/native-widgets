import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { isAvailable } from "@mendix/piw-utils-internal";
import { createElement,useState } from "react";
import { Text, View,I18nManager,ViewStyle } from "react-native";
import { Bar } from "react-native-progress";

import { ProgressBarProps } from "../typings/ProgressBarProps";
import { defaultProgressBarStyle, ProgressBarStyle } from "./ui/Styles";

export type Props = ProgressBarProps<ProgressBarStyle>;

export function ProgressBar(props: ProgressBarProps<ProgressBarStyle>): JSX.Element {
    const styles = flattenStyles(defaultProgressBarStyle, props.style);
    const [barWidth, setBarWidth] = useState(0);
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
   // const screenWidth = Dimensions.get("window").width;
    

   const getCaptionStyle = (progress: number, barWidth: number): ViewStyle => {
    const labelWidth = 50; // estimate or measure dynamically
    const progressX = barWidth * progress;
    //const clampedLTR = Math.max(0, Math.min(progressX, barWidth - labelWidth));
   // const clampedRTL = Math.max(0, Math.min(barWidth - progressX, barWidth - labelWidth));

    // Center the label over the progress position
const centeredX = progressX - labelWidth / 2;

// Clamp to keep the label within bounds
const clampedLTR = Math.max(0, Math.min(centeredX, barWidth - labelWidth));
const clampedRTL = Math.max(0, Math.min(barWidth - progressX - labelWidth / 2, barWidth - labelWidth));

    return I18nManager.isRTL
        ? {
              position: "absolute" as const,
              right: clampedRTL,
              top: -6,
              transform: [{ translateX: 0 }]
          }
        : {
              position: "absolute" as const,
              left: clampedLTR,
              top: -6,
              transform: [{ translateX: 0 }]
          };
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
    const { showProgressCaption, showDefaultProgressCaption,progressCaption,useDefaulMendixColor,customColor,customUnfilledColor} = props;
    return (
        <View
    style={styles.container}
    onLayout={event => {
        const width = event.nativeEvent.layout.width;
        setBarWidth(width);
    }}
>
    
            <Bar
                testID={props.name}
                height={Number(styles.bar.height)}
                width={null}
                progress={progress}
                color={useDefaulMendixColor ? styles.fill.backgroundColor : customColor}
                unfilledColor={useDefaulMendixColor ? "#fff" : customUnfilledColor}
                borderWidth={styles.bar.borderWidth}
                //style={styles.bar}
            />
            {showProgressCaption && (
           <View style={getCaptionStyle(progress, barWidth)}>
                <View
        style={{
            backgroundColor: useDefaulMendixColor ? styles.fill.backgroundColor : customColor, // blue
            borderRadius: 5,
            paddingHorizontal: 8,
            paddingVertical: 2,
            minWidth: 40,
            alignItems: "center",
            justifyContent: "center"
        }}
    >
                <Text  style={{
                color: "#fff", // White caption text
                fontWeight:"bold"
            }}>
                    { showDefaultProgressCaption ? parseFloat((progress * 100).toFixed(2))+'%' :progressCaption?.value}
                </Text>
            </View>
            {validationMessages.length > 0 && (
                <Text style={styles.validationMessage}>{validationMessages.join("\n")}</Text>
            )}
        </View> )}
        </View>
    );
}
