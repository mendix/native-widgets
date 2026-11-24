import { act, fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { ReactElement } from "react";
import { I18nManager, Modal, StatusBar, StyleSheet, Text } from "react-native";
import { MxMenu, MxMenuProps } from "../MxMenu";

const mockOverlayMounted = jest.fn();
jest.mock("../../MxOverlay", () => {
    const actual = jest.requireActual("../../MxOverlay");
    const react = jest.requireActual("react");
    return {
        ...actual,
        // Counts how often the overlay is created, to see when the menu starts over with a fresh one
        MxOverlay: (props: unknown): unknown => {
            react.useEffect(() => {
                mockOverlayMounted();
            }, []);
            return actual.MxOverlay(props);
        }
    };
});

// The jest window is 750 x 1334
const anchor = { x: 100, y: 300, width: 180, height: 40 };
const menuSize = { width: 150, height: 200 };

const flat = (style: unknown): Record<string, unknown> =>
    (StyleSheet.flatten(style as never) as Record<string, unknown> | undefined) ?? {};

const element = (props: Partial<MxMenuProps> = {}): ReactElement => (
    <MxMenu visible anchor={anchor} onRequestClose={jest.fn()} animationDuration={0} testID="menu" {...props}>
        <Text>item</Text>
    </MxMenu>
);

/** The element that gets the menu's look and is measured */
const surfaceOf = (component: RenderAPI): ReturnType<RenderAPI["UNSAFE_getAllByType"]>[number] =>
    component.UNSAFE_root.findAll(
        node =>
            typeof node.type === "string" &&
            typeof node.props.onLayout === "function" &&
            flat(node.props.style).backgroundColor !== undefined
    )[0];

const measure = (component: RenderAPI, size = menuSize): void => {
    fireEvent(surfaceOf(component), "layout", { nativeEvent: { layout: { x: 0, y: 0, ...size } } });
};

const overlayPosition = (component: RenderAPI): { top: unknown; left: unknown } => {
    const style = flat(component.getByTestId("menu-overlay-content").props.style);
    return { top: style.top, left: style.left };
};

const originalStatusBarHeight = Object.getOwnPropertyDescriptor(StatusBar, "currentHeight");
const setStatusBarHeight = (value: number): void => {
    Object.defineProperty(StatusBar, "currentHeight", { value, configurable: true });
};

describe("MxMenu", () => {
    beforeEach(() => {
        mockOverlayMounted.mockClear();
        // Jest reports a status bar of 42, which the positions below should not depend on
        setStatusBarHeight(0);
    });

    afterEach(() => {
        if (originalStatusBarHeight) {
            Object.defineProperty(StatusBar, "currentHeight", originalStatusBarHeight);
        }
    });

    describe("placing the menu", () => {
        it("is invisible until it has been measured", () => {
            const component = render(element());

            expect(flat(surfaceOf(component).props.style).opacity).toBe(0);

            measure(component);

            expect(flat(surfaceOf(component).props.style).opacity).toBeUndefined();
        });

        it("puts the menu on the trigger by default", () => {
            const component = render(element());
            measure(component);

            expect(overlayPosition(component)).toEqual({ top: 300, left: 100 });
        });

        it("puts the menu under the trigger with placement below", () => {
            const component = render(element({ placement: "below" }));
            measure(component);

            expect(overlayPosition(component)).toEqual({ top: 340, left: 100 });
        });

        it("keeps the menu on the screen", () => {
            const component = render(element({ anchor: { x: 700, y: 1300, width: 40, height: 30 } }));
            measure(component);

            expect(overlayPosition(component)).toEqual({ top: 1126, left: 590 });
        });

        it("is not drawn under the status bar, so it is placed in the space the trigger was measured in", () => {
            const component = render(element());

            expect(component.UNSAFE_getByType(Modal).props.statusBarTranslucent).toBe(false);
        });

        describe("with a status bar", () => {
            beforeEach(() => setStatusBarHeight(24));

            it("does not count the status bar as room below the trigger", () => {
                const component = render(element({ anchor: { x: 700, y: 1300, width: 40, height: 30 } }));
                measure(component);

                // 1334 - 24 = 1310 of room, so the menu's top is at 1310 - 8 - 200 instead of 1334 - 8 - 200
                expect(overlayPosition(component)).toEqual({ top: 1102, left: 590 });
            });

            it("places a menu that fits exactly where the trigger is", () => {
                const component = render(element());
                measure(component);

                expect(overlayPosition(component)).toEqual({ top: 300, left: 100 });
            });
        });

        it("makes the menu as wide as the trigger", () => {
            const component = render(element({ matchAnchorWidth: true }));

            expect(flat(surfaceOf(component).props.style).width).toBe(180);
        });

        it("limits the height", () => {
            const component = render(element({ maxHeight: 120 }));

            expect(flat(surfaceOf(component).props.style).maxHeight).toBe(120);
        });

        describe("right to left", () => {
            const original = { isRTL: I18nManager.isRTL, swap: I18nManager.doLeftAndRightSwapInRTL };
            const setRtl = (isRTL: boolean, swap: boolean): void => {
                Object.assign(I18nManager, { isRTL, doLeftAndRightSwapInRTL: swap });
            };

            afterEach(() => setRtl(original.isRTL, original.swap));

            it("aligns with the trigger's right edge and turns x into the swapped left", () => {
                setRtl(true, true);
                const component = render(element());
                measure(component);

                // x = 280 - 150 = 130, and left is the distance from the right edge: 750 - 130 - 150
                expect(overlayPosition(component)).toEqual({ top: 300, left: 470 });
            });

            it("uses x as is when left and right are not swapped", () => {
                setRtl(true, false);
                const component = render(element());
                measure(component);

                expect(overlayPosition(component)).toEqual({ top: 300, left: 130 });
            });
        });
    });

    describe("the menu", () => {
        it("is a menu", () => {
            const component = render(element({ accessibilityLabel: "Actions" }));
            const menu = component.getByTestId("menu");

            expect(menu.props.accessibilityRole).toBe("menu");
            expect(menu.props.accessibilityLabel).toBe("Actions");
        });

        it("has a white, rounded surface with a shadow unless the style says otherwise", () => {
            const component = render(element());
            const surface = flat(surfaceOf(component).props.style);

            expect(surface).toMatchObject({ backgroundColor: "white", borderRadius: 4 });
            expect(flat(component.getByTestId("menu").props.style)).toMatchObject({
                overflow: "hidden",
                borderRadius: 4
            });
        });

        it("applies the style on top, and rounds the clipping with the same radius", () => {
            const component = render(element({ style: { backgroundColor: "#eeeeee", borderRadius: 12 } }));

            expect(flat(surfaceOf(component).props.style)).toMatchObject({
                backgroundColor: "#eeeeee",
                borderRadius: 12
            });
            expect(flat(component.getByTestId("menu").props.style).borderRadius).toBe(12);
        });
    });

    describe("closing", () => {
        it("closes with a press outside the menu", () => {
            const onRequestClose = jest.fn();
            const component = render(element({ onRequestClose }));

            fireEvent.press(component.getByTestId("menu-overlay-backdrop", { includeHiddenElements: true }));

            expect(onRequestClose).toHaveBeenCalledTimes(1);
        });

        it("closes with the Android back button", () => {
            const onRequestClose = jest.fn();
            const component = render(element({ onRequestClose }));

            act(() => component.UNSAFE_getByType(Modal).props.onRequestClose());

            expect(onRequestClose).toHaveBeenCalledTimes(1);
        });

        it("has a see-through backdrop", () => {
            const component = render(element());
            const backdrop = component.getByTestId("menu-overlay-backdrop", { includeHiddenElements: true });
            const [dim] = backdrop.findAll(node => node.props.pointerEvents === "none");

            expect(flat(dim.props.style)).toMatchObject({ backgroundColor: "transparent" });
        });
    });

    describe("never more than one modal (the iOS double modal)", () => {
        const showing = (visible: boolean): ReactElement => element({ visible });

        it("starts over with a fresh overlay every time the menu has completely closed", () => {
            const component = render(showing(false));
            expect(mockOverlayMounted).toHaveBeenCalledTimes(1);

            component.rerender(showing(true));
            expect(component.UNSAFE_queryAllByType(Modal)).toHaveLength(1);
            expect(mockOverlayMounted).toHaveBeenCalledTimes(1);

            component.rerender(showing(false));
            expect(component.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
            expect(mockOverlayMounted).toHaveBeenCalledTimes(2);

            component.rerender(showing(true));
            expect(component.UNSAFE_queryAllByType(Modal)).toHaveLength(1);
            expect(mockOverlayMounted).toHaveBeenCalledTimes(2);

            component.rerender(showing(false));
            expect(mockOverlayMounted).toHaveBeenCalledTimes(3);
        });

        it("keeps a single modal when it is opened again while it is still closing", () => {
            jest.useFakeTimers();
            try {
                const animated = (visible: boolean): ReactElement => element({ visible, animationDuration: 200 });
                const component = render(animated(true));
                act(() => {
                    jest.advanceTimersByTime(250);
                });

                // Under Jest the exit animation completes on the first timer tick, so before that it is still closing
                component.rerender(animated(false));
                expect(component.UNSAFE_queryAllByType(Modal)).toHaveLength(1);

                component.rerender(animated(true));
                expect(component.UNSAFE_queryAllByType(Modal)).toHaveLength(1);
                act(() => {
                    jest.advanceTimersByTime(250);
                });

                expect(component.UNSAFE_queryAllByType(Modal)).toHaveLength(1);
                expect(mockOverlayMounted).toHaveBeenCalledTimes(1);
            } finally {
                jest.useRealTimers();
            }
        });

        it("never has two modals across quick open and close cycles", () => {
            const component = render(showing(false));
            const counts: number[] = [];

            for (let i = 0; i < 5; i++) {
                component.rerender(showing(true));
                counts.push(component.UNSAFE_queryAllByType(Modal).length);
                component.rerender(showing(false));
                counts.push(component.UNSAFE_queryAllByType(Modal).length);
            }

            expect(Math.max(...counts)).toBe(1);
            expect(counts.filter(count => count === 0)).toHaveLength(5);
        });
    });

    it("renders its children", () => {
        expect(render(element()).getByText("item")).toBeTruthy();
    });
});
