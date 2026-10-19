import { actionValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { View } from "react-native";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { ReactTestInstance } from "react-test-renderer";
import { ColorPicker, Props } from "../ColorPicker";
import { defaultColorPickerStyle } from "../ui/Styles";

describe("Color Picker", () => {
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "color-picker-test",
            style: [],
            format: "hex",
            color: new EditableValueBuilder<string>().withValue("#ff0000").build(),
            showPreview: true,
            showSaturation: true,
            showLightness: true,
            showAlpha: false
        };
    });

    it("renders", () => {
        const component = render(<ColorPicker {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders no error while the value is resolving", () => {
        const component = render(
            <ColorPicker {...defaultProps} color={new EditableValueBuilder<string>().isLoading().build()} />
        );
        expect(component.UNSAFE_queryByType(View)).toBeNull();
    });

    it("renders with alpha slider", () => {
        const component = render(<ColorPicker {...defaultProps} format="rgb" showAlpha />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with custom style", () => {
        const component = render(
            <ColorPicker
                {...defaultProps}
                style={[
                    {
                        container: {},
                        preview: {
                            aspectRatio: 1,
                            borderRadius: 50
                        }
                    }
                ]}
            />
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("changes the value when swiping hue slider", () => {
        const onChangeAction = actionValue();
        const component = render(<ColorPicker {...defaultProps} onChange={onChangeAction} />);

        const hue = getTouchArea(component, "hue");
        fireEvent(hue, "responderGrant", touch(0));
        fireEvent(hue, "responderMove", move(140));

        expect(onChangeAction.execute).not.toHaveBeenCalled();

        fireEvent(hue, "responderRelease", {});

        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
        expect(defaultProps.color.setValue).toHaveBeenCalledWith("#00ffff");
    });

    it("changes the value when swiping saturation slider", () => {
        const onChangeAction = actionValue();
        const component = render(<ColorPicker {...defaultProps} onChange={onChangeAction} />);

        const saturation = getTouchArea(component, "saturation");
        fireEvent(saturation, "responderGrant", touch(0));
        fireEvent(saturation, "responderMove", move(-280));
        fireEvent(saturation, "responderRelease", {});

        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
        expect(defaultProps.color.setValue).toHaveBeenCalledWith("#808080");
    });

    it("changes the value when swiping lightness slider with no lightness", () => {
        const component = render(<ColorPicker {...defaultProps} />);

        const lightness = getTouchArea(component, "lightness");
        fireEvent(lightness, "responderGrant", touch(0));
        fireEvent(lightness, "responderMove", move(-140));
        fireEvent(lightness, "responderRelease", {});

        expect(defaultProps.color.setValue).toHaveBeenCalledWith("#000000");
    });

    it("changes the value when swiping lightness slider with full lightness", () => {
        const component = render(<ColorPicker {...defaultProps} />);

        const lightness = getTouchArea(component, "lightness");
        fireEvent(lightness, "responderGrant", touch(0));
        fireEvent(lightness, "responderMove", move(140));
        fireEvent(lightness, "responderRelease", {});

        expect(defaultProps.color.setValue).toHaveBeenCalledWith("#ffffff");
    });

    it("keeps the saturation when swiping lightness slider", () => {
        const color = new EditableValueBuilder<string>().withValue("#d66329").build();
        const component = render(<ColorPicker {...defaultProps} color={color} />);
        const saturation = (): object => component.getByTestId("color-picker-test$saturation").props.accessibilityValue;
        expect(saturation()).toEqual({ min: 0, max: 100, now: 68 });

        // Lightness 0.03 is stored as #0d0602, which reads back as saturation 0.73
        const lightness = getTouchArea(component, "lightness");
        fireEvent(lightness, "responderGrant", touch(0));
        fireEvent(lightness, "responderMove", move(-131));
        expect(saturation()).toEqual({ min: 0, max: 100, now: 68 });

        fireEvent(lightness, "responderRelease", {});
        expect(color.setValue).toHaveBeenCalledWith("#0d0602");
        component.rerender(
            <ColorPicker {...defaultProps} color={new EditableValueBuilder<string>().withValue("#0d0602").build()} />
        );
        expect(saturation()).toEqual({ min: 0, max: 100, now: 68 });
    });

    it("keeps hue and saturation when swiping lightness slider through black", () => {
        const component = render(<ColorPicker {...defaultProps} />);

        const lightness = getTouchArea(component, "lightness");
        fireEvent(lightness, "responderGrant", touch(0));
        fireEvent(lightness, "responderMove", move(-140));
        fireEvent(lightness, "responderRelease", {});
        expect(defaultProps.color.setValue).toHaveBeenLastCalledWith("#000000");

        const color = new EditableValueBuilder<string>().withValue("#000000").build();
        component.rerender(<ColorPicker {...defaultProps} color={color} />);
        fireEvent(lightness, "responderGrant", touch(0));
        fireEvent(lightness, "responderMove", move(140));
        fireEvent(lightness, "responderRelease", {});
        expect(color.setValue).toHaveBeenCalledWith("#ff0000");
    });

    it("follows value changes from outside", () => {
        const component = render(<ColorPicker {...defaultProps} />);

        const lightness = getTouchArea(component, "lightness");
        fireEvent(lightness, "responderGrant", touch(0));
        fireEvent(lightness, "responderMove", move(-140));
        fireEvent(lightness, "responderRelease", {});

        component.rerender(
            <ColorPicker {...defaultProps} color={new EditableValueBuilder<string>().withValue("#00ffff").build()} />
        );
        expect(component.getByTestId("color-picker-test$hue").props.accessibilityValue).toEqual({
            min: 0,
            max: 100,
            now: 50
        });
        expect(component.getByTestId("color-picker-test$lightness").props.accessibilityValue).toEqual({
            min: 0,
            max: 100,
            now: 50
        });
    });

    it("changes the value when swiping alpha slider", () => {
        const onChangeAction = actionValue();
        const component = render(<ColorPicker {...defaultProps} onChange={onChangeAction} showAlpha format="rgb" />);

        const alpha = getTouchArea(component, "alpha");
        fireEvent(alpha, "responderGrant", touch(0));
        fireEvent(alpha, "responderMove", move(-280));
        fireEvent(alpha, "responderRelease", {});

        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
        expect(defaultProps.color.setValue).toHaveBeenCalledWith("rgba(255, 0, 0, 0)");
    });

    it("moves to the tapped position on the track", () => {
        const onChangeAction = actionValue();
        const component = render(<ColorPicker {...defaultProps} onChange={onChangeAction} />);

        // Thumb centre at half of the track: 10 + 140 in the slider, plus half of the 28px touch overflow
        const hue = getTouchArea(component, "hue");
        expect(hue.props.onStartShouldSetResponder(touch(14 + 150))).toBe(true);
        fireEvent(hue, "responderGrant", touch(14 + 150));
        fireEvent(hue, "responderRelease", {});

        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
        expect(defaultProps.color.setValue).toHaveBeenCalledWith("#00ffff");
    });

    it("does not respond to touches when read-only", () => {
        const component = render(
            <ColorPicker
                {...defaultProps}
                color={new EditableValueBuilder<string>().withValue("#ff0000").isReadOnly().build()}
            />
        );

        const hue = getTouchArea(component, "hue");
        expect(hue.props.onStartShouldSetResponder(touch(14 + 150))).toBe(false);
        expect(component.getByTestId("color-picker-test$hue").props.accessibilityState).toEqual({ disabled: true });
    });

    it("announces the slider value to screen readers", () => {
        const component = render(
            <ColorPicker {...defaultProps} color={new EditableValueBuilder<string>().withValue("#00ffff").build()} />
        );

        const hue = component.getByTestId("color-picker-test$hue");
        expect(hue.props.accessibilityRole).toBe("adjustable");
        expect(hue.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
        expect(component.getByTestId("color-picker-test$lightness").props.accessibilityValue).toEqual({
            min: 0,
            max: 100,
            now: 50
        });
    });

    it("changes the value with screen reader actions", () => {
        const onChangeAction = actionValue();
        const component = render(<ColorPicker {...defaultProps} onChange={onChangeAction} />);

        fireEvent(component.getByTestId("color-picker-test$lightness"), "accessibilityAction", {
            nativeEvent: { actionName: "increment" }
        });

        expect(onChangeAction.execute).toHaveBeenCalledTimes(1);
        expect(defaultProps.color.setValue).toHaveBeenCalledWith("#ff3333");
    });

    // Lays out the slider 300 wide with a 20 wide thumb, leaving a 280px track
    function getTouchArea(component: RenderAPI, name: string): ReactTestInstance {
        const slider = component.getByTestId(`color-picker-test$${name}`);
        const [container, thumb] = slider.findAll(
            node => typeof node.type === "string" && typeof node.props.onLayout === "function"
        );
        fireEvent(container, "layout", { nativeEvent: { layout: { width: 300, height: 40 } } });
        fireEvent(thumb, "layout", { nativeEvent: { layout: { width: 20, height: 20 } } });
        return slider.findAll(
            node => typeof node.type === "string" && typeof node.props.onResponderGrant === "function"
        )[0];
    }

    it("preserves expected style key set", () => {
        const keys = Object.keys(defaultColorPickerStyle).sort();
        expect(keys).toEqual(["container", "preview"]);
    });
});

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
                    previousPageY: 0
                }
            ]
        }
    };
}
