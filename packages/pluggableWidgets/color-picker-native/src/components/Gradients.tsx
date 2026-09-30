/**
 * Gradients ported from react-native-color 0.0.10 (https://github.com/hector/react-native-color)
 * Copyright (c) 2017 Hector Garcia, MIT License
 */
import { memo, ReactElement } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import tinycolor from "tinycolor2";
import HSLA = tinycolor.ColorFormats.HSLA;

interface GradientProps {
    style?: ViewStyle;
    gradientSteps: number;
    maximumValue: number;
    getStepColor: (i: number) => string;
}

interface ColorGradientProps {
    style?: ViewStyle;
    gradientSteps: number;
    color: HSLA;
}

export const Gradient = ({ style, gradientSteps, maximumValue, getStepColor }: GradientProps): ReactElement => {
    const rows = [];
    for (let i = 0; i <= gradientSteps; i++) {
        rows.push(
            <View
                key={i}
                style={{
                    flex: 1,
                    marginLeft: Platform.OS === "ios" ? -StyleSheet.hairlineWidth : 0,
                    backgroundColor: getStepColor((i * maximumValue) / gradientSteps)
                }}
            />
        );
    }
    return <View style={[styles.container, style]}>{rows}</View>;
};

export const HueGradient = memo(
    ({ style, gradientSteps }: Omit<ColorGradientProps, "color">): ReactElement => (
        <Gradient
            style={style}
            gradientSteps={gradientSteps}
            getStepColor={i => tinycolor({ s: 1, l: 0.5, h: i }).toHslString()}
            maximumValue={359}
        />
    )
);

export const SaturationGradient = memo(
    ({ style, color, gradientSteps }: ColorGradientProps): ReactElement => (
        <Gradient
            style={style}
            gradientSteps={gradientSteps}
            getStepColor={i => tinycolor({ ...color, s: i }).toHslString()}
            maximumValue={1}
        />
    ),
    (previous, next) => previous.color.h === next.color.h && previous.color.l === next.color.l
);

export const LightnessGradient = memo(
    ({ style, color, gradientSteps }: ColorGradientProps): ReactElement => (
        <Gradient
            style={style}
            gradientSteps={gradientSteps}
            getStepColor={i => tinycolor({ ...color, l: i }).toHslString()}
            maximumValue={1}
        />
    ),
    (previous, next) => previous.color.h === next.color.h && previous.color.s === next.color.s
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "stretch"
    }
});
