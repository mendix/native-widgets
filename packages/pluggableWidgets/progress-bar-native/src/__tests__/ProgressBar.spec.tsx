import { Bar } from "@mendix/piw-native-utils-internal";
import { dynamicValue } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { Text, View } from "react-native";
import { render } from "@testing-library/react-native";

import { ProgressBar, Props } from "../ProgressBar";
import { defaultProgressBarStyle } from "../ui/Styles";

describe("ProgressBar", () => {
    it("renders", () => {
        const component = render(<ProgressBar {...createProps(50, 0, 100)} />);
        expect(component.toJSON()).toMatchSnapshot();
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(0.5);
    });

    it("renders progress bar with minimum value with undefined values", () => {
        const component = render(<ProgressBar {...createProps()} />);
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(0);
        expect(component.UNSAFE_queryByType(Text)).toBeDefined();
    });

    it("renders progress bar with minimum value when minimum equals maximum", () => {
        const component = render(<ProgressBar {...createProps(50, 50, 50)} />);
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(0);
    });

    it("renders progress bar with minimum value when the value is less than the minimum", () => {
        const component = render(<ProgressBar {...createProps(-50, 0, 100)} />);
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(0);
    });

    it("renders progress bar with max value when the value is greater than maximum", () => {
        const component = render(<ProgressBar {...createProps(150, 0, 100)} />);
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(1);
    });

    it("renders correct progress with decimal values", () => {
        const component = render(<ProgressBar {...createProps(2.5, 0, 10)} />);
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(0.25);
        expect(component.UNSAFE_queryByType(Text)).toBeNull();
    });

    it("renders correct progress with negative values", () => {
        const component = render(<ProgressBar {...createProps(-30, -100, 0)} />);
        expect(component.UNSAFE_getByType(Bar).props.progress).toBe(0.7);
        expect(component.UNSAFE_queryByType(Text)).toBeNull();
    });

    it("has progressbar accessibility role", () => {
        const component = render(<ProgressBar {...createProps(60, 0, 100)} />);
        const views = component.UNSAFE_getAllByType(View);
        // Find the View with accessibilityRole="progressbar"
        const accessibleElement = views.find(view => view.props.accessibilityRole === "progressbar");
        expect(accessibleElement).toBeDefined();
        expect(accessibleElement?.props.accessibilityValue).toEqual({
            min: 0,
            max: 100,
            now: 60
        });
    });

    it("has correct accessibility values with different range", () => {
        const component = render(<ProgressBar {...createProps(25, 10, 50)} />);
        const views = component.UNSAFE_getAllByType(View);
        const accessibleElement = views.find(view => view.props.accessibilityRole === "progressbar");
        expect(accessibleElement?.props.accessibilityValue).toEqual({
            min: 10,
            max: 50,
            now: 25
        });
    });

    it("preserves expected style key set", () => {
        const keys = Object.keys(defaultProgressBarStyle).sort();
        expect(keys).toEqual(["bar", "container", "fill", "validationMessage"]);
    });

    it("preserves expected fill style key set", () => {
        const keys = Object.keys(defaultProgressBarStyle.fill).sort();
        expect(keys).toEqual(["backgroundColor"]);
    });
});

function createProps(progressValue?: number, minimumValue?: number, maximumValue?: number): Props {
    return {
        name: "progress-bar-test",
        style: [],
        progressValue: dynamicValue(progressValue != null ? new Big(progressValue) : undefined),
        minimumValue: dynamicValue(minimumValue != null ? new Big(minimumValue) : undefined),
        maximumValue: dynamicValue(maximumValue != null ? new Big(maximumValue) : undefined)
    };
}
