import { render } from "@testing-library/react-native";
import { EmitterSubscription, Keyboard, Platform, TextInput } from "react-native";
import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
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
    let removeListener: jest.Mock;
    let platformOsDescriptor: PropertyDescriptor | undefined;

    const setPlatform = (os: string): void => {
        Object.defineProperty(Platform, "OS", { configurable: true, value: os });
    };

    beforeEach(() => {
        platformOsDescriptor = Object.getOwnPropertyDescriptor(Platform, "OS");
        animatedKeyboardState = createKeyboardState();
        (useBottomSheetInternal as jest.Mock).mockReturnValue({ animatedKeyboardState });

        removeListener = jest.fn();
        showKeyboard = () => {
            throw new Error("keyboardWillShow was never subscribed to");
        };
        jest.spyOn(Keyboard, "addListener").mockImplementation((eventName, handler) => {
            if (eventName === "keyboardWillShow") {
                showKeyboard = () => handler({} as any);
            }
            return { remove: removeListener } as unknown as EmitterSubscription;
        });
        setPlatform("ios");
    });

    afterEach(() => {
        jest.restoreAllMocks();
        if (platformOsDescriptor) {
            Object.defineProperty(Platform, "OS", platformOsDescriptor);
        }
    });

    it("reports a target to the sheet when the keyboard opens on iOS", () => {
        render(<SheetKeyboardTracker />);

        expect(animatedKeyboardState.get().target).toBeUndefined();

        showKeyboard();

        // Without a target the sheet discards the keyboard event and never moves.
        expect(animatedKeyboardState.get().target).toBeTruthy();
    });

    it("preserves the rest of the keyboard state", () => {
        animatedKeyboardState.set({ height: 336 });
        render(<SheetKeyboardTracker />);

        showKeyboard();

        expect(animatedKeyboardState.get().height).toBe(336);
    });

    it("reports a new target on every open, so a cached event is always replayed", () => {
        render(<SheetKeyboardTracker />);

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
        render(<SheetKeyboardTracker />);

        showKeyboard();

        expect(animatedKeyboardState.get().target).toBeTruthy();
    });

    it("does not subscribe on Android, where the OS already moves the input into view", () => {
        setPlatform("android");

        render(<SheetKeyboardTracker />);

        expect(Keyboard.addListener).not.toHaveBeenCalled();
    });

    it("unsubscribes on unmount", () => {
        const { unmount } = render(<SheetKeyboardTracker />);

        unmount();

        expect(removeListener).toHaveBeenCalled();
    });
});
