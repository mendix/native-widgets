import { actionValue, dynamicValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { ReactElement } from "react";
import { ValueStatus, DynamicValue } from "mendix";

import { Props, Slider } from "../Slider";

describe("Slider", () => {
    const noValue: DynamicValue<Big> = { status: ValueStatus.Unavailable, value: undefined };
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "slider-test",
            style: [],
            valueAttribute: new EditableValueBuilder<Big>().withValue(new Big(140)).build(),
            editable: "default",
            minimumValue: dynamicValue<Big>(new Big(0)),
            maximumValue: dynamicValue<Big>(new Big(280)),
            stepSize: dynamicValue<Big>(new Big(1))
        };
    });

    it("renders", () => {
        const component = render(<Slider {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders no error while the value is resolving", () => {
        const component = render(
            <Slider {...defaultProps} valueAttribute={new EditableValueBuilder<Big>().isLoading().build()} />
        );
        expect(component.queryByTestId(`${defaultProps.name}-validation-message`)).toBeNull();
    });

    it("renders an error when the minimum is greater than the maximum", () => {
        const component = render(<Slider {...defaultProps} minimumValue={dynamicValue(new Big(300))} />);
        expect(component.queryByText("The minimum value can not be greater than the maximum value.")).not.toBeNull();
    });

    it("renders an error when the step size is negative", () => {
        const component = render(<Slider {...defaultProps} stepSize={dynamicValue(new Big(-10))} />);
        expect(component.queryByText("The step size can not be zero or less than zero.")).not.toBeNull();
    });

    it("renders an error when the step size is empty", () => {
        const component = render(<Slider {...defaultProps} stepSize={noValue} />);
        expect(component.queryByText("No step size provided.")).not.toBeNull();
    });

    it("renders an error when the minimum is empty", () => {
        const component = render(<Slider {...defaultProps} minimumValue={noValue} />);
        expect(component.queryByText("No minimum value provided.")).not.toBeNull();
    });

    it("renders an error when the maximum is empty", () => {
        const component = render(<Slider {...defaultProps} maximumValue={noValue} />);
        expect(component.queryByText("No maximum value provided.")).not.toBeNull();
    });

    it("renders an error when the minimum is equal to the maximum", () => {
        const value = new Big(10);
        const component = render(
            <Slider
                {...defaultProps}
                valueAttribute={new EditableValueBuilder<Big>().withValue(value).build()}
                minimumValue={dynamicValue(value)}
                maximumValue={dynamicValue(value)}
            />
        );
        expect(component.queryByText("The minimum value can not be equal to the maximum value.")).not.toBeNull();
    });

    it("renders an error when the value is less than the minimum", () => {
        const component = render(
            <Slider
                {...defaultProps}
                valueAttribute={new EditableValueBuilder<Big>().withValue(new Big(-50)).build()}
            />
        );
        expect(component.queryByText("The current value can not be less than the minimum value.")).not.toBeNull();
    });

    it("renders an error when the value is greater than the maximum", () => {
        const component = render(
            <Slider
                {...defaultProps}
                valueAttribute={new EditableValueBuilder<Big>().withValue(new Big(300)).build()}
            />
        );
        expect(component.queryByText("The current value can not be greater than the maximum value.")).not.toBeNull();
    });

    it("renders a validation message", () => {
        const value = new EditableValueBuilder<Big>().withValidation("Invalid").build();
        const component = render(<Slider {...defaultProps} valueAttribute={value} />);

        expect(component.queryByText("Invalid")).not.toBeNull();
    });

    // The value 140 of 0-280 puts the thumb at left 135, so its centre in the touch area is at 9 + 135 + 15
    const thumbCentre = 159;
    const sliderId = "slider-test$slider";

    it("renders as disabled when editable is never", () => {
        const component = renderMeasured(<Slider {...defaultProps} editable={"never"} />, sliderId);

        expect(component.getByTestId(sliderId).props.accessibilityState).toEqual({ disabled: true });
        expect(drag(component, sliderId, thumbCentre, 27)).toBe(false);
        expect(defaultProps.valueAttribute.setValue).not.toHaveBeenCalled();
    });

    it("renders as enabled when editable is default", () => {
        const component = renderMeasured(<Slider {...defaultProps} />, sliderId);

        expect(component.getByTestId(sliderId).props.accessibilityState).toEqual({ disabled: false });
    });

    it("announces the value as adjustable", () => {
        const component = renderMeasured(<Slider {...defaultProps} />, sliderId);
        const slider = component.getByTestId(sliderId);

        expect(slider.props.accessibilityRole).toBe("adjustable");
        expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
    });

    it("adjusts the value with a screen reader", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<Slider {...defaultProps} onChange={onChangeAction} />, sliderId);

        fireEvent(component.getByTestId(sliderId), "accessibilityAction", { nativeEvent: { actionName: "increment" } });

        expect(defaultProps.valueAttribute.setValue).toHaveBeenLastCalledWith(new Big(168));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("calls onValueChange when sliding", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<Slider {...defaultProps} onChange={onChangeAction} />, sliderId);

        drag(component, sliderId, thumbCentre, 27, false);

        expect(defaultProps.valueAttribute.setValue).toHaveBeenCalledWith(new Big(168));
        expect(onChangeAction.execute).not.toHaveBeenCalled();
    });

    it("calls onChange action on sliding complete", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<Slider {...defaultProps} onChange={onChangeAction} />, sliderId);

        drag(component, sliderId, thumbCentre, 27);

        expect(defaultProps.valueAttribute.setValue).toHaveBeenLastCalledWith(new Big(168));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("rounds the value to the precision of the step size", () => {
        const component = renderMeasured(
            <Slider {...defaultProps} stepSize={dynamicValue<Big>(new Big(0.5))} />,
            sliderId
        );

        // 10px is 10.37 of 0-280, which snaps to 150.5
        drag(component, sliderId, thumbCentre, 10);

        expect(defaultProps.valueAttribute.setValue).toHaveBeenLastCalledWith(new Big("150.5"));
    });

    it("moves the thumb to a pressed position on the track", () => {
        const component = renderMeasured(<Slider {...defaultProps} />, sliderId);

        // Value 70 is at left 67.5
        drag(component, sliderId, 9 + 67.5 + 15, 0);

        expect(defaultProps.valueAttribute.setValue).toHaveBeenLastCalledWith(new Big(70));
    });

    it("does not call onChange when value hasn't changed", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<Slider {...defaultProps} onChange={onChangeAction} />, sliderId);

        drag(component, sliderId, thumbCentre, 0);

        expect(onChangeAction.execute).not.toHaveBeenCalled();
    });

    it("applies custom styles", () => {
        const component = render(
            <Slider
                {...defaultProps}
                style={[
                    {
                        container: { width: 100 },
                        track: {},
                        trackDisabled: {},
                        minimumTrack: {},
                        minimumTrackDisabled: {},
                        maximumTrack: {},
                        maximumTrackDisabled: {},
                        thumb: {},
                        thumbActive: {},
                        thumbDisabled: {},
                        validationMessage: {},
                        highlight: {},
                        highlightDisabled: {},
                        marker: {},
                        markerDisabled: {}
                    }
                ]}
            />
        );
        expect(component.toJSON()).toMatchSnapshot("with custom styles");
    });
});

// A 300 wide container and the 30 wide default marker leave a 270px track; the 48px touch area adds 9px on each side
function renderMeasured(element: ReactElement, testID: string): RenderAPI {
    const component = render(element);
    const [container, thumb] = component
        .getByTestId(testID)
        .findAll(node => typeof node.type === "string" && typeof node.props.onLayout === "function");
    fireEvent(container, "layout", { nativeEvent: { layout: { width: 300, height: 40 } } });
    fireEvent(thumb, "layout", { nativeEvent: { layout: { width: 30, height: 30 } } });
    return component;
}

function drag(component: RenderAPI, testID: string, locationX: number, dx: number, release = true): boolean {
    const touchArea = component
        .getByTestId(testID)
        .findAll(node => typeof node.type === "string" && typeof node.props.onResponderGrant === "function")[0];
    const touch = { nativeEvent: { locationX, locationY: 20 }, touchHistory: { touchBank: [] } };
    if (!touchArea.props.onStartShouldSetResponder(touch)) {
        return false;
    }
    fireEvent(touchArea, "responderGrant", touch);
    const gesture = {
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
    fireEvent(touchArea, "responderMove", gesture);
    if (release) {
        fireEvent(touchArea, "responderRelease", gesture);
    }
    return true;
}
