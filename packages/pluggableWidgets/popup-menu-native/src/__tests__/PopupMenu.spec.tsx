import { PopupMenuProps } from "../../typings/PopupMenuProps";
import { PopupMenuStyle } from "../ui/Styles";
import { Text, View } from "react-native";
import { actionValue } from "@mendix/piw-utils-internal";
import { fireEvent, render, within } from "@testing-library/react-native";
import { PopupMenu } from "../PopupMenu";
import { MenuDivider, MenuItem } from "react-native-material-menu";
import { ReactTestInstance } from "react-test-renderer";

let dummyActionValue: any;
let defaultProps: PopupMenuProps<PopupMenuStyle>;
jest.useFakeTimers();

let basicItemTestId: string;
let customItemTestId: string;

jest.mock("react-native/Libraries/Modal/Modal", () => (props: any) => {
    const MockedModal = jest.requireActual("react-native").View;
    return <MockedModal {...props} testID="modal" />;
});

describe("Popup menu", () => {
    beforeEach(() => {
        dummyActionValue = actionValue();
        defaultProps = {
            popupRenderMode: "basic",
            name: "popup-menu",
            style: [],
            menuTriggerer: <Text>Menu Triggerer</Text>,
            basicItems: [
                { itemType: "item", action: dummyActionValue, caption: "yolo", styleClass: "defaultStyle" },
                { itemType: "divider", styleClass: "defaultStyle", caption: "" }
            ],
            customItems: [{ content: <Text>Yolo</Text>, action: dummyActionValue }]
        };

        basicItemTestId = `${defaultProps.name}_basic-item`;
        customItemTestId = `${defaultProps.name}_custom-item`;
    });

    it("renders", () => {
        const component = render(<PopupMenu {...defaultProps} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders custom items", () => {
        const component = render(<PopupMenu {...defaultProps} popupRenderMode="custom" />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    describe("in basic mode", () => {
        it("renders only basic items", async () => {
            const component = render(<PopupMenu {...defaultProps} />);

            const basicItems = component.queryAllByTestId(basicItemTestId);
            const dividers = component.UNSAFE_queryAllByType(MenuDivider);
            const customItems = component.queryAllByTestId(customItemTestId);
            expect(basicItems).toHaveLength(1);
            expect(within(basicItems[0]).getByText("yolo")).not.toBeNull();
            expect(dividers).toHaveLength(1);
            expect(customItems).toHaveLength(0);
        });

        it("triggers action", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            const basicItem = component.UNSAFE_root.findByType(MenuItem);
            expect(basicItem).toBeDefined();
            expect(basicItem.props.testID).toBe(basicItemTestId);

            fireEvent.press(basicItem);

            jest.advanceTimersByTime(501);

            expect(dummyActionValue.execute).toHaveBeenCalled();
        });

        it("renders with custom styles", () => {
            const customStyle = [
                {
                    basic: {
                        itemStyle: {
                            defaultStyle: {
                                color: "green"
                            }
                        }
                    }
                }
            ];
            const component = render(<PopupMenu {...defaultProps} style={customStyle} />);
            expect(component.getByTestId(basicItemTestId).findByType(Text).props.style).toEqual(
                expect.arrayContaining([{ color: "green" }])
            );
        });
    });

    describe("in custom mode", () => {
        beforeEach(() => {
            defaultProps.popupRenderMode = "custom";
        });

        it("renders only custom items", () => {
            const component = render(<PopupMenu {...defaultProps} />);

            const basicItems = component.queryAllByTestId(basicItemTestId);
            const dividers = component.UNSAFE_queryAllByType(MenuDivider);
            const customItems = component.queryAllByTestId(customItemTestId);
            expect(basicItems).toHaveLength(0);
            expect(dividers).toHaveLength(0);
            expect(customItems).toHaveLength(1);
            expect(within(customItems[0]).getByText("Yolo")).not.toBeNull();
        });

        it("triggers action", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            fireEvent.press(component.getByTestId(customItemTestId));

            jest.advanceTimersByTime(501);

            expect(dummyActionValue.execute).toHaveBeenCalled();
        });

        it("renders with custom styles", () => {
            const customStyle = [
                {
                    container: {
                        backgroundColor: "yellow"
                    }
                }
            ];
            const component = render(<PopupMenu {...defaultProps} style={customStyle} />);
            const modal = component.getByTestId("modal");
            const firstView = within(modal).UNSAFE_getByType(View);
            const secondView = within(firstView.children[0] as ReactTestInstance).UNSAFE_getByType(View);
            expect(secondView.props.style.backgroundColor).toEqual("yellow");
            expect(within(secondView).getByText("Yolo")).not.toBeNull();
        });
    });
});
