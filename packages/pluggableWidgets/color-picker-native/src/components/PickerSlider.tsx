import { Component, createElement, createRef } from "react";
import {
    AccessibilityActionEvent,
    AccessibilityValue,
    GestureResponderEvent,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    ViewStyle
} from "react-native";
import Slider from "react-native-slider";
import { DynamicValue } from "mendix";

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
    accessible?: boolean;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    screenReaderEnabled?: boolean;
    accessibilityValue?: AccessibilityValue;
}

export class PickerSlider extends Component<PickerSlidersProps> {
    private readonly onTapHandler = this.onTap.bind(this);
    private readonly onChangeHandler = this.onChange.bind(this);
    private readonly onSlidingCompleteHandler = this.onSlidingComplete.bind(this);
    private readonly viewRef = createRef<View>();
    private isSliding = false;

    private renderSlider = (): JSX.Element => {
        const minValue = this.props.minimumValue || 0;
        const maxValue = this.props.maximumValue || 1;
        const SliderRender = (
            <View
                {...(this.props.accessible && this.props.screenReaderEnabled && { testID: this.props.testID })}
                accessible={this.props.accessible}
                accessibilityLabel={this.props.screenReaderCaption?.value}
                accessibilityRole="adjustable"
                accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
                onAccessibilityAction={(event: AccessibilityActionEvent) => {
                    const value = event.nativeEvent.actionName === "increment" ? 1 : -1;
                    const newValue = this.props.value + value * this.props.step;
                    if (newValue >= minValue && newValue <= maxValue) {
                        this.onChangeHandler(newValue);
                        this.onSlidingComplete();
                    }
                }}
                accessibilityState={{ disabled: this.props.disabled }}
                accessibilityValue={this.props.accessibilityValue}
                style={[styles.container]}
                ref={this.viewRef}
            >
                <View style={styles.gradient}>{this.props.children}</View>
                <Slider
                    value={this.props.value}
                    step={this.props.step}
                    animateTransitions={false}
                    thumbTouchSize={{ width: 48, height: 48 }}
                    minimumValue={this.props.minimumValue}
                    maximumValue={this.props.maximumValue}
                    onValueChange={this.onChangeHandler}
                    onSlidingComplete={this.onSlidingCompleteHandler}
                    minimumTrackTintColor="transparent"
                    maximumTrackTintColor="transparent"
                    trackStyle={this.props.trackStyle}
                    thumbStyle={[
                        styles.thumb,
                        this.props.thumbStyle as ViewStyle,
                        { backgroundColor: this.props.thumbTintColor }
                    ]}
                    disabled={this.props.disabled}
                />
            </View>
        );

        return this.props.accessible && this.props.screenReaderEnabled ? (
            SliderRender
        ) : (
            <TouchableWithoutFeedback
                onPressIn={this.onTapHandler}
                testID={this.props.testID}
                disabled={this.props.disabled}
            >
                {SliderRender}
            </TouchableWithoutFeedback>
        );
    };

    render(): JSX.Element {
        return this.renderSlider();
    }

    private onChange(value: number): void {
        this.isSliding = true;
        this.props.onValueChange(value);
    }

    private onSlidingComplete(): void {
        this.isSliding = false;
        this.props.onValueChangeComplete();
    }

    private onTap(event: GestureResponderEvent): void {
        if (!this.viewRef.current || this.props.disabled) {
            return;
        }

        const { step, maximumValue, minimumValue } = this.props;

        this.viewRef.current.measure((_x, _y, width) => {
            if (this.isSliding) {
                return;
            }
            const positionFraction = event.nativeEvent.locationX / width;
            const value = (maximumValue || 1) * positionFraction;
            const roundedValue = this.roundToMultiple(value, step);
            if (roundedValue >= (minimumValue || 0) && roundedValue <= (maximumValue || 1)) {
                this.props.onValueChange(roundedValue);
                this.props.onValueChangeComplete();
            }
        });
    }

    private readonly roundToMultiple = (value: number, multiple: number): number =>
        Math.round(value / multiple) * multiple;
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
