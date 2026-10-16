import { createRef, ReactElement } from "react";
import { AccessibilityInfo, Modal, Platform, Text, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { MxOverlay, MxOverlayProps } from "../MxOverlay";

const mockFindNodeHandle = jest.fn();
jest.mock("react-native/Libraries/ReactNative/RendererProxy", () => ({
    ...jest.requireActual("react-native/Libraries/ReactNative/RendererProxy"),
    findNodeHandle: (node: unknown) => mockFindNodeHandle(node)
}));

const setPlatform = (os: "ios" | "android"): void => {
    (Platform as { OS: string }).OS = os;
};

const renderOverlay = (
    props: Partial<MxOverlayProps> = {}
): ReturnType<typeof render> & { onRequestClose: jest.Mock } => {
    const onRequestClose = jest.fn();
    const utils = render(
        <MxOverlay visible onRequestClose={onRequestClose} animationDuration={0} testID="overlay" {...props}>
            <Text>content</Text>
        </MxOverlay>
    );
    return { ...utils, onRequestClose };
};

describe.each(["ios", "android"] as const)("MxOverlay on %s", os => {
    const originalOS = Platform.OS;
    let setFocus: jest.SpyInstance;

    beforeEach(() => {
        setPlatform(os);
        setFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => undefined);
        mockFindNodeHandle.mockReset().mockReturnValue(42);
    });

    afterEach(() => {
        (Platform as { OS: string }).OS = originalOS;
        jest.restoreAllMocks();
    });

    describe("modal semantics", () => {
        it("marks the content as modal for the current platform only", () => {
            const { getByTestId } = renderOverlay();
            const props = getByTestId("overlay-content").props;

            if (os === "ios") {
                expect(props.accessibilityViewIsModal).toBe(true);
                expect(props.importantForAccessibility).toBeUndefined();
            } else {
                expect(props.importantForAccessibility).toBe("yes");
                expect(props.accessibilityViewIsModal).toBeUndefined();
            }
        });

        it("hides the backdrop from accessibility", () => {
            const { getByTestId } = renderOverlay();

            expect(getByTestId("overlay-backdrop", { includeHiddenElements: true }).props.accessible).toBe(false);
        });
    });

    describe("focus", () => {
        const layout = (getByTestId: (id: string) => any): void => {
            fireEvent(getByTestId("overlay-content"), "layout", { nativeEvent: { layout: {} } });
        };

        it("moves focus into the overlay once it has laid out", () => {
            const { getByTestId } = renderOverlay();
            expect(setFocus).not.toHaveBeenCalled();

            layout(getByTestId);
            layout(getByTestId);

            expect(setFocus).toHaveBeenCalledTimes(1);
            expect(setFocus).toHaveBeenCalledWith(42);
        });

        it("moves focus to initialFocusRef when provided", () => {
            const initialFocusRef = createRef<View>();
            mockFindNodeHandle.mockImplementation(node => (node === initialFocusRef.current ? 7 : 42));
            const { getByTestId } = render(
                <MxOverlay visible animationDuration={0} testID="overlay" initialFocusRef={initialFocusRef}>
                    <View ref={initialFocusRef} />
                </MxOverlay>
            );

            layout(getByTestId);

            expect(setFocus).toHaveBeenCalledWith(7);
        });

        it("restores focus to returnFocusRef after closing", () => {
            const returnFocusRef = createRef<View>();
            mockFindNodeHandle.mockImplementation(node => (node === returnFocusRef.current ? 9 : 42));
            const element = (visible: boolean): ReactElement => (
                <>
                    <View ref={returnFocusRef} />
                    <MxOverlay visible={visible} animationDuration={0} returnFocusRef={returnFocusRef}>
                        <Text>content</Text>
                    </MxOverlay>
                </>
            );
            const { rerender } = render(element(true));
            setFocus.mockClear();

            rerender(element(false));

            expect(setFocus).toHaveBeenCalledTimes(1);
            expect(setFocus).toHaveBeenCalledWith(9);
        });

        it("restores focus only after the modal has unmounted", () => {
            const returnFocusRef = createRef<View>();
            mockFindNodeHandle.mockImplementation(node => (node === returnFocusRef.current ? 9 : 42));
            const rendered: { current?: ReturnType<typeof render> } = {};
            const modalPresentWhenFocused: boolean[] = [];
            setFocus.mockImplementation(() => {
                modalPresentWhenFocused.push(Boolean(rendered.current?.UNSAFE_queryByType(Modal)));
            });
            const element = (visible: boolean): ReactElement => (
                <>
                    <View ref={returnFocusRef} />
                    <MxOverlay visible={visible} animationDuration={0} returnFocusRef={returnFocusRef}>
                        <Text>content</Text>
                    </MxOverlay>
                </>
            );
            rendered.current = render(element(true));
            setFocus.mockClear();
            modalPresentWhenFocused.length = 0;

            rendered.current.rerender(element(false));

            expect(modalPresentWhenFocused).toEqual([false]);
        });

        it("does not move focus when it was never shown", () => {
            const returnFocusRef = createRef<View>();
            render(
                <MxOverlay visible={false} returnFocusRef={returnFocusRef}>
                    <Text>content</Text>
                </MxOverlay>
            );

            expect(setFocus).not.toHaveBeenCalled();
        });
    });

    describe("back button", () => {
        const pressBack = (utils: ReturnType<typeof renderOverlay>): void => {
            act(() => {
                utils.UNSAFE_getByType(Modal).props.onRequestClose();
            });
        };

        it("dismisses on back press by default", () => {
            const utils = renderOverlay();

            pressBack(utils);

            expect(utils.onRequestClose).toHaveBeenCalledTimes(1);
        });

        it("swallows back press without dismissing when dismissOnBackPress is false", () => {
            const utils = renderOverlay({ dismissOnBackPress: false });

            expect(typeof utils.UNSAFE_getByType(Modal).props.onRequestClose).toBe("function");
            pressBack(utils);

            expect(utils.onRequestClose).not.toHaveBeenCalled();
        });
    });

    describe("backdrop", () => {
        it("dismisses on backdrop press by default", () => {
            const { getByTestId, onRequestClose } = renderOverlay();

            fireEvent.press(getByTestId("overlay-backdrop", { includeHiddenElements: true }));

            expect(onRequestClose).toHaveBeenCalledTimes(1);
        });

        it("ignores backdrop press when dismissOnBackdropPress is false", () => {
            const { getByTestId, onRequestClose } = renderOverlay({ dismissOnBackdropPress: false });

            fireEvent.press(getByTestId("overlay-backdrop", { includeHiddenElements: true }));

            expect(onRequestClose).not.toHaveBeenCalled();
        });
    });

    describe("visibility and animation", () => {
        it("passes statusBarTranslucent through to the modal", () => {
            expect(renderOverlay().UNSAFE_getByType(Modal).props.statusBarTranslucent).toBe(true);
            expect(
                renderOverlay({ statusBarTranslucent: false }).UNSAFE_getByType(Modal).props.statusBarTranslucent
            ).toBe(false);
        });

        it("renders a transparent modal by default and an opaque one when transparent is false", () => {
            expect(renderOverlay().UNSAFE_getByType(Modal).props.transparent).toBe(true);
            expect(renderOverlay({ transparent: false }).UNSAFE_getByType(Modal).props.transparent).toBe(false);
        });

        it("supports every orientation so the device orientation is kept on iOS", () => {
            expect(renderOverlay().UNSAFE_getByType(Modal).props.supportedOrientations).toEqual([
                "portrait",
                "portrait-upside-down",
                "landscape-left",
                "landscape-right"
            ]);
        });

        it("uses the supportedOrientations passed by the caller", () => {
            const utils = renderOverlay({ supportedOrientations: ["portrait"] });

            expect(utils.UNSAFE_getByType(Modal).props.supportedOrientations).toEqual(["portrait"]);
        });

        it("renders nothing while hidden", () => {
            const { queryByTestId } = renderOverlay({ visible: false });

            expect(queryByTestId("overlay")).toBeNull();
        });

        it("stays mounted until the exit animation finishes", () => {
            jest.useFakeTimers();
            try {
                const element = (visible: boolean): ReactElement => (
                    <MxOverlay visible={visible} animationDuration={200} testID="overlay">
                        <Text>content</Text>
                    </MxOverlay>
                );
                const { rerender, queryByTestId } = render(element(true));
                act(() => {
                    jest.advanceTimersByTime(250);
                });

                rerender(element(false));
                expect(queryByTestId("overlay")).not.toBeNull();

                act(() => {
                    jest.advanceTimersByTime(250);
                });
                expect(queryByTestId("overlay")).toBeNull();
            } finally {
                jest.useRealTimers();
            }
        });

        it.each(["center", "bottom", "fullscreen", "positioned"] as const)("renders %s placement", placement => {
            const { getByText } = renderOverlay({ placement, position: { top: 10, left: 20 } });

            expect(getByText("content")).toBeTruthy();
        });
    });
});
