import { PopupMenuProps } from "../../typings/PopupMenuProps";
import { defaultPopupMenuStyle, PopupMenuStyle } from "../ui/Styles";
import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { actionValue } from "@mendix/piw-utils-internal";
import { act, fireEvent, render, RenderAPI, within } from "@testing-library/react-native";
import { PopupMenu } from "../PopupMenu";

let dummyActionValue: any;
let defaultProps: PopupMenuProps<PopupMenuStyle>;
jest.useFakeTimers();

let basicItemTestId: string;
let customItemTestId: string;

const flat = (style: unknown): Record<string, unknown> =>
    (StyleSheet.flatten(style as never) as Record<string, unknown> | undefined) ?? {};

/** The props the menu item gave to React Native's Pressable (it is a wrapped component, so it cannot be found by type) */
const pressableProps = (component: RenderAPI, testID: string): Record<string, any> =>
    component.UNSAFE_root.findAll(
        node => typeof node.type !== "string" && node.props.testID === testID && "disabled" in node.props
    )[0].props;

const openMenu = (component: RenderAPI): void => {
    fireEvent.press(component.getByTestId("popup-menu_trigger"));
    // The menu is shown a frame after the trigger has been measured
    act(() => {
        jest.advanceTimersByTime(20);
    });
};

describe("Popup menu", () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
        // The trigger is measured when the menu opens
        jest.spyOn(View.prototype as unknown as { measureInWindow: () => void }, "measureInWindow").mockImplementation(
            ((callback: (x: number, y: number, width: number, height: number) => void) =>
                callback(100, 300, 40, 30)) as never
        );
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

    afterEach(() => {
        (Platform as { OS: string }).OS = originalOS;
        jest.restoreAllMocks();
    });

    it("renders", () => {
        const component = render(<PopupMenu {...defaultProps} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders custom items", () => {
        const component = render(<PopupMenu {...defaultProps} popupRenderMode="custom" />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    describe("the trigger", () => {
        it("opens the menu", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            expect(component.queryByTestId("popup-menu_menu")).toBeNull();

            openMenu(component);

            expect(component.getByTestId("popup-menu_menu")).toBeTruthy();
        });

        it("is a button that says whether the menu is open", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            const trigger = (): Record<string, any> => component.getByTestId("popup-menu_trigger").props;

            expect(trigger().accessibilityRole).toBe("button");
            expect(trigger().accessibilityState).toMatchObject({ expanded: false });

            openMenu(component);

            expect(trigger().accessibilityState).toMatchObject({ expanded: true });
        });
    });

    describe("in basic mode", () => {
        it("renders only basic items", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            openMenu(component);

            const basicItems = component.queryAllByTestId(basicItemTestId);
            const dividers = component.queryAllByTestId("popup-menu_divider", { includeHiddenElements: true });
            const customItems = component.queryAllByTestId(customItemTestId);
            expect(basicItems).toHaveLength(1);
            expect(within(basicItems[0]).getByText("yolo")).not.toBeNull();
            expect(dividers).toHaveLength(1);
            expect(customItems).toHaveLength(0);
        });

        it("renders the items in a menu", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            openMenu(component);

            expect(component.getByTestId("popup-menu_menu").props.accessibilityRole).toBe("menu");
            expect(component.getByTestId(basicItemTestId).props.accessibilityRole).toBe("menuitem");
        });

        it("triggers action and closes the menu", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            openMenu(component);

            fireEvent.press(component.getByTestId(basicItemTestId));

            // The action waits until the menu is gone, because the modal would close alerts the action shows
            expect(dummyActionValue.execute).not.toHaveBeenCalled();
            act(() => {
                jest.advanceTimersByTime(501);
            });

            expect(dummyActionValue.execute).toHaveBeenCalled();
            expect(component.queryByTestId("popup-menu_menu")).toBeNull();
        });

        it("closes with the Android back button without running an action", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            openMenu(component);

            act(() => component.UNSAFE_getByType(Modal).props.onRequestClose());
            act(() => {
                jest.advanceTimersByTime(501);
            });

            expect(component.queryByTestId("popup-menu_menu")).toBeNull();
            expect(dummyActionValue.execute).not.toHaveBeenCalled();
        });

        it("applies the divider colour and the item container style", () => {
            const component = render(
                <PopupMenu
                    {...defaultProps}
                    style={[{ basic: { dividerColor: "#123456", container: { height: 64, backgroundColor: "pink" } } }]}
                />
            );
            openMenu(component);

            expect(
                flat(component.getByTestId("popup-menu_divider", { includeHiddenElements: true }).props.style)
                    .borderBottomColor
            ).toBe("#123456");
            const row = component
                .getByTestId(basicItemTestId)
                .findAll(node => typeof node.type === "string" && flat(node.props.style).backgroundColor === "pink")[0];
            expect(flat(row.props.style)).toMatchObject({ height: 64, maxWidth: 248 });
        });

        describe("styleClass", () => {
            const styleClasses = ["defaultStyle", "primaryStyle", "dangerStyle", "customStyle"] as const;
            const colors = {
                defaultStyle: "#111111",
                primaryStyle: "#222222",
                dangerStyle: "#333333",
                customStyle: "#444444"
            };
            const customStyle = [
                {
                    basic: {
                        itemStyle: Object.fromEntries(styleClasses.map(name => [name, { color: colors[name] }]))
                    }
                }
            ] as unknown as PopupMenuProps<PopupMenuStyle>["style"];

            it.each(["android", "ios"] as const)("styles each of the four classes with its own style on %s", os => {
                (Platform as { OS: string }).OS = os;
                const component = render(
                    <PopupMenu
                        {...defaultProps}
                        style={customStyle}
                        basicItems={styleClasses.map(styleClass => ({
                            itemType: "item" as const,
                            styleClass,
                            caption: styleClass,
                            action: dummyActionValue
                        }))}
                    />
                );
                openMenu(component);

                for (const styleClass of styleClasses) {
                    expect(flat(component.getByText(styleClass).props.style).color).toBe(colors[styleClass]);
                }
            });
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
            openMenu(component);

            expect(flat(component.getByText("yolo").props.style).color).toBe("green");
        });

        describe("rippleColor", () => {
            const rippleStyle = [{ basic: { itemStyle: { rippleColor: "#00aa00" } } }];

            it("is the ripple of the item on Android", () => {
                (Platform as { OS: string }).OS = "android";
                const component = render(<PopupMenu {...defaultProps} style={rippleStyle} />);
                openMenu(component);

                const props = pressableProps(component, basicItemTestId);

                expect(props.android_ripple).toMatchObject({ color: "#00aa00", borderless: false });
                expect(typeof props.style).not.toBe("function");
            });

            it("is the colour shown while the item is pressed on iOS", () => {
                (Platform as { OS: string }).OS = "ios";
                const component = render(<PopupMenu {...defaultProps} style={rippleStyle} />);
                openMenu(component);

                const props = pressableProps(component, basicItemTestId);

                expect(props.android_ripple).toBeUndefined();
                expect(flat(props.style({ pressed: true }))).toMatchObject({ backgroundColor: "#00aa00" });
                expect(flat(props.style({ pressed: false }))).not.toHaveProperty("backgroundColor");
            });

            it("falls back to the default feedback when it is not set", () => {
                (Platform as { OS: string }).OS = "android";
                const component = render(<PopupMenu {...defaultProps} />);
                openMenu(component);

                expect(pressableProps(component, basicItemTestId).android_ripple.color).toBe("rgba(0, 0, 0, 0.2)");
            });
        });
    });

    describe("in custom mode", () => {
        beforeEach(() => {
            defaultProps.popupRenderMode = "custom";
        });

        it("renders only custom items", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            openMenu(component);

            const basicItems = component.queryAllByTestId(basicItemTestId);
            const dividers = component.queryAllByTestId("popup-menu_divider", { includeHiddenElements: true });
            const customItems = component.queryAllByTestId(customItemTestId);
            expect(basicItems).toHaveLength(0);
            expect(dividers).toHaveLength(0);
            expect(customItems).toHaveLength(1);
            expect(within(customItems[0]).getByText("Yolo")).not.toBeNull();
        });

        it("triggers action", () => {
            const component = render(<PopupMenu {...defaultProps} />);
            openMenu(component);

            fireEvent.press(component.getByTestId(customItemTestId));

            act(() => {
                jest.advanceTimersByTime(501);
            });

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
            openMenu(component);

            const [surface] = component.UNSAFE_root.findAll(
                node => typeof node.type === "string" && flat(node.props.style).backgroundColor === "yellow"
            );
            expect(surface).toBeDefined();
            expect(within(surface).getByText("Yolo")).not.toBeNull();
        });

        it("does not force a minimum size on custom items, and applies the custom container style", () => {
            const component = render(
                <PopupMenu {...defaultProps} style={[{ custom: { container: { backgroundColor: "pink" } } }]} />
            );
            openMenu(component);

            const row = component
                .getByTestId(customItemTestId)
                .findAll(node => typeof node.type === "string" && flat(node.props.style).backgroundColor === "pink")[0];

            expect(flat(row.props.style)).toMatchObject({ minHeight: 0, minWidth: 0 });
        });

        it("uses the custom rippleColor on both platforms", () => {
            const rippleStyle = [{ custom: { itemStyle: { rippleColor: "#aa0000" } } }];

            (Platform as { OS: string }).OS = "android";
            const android = render(<PopupMenu {...defaultProps} style={rippleStyle} />);
            openMenu(android);
            expect(pressableProps(android, customItemTestId).android_ripple.color).toBe("#aa0000");
            android.unmount();

            (Platform as { OS: string }).OS = "ios";
            const ios = render(<PopupMenu {...defaultProps} style={rippleStyle} />);
            openMenu(ios);
            expect(flat(pressableProps(ios, customItemTestId).style({ pressed: true })).backgroundColor).toBe(
                "#aa0000"
            );
        });
    });

    describe("Style schema guardrail", () => {
        it("preserves expected style key set", () => {
            const keys = Object.keys(defaultPopupMenuStyle).sort();
            expect(keys).toEqual(["basic", "buttonContainer", "container", "custom"]);
        });

        it("preserves expected basic.itemStyle key set", () => {
            const itemStyle: NonNullable<PopupMenuStyle["basic"]>["itemStyle"] = {
                rippleColor: "",
                ellipsizeMode: "tail",
                defaultStyle: {},
                primaryStyle: {},
                dangerStyle: {},
                customStyle: {}
            };
            expect(Object.keys(itemStyle).sort()).toEqual([
                "customStyle",
                "dangerStyle",
                "defaultStyle",
                "ellipsizeMode",
                "primaryStyle",
                "rippleColor"
            ]);
        });
    });
});
