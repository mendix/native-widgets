import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { Platform, StyleSheet, Text, View } from "react-native";
import { MxMenuDivider } from "../MxMenuDivider";
import { MxMenuItem, MxMenuItemProps } from "../MxMenuItem";

const setPlatform = (os: "ios" | "android"): void => {
    (Platform as { OS: string }).OS = os;
};

const flat = (style: unknown): Record<string, unknown> =>
    (StyleSheet.flatten(style as never) as Record<string, unknown> | undefined) ?? {};

/** The props the item gave to React Native's Pressable (it is a wrapped component, so it cannot be found by type) */
const pressableProps = (component: RenderAPI): Record<string, any> =>
    component.UNSAFE_root.findAll(
        node => typeof node.type !== "string" && node.props.testID === "item" && "disabled" in node.props
    )[0].props;

const renderItem = (props: Partial<MxMenuItemProps> = {}): RenderAPI =>
    render(
        <MxMenuItem testID="item" onPress={jest.fn()} {...props}>
            {props.children ?? "Label"}
        </MxMenuItem>
    );

describe("MxMenuItem", () => {
    const originalOS = Platform.OS;

    afterEach(() => {
        (Platform as { OS: string }).OS = originalOS;
    });

    describe("content", () => {
        it("renders text on a single line", () => {
            const text = renderItem().getByText("Label");

            expect(text.props.numberOfLines).toBe(1);
            expect(flat(text.props.style)).toMatchObject({ fontSize: 14, paddingHorizontal: 16, textAlign: "left" });
        });

        it.each([
            ["ios", "clip"],
            ["android", "tail"]
        ] as const)("clips overflowing text with %s defaults", (os, mode) => {
            setPlatform(os);

            expect(renderItem().getByText("Label").props.ellipsizeMode).toBe(mode);
        });

        it("lets the caller choose how overflowing text is clipped", () => {
            expect(renderItem({ ellipsizeMode: "middle" }).getByText("Label").props.ellipsizeMode).toBe("middle");
        });

        it("renders other content as is", () => {
            const component = renderItem({ children: <View testID="custom" /> });

            expect(component.getByTestId("custom")).toBeTruthy();
            expect(component.UNSAFE_queryAllByType(Text)).toHaveLength(0);
        });

        it("applies the text style on top of the defaults", () => {
            const text = renderItem({ textStyle: { color: "#123456", fontSize: 20 } }).getByText("Label");

            expect(flat(text.props.style)).toMatchObject({ color: "#123456", fontSize: 20, paddingHorizontal: 16 });
        });

        it("hides the text instead of rendering fontSize 0, which crashes the new architecture", () => {
            const text = renderItem({ textStyle: { fontSize: 0 } }).getByText("Label", { includeHiddenElements: true });
            const style = flat(text.props.style);

            expect(style.display).toBe("none");
            expect(style).not.toHaveProperty("fontSize");
        });

        it("applies the item style to the row", () => {
            const component = renderItem({ style: { height: 48, maxWidth: 248 } });
            const [row] = component.UNSAFE_root.findAll(
                node => typeof node.type === "string" && flat(node.props.style).minHeight === 48
            );

            expect(flat(row.props.style)).toMatchObject({ minHeight: 48, minWidth: 124, height: 48, maxWidth: 248 });
        });
    });

    describe("menu accessibility", () => {
        it("is a menu item", () => {
            expect(renderItem().getByTestId("item").props.accessibilityRole).toBe("menuitem");
        });

        it("is reported as enabled or disabled", () => {
            expect(renderItem().getByTestId("item").props.accessibilityState).toMatchObject({ disabled: false });
            expect(renderItem({ disabled: true }).getByTestId("item").props.accessibilityState).toMatchObject({
                disabled: true
            });
        });

        it("is reported as selected", () => {
            expect(renderItem({ selected: true }).getByTestId("item").props.accessibilityState).toMatchObject({
                selected: true
            });
            expect(renderItem().getByTestId("item").props.accessibilityState.selected).toBeUndefined();
        });

        it("passes an accessibility label", () => {
            expect(renderItem({ accessibilityLabel: "Delete" }).getByTestId("item").props.accessibilityLabel).toBe(
                "Delete"
            );
        });
    });

    describe("pressing", () => {
        it("calls onPress", () => {
            const onPress = jest.fn();
            const component = renderItem({ onPress });

            fireEvent.press(component.getByTestId("item"));

            expect(onPress).toHaveBeenCalledTimes(1);
        });

        it("does nothing when disabled", () => {
            const onPress = jest.fn();
            const component = renderItem({ onPress, disabled: true });

            fireEvent.press(component.getByTestId("item"));

            expect(onPress).not.toHaveBeenCalled();
        });

        it("greys out disabled text, unless the text style sets a colour", () => {
            expect(flat(renderItem({ disabled: true }).getByText("Label").props.style).color).toBe("#bdbdbd");
            expect(
                flat(renderItem({ disabled: true, disabledTextColor: "#999999" }).getByText("Label").props.style).color
            ).toBe("#999999");
            expect(
                flat(renderItem({ disabled: true, textStyle: { color: "#ff0000" } }).getByText("Label").props.style)
                    .color
            ).toBe("#ff0000");
        });
    });

    describe("Android press feedback", () => {
        beforeEach(() => setPlatform("android"));

        it("uses a bounded ripple with the default colour", () => {
            const ripple = pressableProps(renderItem()).android_ripple;

            expect(ripple).toMatchObject({ color: "rgba(0, 0, 0, 0.2)", borderless: false });
        });

        it("uses the ripple colour", () => {
            expect(pressableProps(renderItem({ rippleColor: "#00ff00" })).android_ripple.color).toBe("#00ff00");
        });

        it("ignores the iOS underlay", () => {
            expect(typeof pressableProps(renderItem({ underlayColor: "#ff0000" })).style).not.toBe("function");
        });
    });

    describe("iOS press feedback", () => {
        beforeEach(() => setPlatform("ios"));

        const pressedStyle = (props: Partial<MxMenuItemProps>): Record<string, unknown> => {
            return flat(pressableProps(renderItem(props)).style({ pressed: true }));
        };

        it("has no ripple", () => {
            expect(pressableProps(renderItem()).android_ripple).toBeUndefined();
        });

        it("shows nothing while it is not pressed", () => {
            expect(flat(pressableProps(renderItem({ underlayColor: "#ff0000" })).style({ pressed: false }))).toEqual(
                {}
            );
        });

        it("shows the underlay colour and dims while pressed", () => {
            expect(pressedStyle({ underlayColor: "#ff0000" })).toMatchObject({
                backgroundColor: "#ff0000",
                opacity: 0.2
            });
        });

        it("only dims while pressed when there is no underlay colour", () => {
            const style = pressedStyle({});

            expect(style.opacity).toBe(0.2);
            expect(style).not.toHaveProperty("backgroundColor");
        });

        it("uses the active opacity", () => {
            expect(pressedStyle({ activeOpacity: 0.6 }).opacity).toBe(0.6);
        });

        it("ignores the Android ripple colour", () => {
            expect(pressedStyle({ rippleColor: "#00ff00" })).not.toHaveProperty("backgroundColor");
        });
    });
});

describe("MxMenuDivider", () => {
    it("is a hairline with the default colour", () => {
        const divider = render(<MxMenuDivider testID="divider" />).getByTestId("divider", {
            includeHiddenElements: true
        });

        expect(flat(divider.props.style)).toMatchObject({
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: "rgba(0, 0, 0, 0.12)"
        });
    });

    it("uses the colour", () => {
        const divider = render(<MxMenuDivider testID="divider" color="#abcdef" />).getByTestId("divider", {
            includeHiddenElements: true
        });

        expect(flat(divider.props.style).borderBottomColor).toBe("#abcdef");
    });

    it("is hidden from screen readers", () => {
        const divider = render(<MxMenuDivider testID="divider" />).getByTestId("divider", {
            includeHiddenElements: true
        });

        expect(divider.props.importantForAccessibility).toBe("no");
    });
});
