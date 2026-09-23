import { RefObject } from "react";
import { render } from "@testing-library/react-native";
import { EmitterSubscription, Keyboard, Platform, TextInput } from "react-native";
import { BottomSheetScrollViewMethods, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { SheetKeyboardTracker } from "../components/SheetKeyboardTracker";

jest.mock("@gorhom/bottom-sheet", () => ({
    useBottomSheetInternal: jest.fn()
}));

interface KeyboardState {
    target?: number;
    height: number;
}

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
    let scrollToKeyboard: jest.Mock;
    let scrollableRef: RefObject<BottomSheetScrollViewMethods | null>;
    let removeListener: jest.Mock;
    let platformOsDescriptor: PropertyDescriptor | undefined;

    const setPlatform = (os: string): void => {
        Object.defineProperty(Platform, "OS", { configurable: true, value: os });
    };

    const renderTracker = (): ReturnType<typeof render> =>
        render(<SheetKeyboardTracker scrollableRef={scrollableRef} />);

    const focusInput = (): unknown => {
        const focusedInput = { id: "focused input" };
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
                getScrollResponder: () => ({ scrollResponderScrollNativeHandleToKeyboard: scrollToKeyboard })
            } as unknown as BottomSheetScrollViewMethods
        };

        removeListener = jest.fn();
        const notSubscribed = (eventName: string) => () => {
            throw new Error(`${eventName} was never subscribed to`);
        };
        showKeyboard = notSubscribed("keyboardWillShow");
        finishShowingKeyboard = notSubscribed("keyboardDidShow");
        jest.spyOn(Keyboard, "addListener").mockImplementation((eventName, handler) => {
            if (eventName === "keyboardWillShow") {
                showKeyboard = () => handler({} as any);
            }
            if (eventName === "keyboardDidShow") {
                finishShowingKeyboard = () => handler({} as any);
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

        // Without a target the sheet discards the keyboard event and never moves.
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

    it("reports a target even before React Native has recorded the focused input", () => {
        // On iOS keyboardWillShow is delivered before TextInput's onFocus, which is what
        // fills this ref. Gating on it made the very first focus a no-op, so the sheet
        // only moved once a later keyboard event -- e.g. after backgrounding the app --
        // found the ref populated. Typed as non-nullable by RN, but null at runtime.
        jest.spyOn(TextInput.State, "currentlyFocusedInput").mockReturnValue(null as any);
        renderTracker();

        showKeyboard();

        expect(animatedKeyboardState.get().target).toBeTruthy();
    });

    it("scrolls the focused input above the keyboard", () => {
        // A sheet too tall to fit above the keyboard is not moved any further; its content
        // area is shrunk instead, which leaves the input behind the keyboard until the
        // content is scrolled.
        const focusedInput = focusInput();
        renderTracker();

        finishShowingKeyboard();

        // The last argument keeps the content from being pulled down when the input is
        // already above the keyboard.
        expect(scrollToKeyboard).toHaveBeenCalledWith(focusedInput, 16, true);
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
