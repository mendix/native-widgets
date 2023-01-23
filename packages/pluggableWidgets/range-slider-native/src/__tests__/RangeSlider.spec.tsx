import { actionValue, dynamicValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { createElement } from "react";
import { View } from "react-native";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { ReactTestInstance } from "react-test-renderer";
import { ValueStatus, DynamicValue } from "mendix";
import { Props, RangeSlider } from "../RangeSlider";

describe("RangeSlider", () => {
    const noValue: DynamicValue<Big> = { status: ValueStatus.Unavailable, value: undefined };
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "range-slider-test",
            accessible: "yes",
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
        expect(component.queryByTestId(`${defaultProps.name}-validation-message`)).toBeNull();
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

    it("renders with the width of the parent view", () => {
        const component = render(
            <RangeSlider
                {...defaultProps}
                style={[
                    {
                        container: { width: 100 },
                        highlight: {},
                        highlightDisabled: {},
                        marker: {},
                        markerActive: {},
                        markerDisabled: {},
                        track: {},
                        trackDisabled: {},
                        validationMessage: {}
                    }
                ]}
            />
        );
        fireEvent(component.getByTestId("range-slider-test"), "layout", { nativeEvent: { layout: { width: 100 } } });
        expect(component.getByTestId("range-slider-test").findByProps({ sliderLength: 100 })).not.toBeNull();
    });

    it("renders a validation message", () => {
        const value = new EditableValueBuilder<Big>().withValidation("Invalid").build();
        const component = render(
            <RangeSlider {...defaultProps} lowerValueAttribute={value} upperValueAttribute={value} />
        );

        expect(component.getAllByText("Invalid")).toHaveLength(2);
    });

    it("handles an invalid step size", () => {
        const component = render(<RangeSlider {...defaultProps} stepSize={dynamicValue(new Big(-10))} />);
        expect(component.getByTestId("range-slider-test").findByProps({ step: 1 })).not.toBeNull();
    });

    it("changes the lower value when swiping", () => {
        const onChangeAction = actionValue();
        const component = render(<RangeSlider {...defaultProps} onChange={onChangeAction} />);

        fireEvent(getHandle(component), "responderGrant", { touchHistory: { touchBank: [] } });
        fireEvent(getHandle(component), "responderMove", responderMove(50));

        expect(onChangeAction.execute).not.toHaveBeenCalled();

        fireEvent(getHandle(component), "responderRelease", {});

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenCalledWith(new Big(120));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenCalledWith(new Big(210));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("changes the upper value when swiping", () => {
        const onChangeAction = actionValue();
        const component = render(<RangeSlider {...defaultProps} onChange={onChangeAction} />);

        fireEvent(getHandle(component, 1), "responderGrant", { touchHistory: { touchBank: [] } });
        fireEvent(getHandle(component, 1), "responderMove", responderMove(-50));

        expect(onChangeAction.execute).not.toHaveBeenCalled();

        fireEvent(getHandle(component, 1), "responderRelease", {});

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenCalledWith(new Big(70));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenCalledWith(new Big(160));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("does not change the value when non editable", () => {
        const onChangeAction = actionValue();
        const component = render(<RangeSlider {...defaultProps} editable={"never"} onChange={onChangeAction} />);

        fireEvent(getHandle(component), "responderGrant", { touchHistory: { touchBank: [] } });
        fireEvent(getHandle(component), "responderMove", responderMove(50));
        fireEvent(getHandle(component), "responderRelease", {});

        expect(onChangeAction.execute).not.toHaveBeenCalled();
        expect(defaultProps.lowerValueAttribute.setValue).not.toHaveBeenCalled();
        expect(defaultProps.upperValueAttribute.setValue).not.toHaveBeenCalled();
    });
});

function getHandle(component: RenderAPI, index = 0): ReactTestInstance {
    return component.UNSAFE_getAllByType(View).filter(instance => instance.props.onMoveShouldSetResponder)[index];
}

function responderMove(dx: number): any {
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
                    previousPageY: 0
                }
            ]
        }
    };
}
