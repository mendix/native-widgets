import { fireEvent, render } from "@testing-library/react-native";
import { SegmentedControl, SegmentedControlProps } from "../SegmentedControl";

describe("SegmentedControl", () => {
    let defaultProps: SegmentedControlProps;

    beforeEach(() => {
        defaultProps = {
            values: ["Option 1", "Option 2", "Option 3"],
            selectedIndex: 0,
            enabled: true,
            onTabPress: jest.fn(),
            borderRadius: 5,
            buttonStyle: {
                borderWidth: 1,
                borderColor: "#CCC",
                padding: 8
            },
            textStyle: {
                color: "#666"
            },
            activeButtonStyle: {
                backgroundColor: "rgb(98, 0, 238)",
                borderColor: "rgb(98, 0, 238)"
            },
            activeTextStyle: {
                color: "#fff"
            },
            testID: "segmented-control-test"
        };
    });

    it("renders correctly", () => {
        const component = render(<SegmentedControl {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("displays all values as buttons", () => {
        const component = render(<SegmentedControl {...defaultProps} />);

        expect(component.getByText("Option 1")).toBeTruthy();
        expect(component.getByText("Option 2")).toBeTruthy();
        expect(component.getByText("Option 3")).toBeTruthy();
    });

    it("applies active styles to selected index", () => {
        const component = render(<SegmentedControl {...defaultProps} selectedIndex={1} />);

        const button1 = component.getByTestId("segmented-control-test$button-1");
        expect(button1.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    });

    it("calls onTabPress with correct index when button pressed", () => {
        const mockOnTabPress = jest.fn();
        const component = render(<SegmentedControl {...defaultProps} onTabPress={mockOnTabPress} />);

        const button2 = component.getByTestId("segmented-control-test$button-2");
        fireEvent.press(button2);

        expect(mockOnTabPress).toHaveBeenCalledWith(2);
    });

    it("does not call onTabPress when disabled", () => {
        const mockOnTabPress = jest.fn();
        const component = render(<SegmentedControl {...defaultProps} enabled={false} onTabPress={mockOnTabPress} />);

        const button1 = component.getByTestId("segmented-control-test$button-1");
        fireEvent.press(button1);

        expect(mockOnTabPress).not.toHaveBeenCalled();
    });

    it("does not call onTabPress when pressing already-selected button", () => {
        const mockOnTabPress = jest.fn();
        const component = render(<SegmentedControl {...defaultProps} onTabPress={mockOnTabPress} />);

        const button0 = component.getByTestId("segmented-control-test$button-0");
        fireEvent.press(button0);

        expect(mockOnTabPress).not.toHaveBeenCalled();
    });

    it("sets correct accessibility props", () => {
        const component = render(<SegmentedControl {...defaultProps} selectedIndex={1} />);

        const button0 = component.getByTestId("segmented-control-test$button-0");
        const button1 = component.getByTestId("segmented-control-test$button-1");
        const button2 = component.getByTestId("segmented-control-test$button-2");

        expect(button0.props.accessibilityRole).toBe("tab");
        expect(button0.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
        expect(button0.props.accessibilityLabel).toBe("Option 1");

        expect(button1.props.accessibilityRole).toBe("tab");
        expect(button1.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
        expect(button1.props.accessibilityLabel).toBe("Option 2");

        expect(button2.props.accessibilityRole).toBe("tab");
        expect(button2.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
        expect(button2.props.accessibilityLabel).toBe("Option 3");
    });

    it("applies border radius to all buttons", () => {
        const component = render(<SegmentedControl {...defaultProps} borderRadius={10} />);

        const button0 = component.getByTestId("segmented-control-test$button-0");
        const button1 = component.getByTestId("segmented-control-test$button-1");
        const button2 = component.getByTestId("segmented-control-test$button-2");

        // All buttons should have the same border radius applied
        expect(button0.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    borderRadius: 10
                })
            ])
        );

        expect(button1.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    borderRadius: 10
                })
            ])
        );

        expect(button2.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    borderRadius: 10
                })
            ])
        );
    });

    it("sets correct testIDs on buttons", () => {
        const component = render(<SegmentedControl {...defaultProps} />);

        expect(component.getByTestId("segmented-control-test$button-0")).toBeTruthy();
        expect(component.getByTestId("segmented-control-test$button-1")).toBeTruthy();
        expect(component.getByTestId("segmented-control-test$button-2")).toBeTruthy();
    });

    it("renders with single value", () => {
        const component = render(<SegmentedControl {...defaultProps} values={["Single"]} selectedIndex={0} />);

        expect(component.getByText("Single")).toBeTruthy();
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with two values", () => {
        const component = render(<SegmentedControl {...defaultProps} values={["First", "Second"]} selectedIndex={0} />);

        expect(component.getByText("First")).toBeTruthy();
        expect(component.getByText("Second")).toBeTruthy();
        expect(component.toJSON()).toMatchSnapshot();
    });
});
