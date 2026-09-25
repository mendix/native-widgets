import { RefObject } from "react";
import { render } from "@testing-library/react-native";
import { EmitterSubscription, Keyboard, Platform, TextInput } from "react-native";
import { BottomSheetScrollViewMethods, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { dismissSheetKeyboard, SheetKeyboardTracker } from "../components/SheetKeyboardTracker";

jest.mock("@gorhom/bottom-sheet", () => ({
    useBottomSheetInternal: jest.fn()
}));

interface KeyboardState {
    target?: number;
    height: number;
}

/** Distance between the top of the screen and the sheet's scrollable. */
const SCROLLABLE_SCREEN_Y = 120;

/** Minimal stand-in for the reanimated shared value the sheet keeps its keyboard state in. */
const createKeyboardState = (): { get: () => KeyboardState; set: (updater: any) => void } => {
    let state: KeyboardState = { height: 0 };

    return {
        get: () => state,
        set: updater => {
            state = typeof updater === "function" ? updater(state) : updater;
        }
    };
};

describe("SheetKeyboardTracker", () => {
    let animatedKeyboardState: ReturnType<typeof createKeyboardState>;
    let showKeyboard: () => void;
    let finishShowingKeyboard: () => void;
    let finishHidingKeyboard: () => void;
    let scrollToKeyboard: jest.Mock;
    let scrollableRef: RefObject<BottomSheetScrollViewMethods | null>;
    let removeListener: jest.Mock;
    let platformOsDescriptor: PropertyDescriptor | undefined;

    const setPlatform = (os: string): void => {
        Object.defineProperty(Platform, "OS", { configurable: true, value: os });
    };

    const renderTracker = ({ isModal = true } = {}): ReturnType<typeof render> =>
        render(<SheetKeyboardTracker scrollableRef={scrollableRef} isModal={isModal} />);

    /**
     * Focuses an input, either one of the sheet's own or one elsewhere on the page. The
     * sheet tells the two apart by measuring the input against its scrollable, which fails
     * for a view outside it.
     */
    const focusInput = ({ insideSheet = true } = {}): unknown => {
        const focusedInput = {
            id: "focused input",
            measureLayout: (_relativeTo: unknown, onSuccess: () => void, onFail: () => void) =>
                insideSheet ? onSuccess() : onFail()
        };
        jest.spyOn(TextInput.State, "currentlyFocusedInput").mockReturnValue(focusedInput as any);

        return focusedInput;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        platformOsDescriptor = Object.getOwnPropertyDescriptor(Platform, "OS");
        animatedKeyboardState = createKeyboardState();
        (useBottomSheetInternal as jest.Mock).mockReturnValue({ animatedKeyboardState });

        scrollToKeyboard = jest.fn();
        scrollableRef = {
            current: {
                getScrollResponder: () => ({ scrollResponderScrollNativeHandleToKeyboard: scrollToKeyboard }),
                measureInWindow: (callback: (x: number, y: number) => void) => callback(0, SCROLLABLE_SCREEN_Y)
            } as unknown as BottomSheetScrollViewMethods
        };

        removeListener = jest.fn();
        const notSubscribed = (eventName: string) => () => {
            throw new Error(`${eventName} was never subscribed to`);
        };
        showKeyboard = notSubscribed("keyboardWillShow");
        finishShowingKeyboard = notSubscribed("keyboardDidShow");
        finishHidingKeyboard = notSubscribed("keyboardDidHide");
        jest.spyOn(Keyboard, "addListener").mockImplementation((eventName, handler) => {
            if (eventName === "keyboardWillShow") {
                showKeyboard = () => handler({} as any);
            }
            if (eventName === "keyboardDidShow") {
                finishShowingKeyboard = () => handler({} as any);
            }
            if (eventName === "keyboardDidHide") {
                finishHidingKeyboard = () => handler({} as any);
            }
            return { remove: removeListener } as unknown as EmitterSubscription;
        });
        setPlatform("ios");
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
        if (platformOsDescriptor) {
            Object.defineProperty(Platform, "OS", platformOsDescriptor);
        }
    });

    it("reports a target to the sheet when the keyboard opens on iOS", () => {
        renderTracker();

        expect(animatedKeyboardState.get().target).toBeUndefined();

        showKeyboard();

        expect(animatedKeyboardState.get().target).toBeTruthy();
    });

    it("preserves the rest of the keyboard state", () => {
        animatedKeyboardState.set({ height: 336 });
        renderTracker();

        showKeyboard();

        expect(animatedKeyboardState.get().height).toBe(336);
    });

    it("reports a new target on every open, so a cached event is always replayed", () => {
        renderTracker();

        showKeyboard();
        const firstTarget = animatedKeyboardState.get().target;

        showKeyboard();

        expect(animatedKeyboardState.get().target).not.toBe(firstTarget);
    });

    it("reports a target even before the focused input is recorded", () => {
        // React Native records the focused input after iOS has announced the keyboard, so a
        // modal sheet cannot wait for it: gating on the ref made the first focus a no-op and
        // only moved the sheet once a later keyboard event -- e.g. after backgrounding the
        // app -- found the ref populated. Typed as non-nullable by RN, but null at runtime.
        jest.spyOn(TextInput.State, "currentlyFocusedInput").mockReturnValue(null as any);
        renderTracker();

        showKeyboard();

        expect(animatedKeyboardState.get().target).toBeTruthy();
    });

    it("scrolls the focused input above the keyboard, measured from where the scrollable sits", () => {
        // A sheet too tall to fit above the keyboard is not moved any further; its content
        // area is shrunk instead, which leaves the input behind the keyboard until the
        // content is scrolled. The offset the scroll is asked for is relative to the scroll
        // content, while the keyboard is compared against the screen, so the scrollable's
        // own distance from the top of the screen has to be added to the gap.
        const focusedInput = focusInput();
        renderTracker();

        finishShowingKeyboard();

        // The last argument keeps the content from being pulled down when the input is
        // already above the keyboard.
        expect(scrollToKeyboard).toHaveBeenCalledWith(focusedInput, SCROLLABLE_SCREEN_Y + 16, true);
    });

    it("scrolls again once the sheet has settled, as the first scroll is bound by the content area it is still resizing", () => {
        focusInput();
        renderTracker();

        finishShowingKeyboard();
        expect(scrollToKeyboard).toHaveBeenCalledTimes(1);

        jest.runOnlyPendingTimers();

        expect(scrollToKeyboard).toHaveBeenCalledTimes(2);
    });

    it("does not scroll when no input is focused", () => {
        jest.spyOn(TextInput.State, "currentlyFocusedInput").mockReturnValue(null as any);
        renderTracker();

        finishShowingKeyboard();
        jest.runOnlyPendingTimers();

        expect(scrollToKeyboard).not.toHaveBeenCalled();
    });

    it("does not scroll when the sheet has no scrollable mounted", () => {
        focusInput();
        scrollableRef = { current: null };
        renderTracker();

        expect(() => {
            finishShowingKeyboard();
            jest.runOnlyPendingTimers();
        }).not.toThrow();
    });

    it("does not correct the scroll position after unmount", () => {
        focusInput();
        const { unmount } = renderTracker();

        finishShowingKeyboard();
        unmount();
        jest.runOnlyPendingTimers();

        expect(scrollToKeyboard).toHaveBeenCalledTimes(1);
    });

    describe("when the sheet shares the screen with the page", () => {
        it("claims the keyboard of an input inside the sheet, and scrolls it into view", () => {
            const focusedInput = focusInput();
            renderTracker({ isModal: false });

            finishShowingKeyboard();

            expect(animatedKeyboardState.get().target).toBeTruthy();
            expect(scrollToKeyboard).toHaveBeenCalledWith(focusedInput, SCROLLABLE_SCREEN_Y + 16, true);
        });

        it("leaves the sheet where it is for an input elsewhere on the page", () => {
            focusInput({ insideSheet: false });
            renderTracker({ isModal: false });

            finishShowingKeyboard();
            jest.runOnlyPendingTimers();

            expect(animatedKeyboardState.get().target).toBeUndefined();
            expect(scrollToKeyboard).not.toHaveBeenCalled();
        });

        it("does not claim the keyboard before it is up, as the focused input is not recorded yet", () => {
            renderTracker({ isModal: false });

            expect(Keyboard.addListener).not.toHaveBeenCalledWith("keyboardWillShow", expect.anything());
        });

        it("releases its claim when the keyboard hides, so a later page input leaves the sheet alone", () => {
            focusInput();
            renderTracker({ isModal: false });

            finishShowingKeyboard();
            finishHidingKeyboard();

            expect(animatedKeyboardState.get().target).toBeUndefined();
        });

        it("unsubscribes on unmount", () => {
            const { unmount } = renderTracker({ isModal: false });

            unmount();

            expect(removeListener).toHaveBeenCalledTimes(2);
        });
    });

    describe("dismissSheetKeyboard", () => {
        beforeEach(() => {
            jest.spyOn(Keyboard, "dismiss").mockImplementation(() => undefined);
        });

        it("dismisses the keyboard of an input inside the sheet", () => {
            jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
            focusInput();

            dismissSheetKeyboard(scrollableRef);

            expect(Keyboard.dismiss).toHaveBeenCalled();
        });

        it("leaves the keyboard of an input elsewhere on the page up", () => {
            jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
            focusInput({ insideSheet: false });

            dismissSheetKeyboard(scrollableRef);

            expect(Keyboard.dismiss).not.toHaveBeenCalled();
        });

        it("does nothing when no keyboard is open", () => {
            jest.spyOn(Keyboard, "isVisible").mockReturnValue(false);
            focusInput();

            dismissSheetKeyboard(scrollableRef);

            expect(Keyboard.dismiss).not.toHaveBeenCalled();
        });
    });

    it("does not subscribe on Android, where the OS already moves the input into view", () => {
        setPlatform("android");

        renderTracker();

        expect(Keyboard.addListener).not.toHaveBeenCalled();
    });

    it("unsubscribes on unmount", () => {
        const { unmount } = renderTracker();

        unmount();

        expect(removeListener).toHaveBeenCalledTimes(2);
    });
});
