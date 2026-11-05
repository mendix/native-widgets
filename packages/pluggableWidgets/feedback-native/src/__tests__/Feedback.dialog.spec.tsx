import { act, cleanup, fireEvent, render, RenderAPI, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, ActivityIndicator, Modal, StyleSheet } from "react-native";
import { FeedbackProps } from "../../typings/FeedbackProps";
import { Feedback } from "../Feedback";
import { FeedbackStyle } from "../ui/styles";
import { themedFixture } from "./themedFixture";

const mockFindNodeHandle = jest.fn();
jest.mock("react-native/Libraries/ReactNative/RendererProxy", () => {
    const actual = jest.requireActual("react-native/Libraries/ReactNative/RendererProxy");
    return {
        ...actual,
        // Only intercepted while a test installs an implementation, so other tests keep the real behaviour
        findNodeHandle: (node: unknown) =>
            mockFindNodeHandle.getMockImplementation() ? mockFindNodeHandle(node) : actual.findNodeHandle(node)
    };
});

jest.mock("react-native-view-shot", () => ({
    captureScreen: jest.fn(() => Promise.resolve(""))
}));

const fetchMock = jest.fn();
global.fetch = fetchMock;

type TestNode = { props: { testID?: string; accessibilityRole?: string; children?: unknown } };

describe("Feedback dialog", () => {
    let props: FeedbackProps<FeedbackStyle>;
    let setFocus: jest.SpyInstance;
    let nodeOf: (tag: number) => TestNode | undefined;

    beforeEach(() => {
        fetchMock.mockReset().mockResolvedValue({ ok: true });
        props = { name: "feedback-test", style: [], sprintrapp: "sprintr-app-id", allowScreenshot: true };
        setFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => undefined);

        // Numeric tags like on a device, so the element that received focus can be identified
        const tags = new Map<unknown, number>();
        const nodes = new Map<number, TestNode>();
        mockFindNodeHandle.mockReset().mockImplementation((node: TestNode | null) => {
            if (!node) {
                return null;
            }
            if (!tags.has(node)) {
                tags.set(node, tags.size + 1);
                nodes.set(tags.size, node);
            }
            return tags.get(node);
        });
        nodeOf = tag => nodes.get(tag);
    });

    afterEach(() => {
        cleanup();
        jest.useRealTimers();
        mockFindNodeHandle.mockReset();
        jest.restoreAllMocks();
    });

    const openTodoDialog = async (): Promise<RenderAPI> => {
        const component = render(<Feedback {...props} />);
        fireEvent.press(component.getByTestId("feedback-test$button"));
        await waitFor(() => component.getByTestId("feedback-test$input"));
        return component;
    };

    const dialogModals = (component: RenderAPI): ReturnType<RenderAPI["UNSAFE_getAllByType"]> =>
        component.UNSAFE_queryAllByType(Modal);

    /** Closing plays the exit animation, so fake timers are switched on right before closing to run it to the end */
    const closeWithFakeTimers = (close: () => void): void => {
        jest.useFakeTimers();
        act(() => close());
        act(() => {
            jest.advanceTimersByTime(1000);
        });
    };

    it("renders the dialog through the overlay with modal semantics", async () => {
        const component = await openTodoDialog();

        expect(dialogModals(component)).toHaveLength(1);
        const { props: contentProps } = component.getByTestId("feedback-test$popup-content");
        expect(contentProps.importantForAccessibility).toBe("yes");
        expect(contentProps.accessibilityViewIsModal).toBeUndefined();
    });

    it("keeps the previous Modal behaviour: transparent, not under the status bar, portrait and landscape", async () => {
        const component = await openTodoDialog();
        const { props: modalProps } = dialogModals(component)[0];

        expect(modalProps.transparent).toBe(true);
        expect(modalProps.statusBarTranslucent).toBe(false);
        expect(modalProps.supportedOrientations).toEqual(["portrait", "landscape"]);
    });

    it("on Android applies the whole dialog style to the content and draws no iOS blur or separators", async () => {
        props.style = [themedFixture as FeedbackStyle];
        const component = await openTodoDialog();
        const styleOf = (node: { props: { style?: unknown } }): Record<string, unknown> =>
            (StyleSheet.flatten(node.props.style as never) as Record<string, unknown> | undefined) ?? {};
        const hostsWith = (predicate: (style: Record<string, unknown>) => boolean): unknown[] =>
            component.UNSAFE_root.findAll(node => typeof node.type === "string" && predicate(styleOf(node)));

        expect(
            hostsWith(s => s.borderRadius === 21 && s.backgroundColor === "#b2b2b2" && s.opacity === 0.9)
        ).toHaveLength(1);
        expect(hostsWith(s => s.position === "absolute" && s.backgroundColor === "#b2b2b2")).toHaveLength(0);
        expect(hostsWith(s => s.backgroundColor === "#8f9f9f" && s.width === 3)).toHaveLength(0);
        expect(hostsWith(s => s.borderTopColor === "#8f9f9f")).toHaveLength(0);
    });

    it("ignores presses on the area around the dialog", async () => {
        const component = await openTodoDialog();

        fireEvent.press(component.getByTestId("feedback-test$popup-backdrop", { includeHiddenElements: true }));

        expect(component.queryByTestId("feedback-test$input")).not.toBeNull();
        expect(component.queryByTestId("feedback-test$button")).toBeNull();
    });

    describe("focus", () => {
        it("moves accessibility focus to the title when the dialog opens", async () => {
            const component = await openTodoDialog();

            fireEvent(component.getByTestId("feedback-test$popup-content"), "layout", {
                nativeEvent: { layout: { width: 300, height: 300 } }
            });

            expect(setFocus).toHaveBeenCalledTimes(1);
            const focused = nodeOf(setFocus.mock.calls[0][0]);
            expect(focused?.props.accessibilityRole).toBe("header");
            expect(focused?.props.children).toBe("Send Feedback");
        });

        it("returns accessibility focus to the feedback button after the dialog closes", async () => {
            const component = await openTodoDialog();
            setFocus.mockClear();

            closeWithFakeTimers(() => fireEvent.press(component.getByTestId("feedback-test$cancel")));

            expect(dialogModals(component)).toHaveLength(0);
            expect(setFocus).toHaveBeenCalledTimes(1);
            expect(nodeOf(setFocus.mock.calls[0][0])?.props.testID).toBe("feedback-test$button");
        });
    });

    describe("Android back button", () => {
        it("closes the feedback form like Cancel", async () => {
            const component = await openTodoDialog();

            closeWithFakeTimers(() => dialogModals(component)[0].props.onRequestClose());

            expect(dialogModals(component)).toHaveLength(0);
            expect(component.queryByTestId("feedback-test$button")).not.toBeNull();
        });

        it("closes the result dialog like OK", async () => {
            const component = await openTodoDialog();
            fireEvent.changeText(component.getByTestId("feedback-test$input"), "message");
            fireEvent.press(component.getByTestId("feedback-test$send"));
            await component.findByTestId("feedback-test$success");

            closeWithFakeTimers(() => {
                const resultModal = dialogModals(component).find(
                    modal => modal.findAll(node => node.props.testID === "feedback-test$success").length > 0
                );
                resultModal?.props.onRequestClose();
            });

            expect(component.queryByTestId("feedback-test$success")).toBeNull();
            expect(component.queryByTestId("feedback-test$button")).not.toBeNull();
        });

        it("does nothing while the feedback is being sent", async () => {
            fetchMock.mockReturnValue(new Promise(() => undefined));
            const component = await openTodoDialog();
            fireEvent.changeText(component.getByTestId("feedback-test$input"), "message");
            fireEvent.press(component.getByTestId("feedback-test$send"));
            await waitFor(() => component.UNSAFE_getByType(ActivityIndicator));

            closeWithFakeTimers(() => {
                const sendingModal = dialogModals(component).find(
                    modal => modal.findAllByType(ActivityIndicator).length > 0
                );
                sendingModal?.props.onRequestClose();
            });

            expect(component.UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
            expect(component.queryByTestId("feedback-test$button")).toBeNull();
        });
    });
});
