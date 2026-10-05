import { ComponentType, memo, ReactElement } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import tinycolor from "tinycolor2";
import HSLA = tinycolor.ColorFormats.HSLA;

interface GradientProps {
    style?: ViewStyle;
    gradientSteps: number;
    maximumValue: number;
    getStepColor: (value: number) => string;
}

interface ChannelGradientProps {
    style?: ViewStyle;
    gradientSteps: number;
    color: HSLA;
}

/**
 * Approximates a horizontal linear gradient with a row of solid color segments.
 * Segment `n` is colored with the value `n / gradientSteps * maximumValue`, so both ends of the range are included.
 */
export const Gradient = ({ style, gradientSteps, maximumValue, getStepColor }: GradientProps): ReactElement => {
    const segmentColors = Array.from({ length: gradientSteps + 1 }, (_, index) =>
        getStepColor((index / gradientSteps) * maximumValue)
    );

    return (
        <View style={[styles.track, style]}>
            {segmentColors.map((backgroundColor, index) => (
                <View key={index} style={[styles.segment, { backgroundColor }]} />
            ))}
        </View>
    );
};

const hueColor = (hue: number): string => tinycolor({ h: hue, s: 1, l: 0.5 }).toHslString();

export const HueGradient = memo(
    ({ style, gradientSteps }: Omit<ChannelGradientProps, "color">): ReactElement => (
        <Gradient style={style} gradientSteps={gradientSteps} maximumValue={359} getStepColor={hueColor} />
    )
);

/**
 * Builds a gradient that sweeps one HSL channel from 0 to 1 while keeping the other channels of `color` fixed.
 * Changes to the swept channel itself don't affect the gradient, so they don't trigger a re-render.
 */
const createChannelGradient = (channel: "s" | "l"): ComponentType<ChannelGradientProps> => {
    const fixedChannels = (["h", "s", "l"] as const).filter(key => key !== channel);

    return memo(
        ({ style, gradientSteps, color }: ChannelGradientProps): ReactElement => (
            <Gradient
                style={style}
                gradientSteps={gradientSteps}
                maximumValue={1}
                getStepColor={value => tinycolor({ ...color, [channel]: value }).toHslString()}
            />
        ),
        (previous, next) => fixedChannels.every(key => previous.color[key] === next.color[key])
    );
};

export const SaturationGradient = createChannelGradient("s");

export const LightnessGradient = createChannelGradient("l");

const styles = StyleSheet.create({
    track: {
        flex: 1,
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "center"
    },
    segment: {
        flex: 1,
        // Overlap neighbouring segments slightly so iOS doesn't render visible seams between them
        marginLeft: Platform.OS === "ios" ? -StyleSheet.hairlineWidth : 0
    }
});
