import { memo, ReactElement } from "react";
import { ViewStyle } from "react-native";
import { Gradient } from "./Gradients";
import tinycolor from "tinycolor2";
import HSLA = tinycolor.ColorFormats.HSLA;

interface AlphaGradientProps {
    style?: ViewStyle;
    gradientSteps: number;
    color: HSLA;
}

export const AlphaGradient = memo(
    ({ style, gradientSteps, color }: AlphaGradientProps): ReactElement => (
        <Gradient
            style={style}
            gradientSteps={gradientSteps}
            getStepColor={value => tinycolor({ ...color, a: value }).toHslString()}
            maximumValue={1}
        />
    ),
    // Changes to the alpha channel itself don't affect the gradient, so they don't trigger a re-render
    (previous, next) =>
        previous.color.h === next.color.h && previous.color.s === next.color.s && previous.color.l === next.color.l
);
