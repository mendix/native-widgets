import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { ValueStatus } from "mendix";
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ViewStyle } from "react-native";
import tinycolor from "tinycolor2";
import { ColorPickerProps } from "../typings/ColorPickerProps";
import { PickerSlider } from "./components/PickerSlider";
import { AlphaGradient } from "./components/AlphaGradient";
import { DisabledHueGradient } from "./components/DisabledHueGradient";
import { HueGradient, LightnessGradient, SaturationGradient } from "./components/Gradients";
import { ColorPickerStyle, defaultColorPickerStyle } from "./ui/Styles";
import HSLA = tinycolor.ColorFormats.HSLA;
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = ColorPickerProps<ColorPickerStyle>;

const defaultSteps = 80;

const formatColor = (hsla: HSLA | undefined, format: Props["format"]): string => {
    const color = tinycolor(hsla);
    switch (format) {
        case "hex":
            return color.toHexString();
        case "hsl":
            return color.toHslString();
        case "hsv":
            return color.toHsvString();
        case "rgb":
            return color.toRgbString();
    }
};

const getThumbStyle = (color: HSLA): ViewStyle => ({
    borderWidth: 1,
    borderColor: tinycolor(color).toHexString()
});

export function ColorPicker(props: Props): ReactElement | null {
    const { color: colorValue, format, onChange } = props;
    const [stateColor, setStateColor] = useState<HSLA | undefined>(undefined);
    // Screen reader actions change and complete in one event, before the state update is applied
    const pendingColor = useRef<HSLA | undefined>(undefined);
    const previous = useRef({ value: colorValue.value, color: stateColor });
    const styles = useMemo(() => flattenStyles(defaultColorPickerStyle, props.style), [props.style]);

    useEffect(() => {
        const { value: previousValue, color: previousColor } = previous.current;
        previous.current = { value: colorValue.value, color: stateColor };
        // Keep the unrounded color while it still matches the value, so the other sliders don't jump when it is
        // stored with 8-bit precision or hue and saturation are lost at black and white
        if (
            colorValue.value !== previousValue &&
            stateColor === previousColor &&
            stateColor &&
            formatColor(stateColor, format) !== colorValue.value
        ) {
            setStateColor(undefined);
        }
    });

    const renderedColor = useMemo(
        (): HSLA => stateColor ?? tinycolor(colorValue.value).toHsl(),
        [stateColor, colorValue.value]
    );
    const getCurrentColor = useCallback((): HSLA => pendingColor.current ?? renderedColor, [renderedColor]);

    const setColor = useCallback((color: HSLA): void => {
        pendingColor.current = color;
        setStateColor(color);
    }, []);

    const onChangeHue = useCallback(
        (value: number): void => setColor({ ...getCurrentColor(), h: value }),
        [getCurrentColor, setColor]
    );
    const onChangeSaturation = useCallback(
        (value: number): void => setColor({ ...getCurrentColor(), s: value }),
        [getCurrentColor, setColor]
    );
    const onChangeLightness = useCallback(
        (value: number): void => setColor({ ...getCurrentColor(), l: value }),
        [getCurrentColor, setColor]
    );
    const onChangeAlpha = useCallback(
        (value: number): void => setColor({ ...getCurrentColor(), a: value }),
        [getCurrentColor, setColor]
    );

    const onChangeComplete = useCallback((): void => {
        if (pendingColor.current && colorValue.value !== formatColor(pendingColor.current, format)) {
            colorValue.setValue(formatColor(pendingColor.current, format));
        }
        pendingColor.current = undefined;

        executeAction(onChange);
    }, [colorValue, format, onChange]);

    if (!colorValue || colorValue.status !== ValueStatus.Available || !colorValue.value) {
        return null;
    }

    const color = renderedColor;
    const thumbTintColor = tinycolor(color).toHslString();
    const thumbStyle = getThumbStyle(color);

    return (
        <View style={styles.container} testID={`${props.name}`}>
            {props.showPreview && (
                <View testID={`${props.name}$preview`} style={[styles.preview, { backgroundColor: thumbTintColor }]} />
            )}
            <PickerSlider
                testID={`${props.name}$hue`}
                value={color.h}
                onValueChange={onChangeHue}
                onValueChangeComplete={onChangeComplete}
                step={1}
                maximumValue={359}
                thumbTintColor={thumbTintColor}
                thumbStyle={thumbStyle}
                disabled={colorValue.readOnly}
            >
                {colorValue.readOnly ? (
                    <DisabledHueGradient color={color} />
                ) : (
                    <HueGradient gradientSteps={defaultSteps} />
                )}
            </PickerSlider>
            {props.showSaturation && !colorValue.readOnly && (
                <PickerSlider
                    testID={`${props.name}$saturation`}
                    value={color.s}
                    onValueChange={onChangeSaturation}
                    onValueChangeComplete={onChangeComplete}
                    step={0.01}
                    thumbTintColor={thumbTintColor}
                    thumbStyle={thumbStyle}
                    disabled={colorValue.readOnly}
                >
                    <SaturationGradient color={color} gradientSteps={defaultSteps} />
                </PickerSlider>
            )}
            {props.showLightness && !colorValue.readOnly && (
                <PickerSlider
                    testID={`${props.name}$lightness`}
                    value={color.l}
                    onValueChange={onChangeLightness}
                    onValueChangeComplete={onChangeComplete}
                    step={0.01}
                    thumbTintColor={thumbTintColor}
                    thumbStyle={thumbStyle}
                    disabled={colorValue.readOnly}
                >
                    <LightnessGradient color={color} gradientSteps={defaultSteps} />
                </PickerSlider>
            )}
            {format !== "hex" && props.showAlpha && !colorValue.readOnly && (
                <PickerSlider
                    testID={`${props.name}$alpha`}
                    value={color.a}
                    onValueChange={onChangeAlpha}
                    onValueChangeComplete={onChangeComplete}
                    step={0.01}
                    thumbTintColor={thumbTintColor}
                    thumbStyle={thumbStyle}
                    disabled={colorValue.readOnly}
                >
                    <AlphaGradient color={color} gradientSteps={defaultSteps} />
                </PickerSlider>
            )}
        </View>
    );
}
