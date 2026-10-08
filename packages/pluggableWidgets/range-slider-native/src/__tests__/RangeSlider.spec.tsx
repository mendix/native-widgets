import { actionValue, dynamicValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { ReactElement } from "react";
import { ValueStatus, DynamicValue } from "mendix";
import { Props, RangeSlider } from "../RangeSlider";

describe("RangeSlider", () => {
    const noValue: DynamicValue<Big> = { status: ValueStatus.Unavailable, value: undefined };
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "range-slider-test",
            style: [],
            lowerValueAttribute: new EditableValueBuilder<Big>().withValue(new Big(70)).build(),
            upperValueAttribute: new EditableValueBuilder<Big>().withValue(new Big(210)).build(),
            editable: "default",
            minimumValue: dynamicValue<Big>(new Big(0)),
            maximumValue: dynamicValue<Big>(new Big(280)),
            stepSize: dynamicValue<Big>(new Big(1))
        };
    });

    it("renders", () => {
        const component = render(<RangeSlider {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders no error while a value is resolving", () => {
        const component = render(
            <RangeSlider {...defaultProps} lowerValueAttribute={new EditableValueBuilder<Big>().isLoading().build()} />
        );
        expect(component.queryByTestId(`${defaultProps.name}-validation-messages`)).toBeNull();
    });

    it("renders an error when no minimum value is provided", () => {
        const component = render(<RangeSlider {...defaultProps} minimumValue={noValue} />);
        expect(component.queryByText("No minimum value provided.")).not.toBeNull();
    });

    it("renders an error when no maximum value is provided", () => {
        const component = render(<RangeSlider {...defaultProps} maximumValue={noValue} />);
        expect(component.queryByText("No maximum value provided.")).not.toBeNull();
    });

    it("renders an error when no step size is provided", () => {
        const component = render(<RangeSlider {...defaultProps} stepSize={noValue} />);
        expect(component.queryByText("No step size provided.")).not.toBeNull();
    });

    it("renders an error when the minimum is greater than the maximum", () => {
        const component = render(<RangeSlider {...defaultProps} minimumValue={dynamicValue(new Big(300))} />);
        expect(component.queryByText("The minimum value must be less than the maximum value.")).not.toBeNull();
    });

    it("renders an error when the step size is negative", () => {
        const component = render(<RangeSlider {...defaultProps} stepSize={dynamicValue(new Big(-10))} />);
        expect(component.queryByText("The step size must be greater than zero.")).not.toBeNull();
    });

    it("renders an error when the lower value is less than the minimum", () => {
        const component = render(
            <RangeSlider
                {...defaultProps}
                lowerValueAttribute={new EditableValueBuilder<Big>().withValue(new Big(-50)).build()}
            />
        );
        expect(
            component.queryByText("The lower value must be equal or greater than the minimum value.")
        ).not.toBeNull();
    });

    it("renders an error when the lower value is greater than the maximum", () => {
        const component = render(
            <RangeSlider
                {...defaultProps}
                lowerValueAttribute={new EditableValueBuilder<Big>().withValue(new Big(300)).build()}
            />
        );
        expect(component.queryByText("The lower value must be less than the maximum value.")).not.toBeNull();
    });

    it("renders an error when the upper value is less than the minimum", () => {
        const component = render(
            <RangeSlider
                {...defaultProps}
                upperValueAttribute={new EditableValueBuilder<Big>().withValue(new Big(-50)).build()}
            />
        );
        expect(component.queryByText("The upper value bust be greater than the minimum value.")).not.toBeNull();
    });

    it("renders an error when the upper value is greater than the maximum", () => {
        const component = render(
            <RangeSlider
                {...defaultProps}
                upperValueAttribute={new EditableValueBuilder<Big>().withValue(new Big(300)).build()}
            />
        );
        expect(component.queryByText("The upper value must be equal or less than the maximum value.")).not.toBeNull();
    });

    it("renders a validation message", () => {
        const value = new EditableValueBuilder<Big>().withValidation("Invalid").build();
        const component = render(
            <RangeSlider {...defaultProps} lowerValueAttribute={value} upperValueAttribute={value} />
        );

        expect(component.getAllByText("Invalid")).toHaveLength(2);
    });

    // Values 70 and 210 of 0-280 put the thumbs at left 67.5 and 202.5, so their centres in the touch area are at
    // 9 + 67.5 + 15 and 9 + 202.5 + 15
    const lowerCentre = 91.5;
    const upperCentre = 226.5;
    const sliderId = "range-slider-test$slider";

    it("renders as disabled when editable is never", () => {
        const component = renderMeasured(<RangeSlider {...defaultProps} editable={"never"} />, sliderId);

        expect(component.getByTestId(`${sliderId}$thumb0`).props.accessibilityState).toEqual({ disabled: true });
        expect(component.getByTestId(`${sliderId}$thumb1`).props.accessibilityState).toEqual({ disabled: true });
        expect(drag(component, sliderId, lowerCentre, 27)).toBe(false);
    });

    it("renders as enabled when editable is default", () => {
        const component = renderMeasured(<RangeSlider {...defaultProps} />, sliderId);

        expect(component.getByTestId(`${sliderId}$thumb0`).props.accessibilityState).toEqual({ disabled: false });
    });

    it("announces each value as adjustable", () => {
        const component = renderMeasured(<RangeSlider {...defaultProps} />, sliderId);
        const lower = component.getByTestId(`${sliderId}$thumb0`);
        const upper = component.getByTestId(`${sliderId}$thumb1`);

        expect(lower.props.accessibilityRole).toBe("adjustable");
        expect(lower.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 25 });
        expect(upper.props.accessibilityRole).toBe("adjustable");
        expect(upper.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 75 });
    });

    it("adjusts a value with a screen reader", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<RangeSlider {...defaultProps} onChange={onChangeAction} />, sliderId);

        fireEvent(component.getByTestId(`${sliderId}$thumb1`), "accessibilityAction", {
            nativeEvent: { actionName: "decrement" }
        });

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(70));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(182));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("calls onValueChange when sliding", () => {
        const component = renderMeasured(<RangeSlider {...defaultProps} />, sliderId);

        drag(component, sliderId, lowerCentre, 27, false);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenCalledWith(new Big(98));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenCalledWith(new Big(210));
    });

    it("calls onChange action on sliding complete", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<RangeSlider {...defaultProps} onChange={onChangeAction} />, sliderId);

        drag(component, sliderId, upperCentre, 27);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(70));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(238));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("does not call onChange when values haven't changed", () => {
        const onChangeAction = actionValue();
        const component = renderMeasured(<RangeSlider {...defaultProps} onChange={onChangeAction} />, sliderId);

        drag(component, sliderId, lowerCentre, 0);

        expect(onChangeAction.execute).not.toHaveBeenCalled();
    });

    it("does not move a thumb past the other", () => {
        const component = renderMeasured(<RangeSlider {...defaultProps} />, sliderId);

        drag(component, sliderId, lowerCentre, 1000);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(210));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(210));
    });

    it("moves the closest thumb to a pressed position on the track", () => {
        const component = renderMeasured(<RangeSlider {...defaultProps} />, sliderId);

        // Value 250 is at left 241.07
        drag(component, sliderId, 9 + 241.07 + 15, 0);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(70));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenLastCalledWith(new Big(250));
    });

    it("renders with the width of the parent view", () => {
        const component = render(
            <RangeSlider
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
                        markerActive: {},
                        markerDisabled: {}
                    }
                ]}
            />
        );
        const container = component.getByTestId("range-slider-test");
        expect(container.props.style).toEqual(expect.objectContaining({ width: 100 }));
    });

    it("applies custom styles", () => {
        const component = render(
            <RangeSlider
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
                        markerActive: {},
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
