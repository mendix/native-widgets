import { render, act, fireEvent, RenderAPI } from "@testing-library/react-native";
import { IntroScreen } from "../IntroScreen";
import { IntroScreenProps } from "../../typings/IntroScreenProps";
import { IntroScreenStyle } from "../ui/Styles";
import { AccessibilityInfo, Modal, ScrollView, View } from "react-native";
import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { DynamicValue, ValueStatus } from "mendix";

jest.mock("react-native-device-info", () => ({
    hasNotch: jest.fn(),
    getDeviceId: jest.fn().mockReturnValue("")
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null)
}));

const dynamicValue = (value: string): DynamicValue<string> => ({ status: ValueStatus.Available, value });

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

    it("renders an opaque modal in fullscreen mode", () => {
        const component = render(<IntroScreen {...defaultProps} showMode="fullscreen" />);

        expect(component.UNSAFE_getByType(Modal).props.transparent).toBe(false);
    });

    it("renders a transparent modal in popup mode", () => {
        const component = render(<IntroScreen {...defaultProps} showMode="popup" />);

        expect(component.UNSAFE_getByType(Modal).props.transparent).toBe(true);
    });

    it("stays in portrait on iOS", () => {
        const component = render(<IntroScreen {...defaultProps} />);

        expect(component.UNSAFE_getByType(Modal).props.supportedOrientations).toEqual(["portrait"]);
    });

    it("keeps the intro screen open when the Android back button is pressed", () => {
        const component = render(<IntroScreen {...defaultProps} />);

        act(() => {
            component.UNSAFE_getByType(Modal).props.onRequestClose();
        });

        expect(component.UNSAFE_queryByType(Modal)).not.toBeNull();
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

            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(2));
        });

        it("reports a swipe made from the slide the attribute already named", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(1)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            reportViewable(component, 1);

            expect(activeSlideAttribute.setValue).toHaveBeenCalledTimes(1);
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(2));
            expect(component.queryByTestId("intro-screen-test$buttonPrevious")).not.toBeNull();
        });

        it("does not report the slide that is already active", () => {
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
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            fireEvent(component.getByTestId("intro-screen-test"), "viewableItemsChanged", {
                viewableItems: [{ index: 0, isViewable: true }],
                changed: [{ index: 0, isViewable: true }]
            });

            expect(activeSlideAttribute.setValue).not.toHaveBeenCalled();
            expect(component.queryByTestId("intro-screen-test$buttonPrevious")).not.toBeNull();
        });

        it("reports a swipe that begins before the list has finished opening", () => {
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
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            (activeSlideAttribute.setValue as jest.Mock).mockImplementation(() => undefined);
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            fireEvent.press(component.getByTestId("intro-screen-test$buttonNext"));
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(3));

            component.update(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );

            expect(component.queryByTestId("intro-screen-test$buttonDone")).not.toBeNull();
            expect(component.queryByTestId("intro-screen-test$buttonNext")).toBeNull();
            expect(activeSlideAttribute.setValue).toHaveBeenCalledTimes(1);
        });

        it("mounts the slides only once a width has been measured", () => {
            const component = render(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(3)).build()}
                />
            );

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBeUndefined();

            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(2);
        });

        it("does not re-point the mounted list at the slide navigated to", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);

            fireEvent.press(component.getByTestId("intro-screen-test$buttonNext"));

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);
        });

        it("does not let the list hold the previous slide in place", () => {
            const component = render(<IntroScreen {...defaultProps} slides={threeSlides} />);
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.maintainVisibleContentPosition).toBeUndefined();
        });

        it("holds the slides back until the attribute has a value to open on", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().isLoading().build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBeUndefined();

            component.update(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(3)).build()}
                />
            );

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(2);
        });

        it("keeps the slides up while a value it already has is refreshing", () => {
            const refreshing = new EditableValueBuilder<Big>().withValue(new Big(2)).isLoading().build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={refreshing} />
            );
            layout(component, "intro-screen-test");

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);
        });

        it("keeps the slides up while the attribute reloads with no value after a swipe", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            reportViewable(component, 2);
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(3));

            component.update(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={new EditableValueBuilder<Big>().isLoading().build()}
                />
            );

            expect(component.getByTestId("intro-screen-test").props.initialScrollIndex).toBe(1);
            expect(component.queryByTestId("intro-screen-test$buttonDone")).not.toBeNull();
            expect(activeSlideAttribute.setValue).toHaveBeenCalledTimes(1);
        });

        it("opens on the first slide when the attribute has no value to give", () => {
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

    describe("page indicator accessibility", () => {
        const slides = [1, 2, 3].map(n => ({ name: `Page ${n}`, content: <View /> }));
        const adjust = (component: RenderAPI, actionName: string): void => {
            fireEvent(component.getByRole("adjustable"), "accessibilityAction", {
                nativeEvent: { actionName }
            });
        };

        it("exposes the dots as one adjustable element and hides the individual dots", () => {
            const component = render(<IntroScreen {...defaultProps} slides={slides} />);
            layout(component, "intro-screen-test");

            const indicator = component.getByRole("adjustable");
            expect(indicator.props.accessibilityRole).toBe("adjustable");
            expect(indicator.props.accessibilityLabel).toBe("Slide 1 of 3");
            expect(indicator.props.accessibilityValue).toBeUndefined();
            [0, 1, 2].forEach(i => {
                const dot = component.getByTestId(`intro-screen-test$dot${i}`, { hidden: true });
                expect(dot.props.accessible).toBe(false);
                expect(dot.props.importantForAccessibility).toBe("no-hide-descendants");
                expect(dot.props.accessibilityElementsHidden).toBe(true);
            });
        });

        it("changes slide on increment and decrement and stays within range", () => {
            const component = render(<IntroScreen {...defaultProps} slides={slides} />);
            layout(component, "intro-screen-test");

            adjust(component, "decrement");
            expect(component.getByRole("adjustable").props.accessibilityLabel).toBe("Slide 1 of 3");

            adjust(component, "increment");
            expect(component.getByRole("adjustable").props.accessibilityLabel).toBe("Slide 2 of 3");

            adjust(component, "increment");
            adjust(component, "increment");
            expect(component.getByRole("adjustable").props.accessibilityLabel).toBe("Slide 3 of 3");

            adjust(component, "decrement");
            expect(component.getByRole("adjustable").props.accessibilityLabel).toBe("Slide 2 of 3");
        });

        it("speaks a configured label as-is", () => {
            const component = render(
                <IntroScreen
                    {...defaultProps}
                    slides={slides}
                    slidePositionLabel={dynamicValue("Onboarding progress")}
                />
            );
            layout(component, "intro-screen-test");

            expect(component.getByRole("adjustable").props.accessibilityLabel).toBe("Onboarding progress");
        });
    });

    describe("buttons accessibility", () => {
        const slides = [1, 2, 3].map(n => ({ name: `Page ${n}`, content: <View /> }));

        it("labels icon-only buttons with a default and prefers a configured label or caption", () => {
            const component = render(
                <IntroScreen
                    {...defaultProps}
                    slides={slides}
                    nextAccessibilityLabel={dynamicValue("Volgende slide")}
                    skipCaption={dynamicValue("Overslaan")}
                />
            );
            layout(component, "intro-screen-test");

            const next = component.getByTestId("intro-screen-test$buttonNext");
            expect(next.props.accessibilityRole).toBe("button");
            expect(next.props.accessibilityLabel).toBe("Volgende slide");
            expect(component.getByTestId("intro-screen-test$buttonSkip").props.accessibilityLabel).toBe("Overslaan");

            fireEvent.press(next);
            expect(component.getByTestId("intro-screen-test$buttonPrevious").props.accessibilityLabel).toBe("Previous");
        });
    });

    describe("screen reader announcements and reduce motion", () => {
        const slides = [1, 2, 3].map(n => ({ name: `Page ${n}`, content: <View /> }));

        afterEach(() => jest.restoreAllMocks());

        it("announces the new slide after Next and Previous, but not after using the indicator", () => {
            const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
            const component = render(<IntroScreen {...defaultProps} slides={slides} />);
            layout(component, "intro-screen-test");

            fireEvent.press(component.getByTestId("intro-screen-test$buttonNext"));
            expect(announce).toHaveBeenLastCalledWith("Slide 2 of 3");

            fireEvent.press(component.getByTestId("intro-screen-test$buttonPrevious"));
            expect(announce).toHaveBeenLastCalledWith("Slide 1 of 3");

            announce.mockClear();
            fireEvent(component.getByRole("adjustable"), "accessibilityAction", {
                nativeEvent: { actionName: "increment" }
            });
            expect(announce).not.toHaveBeenCalled();
        });

        it.each([
            [false, true],
            [true, false]
        ])("with reduce motion %s scrolls with animated %s", async (reduceMotion, animated) => {
            jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(reduceMotion);
            const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
            const component = render(<IntroScreen {...defaultProps} slides={slides} />);
            await act(async () => {});
            layout(component, "intro-screen-test");

            fireEvent.press(component.getByTestId("intro-screen-test$buttonNext"));

            expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ animated }));
        });
    });
});
