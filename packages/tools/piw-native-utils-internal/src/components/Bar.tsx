import { JSX, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, I18nManager, ColorValue } from "react-native";

export interface BarProps {
    progress: number;
    color: ColorValue;
    height: number;
    width?: number | null;
    borderWidth?: number | string;
    borderColor?: ColorValue;
    borderRadius?: number | string;
    unfilledColor?: ColorValue;
    style?: ViewStyle;
    testID?: string;
}

export function Bar(props: BarProps): JSX.Element {
    const {
        progress,
        color,
        height,
        width,
        borderWidth = 0,
        borderColor,
        borderRadius = 0,
        unfilledColor,
        style,
        testID
    } = props;

    // Track layout width when width prop is null, matching react-native-progress behavior
    const [layoutWidth, setLayoutWidth] = useState(0);

    // Clamp progress between 0 and 1, matching react-native-progress behavior
    const clampedProgress = Math.min(Math.max(progress, 0), 1);

    // Normalize numeric values from string | number to number
    const numericBorderWidth = typeof borderWidth === "string" ? parseFloat(borderWidth) || 0 : borderWidth || 0;
    const numericBorderRadius = typeof borderRadius === "string" ? parseFloat(borderRadius) || 0 : borderRadius || 0;

    // Calculate inner width considering border
    // Use provided width or measured layout width, matching react-native-progress
    const innerWidth = Math.max(0, (width || layoutWidth) - numericBorderWidth * 2);

    // Match react-native-progress transform behavior
    // Uses interpolation for RTL: inputRange [0,1] -> outputRange [innerWidth/-2, 0]
    // And scaleX: inputRange [0,1] -> outputRange [0.0001, 1]
    const translateX = I18nManager.isRTL
        ? (innerWidth / 2) * (1 - clampedProgress)
        : (innerWidth / -2) * (1 - clampedProgress);

    // Use 0.0001 instead of 0 to avoid transform issues (react-native-progress workaround)
    const scaleX = clampedProgress === 0 ? 0.0001 : clampedProgress;

    const handleLayout = (event: LayoutChangeEvent): void => {
        if (!width) {
            setLayoutWidth(event.nativeEvent.layout.width);
        }
    };

    return (
        <View
            testID={testID}
            onLayout={handleLayout}
            style={[
                {
                    width: width === null ? undefined : width,
                    borderWidth: numericBorderWidth,
                    borderColor: borderColor || color,
                    borderRadius: numericBorderRadius,
                    overflow: "hidden",
                    backgroundColor: unfilledColor
                },
                style
            ]}
        >
            <View
                testID={testID ? `${testID}-fill` : undefined}
                style={{
                    backgroundColor: color,
                    height,
                    width: "100%",
                    transform: [{ translateX }, { scaleX }]
                }}
            />
        </View>
    );
}
