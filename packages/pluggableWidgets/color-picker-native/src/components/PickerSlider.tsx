import { PropsWithChildren, ReactElement } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { Slider } from "@mendix/piw-native-utils-internal";

interface PickerSlidersProps {
    value: number;
    step: number;
    minimumValue?: number;
    maximumValue?: number;
    onValueChange: (value: number) => void;
    onValueChangeComplete: () => void;
    thumbTintColor: string;
    thumbStyle?: ViewStyle;
    trackStyle?: ViewStyle;
    disabled?: boolean;
    testID?: string;
}

export function PickerSlider(props: PropsWithChildren<PickerSlidersProps>): ReactElement {
    return (
        <View style={styles.container}>
            <View style={styles.gradient}>{props.children}</View>
            <Slider
                testID={props.testID}
                value={props.value}
                step={props.step}
                trackClickable
                thumbTouchSize={{ width: 48, height: 48 }}
                minimumValue={props.minimumValue}
                maximumValue={props.maximumValue}
                onValueChange={props.onValueChange}
                onSlidingComplete={props.onValueChangeComplete}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                trackStyle={props.trackStyle}
                thumbStyle={[styles.thumb, props.thumbStyle, { backgroundColor: props.thumbTintColor }]}
                disabled={props.disabled}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        height: 32
    },
    thumb: Platform.select({
        ios: {
            width: 24,
            height: 24,
            borderRadius: 12
        },
        default: {
            width: 20,
            height: 20,
            borderRadius: 10,
            elevation: 3
        }
    }),
    gradient: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 6
    }
});
