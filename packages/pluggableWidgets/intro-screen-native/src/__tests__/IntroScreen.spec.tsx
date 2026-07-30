import { render, act, fireEvent, RenderAPI } from "@testing-library/react-native";
import { IntroScreen } from "../IntroScreen";
import { IntroScreenProps } from "../../typings/IntroScreenProps";
import { IntroScreenStyle } from "../ui/Styles";
import { View } from "react-native";
import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";

jest.mock("react-native-device-info", () => ({
    hasNotch: jest.fn(),
    getDeviceId: jest.fn().mockReturnValue("")
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null)
}));

// The list only mounts after a layout pass, and the test renderer never lays out.
const layout = (component: RenderAPI, name: string): void => {
    fireEvent(component.getByTestId(name), "layout", {
        nativeEvent: { layout: { width: 400, height: 800 } }
    });
};

describe("Intro Screen", () => {
    let defaultProps: IntroScreenProps<IntroScreenStyle>;

    beforeEach(() => {
        defaultProps = {
            name: "intro-screen-test",
            slides: [
                {
                    name: "Page 1",
                    content: <View />
                }
            ],
            buttonPattern: "all",
            showMode: "fullscreen",
            slideIndicators: "between",
            style: [],
            hideIndicatorLastSlide: false,
            identifier: ""
        };

        jest.mock("react-native-device-info", () => ({
            hasNotch: jest.fn(),
            getDeviceId: jest.fn().mockReturnValue("iPhone")
        }));
    });

    it("renders", () => {
        const component = render(<IntroScreen {...defaultProps} />);
        layout(component, "intro-screen-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with 1 bottom button", () => {
        const component = render(
            <IntroScreen {...defaultProps} slideIndicators={"above"} buttonPattern={"nextDone"} />
        );
        layout(component, "intro-screen-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with 2 bottom button", () => {
        const component = render(<IntroScreen {...defaultProps} slideIndicators={"above"} buttonPattern={"all"} />);
        layout(component, "intro-screen-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with active slide attribute", () => {
        const component = render(
            <IntroScreen
                {...defaultProps}
                activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(1)).build()}
            />
        );
        layout(component, "intro-screen-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with async storage identifier", async () => {
        const component = render(<IntroScreen {...defaultProps} identifier="test1" />);
        // Wait for async storage to resolve
        await act(async () => {});
        layout(component, "intro-screen-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    describe("active slide attribute", () => {
        const threeSlides = [
            { name: "Page 1", content: <View /> },
            { name: "Page 2", content: <View /> },
            { name: "Page 3", content: <View /> }
        ];

        // Which slide is showing is reported by the list, not worked out from scroll offsets, so a
        // swipe arrives here as a viewability report naming the index that settled on screen.
        // Reports are only acted on once a touch has driven the list, so a swipe is a drag followed
        // by the report — see "ignores the list's own opening scroll".
        const reportViewable = (component: RenderAPI, index: number): void => {
            const list = component.getByTestId("intro-screen-test");
            fireEvent(list, "scrollBeginDrag");
            fireEvent(list, "viewableItemsChanged", {
                viewableItems: [{ index, isViewable: true }],
                changed: [{ index, isViewable: true }]
            });
        };

        it("reports the slide the list says is showing", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(1)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            reportViewable(component, 1);

            // Indices are zero-based, the attribute is one-based.
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(2));
        });

        it("reports a swipe made from the slide the attribute already named", () => {
            // The regression this guards, seen on an emulator: the widget used to keep its own
            // "still initializing" latch and clear it only when the attribute disagreed with the
            // slide it had opened on. Starting in agreement meant the latch was never cleared, so
            // the first real swipe was swallowed — and worse, the sync effect then scrolled the list
            // back, so the slide the user had swiped to silently reverted. Viewability reporting has
            // no such latch of its own: flash-list withholds reports until the first interaction and
            // then reports every settled slide.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(1)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            reportViewable(component, 1);

            expect(activeSlideAttribute.setValue).toHaveBeenCalledTimes(1);
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(2));
            // The buttons follow the slide too: on the middle slide the pagination offers Previous,
            // which the first slide it opened on does not.
            expect(component.queryByTestId("intro-screen-test$buttonPrevious")).not.toBeNull();
        });

        it("does not report the slide that is already active", () => {
            // Viewability is recomputed on every scroll event, so the slide currently showing is
            // reported repeatedly while a gesture is in progress. Only arriving somewhere new counts.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            reportViewable(component, 1);
            reportViewable(component, 1);

            expect(activeSlideAttribute.setValue).not.toHaveBeenCalled();
        });

        it("ignores the list's own opening scroll", () => {
            // The regression this guards, seen on a CI emulator on both first mount and re-entry:
            // the list opens by scrolling to initialScrollIndex, and while it is still on its way it
            // reports the slides it passes. Slide 1 was therefore announced as an arrival and
            // written to the attribute, so a widget asked to open on slide 2 came up on slide 1 with
            // one slide change already counted.
            //
            // flash-list's own waitForInteraction does not prevent this: it computes viewability
            // from its commit effect without consulting that flag at all. It is also unusable in
            // the other direction — its interaction flag is gated on a 100ms timer, so a swipe made
            // before that timer fires is dropped entirely. Only a touch distinguishes a scroll the
            // user asked for, so no drag means no report — see "reports a swipe that begins before
            // the list has finished opening".
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            // No scrollBeginDrag: this is the list moving itself, not the user moving it.
            fireEvent(component.getByTestId("intro-screen-test"), "viewableItemsChanged", {
                viewableItems: [{ index: 0, isViewable: true }],
                changed: [{ index: 0, isViewable: true }]
            });

            expect(activeSlideAttribute.setValue).not.toHaveBeenCalled();
            // Still on the slide it was asked to open on, so the pagination offers Previous.
            expect(component.queryByTestId("intro-screen-test$buttonPrevious")).not.toBeNull();
        });

        it("reports a swipe that begins before the list has finished opening", () => {
            // The regression this guards, seen on a CI emulator and reproducible there: swiping
            // within the first moments of mount moved the list to the next slide, but nothing else
            // followed — the buttons, the dots and the attribute all stayed on the slide the widget
            // opened on, and the flow timed out waiting for the new one.
            //
            // The cause was viewabilityConfig.waitForInteraction. flash-list gates every report on
            // its own hasInteracted, which it records from onScroll and only once
            // isInitialScrollComplete — a flag flipped by a 100ms timer started after first layout.
            // A drag that lands before that timer fires records no interaction, and nothing
            // re-records it afterwards, so the entire swipe is reported to nobody. The gate here
            // must therefore be ours alone: the touch says the user is scrolling, whatever
            // flash-list's timer has or has not done.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.viewabilityConfig.waitForInteraction).toBe(
                undefined
            );

            reportViewable(component, 2);

            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(3));
        });

        it("ignores a viewability report that names no item", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(1)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            fireEvent(component.getByTestId("intro-screen-test"), "viewableItemsChanged", {
                viewableItems: [],
                changed: []
            });

            expect(activeSlideAttribute.setValue).not.toHaveBeenCalled();
        });

        it("stays on the new slide while the attribute write is still in flight", () => {
            // The regression this guards: setValue round-trips through the runtime, so for a
            // render or two the attribute still reports the slide we just left. Syncing from it
            // then scrolled straight back and counted the return as another change.
            // The builder's setValue applies the value straight away, so stub it out: the point
            // here is the window in which the runtime has not applied it yet.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            (activeSlideAttribute.setValue as jest.Mock).mockImplementation(() => undefined);
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            fireEvent.press(component.getByTestId("intro-screen-test$buttonNext"));
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(3));

            // The stale value arrives on the next render, before the runtime commits the write.
            component.update(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );

            // Still on the last slide, so its Done button is what the pagination offers.
            expect(component.queryByTestId("intro-screen-test$buttonDone")).not.toBeNull();
            expect(component.queryByTestId("intro-screen-test$buttonNext")).toBeNull();
            expect(activeSlideAttribute.setValue).toHaveBeenCalledTimes(1);
        });

        it("mounts the slides only once a width has been measured", () => {
            // Rendering the list before onLayout lays every slide out at width 0, which stacks
            // them all on the first page and makes the initial scroll offset meaningless.
            const component = render(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(3)).build()}
                />
            );

            // Before the layout pass only the measuring placeholder is present, so the list has
            // not been given a chance to cache zero-width cell layouts.
            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBeUndefined();

            layout(component, "intro-screen-test");

            // The first painted frame already targets the attribute's slide, so the list and the
            // pagination agree instead of showing slide 1 and then correcting.
            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(2);
        });

        it("does not re-point the mounted list at the slide navigated to", () => {
            // The regression this guards: the list keeps re-applying initialScrollIndex from
            // current props for a short window after it mounts. Passing the live active index
            // there let that re-apply race our own scrollToOffset, and the list settled back on
            // slide 1 while the pagination already showed the last slide's Done button.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);

            fireEvent.press(component.getByTestId("intro-screen-test$buttonNext"));

            // Navigation moves the list with scrollToOffset, so the slide it opened on must not
            // follow along: re-applying it would fight that scroll.
            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);
        });

        it("does not let the list hold the previous slide in place", () => {
            // The regression this guards: flash-list keeps maintainVisibleContentPosition on by
            // default, which anchors the list to the first visible item and scrolls back by however
            // far a re-render moved it. Navigating re-renders the slides, so that correction undid
            // the scrollToOffset in goToSlide — buttons and dots advanced while the slide on screen
            // did not. Only a snapshot covered this prop, and a snapshot update would bury it.
            const component = render(<IntroScreen {...defaultProps} slides={threeSlides} />);
            layout(component, "intro-screen-test");

            // The list passes this through to its ScrollView, and `disabled` becomes no prop at all.
            // Left on, it would arrive here as { minIndexForVisible: 0 } instead.
            expect(component.getByTestId("intro-screen-test").props.maintainVisibleContentPosition).toBeUndefined();
        });

        it("holds the slides back until the attribute has a value to open on", () => {
            // The regression this guards, reproduced on a CPU-throttled emulator: the attribute
            // arrives Loading with no value and the real one lands a render or two later. Mounting the
            // list against the value it could answer then means opening on slide 1 — and flash-list
            // applies initialScrollIndex at most once, from a commit effect behind a 100ms timer, with
            // no retry — so the content stayed on slide 1 for good while the dots and buttons followed
            // the value that arrived moments later. The two disagreed permanently, and the first swipe
            // was spent dragging the content into line instead of changing slide.
            const activeSlideAttribute = new EditableValueBuilder<Big>().isLoading().build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            // Only the measuring placeholder so far, so the list has not been given a slide to open on.
            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBeUndefined();

            component.update(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(3)).build()}
                />
            );

            // The first frame the list ever draws already targets the slide the attribute named.
            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(2);
        });

        it("keeps the slides up while a value it already has is refreshing", () => {
            // Loading is not on its own a reason to wait: a refresh can arrive with the previous value
            // still attached, and there is no need to take the slides down over a value we already have.
            const refreshing = new EditableValueBuilder<Big>().withValue(new Big(2)).isLoading().build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={refreshing} />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);
        });

        it("keeps the slides up while the attribute reloads with no value after a swipe", () => {
            // The regression this guards, reproduced on a CPU-throttled emulator: writing to the
            // attribute sends it back to Loading with no value at all while the runtime applies the
            // write — the same state a fresh page starts in. Waiting there took the list down and
            // remounted it on initialScrollIndex, so every slide swiped to sprang back to the one the
            // widget opened on, and the return was counted as a second slide change. The wait is for
            // the opening value only, so it has to end once the list is up.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            reportViewable(component, 2);
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(3));

            // The write round-trip, as this host reports it: loading, value gone.
            component.update(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().isLoading().build()}
                />
            );

            // Still the same mounted list, still on the slide swiped to — an unmount would take
            // initialScrollIndex back to the slide it opened on and lose the swipe.
            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);
            expect(component.queryByTestId("intro-screen-test$buttonDone")).not.toBeNull();
            expect(activeSlideAttribute.setValue).toHaveBeenCalledTimes(1);
        });

        it("opens on the first slide when the attribute has no value to give", () => {
            // Unavailable is not the same wait as Loading: nothing is on its way, so holding the
            // slides back would leave the widget blank for good rather than for a render.
            const component = render(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().isUnavailable().build()}
                />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(0);
        });
    });
});
