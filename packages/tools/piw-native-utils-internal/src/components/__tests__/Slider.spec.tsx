import { ReactElement } from "react";
import { I18nManager, StyleSheet } from "react-native";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { ReactTestInstance } from "react-test-renderer";
import { RangeSlider, RangeSliderProps, Slider, SliderProps } from "../Slider";

// Container 300 wide and thumb 20 wide gives a 280px track, so a value of 0.5 puts the thumb at left 140.
const CONTAINER = { width: 300, height: 40 };
const THUMB = { width: 20, height: 20 };

describe("Slider", () => {
    let defaultProps: SliderProps;

    beforeEach(() => {
        defaultProps = {
            testID: "slider",
            value: 0.5,
            step: 0.01,
            onSlidingStart: jest.fn(),
            onValueChange: jest.fn(),
            onSlidingComplete: jest.fn()
        };
    });

    describe("accessibility", () => {
        it("is an adjustable element announcing its value on a 0-100 scale", () => {
            const slider = renderMeasured(defaultProps).getByTestId("slider");

            expect(slider.props.accessible).toBe(true);
            expect(slider.props.accessibilityRole).toBe("adjustable");
            expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
            expect(slider.props.accessibilityActions).toEqual([{ name: "increment" }, { name: "decrement" }]);
        });

        it("normalizes ranges that do not start at zero", () => {
            const slider = renderMeasured({
                ...defaultProps,
                minimumValue: 10,
                maximumValue: 20,
                value: 15
            }).getByTestId("slider");

            expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
        });

        it("reports the disabled state", () => {
            const slider = renderMeasured({ ...defaultProps, disabled: true }).getByTestId("slider");

            expect(slider.props.accessibilityState).toEqual({ disabled: true });
        });

        it("increments and decrements by a tenth of the range, snapped to the step", () => {
            const component = renderMeasured({
                ...defaultProps,
                minimumValue: 0,
                maximumValue: 359,
                step: 1,
                value: 100
            });

            fireEvent(component.getByTestId("slider"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });
            expect(defaultProps.onValueChange).toHaveBeenLastCalledWith(136);
            expect(defaultProps.onSlidingComplete).toHaveBeenLastCalledWith(136);

            fireEvent(component.getByTestId("slider"), "accessibilityAction", {
                nativeEvent: { actionName: "decrement" }
            });
            expect(defaultProps.onValueChange).toHaveBeenLastCalledWith(100);
        });

        it("uses a custom increment", () => {
            const component = renderMeasured({ ...defaultProps, value: 0.5, accessibilityIncrement: 0.25 });

            fireEvent(component.getByTestId("slider"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });

            expect(defaultProps.onValueChange).toHaveBeenCalledWith(0.75);
        });

        it("does not go beyond the bounds", () => {
            const component = renderMeasured({ ...defaultProps, value: 1 });

            fireEvent(component.getByTestId("slider"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });

            expect(defaultProps.onValueChange).not.toHaveBeenCalled();
            expect(defaultProps.onSlidingComplete).not.toHaveBeenCalled();
        });

        it("ignores actions when disabled", () => {
            const component = renderMeasured({ ...defaultProps, disabled: true });

            fireEvent(component.getByTestId("slider"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });

            expect(defaultProps.onValueChange).not.toHaveBeenCalled();
        });
    });

    describe("dragging", () => {
        it("drags the thumb and completes on release", () => {
            const touchArea = getTouchArea(renderMeasured(defaultProps));

            expect(press(touchArea, 150)).toBe(true);
            fireEvent(touchArea, "responderGrant", touch(150));
            expect(defaultProps.onSlidingStart).toHaveBeenCalledWith(0.5);
            expect(defaultProps.onValueChange).not.toHaveBeenCalled();

            fireEvent(touchArea, "responderMove", move(70));
            expect(defaultProps.onValueChange).toHaveBeenLastCalledWith(0.75);
            expect(defaultProps.onSlidingComplete).not.toHaveBeenCalled();

            fireEvent(touchArea, "responderRelease", move(70));
            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith(0.75);
        });

        it("clamps to the bounds", () => {
            const touchArea = getTouchArea(renderMeasured(defaultProps));

            fireEvent(touchArea, "responderGrant", touch(150));
            fireEvent(touchArea, "responderMove", move(-1000));
            fireEvent(touchArea, "responderRelease", move(-1000));
            expect(defaultProps.onSlidingComplete).toHaveBeenLastCalledWith(0);

            fireEvent(touchArea, "responderGrant", touch(0));
            fireEvent(touchArea, "responderMove", move(1000));
            fireEvent(touchArea, "responderRelease", move(1000));
            expect(defaultProps.onSlidingComplete).toHaveBeenLastCalledWith(1);
        });

        it("keeps a touch area of at least 48x48 around the thumb", () => {
            const touchArea = getTouchArea(
                renderMeasured({ ...defaultProps, thumbTouchSize: { width: 10, height: 10 } })
            );

            // Thumb centre is at 150 in the container; the touch area is offset by half the 28px overflow
            expect(press(touchArea, 14 + 150 + 23)).toBe(true);
            expect(press(touchArea, 14 + 150 + 25)).toBe(false);
        });

        it("starts dragging from a value updated through props", () => {
            const component = renderMeasured(defaultProps);
            component.rerender(<Slider {...defaultProps} value={0.25} />);
            const touchArea = getTouchArea(component);

            fireEvent(touchArea, "responderGrant", touch(0));
            fireEvent(touchArea, "responderMove", move(28));
            fireEvent(touchArea, "responderRelease", move(28));

            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith(0.35);
        });

        it("does not respond when disabled", () => {
            const touchArea = getTouchArea(renderMeasured({ ...defaultProps, disabled: true }));

            expect(press(touchArea, 150)).toBe(false);
        });
    });

    it("rounds values to the precision of the step", () => {
        const touchArea = getTouchArea(
            renderMeasured({ ...defaultProps, minimumValue: 0.5, maximumValue: 2, step: 0.1 })
        );

        fireEvent(touchArea, "responderGrant", touch(0));
        fireEvent(touchArea, "responderMove", move(131));

        expect(defaultProps.onValueChange).toHaveBeenLastCalledWith(1.2);
    });

    it("rounds values when the step uses scientific notation", () => {
        const touchArea = getTouchArea(
            renderMeasured({ ...defaultProps, minimumValue: 0, maximumValue: 1e-6, step: 1e-7, value: 0 })
        );

        fireEvent(touchArea, "responderGrant", touch(24));
        fireEvent(touchArea, "responderMove", move(112));

        expect(defaultProps.onValueChange).toHaveBeenLastCalledWith(4e-7);
    });

    describe("track", () => {
        it("ignores presses outside the thumb by default", () => {
            const touchArea = getTouchArea(renderMeasured(defaultProps));

            expect(press(touchArea, 20)).toBe(false);
        });

        it("moves the thumb to the pressed position when clickable", () => {
            const touchArea = getTouchArea(renderMeasured({ ...defaultProps, trackClickable: true }));

            // Thumb centre at 3/4 of the track: 10 + 210 in the container, plus the 14px touch overflow
            expect(press(touchArea, 14 + 220)).toBe(true);
            fireEvent(touchArea, "responderGrant", touch(14 + 220));
            expect(defaultProps.onValueChange).toHaveBeenCalledWith(0.75);

            fireEvent(touchArea, "responderRelease", move(0));
            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith(0.75);
        });

        it("continues as a drag after pressing the track", () => {
            const touchArea = getTouchArea(renderMeasured({ ...defaultProps, trackClickable: true }));

            press(touchArea, 14 + 220);
            fireEvent(touchArea, "responderGrant", touch(14 + 220));
            fireEvent(touchArea, "responderMove", move(-140));
            fireEvent(touchArea, "responderRelease", move(-140));

            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith(0.25);
        });

        it("does not respond when disabled", () => {
            const touchArea = getTouchArea(renderMeasured({ ...defaultProps, trackClickable: true, disabled: true }));

            expect(press(touchArea, 20)).toBe(false);
        });
    });

    it("lets the minimum track style override the tint color", () => {
        const component = renderMeasured(
            <Slider {...defaultProps} minimumTrackTintColor="red" minimumTrackStyle={{ backgroundColor: "blue" }} />
        );
        const [, minimumTrack] = component
            .getByTestId("slider")
            .findAll(node => typeof node.type === "string" && node.props.renderToHardwareTextureAndroid);

        expect(StyleSheet.flatten(minimumTrack.props.style).backgroundColor).toBe("blue");
    });

    describe("in a right-to-left layout", () => {
        beforeEach(() => {
            jest.replaceProperty(I18nManager, "isRTL", true);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("starts the track on the right", () => {
            const touchArea = getTouchArea(renderMeasured({ ...defaultProps, value: 0.25 }));

            // Thumb at a quarter of the track from the right edge: 280 - 70 = 210 from the left
            expect(press(touchArea, 14 + 210 + 10)).toBe(true);
            expect(press(touchArea, 14 + 70 + 10)).toBe(false);

            fireEvent(touchArea, "responderGrant", touch(14 + 210 + 10));
            fireEvent(touchArea, "responderMove", move(-70));
            fireEvent(touchArea, "responderRelease", move(-70));
            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith(0.5);
        });

        it("moves the thumb to the pressed position when clickable", () => {
            const touchArea = getTouchArea(renderMeasured({ ...defaultProps, trackClickable: true }));

            press(touchArea, 14 + 70 + 10);
            fireEvent(touchArea, "responderGrant", touch(14 + 70 + 10));

            expect(defaultProps.onValueChange).toHaveBeenCalledWith(0.75);
        });
    });
});

// Values 20 and 80 of 0-100 put the thumbs at left 56 and 224, so their centres in the touch area are at 80 and 248
describe("RangeSlider", () => {
    let defaultProps: RangeSliderProps;

    beforeEach(() => {
        defaultProps = {
            testID: "slider",
            value: [20, 80],
            minimumValue: 0,
            maximumValue: 100,
            step: 1,
            accessibilityLabels: ["Minimum", "Maximum"],
            onSlidingStart: jest.fn(),
            onValueChange: jest.fn(),
            onSlidingComplete: jest.fn()
        };
    });

    describe("accessibility", () => {
        it("makes each thumb an adjustable element with its own label and value", () => {
            const component = renderMeasured(<RangeSlider {...defaultProps} />);
            const lower = component.getByTestId("slider$thumb0");
            const upper = component.getByTestId("slider$thumb1");

            expect(component.getByTestId("slider").props.accessible).toBeUndefined();
            expect(lower.props.accessibilityRole).toBe("adjustable");
            expect(lower.props.accessibilityLabel).toBe("Minimum");
            expect(lower.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 20 });
            expect(upper.props.accessibilityLabel).toBe("Maximum");
            expect(upper.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 80 });
        });

        it("orders values given in the wrong order", () => {
            const component = renderMeasured(<RangeSlider {...defaultProps} value={[80, 20]} />);

            expect(component.getByTestId("slider$thumb0").props.accessibilityValue.now).toBe(20);
        });

        it("adjusts a thumb without passing the other", () => {
            const component = renderMeasured(<RangeSlider {...defaultProps} value={[20, 25]} />);

            fireEvent(component.getByTestId("slider$thumb0"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });
            expect(defaultProps.onSlidingComplete).toHaveBeenLastCalledWith([25, 25], 0);

            fireEvent(component.getByTestId("slider$thumb1"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });
            expect(defaultProps.onSlidingComplete).toHaveBeenLastCalledWith([25, 35], 1);
        });
    });

    describe("dragging", () => {
        it("drags the lower thumb", () => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} />));

            expect(press(touchArea, 80)).toBe(true);
            fireEvent(touchArea, "responderGrant", touch(80));
            expect(defaultProps.onSlidingStart).toHaveBeenCalledWith([20, 80], 0);
            fireEvent(touchArea, "responderMove", move(70));
            expect(defaultProps.onValueChange).toHaveBeenLastCalledWith([45, 80], 0);
            fireEvent(touchArea, "responderRelease", move(70));
            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith([45, 80], 0);
        });

        it("drags the upper thumb", () => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} />));

            press(touchArea, 248);
            fireEvent(touchArea, "responderGrant", touch(248));
            fireEvent(touchArea, "responderMove", move(-70));
            fireEvent(touchArea, "responderRelease", move(-70));

            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith([20, 55], 1);
        });

        it("ignores presses between the thumbs by default", () => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} />));

            expect(press(touchArea, 164)).toBe(false);
        });

        it("stops a thumb at the other thumb", () => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} />));

            press(touchArea, 80);
            fireEvent(touchArea, "responderGrant", touch(80));
            fireEvent(touchArea, "responderMove", move(1000));
            fireEvent(touchArea, "responderRelease", move(1000));

            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith([80, 80], 0);
        });

        it.each([
            ["down", -28, [40, 50], 0],
            ["up", 28, [50, 60], 1]
        ])("separates thumbs on top of each other when dragging %s", (_, dx, expected, index) => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} value={[50, 50]} />));

            expect(press(touchArea, 164)).toBe(true);
            fireEvent(touchArea, "responderGrant", touch(164));
            fireEvent(touchArea, "responderMove", move(dx as number));
            fireEvent(touchArea, "responderRelease", move(dx as number));

            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith(expected, index);
        });

        it("separates thumbs on top of each other at the minimum", () => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} value={[0, 0]} />));

            press(touchArea, 24);
            fireEvent(touchArea, "responderGrant", touch(24));
            fireEvent(touchArea, "responderMove", move(28));
            fireEvent(touchArea, "responderRelease", move(28));

            expect(defaultProps.onSlidingComplete).toHaveBeenCalledWith([0, 10], 1);
        });
    });

    describe("track", () => {
        it("moves the closest thumb to the pressed position", () => {
            const touchArea = getTouchArea(renderMeasured(<RangeSlider {...defaultProps} trackClickable />));

            // Value 90 is at left 252
            expect(press(touchArea, 14 + 252 + 10)).toBe(true);
            fireEvent(touchArea, "responderGrant", touch(14 + 252 + 10));
            expect(defaultProps.onValueChange).toHaveBeenLastCalledWith([20, 90], 1);
            fireEvent(touchArea, "responderRelease", move(0));

            press(touchArea, 14 + 10);
            fireEvent(touchArea, "responderGrant", touch(14 + 10));
            expect(defaultProps.onValueChange).toHaveBeenLastCalledWith([0, 90], 0);
        });

        it("highlights the track between the thumbs", () => {
            const component = renderMeasured(<RangeSlider {...defaultProps} />);
            const [, minimumTrack] = component
                .getByTestId("slider")
                .findAll(node => typeof node.type === "string" && node.props.renderToHardwareTextureAndroid);
            const style = StyleSheet.flatten(minimumTrack.props.style);

            expect(style.start).toBe(56 + 10);
            expect(style.width).toBe(224 - 56);
        });
    });
});

function renderMeasured(slider: SliderProps | ReactElement): RenderAPI {
    const component = render("value" in slider ? <Slider {...slider} /> : slider);
    const [container, thumb] = component
        .getByTestId("slider")
        .findAll(node => typeof node.type === "string" && typeof node.props.onLayout === "function");
    fireEvent(container, "layout", { nativeEvent: { layout: CONTAINER } });
    fireEvent(thumb, "layout", { nativeEvent: { layout: THUMB } });
    return component;
}

function getTouchArea(component: RenderAPI): ReactTestInstance {
    return component
        .getByTestId("slider")
        .findAll(node => typeof node.type === "string" && typeof node.props.onResponderGrant === "function")[0];
}

function press(touchArea: ReactTestInstance, locationX: number): boolean {
    return touchArea.props.onStartShouldSetResponder(touch(locationX));
}

function touch(locationX: number): object {
    return { nativeEvent: { locationX, locationY: 20 }, touchHistory: { touchBank: [] } };
}

function move(dx: number): object {
    return {
        touchHistory: {
            numberActiveTouches: 1,
            indexOfSingleActiveTouch: 0,
            touchBank: [
                {
                    touchActive: true,
                    currentTimeStamp: Date.now(),
                    currentPageX: dx,
                    currentPageY: 0,
                    previousPageX: 0,
                    previousPageY: 0,
                    startPageX: 0,
                    startPageY: 0
                }
            ]
        }
    };
}
