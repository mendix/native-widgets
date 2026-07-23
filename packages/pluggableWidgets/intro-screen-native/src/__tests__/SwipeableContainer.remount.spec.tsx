import { render, fireEvent, act } from "@testing-library/react-native";
import { View } from "react-native";
import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { EditableValue } from "mendix";
import { Big } from "big.js";
import { SwipeableContainer } from "../SwipeableContainer";
import { defaultWelcomeScreenStyle } from "../ui/Styles";

jest.mock("react-native-device-info", () => ({
    hasNotch: jest.fn(),
    getDeviceId: jest.fn().mockReturnValue("")
}));

const WIDTH = 400;

// Capture the scroll calls the widget issues, while leaving the real FlashList in place so
// layout and momentum-scroll events still behave normally.
const scrollCalls: Array<{ offset: number; animated?: boolean }> = [];

jest.mock("@shopify/flash-list", () => {
    const actual = jest.requireActual("@shopify/flash-list");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const react = require("react");
    const Wrapped = react.forwardRef((props: any, ref: any) => {
        const inner = react.useRef(null);
        react.useImperativeHandle(ref, () => ({
            scrollToOffset: (params: any) => {
                (globalThis as any).__introScreenScrollCalls.push(params);
                (inner.current as any)?.scrollToOffset?.(params);
            }
        }));
        return react.createElement(actual.FlashList, { ...props, ref: inner });
    });
    return { ...actual, FlashList: Wrapped };
});

(globalThis as any).__introScreenScrollCalls = scrollCalls;

type Setup = ReturnType<typeof render> & {
    activeSlide: EditableValue<Big>;
    onSlideChange: jest.Mock;
    scrollCalls: Array<{ offset: number; animated?: boolean }>;
};

function setup(activeSlideValue: number): Setup {
    const activeSlide = new EditableValueBuilder<Big>().withValue(new Big(activeSlideValue)).build();
    const onSlideChange = jest.fn();
    const slides = [1, 2, 3].map(i => ({ name: `Page ${i}`, content: <View /> }));

    scrollCalls.length = 0;

    const utils = render(
        <SwipeableContainer
            testID="intro"
            slides={slides as any}
            onDone={jest.fn()}
            onSkip={jest.fn()}
            onSlideChange={onSlideChange}
            bottomButton={false}
            numberOfButtons={2}
            showSkipButton
            showNextButton
            showPreviousButton
            showDoneButton
            hidePagination={false}
            hideIndicatorLastSlide={false}
            styles={defaultWelcomeScreenStyle}
            activeSlide={activeSlide}
        />
    );

    // Simulate layout so `width` becomes known, exactly as on a real device.
    act(() => {
        fireEvent(utils.getByTestId("intro"), "layout", {
            nativeEvent: { layout: { width: WIDTH, height: 800 } }
        });
    });

    return { ...utils, activeSlide, onSlideChange, scrollCalls };
}

describe("SwipeableContainer remount behaviour", () => {
    it("positions the initial slide without animation", () => {
        const { scrollCalls } = setup(2);

        expect(scrollCalls.length).toBeGreaterThan(0);
        expect(scrollCalls[0]).toEqual({ offset: WIDTH, animated: false });
    });

    it("writes the next slide when Next is pressed after remounting on slide 2", () => {
        const { getByTestId, activeSlide } = setup(2);

        fireEvent.press(getByTestId("intro$buttonNext"));

        expect(activeSlide.setValue).toHaveBeenCalledWith(new Big(3));
    });

    it("does not report a slide change for the programmatic initial scroll", () => {
        const { getByTestId, onSlideChange, activeSlide } = setup(2);

        // The forced initial scroll settles and reports its resting offset.
        act(() => {
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: WIDTH } }
            });
        });

        expect(onSlideChange).not.toHaveBeenCalled();
        expect(activeSlide.setValue).not.toHaveBeenCalled();
    });

    it("still writes the next slide when a stale scroll settles before Next is pressed", () => {
        const { getByTestId, activeSlide } = setup(2);

        act(() => {
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: WIDTH } }
            });
        });

        fireEvent.press(getByTestId("intro$buttonNext"));

        expect(activeSlide.setValue).toHaveBeenCalledWith(new Big(3));
    });

    it("keeps the slide Next moved to when a stale momentum event reports the old offset", () => {
        // Reproduces the Android e2e failure: after remounting on slide 2 the widget scrolls
        // to slide 3, then the list reports a momentum end for the offset it was leaving.
        const { getByTestId, activeSlide, onSlideChange } = setup(2);

        // A drag that settles without a momentum event of its own — the initial positioning
        // scroll produces one on device — leaves the widget believing a drag is in progress.
        act(() => {
            fireEvent(getByTestId("intro"), "scrollBeginDrag", {});
        });

        fireEvent.press(getByTestId("intro$buttonNext"));
        expect(activeSlide.setValue).toHaveBeenLastCalledWith(new Big(3));

        act(() => {
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: 0 } }
            });
        });

        // The stale offset must not drag the attribute back to slide 1 or report a change.
        expect(activeSlide.setValue).toHaveBeenLastCalledWith(new Big(3));
        expect(onSlideChange).toHaveBeenCalledTimes(1);
        expect(onSlideChange).toHaveBeenCalledWith(2, 1);

        // Slide 3 is the last slide, so the pagination still offers Done rather than
        // falling back to the first-slide buttons.
        expect(getByTestId("intro$buttonDone")).toBeTruthy();

        // Previous moves relative to the slide that is actually on screen.
        fireEvent.press(getByTestId("intro$buttonPrevious"));
        expect(activeSlide.setValue).toHaveBeenLastCalledWith(new Big(2));
    });

    it("still reports a user swipe after a programmatic scroll has settled", () => {
        const { getByTestId, activeSlide, onSlideChange } = setup(2);

        fireEvent.press(getByTestId("intro$buttonNext"));
        onSlideChange.mockClear();

        // The programmatic scroll to slide 3 lands.
        act(() => {
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: 2 * WIDTH } }
            });
        });

        // The user then swipes back to slide 2, which must be reported.
        act(() => {
            fireEvent(getByTestId("intro"), "scrollBeginDrag", {});
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: WIDTH } }
            });
        });

        expect(onSlideChange).toHaveBeenCalledWith(1, 2);
        expect(activeSlide.setValue).toHaveBeenLastCalledWith(new Big(2));
    });

    it("reports a user swipe that interrupts an in-flight programmatic scroll", () => {
        const { getByTestId, activeSlide, onSlideChange } = setup(2);

        fireEvent.press(getByTestId("intro$buttonNext"));
        onSlideChange.mockClear();

        // The user grabs the list before the scroll to slide 3 settles and swipes back to
        // slide 1. Taking over invalidates the pending target, so this must be reported.
        act(() => {
            fireEvent(getByTestId("intro"), "scrollBeginDrag", {});
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: 0 } }
            });
        });

        expect(onSlideChange).toHaveBeenCalledWith(0, 2);
        expect(activeSlide.setValue).toHaveBeenLastCalledWith(new Big(1));
    });

    it("ignores a stale programmatic scroll that reports the pre-scroll offset", () => {
        const { getByTestId, activeSlide, onSlideChange } = setup(2);

        // The list reports offset 0 — the position it held before the programmatic scroll to
        // slide 2 settled. Trusting it would desync activeIndex from what is on screen.
        act(() => {
            fireEvent(getByTestId("intro"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: 0 } }
            });
        });

        expect(onSlideChange).not.toHaveBeenCalled();

        fireEvent.press(getByTestId("intro$buttonNext"));

        expect(activeSlide.setValue).toHaveBeenCalledWith(new Big(3));
    });
});
