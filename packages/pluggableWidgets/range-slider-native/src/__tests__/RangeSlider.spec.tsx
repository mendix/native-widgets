import { actionValue, dynamicValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { fireEvent, render } from "@testing-library/react-native";
import { ValueStatus, DynamicValue } from "mendix";
import { Props, RangeSlider } from "../RangeSlider";

jest.mock("@miblanchard/react-native-slider", () => {
    const { View } = require("react-native");
    return {
        Slider: (props: any) => (
            <View
                testID="mocked-slider"
                {...props}
                onValueChange={(values: number[]) => props.onValueChange?.(values)}
                onSlidingComplete={(values: number[]) => props.onSlidingComplete?.(values)}
            />
        )
    };
});

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

    it("renders as disabled when editable is never", () => {
        const component = render(<RangeSlider {...defaultProps} editable={"never"} />);
        const slider = component.getByTestId("mocked-slider");
        expect(slider.props.disabled).toBe(true);
    });

    it("renders as enabled when editable is default", () => {
        const component = render(<RangeSlider {...defaultProps} />);
        const slider = component.getByTestId("mocked-slider");
        expect(slider.props.disabled).toBe(false);
    });

    it("passes correct min/max/step to the slider", () => {
        const component = render(<RangeSlider {...defaultProps} />);
        const slider = component.getByTestId("mocked-slider");
        expect(slider.props.minimumValue).toBe(0);
        expect(slider.props.maximumValue).toBe(280);
        expect(slider.props.step).toBe(1);
    });

    it("passes range values as array", () => {
        const component = render(<RangeSlider {...defaultProps} />);
        const slider = component.getByTestId("mocked-slider");
        expect(slider.props.value).toEqual([70, 210]);
    });

    it("calls onValueChange when sliding", () => {
        const component = render(<RangeSlider {...defaultProps} />);
        const slider = component.getByTestId("mocked-slider");

        fireEvent(slider, "onValueChange", [100, 210]);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenCalledWith(new Big(100));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenCalledWith(new Big(210));
    });

    it("calls onChange action on sliding complete", () => {
        const onChangeAction = actionValue();
        const component = render(<RangeSlider {...defaultProps} onChange={onChangeAction} />);
        const slider = component.getByTestId("mocked-slider");

        fireEvent(slider, "onSlidingComplete", [100, 250]);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenCalledWith(new Big(100));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenCalledWith(new Big(250));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
    });

    it("does not call onChange when values haven't changed", () => {
        const onChangeAction = actionValue();
        const component = render(<RangeSlider {...defaultProps} onChange={onChangeAction} />);
        const slider = component.getByTestId("mocked-slider");

        fireEvent(slider, "onSlidingComplete", [70, 210]);

        expect(onChangeAction.execute).not.toHaveBeenCalled();
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
                        validationMessage: {}
                    }
                ]}
            />
        );
        const container = component.getByTestId("range-slider-test");
        expect(container.props.style).toEqual(expect.objectContaining({ width: 100 }));
    });

    it("changes the lower value when swiping", () => {
        const onChangeAction = actionValue();
        const component = render(<RangeSlider {...defaultProps} onChange={onChangeAction} />);
        const slider = component.getByTestId("mocked-slider");

        fireEvent(slider, "onValueChange", [120, 210]);

        expect(onChangeAction.execute).not.toHaveBeenCalled();

        fireEvent(slider, "onSlidingComplete", [120, 210]);

        expect(defaultProps.lowerValueAttribute.setValue).toHaveBeenCalledWith(new Big(120));
        expect(defaultProps.upperValueAttribute.setValue).toHaveBeenCalledWith(new Big(210));
        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
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
                        validationMessage: {}
                    }
                ]}
            />
        );
        expect(component.toJSON()).toMatchSnapshot("with custom styles");
    });
});
