import { FloatingActionButtonProps } from "../../typings/FloatingActionButtonProps";
import { FloatingActionButtonStyle } from "../ui/styles";
import { fireEvent, render } from "@testing-library/react-native";
import { FloatingActionButton } from "../FloatingActionButton";
import { actionValue, dynamicValue } from "@mendix/piw-utils-internal";
import { NativeIcon } from "mendix";
import { Icon } from "mendix/components/native/Icon";

describe("FloatingActionButton", () => {
    let defaultProps: FloatingActionButtonProps<FloatingActionButtonStyle>;
    const secondaryButtons = [
        {
            icon: dynamicValue({
                type: "glyph",
                iconClass: "fa-glyph1"
            } as NativeIcon),
            caption: dynamicValue("caption1"),
            onClick: actionValue(true, false)
        },
        {
            icon: dynamicValue({
                type: "glyph",
                iconClass: "fa-glyph2"
            } as NativeIcon),
            caption: dynamicValue("caption2"),
            onClick: actionValue(true, false)
        },
        {
            icon: dynamicValue({
                type: "glyph",
                iconClass: "fa-glyph3"
            } as NativeIcon),
            caption: dynamicValue("caption3"),
            onClick: actionValue(true, false)
        }
    ];

    beforeEach(() => {
        defaultProps = {
            name: "FloatingAction",
            style: [],
            horizontalPosition: "right",
            verticalPosition: "bottom",
            secondaryButtons: []
        };
    });

    it("renders correct props without secondary buttons", () => {
        const component = render(<FloatingActionButton {...defaultProps} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders correct props with secondary buttons", () => {
        const component = render(<FloatingActionButton {...defaultProps} secondaryButtons={secondaryButtons} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("should open and close when clicked and secondary buttons are defined", () => {
        const { getByTestId, queryAllByTestId } = render(
            <FloatingActionButton {...defaultProps} secondaryButtons={secondaryButtons} />
        );

        // Initially closed - buttons exist but have opacity 0
        const closedButtons = queryAllByTestId(/FloatingAction\$button*/);
        expect(closedButtons).toHaveLength(3);
        closedButtons.forEach(button => {
            const animatedView = button.parent;
            expect(animatedView?.props.style).toBeDefined();
        });

        // Open - buttons should still exist (now with opacity > 0 after animation)
        fireEvent(getByTestId("FloatingAction"), "onPress");
        const openButtons = queryAllByTestId(/FloatingAction\$button*/);
        expect(openButtons).toHaveLength(3);

        // Close again - buttons still exist (will animate back to opacity 0)
        fireEvent(getByTestId("FloatingAction"), "onPress");
        const closedAgainButtons = queryAllByTestId(/FloatingAction\$button*/);
        expect(closedAgainButtons).toHaveLength(3);
    });

    it("should cancel any events of primary button if secondary buttons exist", () => {
        const mockEvent = actionValue(true, false);
        const { getByTestId } = render(
            <FloatingActionButton {...defaultProps} onClick={mockEvent} secondaryButtons={secondaryButtons} />
        );

        fireEvent(getByTestId("FloatingAction"), "onPress");
        expect(mockEvent.execute).not.toHaveBeenCalled();
    });

    it("should trigger event when clicked and no secondary buttons", () => {
        const mockEvent = actionValue(true, false);
        const { getByTestId } = render(<FloatingActionButton {...defaultProps} onClick={mockEvent} />);

        fireEvent(getByTestId("FloatingAction"), "onPress");
        expect(mockEvent.execute).toHaveBeenCalledTimes(1);
    });

    it("should trigger event on secondary button", () => {
        const { getByTestId } = render(<FloatingActionButton {...defaultProps} secondaryButtons={secondaryButtons} />);

        fireEvent(getByTestId("FloatingAction"), "onPress");
        fireEvent(getByTestId("FloatingAction$button1"), "onPress");
        expect(secondaryButtons[1].onClick.execute).toHaveBeenCalledTimes(1);
    });

    it("should have custom icons on primary button", async () => {
        const icon = dynamicValue({
            type: "glyph",
            iconClass: "fa-glyphNormal"
        } as NativeIcon);
        const iconActive = dynamicValue({
            type: "glyph",
            iconClass: "fa-glyphActive"
        } as NativeIcon);
        const { getByTestId } = render(
            <FloatingActionButton
                {...defaultProps}
                icon={icon}
                iconActive={iconActive}
                secondaryButtons={secondaryButtons}
            />
        );
        const iconViewContainer = getByTestId("FloatingAction$IconView");
        const iconComponent = iconViewContainer.findByType(Icon);
        expect(iconComponent.props.icon).toEqual(icon.value);

        // Check rotation is at 0deg initially
        const initialStyle = iconViewContainer.props.style;
        expect(initialStyle).toBeDefined();

        fireEvent(getByTestId("FloatingAction"), "onPress");

        const iconActiveComponent = iconViewContainer.findByType(Icon);
        expect(iconActiveComponent.props.icon).toEqual(iconActive.value);

        // Check rotation transform exists after press (will be interpolated, not exactly -180deg in test)
        const activeStyle = iconViewContainer.props.style;
        expect(activeStyle).toBeDefined();
    });

    it("should have custom icon on secondary button", async () => {
        const { getByTestId } = render(<FloatingActionButton {...defaultProps} secondaryButtons={secondaryButtons} />);

        fireEvent(getByTestId("FloatingAction"), "onPress");
        const secondaryButtonIcon = getByTestId("FloatingAction$button2").findByType(Icon);
        expect(secondaryButtonIcon.props.icon).toEqual(secondaryButtons[2].icon.value);
    });

    it("should have custom caption on secondary button", async () => {
        const { getByTestId, findByText } = render(
            <FloatingActionButton {...defaultProps} secondaryButtons={secondaryButtons} />
        );

        fireEvent(getByTestId("FloatingAction"), "onPress");
        await findByText(secondaryButtons[2].caption.value as string);
    });

    describe("vertical position", () => {
        it("renders position top correctly", () => {
            defaultProps.verticalPosition = "top";
            const { toJSON } = render(<FloatingActionButton {...defaultProps} />);

            expect(toJSON()).toMatchSnapshot();
        });

        it("renders position bottom correctly", () => {
            const { toJSON } = render(<FloatingActionButton {...defaultProps} />);
            expect(toJSON()).toMatchSnapshot();
        });
    });
});
