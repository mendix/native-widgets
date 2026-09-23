import { RefObject, useEffect, useRef } from "react";
import { Keyboard, Platform, TextInput } from "react-native";
import { BottomSheetScrollViewMethods, useBottomSheetInternal } from "@gorhom/bottom-sheet";

/** Breathing room left between the focused input and the top of the keyboard. */
const INPUT_KEYBOARD_GAP = 16;

/**
 * Time given to the sheet to settle before the scroll position is corrected. The sheet
 * resizes its content area with a spring that is still running when `keyboardDidShow`
 * arrives, and a scroll offset is clamped to the content area as it is *at the time of
 * the call*, so the first scroll can land short on a tall sheet.
 */
const SHEET_SETTLE_DELAY = 300;

interface SheetKeyboardTrackerProps {
    /** The sheet's scrollable, so the focused input can be scrolled above the keyboard. */
    scrollableRef: RefObject<BottomSheetScrollViewMethods | null>;
}

/**
 * Scrolls the focused input above the keyboard.
 *
 * Once the sheet is tall enough that the keyboard would cover it, the library stops
 * lifting the sheet: it pins the sheet to the top of the container and shrinks the
 * content area to the space above the keyboard instead. The scroll offset is left
 * untouched, so an input further down the content stays behind the keyboard -- neither
 * the library nor React Native scrolls it into view on its own.
 *
 * `scrollResponderScrollNativeHandleToKeyboard` measures the input against the scroll
 * content and scrolls it just above the keyboard. It assumes the scrollable starts at the
 * top of the screen, which holds here: the library shrinks the content area exactly when
 * it has also pinned the sheet to the top, as both follow from the sheet not fitting
 * above the keyboard. When it does not shrink, the content fits the sheet and there is
 * nothing to scroll.
 */
const scrollFocusedInputIntoView = (scrollable: BottomSheetScrollViewMethods | null): void => {
    const focusedInput = TextInput.State.currentlyFocusedInput();

    if (!scrollable || !focusedInput) {
        return;
    }

    scrollable
        .getScrollResponder()
        ?.scrollResponderScrollNativeHandleToKeyboard(focusedInput, INPUT_KEYBOARD_GAP, true);
};

/**
 * Teaches the sheet that a plain React Native TextInput is focused, and keeps that input
 * visible while the keyboard is open.
 *
 * @gorhom/bottom-sheet only avoids the keyboard while one of its own
 * BottomSheetTextInput components is focused: useAnimatedKeyboard discards every
 * "keyboard shown" event while `target` is unset, and BottomSheetTextInput is the only
 * component that ever sets it. Mendix Text Box renders a plain TextInput, so the sheet
 * never learns an input is focused and keyboardBehavior has nothing to act on.
 *
 * Reporting a target here closes that gap. The sheet caches the swallowed event and
 * replays it as soon as `target` is set, so this works no matter whether our listener
 * runs before or after the library's own.
 *
 * Renders nothing and must be placed inside a BottomSheet, as it reads the sheet's
 * internal context.
 *
 * iOS only: on Android the OS already moves the focused input into view via
 * windowSoftInputMode, so shifting the sheet from JS as well would offset it twice.
 */
export const SheetKeyboardTracker = ({ scrollableRef }: SheetKeyboardTrackerProps): null => {
    const { animatedKeyboardState } = useBottomSheetInternal();
    const targetRef = useRef(0);

    useEffect(() => {
        if (Platform.OS !== "ios") {
            return;
        }

        let settleTimeout: ReturnType<typeof setTimeout> | undefined;

        const willShowSubscription = Keyboard.addListener("keyboardWillShow", () => {
            // Deliberately unconditional: iOS only raises the keyboard for a first
            // responder, and the sheet fills a modal, so the focused input is ours.
            //
            // In particular we cannot consult TextInput.State.currentlyFocusedInput()
            // here. React Native fills that ref in TextInput's onFocus handler, which on
            // iOS is delivered *after* keyboardWillShow -- the very race the sheet caches
            // events for. Gating on it made the first focus a no-op, so the sheet only
            // started moving once a later keyboard event found the ref populated.
            //
            // The sheet treats `target` as an opaque marker: it only checks that one is
            // set, and replays a swallowed event whenever the value changes. Using a
            // fresh value on every open therefore covers both listener orderings, and
            // avoids node handles, which no longer resolve from the new architecture's
            // host instances.
            targetRef.current += 1;
            animatedKeyboardState.set(state => ({ ...state, target: targetRef.current }));
        });

        // Scrolled on "did show", because that is when React Native has recorded the
        // focused input. Switching between inputs while the keyboard stays up does not
        // raise this event, but such an input was tapped, so it is already in view.
        const didShowSubscription = Keyboard.addListener("keyboardDidShow", () => {
            scrollFocusedInputIntoView(scrollableRef.current);

            clearTimeout(settleTimeout);
            settleTimeout = setTimeout(() => scrollFocusedInputIntoView(scrollableRef.current), SHEET_SETTLE_DELAY);
        });

        return () => {
            clearTimeout(settleTimeout);
            willShowSubscription.remove();
            didShowSubscription.remove();
        };
    }, [animatedKeyboardState, scrollableRef]);

    return null;
};
