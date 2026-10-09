import { render } from "@testing-library/react-native";
import { StyleSheet, View } from "react-native";

import { Bar } from "../Bar";

describe("Bar", () => {
    it("renders with basic props", () => {
        const { getByTestId } = render(<Bar progress={0.5} color="blue" height={10} width={150} testID="bar" />);
        expect(getByTestId("bar")).toBeDefined();
    });

    it("applies correct transform for 50% progress", () => {
        const { getByTestId } = render(
            <Bar progress={0.5} color="blue" height={10} width={150} borderWidth={1} testID="bar" />
        );
        const fill = getByTestId("bar-fill");
        // innerWidth = 150 - 2 = 148
        // translateX = 148 / -2 * (1 - 0.5) = -37
        expect(fill.props.style.transform).toEqual([{ translateX: -37 }, { scaleX: 0.5 }]);
    });

    it("applies correct transform for 75% progress", () => {
        const { getByTestId } = render(
            <Bar progress={0.75} color="blue" height={10} width={150} borderWidth={1} testID="bar" />
        );
        const fill = getByTestId("bar-fill");
        // innerWidth = 150 - 2 = 148
        // translateX = 148 / -2 * (1 - 0.75) = -18.5
        expect(fill.props.style.transform).toEqual([{ translateX: -18.5 }, { scaleX: 0.75 }]);
    });

    it("clamps progress to 0.0001 when negative", () => {
        const { getByTestId } = render(
            <Bar progress={-0.5} color="blue" height={10} width={150} borderWidth={1} testID="bar" />
        );
        const fill = getByTestId("bar-fill");
        // Progress clamped to 0, scaleX becomes 0.0001
        expect(fill.props.style.transform).toEqual([{ translateX: -74 }, { scaleX: 0.0001 }]);
    });

    it("clamps progress to 1 when greater than 1", () => {
        const { getByTestId } = render(
            <Bar progress={1.5} color="blue" height={10} width={150} borderWidth={1} testID="bar" />
        );
        const fill = getByTestId("bar-fill");
        // translateX collapses to (positive or negative) zero at full progress; -0 === 0 visually.
        expect(fill.props.style.transform[0].translateX).toBeCloseTo(0);
        expect(fill.props.style.transform[1].scaleX).toBe(1);
    });

    it("renders with border styling", () => {
        const { getByTestId } = render(
            <Bar
                progress={0.5}
                color="blue"
                height={10}
                width={150}
                borderWidth={2}
                borderColor="red"
                borderRadius={5}
                testID="bar"
            />
        );
        const container = getByTestId("bar");
        expect(StyleSheet.flatten(container.props.style)).toMatchObject({
            borderWidth: 2,
            borderColor: "red",
            borderRadius: 5
        });
    });

    it("defaults borderColor to color when not specified", () => {
        const { getByTestId } = render(
            <Bar progress={0.5} color="blue" height={10} width={150} borderWidth={1} testID="bar" />
        );
        const container = getByTestId("bar");
        expect(StyleSheet.flatten(container.props.style)).toMatchObject({
            borderColor: "blue"
        });
    });

    it("renders with unfilled background color", () => {
        const { getByTestId } = render(
            <Bar progress={0.5} color="blue" height={10} width={150} unfilledColor="lightgray" testID="bar" />
        );
        const container = getByTestId("bar");
        expect(StyleSheet.flatten(container.props.style)).toMatchObject({
            backgroundColor: "lightgray"
        });
    });

    it("applies custom style", () => {
        const customStyle = { marginTop: 10, marginBottom: 5 };
        const { getByTestId } = render(
            <Bar progress={0.5} color="blue" height={10} width={150} style={customStyle} testID="bar" />
        );
        const container = getByTestId("bar");
        expect(StyleSheet.flatten(container.props.style)).toMatchObject(customStyle);
    });

    it("renders at 0% progress with 0.0001 scaleX", () => {
        const { getByTestId } = render(<Bar progress={0} color="blue" height={10} width={150} testID="bar" />);
        const fill = getByTestId("bar-fill");
        expect(fill.props.style.transform[1]).toEqual({ scaleX: 0.0001 });
    });

    it("renders at 100% progress", () => {
        const { getByTestId } = render(
            <Bar progress={1} color="blue" height={10} width={150} borderWidth={1} testID="bar" />
        );
        const fill = getByTestId("bar-fill");
        expect(fill.props.style.transform[0].translateX).toBeCloseTo(0);
        expect(fill.props.style.transform[1].scaleX).toBe(1);
    });

    it("handles null width for flex layout", () => {
        const { getByTestId } = render(<Bar progress={0.5} color="blue" height={10} width={null} testID="bar" />);
        const container = getByTestId("bar");
        expect(StyleSheet.flatten(container.props.style)).toMatchObject({
            width: undefined
        });
    });

    it("renders without testID", () => {
        const { UNSAFE_queryAllByType } = render(<Bar progress={0.5} color="blue" height={10} width={150} />);
        const views = UNSAFE_queryAllByType(View);
        expect(views).toHaveLength(2); // Container and fill
    });
});
