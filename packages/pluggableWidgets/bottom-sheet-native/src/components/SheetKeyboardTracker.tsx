import { useEffect, useRef } from "react";
import { Keyboard, Platform, TextInput } from "react-native";
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
 * Reporting the focused input here closes that gap. The sheet caches the swallowed
 * event and replays it as soon as `target` is set, so this works no matter whether our
 * listener runs before or after the library's own.
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
            if (!TextInput.State.currentlyFocusedInput()) {
                return;
            }

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
