import { RefObject, useEffect, useRef } from "react";
import { EmitterSubscription, HostInstance, Keyboard, Platform, TextInput } from "react-native";
import {
    BottomSheetProps as GorhomBottomSheetProps,
    BottomSheetScrollViewMethods,
    useBottomSheetInternal
} from "@gorhom/bottom-sheet";

/** Breathing room left between the focused input and the top of the keyboard. */
const INPUT_KEYBOARD_GAP = 16;

/**
 * Time given to the sheet to settle before the scroll position is corrected. The sheet
 * resizes its content area with a spring that is still running when `keyboardDidShow`
 * arrives, and a scroll offset is clamped to the content area as it is *at the time of
 * the call*, so the first scroll can land short on a tall sheet.
 */
const SHEET_SETTLE_DELAY = 300;

/**
 * Move the sheet above the keyboard, and back down once it is dismissed. A sheet too tall
 * to fit above the keyboard is pinned to the top of its container instead, with its content
 * area shrunk to the space that is left; SheetKeyboardTracker then scrolls the focused
 * input into that area. Applied on iOS only, because Android already moves the focused
 * input into view through windowSoftInputMode, so shifting the sheet from JS as well would
 * offset it twice. See SheetKeyboardTracker for why the tracker is needed to make these
 * take effect at all.
 */
export const sheetKeyboardProps: Pick<GorhomBottomSheetProps, "keyboardBehavior" | "keyboardBlurBehavior"> =
    Platform.OS === "ios" ? { keyboardBehavior: "interactive", keyboardBlurBehavior: "restore" } : {};

/**
 * The sheet's scrollable doubles as the host instance of the ScrollView underneath it:
 * React Native hangs the imperative scroll methods onto the native instance itself, and
 * both Reanimated and the sheet library hand that instance straight to the ref. The
 * library's typing only advertises the scroll methods, so widen it to measure the
 * scrollable, and to measure the focused input against it.
 */
type SheetScrollable = BottomSheetScrollViewMethods & HostInstance;

interface SheetKeyboardTrackerProps {
    /** The sheet's scrollable, so the focused input can be scrolled above the keyboard. */
    scrollableRef: RefObject<BottomSheetScrollViewMethods | null>;
    /**
     * Whether the sheet fills a modal. Every keyboard then belongs to the sheet, which lets
     * it rise together with the keyboard. A sheet that shares the screen with the page has
     * to wait until the focused input has been placed inside it instead.
     */
    isModal: boolean;
}

/**
 * Scrolls the focused input above the keyboard.
 *
 * Once the sheet is tall enough that the keyboard would cover it, the library stops
 * lifting the sheet: it pins the sheet to the top of the container and shrinks the
 * content area to the space above the keyboard instead. The scroll offset is left
 * untouched, so an input further down the content stays behind the keyboard -- neither
 * the library nor React Native scrolls it into view on its own.
 */
const scrollFocusedInputIntoView = (scrollable: SheetScrollable | null): void => {
    const focusedInput = TextInput.State.currentlyFocusedInput();

    if (!scrollable || !focusedInput) {
        return;
    }

    // `scrollResponderScrollNativeHandleToKeyboard` measures the input against the scroll
    // content, and then compares that content offset to the keyboard's position on screen
    // as if the two shared an origin -- which only holds for a scrollable that starts at
    // the very top of the screen. Handing it the scrollable's own distance from the top as
    // the additional offset makes the target position exact wherever the sheet sits.
    scrollable.measureInWindow?.((_x, scrollableScreenY) => {
        // The last argument keeps the content from being pulled down when the input is
        // already above the keyboard.
        scrollable
            .getScrollResponder()
            ?.scrollResponderScrollNativeHandleToKeyboard(focusedInput, scrollableScreenY + INPUT_KEYBOARD_GAP, true);
    });
};

/**
 * Runs `handleOwnInput` when the focused input sits inside the sheet's scrollable.
 *
 * `measureLayout` reports a failure when the two views are not part of the same hierarchy,
 * which makes it a containment test. A sheet that does not fill a modal shares the screen
 * with the page, and a keyboard raised by an input elsewhere on the page has to leave the
 * sheet where it is: moving it would only cover more of the page, including the input
 * being typed into. An input outside the scrollable -- an expanding drawer renders its
 * small content as a sticky header -- counts as not ours, as there is nothing to scroll.
 */
const whenFocusedInputIsInSheet = (scrollable: SheetScrollable | null, handleOwnInput: () => void): void => {
    const focusedInput = TextInput.State.currentlyFocusedInput();

    if (!scrollable || !focusedInput) {
        return;
    }

    focusedInput.measureLayout(scrollable, handleOwnInput, () => undefined);
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
 * runs before or after the library's own, and no matter how late the target arrives.
 *
 * Renders nothing and must be placed inside a BottomSheet, as it reads the sheet's
 * internal context.
 *
 * iOS only, for the reason given on `sheetKeyboardProps`.
 */
export const SheetKeyboardTracker = ({ scrollableRef, isModal }: SheetKeyboardTrackerProps): null => {
    const { animatedKeyboardState } = useBottomSheetInternal();
    const targetRef = useRef(0);

    useEffect(() => {
        if (Platform.OS !== "ios") {
            return;
        }

        let settleTimeout: ReturnType<typeof setTimeout> | undefined;
        const getScrollable = (): SheetScrollable | null => scrollableRef.current as SheetScrollable | null;

        const claimKeyboard = (): void => {
            // The sheet treats `target` as an opaque marker: it only checks that one is
            // set, and replays a swallowed event whenever the value changes. Using a fresh
            // value on every open therefore covers both listener orderings, and avoids node
            // handles, which no longer resolve from the new architecture's host instances.
            targetRef.current += 1;
            animatedKeyboardState.set(state => ({ ...state, target: targetRef.current }));
        };

        const keepFocusedInputVisible = (): void => {
            scrollFocusedInputIntoView(getScrollable());

            clearTimeout(settleTimeout);
            settleTimeout = setTimeout(() => scrollFocusedInputIntoView(getScrollable()), SHEET_SETTLE_DELAY);
        };

        const subscriptions: EmitterSubscription[] = [];

        if (isModal) {
            // Claimed on "will show", so the sheet rises together with the keyboard.
            //
            // Deliberately unconditional: iOS only raises the keyboard for a first
            // responder, and the sheet fills a modal, so the focused input is ours.
            //
            // In particular we cannot consult TextInput.State.currentlyFocusedInput() here.
            // React Native fills that ref in TextInput's onFocus handler, which on iOS is
            // delivered *after* keyboardWillShow -- the very race the sheet caches events
            // for. Gating on it made the first focus a no-op, so the sheet only moved once
            // a later keyboard event -- e.g. after backgrounding the app -- found the ref
            // populated.
            subscriptions.push(Keyboard.addListener("keyboardWillShow", claimKeyboard));
        } else {
            // A claim covers a single keyboard, so that focusing an input inside the sheet
            // does not hand it every keyboard that follows.
            subscriptions.push(
                Keyboard.addListener("keyboardDidHide", () =>
                    animatedKeyboardState.set(state => ({ ...state, target: undefined }))
                )
            );
        }

        // Handled on "did show", because that is when React Native has recorded the focused
        // input: a sheet sharing the screen with the page needs it to tell whether the
        // keyboard is its own, and the scroll correction needs it to measure. Switching
        // between inputs while the keyboard stays up does not raise this event, but such an
        // input was tapped, so it is already in view.
        subscriptions.push(
            Keyboard.addListener("keyboardDidShow", () => {
                if (isModal) {
                    keepFocusedInputVisible();
                    return;
                }

                whenFocusedInputIsInSheet(getScrollable(), () => {
                    claimKeyboard();
                    keepFocusedInputVisible();
                });
            })
        );

        return () => {
            clearTimeout(settleTimeout);
            subscriptions.forEach(subscription => subscription.remove());
        };
    }, [animatedKeyboardState, scrollableRef, isModal]);

    return null;
};
