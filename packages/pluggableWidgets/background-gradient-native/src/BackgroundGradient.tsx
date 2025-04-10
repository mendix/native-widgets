import { createElement, ReactElement } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { all } from "deepmerge";
import { executeAction } from "@mendix/piw-utils-internal";
import defaultStyle, { CustomStyle } from "./ui/Styles";
import { BackgroundGradientProps } from "../typings/BackgroundGradientProps";

export type props = BackgroundGradientProps<CustomStyle>;

const opacityValidation = (opacity: number | undefined): number => {
    if (opacity === undefined) {
        return defaultStyle.opacity / 100;
    }
    const opacityVal = Number(opacity);
    if (isNaN(opacityVal)) {
        throw new Error("Opacity must be a number.");
    }
    if (opacityVal < 0 || opacityVal > 100) {
        console.warn("Opacity must be between 0 and 100.");
    }
    return opacityVal / 100;
};

const angleValidation = (angle: number | undefined): number => {
    if (angle === undefined) {
        return defaultStyle.angle;
    }
    const angleVal = Number(angle);
    if (isNaN(angleVal)) {
        throw new Error("Angle must be a number.");
    }
    return angleVal;
};

// Convert angle to Expo's LinearGradient start/end points
const angleToCoords = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians);
    const y = Math.sin(radians);
    const start = { x: 0.5 - x / 2, y: 0.5 - y / 2 };
    const end = { x: 0.5 + x / 2, y: 0.5 + y / 2 };
    return { start, end };
};

export function BackgroundGradient({ name, colorList, content, onClick, style }: props): ReactElement {
    const styles = all<CustomStyle>([defaultStyle, ...style]);
    const angle = angleValidation(styles.angle);
    const opacity = opacityValidation(styles.opacity);

    let sortedColorList = (styles.colorList && colorList.length === 0 ? styles.colorList : colorList).sort(
        (a, b) => Number(a.offset) - Number(b.offset)
    );

    if (sortedColorList.length === 0) {
        throw new Error("The color list could not be empty.");
    }

    if (sortedColorList.length === 1) {
        sortedColorList = [...sortedColorList, ...sortedColorList];
    }

    const colors = sortedColorList.map(c => c.color.toLowerCase()) as [string, string, ...string[]];
    const locations = sortedColorList.map(c => Number(c.offset)) as [number, number, ...number[]];
    const { start, end } = angleToCoords(angle);

    return (
        <Pressable
            onPress={() => executeAction(onClick)}
            testID={name}
            style={({ pressed }) => ({
                flex: styles.container.flex,
                opacity: onClick?.canExecute && pressed ? opacity * 0.3 : opacity
            })}
        >
            <LinearGradient
                colors={colors}
                locations={locations}
                start={start}
                end={end}
                style={[StyleSheet.absoluteFill, styles.container]}
            />
            <View style={[StyleSheet.absoluteFill, styles.container]}>{content}</View>
        </Pressable>
    );
}
