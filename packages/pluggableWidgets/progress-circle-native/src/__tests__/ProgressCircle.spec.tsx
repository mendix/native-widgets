import { Arc } from "@mendix/piw-native-utils-internal";
import { dynamicValue } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { Text, PixelRatio } from "react-native";
import { Svg } from "react-native-svg";
import { render } from "@testing-library/react-native";

import { ProgressCircle, Props } from "../ProgressCircle";
import { defaultProgressCircleStyle } from "../ui/Styles";

const TEST_ID = "progress-circle-test";

// The progress arc is always the first Arc rendered; the optional border ring is the second.
function getProgressArc(
    component: ReturnType<typeof render>
): ReturnType<typeof component.UNSAFE_getAllByType>[number] {
    return component.UNSAFE_getAllByType(Arc)[0];
}

describe("ProgressCircle", () => {
    it("renders", () => {
        jest.spyOn(PixelRatio, "getFontScale").mockReturnValue(1);
        const component = render(<ProgressCircle {...createProps(50, 0, 100)} />);
        expect(component.toJSON()).toMatchSnapshot();
        expect(getProgressArc(component).props.endAngle).toBeCloseTo(Math.PI);
    });

    it("renders no progress with undefined values", () => {
        const component = render(<ProgressCircle {...createProps()} circleText="none" />);
        expect(getProgressArc(component).props.endAngle).toBe(0);
        expect(component.UNSAFE_getByType(Text).props.children).toBe(
            `No minimum value provided.
No maximum value provided.
No current value provided.`
        );
    });

    it("renders no progress and an error when minimum equals maximum", () => {
        const component = render(<ProgressCircle {...createProps(50, 50, 50)} circleText="none" />);
        expect(getProgressArc(component).props.endAngle).toBe(0);
        expect(component.UNSAFE_getByType(Text).props.children).toBe(
            "The minimum value must be equal or less than the maximum value."
        );
    });

    it("renders no progress and an error when the value is less than the minimum", () => {
        const component = render(<ProgressCircle {...createProps(-50, 0, 100)} circleText="none" />);
        expect(getProgressArc(component).props.endAngle).toBe(0);
        expect(component.UNSAFE_getByType(Text).props.children).toBe(
            "The current value must be equal or greater than the minimum value."
        );
    });

    it("renders no progress and an error when the value is greater than the maximum", () => {
        const component = render(<ProgressCircle {...createProps(150, 0, 100)} circleText="none" />);
        expect(getProgressArc(component).props.endAngle).toBe(0);
        expect(component.UNSAFE_getByType(Text).props.children).toBe(
            "The current value must be equal or less than the maximum value."
        );
    });

    it("renders correct progress with decimal values", () => {
        const component = render(<ProgressCircle {...createProps(2.5, 0, 10)} />);
        expect(getProgressArc(component).props.endAngle).toBeCloseTo(0.25 * Math.PI * 2);
    });

    it("renders correct progress with negative values", () => {
        const component = render(<ProgressCircle {...createProps(-30, -100, 0)} />);
        expect(getProgressArc(component).props.endAngle).toBeCloseTo(0.7 * Math.PI * 2);
    });

    it("renders custom text", () => {
        const component = render(
            <ProgressCircle
                {...createProps(50, 0, 100)}
                circleText={"customText"}
                customText={dynamicValue("Custom")}
            />
        );
        expect(component.UNSAFE_getByType(Text).props.children).toBe("Custom");
    });

    it("renders empty custom text", () => {
        const component = render(
            <ProgressCircle {...createProps(50, 0, 100)} circleText={"customText"} customText={dynamicValue()} />
        );
        expect(component.UNSAFE_getByType(Text).props.children).toBe("");
    });

    it("renders no text", () => {
        const component = render(<ProgressCircle {...createProps(50, 0, 100)} circleText={"none"} />);
        expect(component.UNSAFE_queryByType(Text)).toBeNull();
    });

    it("has progressbar accessibility role", () => {
        const component = render(<ProgressCircle {...createProps(60, 0, 100)} circleText="percentage" />);
        const accessibleElement = component.getByTestId(TEST_ID);
        expect(accessibleElement.props.accessibilityRole).toBe("progressbar");
        expect(accessibleElement.props.accessibilityValue).toEqual({
            min: 0,
            max: 100,
            now: 60,
            text: "60%"
        });
    });

    it("omits accessibility text when circleText is none", () => {
        const component = render(<ProgressCircle {...createProps(60, 0, 100)} circleText="none" />);
        const accessibleElement = component.getByTestId(TEST_ID);
        expect(accessibleElement.props.accessibilityValue).toEqual({
            min: 0,
            max: 100,
            now: 60
        });
    });

    it("scales size by device font scale", () => {
        const spy = jest.spyOn(PixelRatio, "getFontScale").mockReturnValue(2);
        const component = render(<ProgressCircle {...createProps(50, 0, 100)} />);
        const svg = component.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(defaultProgressCircleStyle.circle.size * 2);
        expect(svg.props.height).toBe(defaultProgressCircleStyle.circle.size * 2);
        spy.mockRestore();
    });

    it("maps fill.width to the arc stroke width", () => {
        const component = render(<ProgressCircle {...createProps(50, 0, 100)} />);
        expect(getProgressArc(component).props.strokeWidth).toBe(defaultProgressCircleStyle.fill.width);
    });

    it("maps fill.lineCapRounded to strokeCap", () => {
        const component = render(<ProgressCircle {...createProps(50, 0, 100)} />);
        expect(getProgressArc(component).props.strokeCap).toBe("square");
    });

    it("maps fill.lineCapRounded=true to a round strokeCap", () => {
        const component = render(
            <ProgressCircle
                {...createProps(50, 0, 100)}
                style={[
                    {
                        ...defaultProgressCircleStyle,
                        fill: { ...defaultProgressCircleStyle.fill, lineCapRounded: true }
                    }
                ]}
            />
        );
        expect(getProgressArc(component).props.strokeCap).toBe("round");
    });

    it("preserves expected style key set", () => {
        const keys = Object.keys(defaultProgressCircleStyle).sort();
        expect(keys).toEqual(["circle", "container", "fill", "text", "validationMessage"]);
    });

    it("preserves expected fill style key set", () => {
        const keys = Object.keys(defaultProgressCircleStyle.fill).sort();
        expect(keys).toEqual(["backgroundColor", "lineCapRounded", "width"]);
    });

    it("preserves expected circle style key set", () => {
        const keys = Object.keys(defaultProgressCircleStyle.circle).sort();
        expect(keys).toEqual(["borderColor", "borderWidth", "size"]);
    });
});

function createProps(progressValue?: number, minimumValue?: number, maximumValue?: number): Props {
    return {
        name: TEST_ID,
        style: [],
        circleText: "percentage",
        progressValue: dynamicValue(progressValue != null ? new Big(progressValue) : undefined),
        minimumValue: dynamicValue(minimumValue != null ? new Big(minimumValue) : undefined),
        maximumValue: dynamicValue(maximumValue != null ? new Big(maximumValue) : undefined)
    };
}
