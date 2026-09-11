import { useEffect, useRef } from "react";
import { Keyboard, Platform } from "react-native";
import { useBottomSheetInternal } from "@gorhom/bottom-sheet";

/**
 * Teaches the sheet that a plain React Native TextInput is focused.
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
export const SheetKeyboardTracker = (): null => {
    const { animatedKeyboardState } = useBottomSheetInternal();
    const targetRef = useRef(0);

    useEffect(() => {
        if (Platform.OS !== "ios") {
            return;
        }

        const subscription = Keyboard.addListener("keyboardWillShow", () => {
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

        return () => subscription.remove();
    }, [animatedKeyboardState]);

    return null;
};
