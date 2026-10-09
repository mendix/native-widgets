import { CarouselProps } from "../../typings/CarouselProps";
import { CarouselStyle, defaultCarouselStyle } from "../ui/styles";
import { fireEvent, render } from "@testing-library/react-native";
import { FlatList, Text, View } from "react-native";
import { buildWidgetValue, ListValueBuilder } from "@mendix/piw-utils-internal";
import { Carousel } from "../Carousel";

describe("Carousel", () => {
    let defaultProps: CarouselProps<CarouselStyle>;
    const listValueBuilder = ListValueBuilder();
    beforeEach(() => {
        defaultProps = {
            name: "carousel",
            contentSource: listValueBuilder.simple(),
            content: buildWidgetValue(
                <View>
                    <Text>MyContent</Text>
                </View>
            ),
            layout: "card",
            showPagination: true,
            activeSlideAlignment: "center",
            style: []
        };
    });

    // Carousel.tsx renders nothing but a loading indicator until it has measured its own width via onLayout, so
    // every test beyond "renders loading" needs to fire that event first, same as Gallery's tests do.
    const fireContainerLayout = (
        carousel: ReturnType<typeof render>,
        layout: { width: number; height: number }
    ): void => {
        fireEvent(carousel.getByTestId(defaultProps.name), "layout", {
            nativeEvent: { layout: { x: 0, y: 0, ...layout } }
        });
    };

    it("renders loading", () => {
        expect(render(<Carousel {...defaultProps} />).toJSON()).toMatchSnapshot();
    });

    it("renders cards with dot pagination once it has measured its width", () => {
        const carousel = render(<Carousel {...defaultProps} />);
        fireContainerLayout(carousel, { width: 300, height: 150 });

        expect(carousel.getByTestId("carousel$carousel")).toBeDefined();
        expect(carousel.getAllByRole("button")).toHaveLength(2);
        expect(carousel.getByTestId("carousel$pagination")).toBeDefined();
    });

    it("renders without pagination", () => {
        const carousel = render(<Carousel {...defaultProps} showPagination={false} />);
        fireContainerLayout(carousel, { width: 300, height: 150 });

        expect(carousel.queryByTestId("carousel$pagination")).toBeNull();
    });

    it("renders full width", () => {
        const carousel = render(<Carousel {...defaultProps} layout="fullWidth" />);
        fireContainerLayout(carousel, { width: 300, height: 150 });

        expect(carousel.toJSON()).toMatchSnapshot();
    });

    it("renders numbered pagination if item count is more than 5", () => {
        const carousel = render(<Carousel {...defaultProps} contentSource={listValueBuilder.withAmountOfItems(6)} />);
        fireContainerLayout(carousel, { width: 300, height: 150 });

        // The "N/M" text itself is hidden from screen readers (see the accessibility describe block below); the
        // count still has to be shown somewhere, so it's asserted via the pagination container's own a11y label.
        const pagination = carousel.getByTestId("carousel$pagination");
        expect(pagination.props.accessibilityLabel).toBe("Slide 1 of 6");
        expect(carousel.queryAllByRole("button")).toHaveLength(0);
    });

    it("tracks the active slide once the list settles on it", () => {
        const carousel = render(<Carousel {...defaultProps} contentSource={listValueBuilder.withAmountOfItems(6)} />);
        fireContainerLayout(carousel, { width: 300, height: 150 });
        // Card layout sizes each item to 70% of the measured width.
        const itemWidth = 300 * 0.7;

        fireEvent(carousel.getByTestId("carousel$carousel"), "momentumScrollEnd", {
            nativeEvent: { contentOffset: { x: itemWidth } }
        });

        expect(carousel.getByTestId("carousel$pagination").props.accessibilityLabel).toBe("Slide 2 of 6");
    });

    it("scrolls to the slide behind a tapped dot", () => {
        const scrollToIndex = jest.spyOn(FlatList.prototype, "scrollToIndex").mockImplementation(() => undefined);
        const carousel = render(<Carousel {...defaultProps} />);
        fireContainerLayout(carousel, { width: 300, height: 150 });

        fireEvent.press(carousel.getAllByRole("button")[1]);

        expect(scrollToIndex).toHaveBeenCalledWith({ index: 1, animated: true });
        scrollToIndex.mockRestore();
    });

    describe("accessibility", () => {
        it("labels each dot by its slide number, with the active one marked selected", () => {
            const carousel = render(<Carousel {...defaultProps} />);
            fireContainerLayout(carousel, { width: 300, height: 150 });

            const dots = carousel.getAllByRole("button");
            expect(dots.map(dot => dot.props.accessibilityLabel)).toEqual(["Go to slide 1", "Go to slide 2"]);
            expect(dots[0].props.accessibilityState).toEqual({ selected: true });
            expect(dots[1].props.accessibilityState).toEqual({ selected: false });
        });

        it("hides every slide but the active one from screen readers", () => {
            const carousel = render(<Carousel {...defaultProps} />);
            fireContainerLayout(carousel, { width: 300, height: 150 });

            // Hidden elements are excluded by default - as a screen reader would skip them too - so finding the
            // (intentionally) hidden one back has to opt in.
            const active = carousel.getByTestId("carousel$content$0");
            const inactive = carousel.getByTestId("carousel$content$1", { includeHiddenElements: true });
            expect(active.props.accessibilityElementsHidden).toBe(false);
            expect(active.props.importantForAccessibility).toBe("auto");
            expect(inactive.props.accessibilityElementsHidden).toBe(true);
            expect(inactive.props.importantForAccessibility).toBe("no-hide-descendants");
        });

        it("moves the hidden-from-screen-readers slide once the active one changes", () => {
            const carousel = render(
                <Carousel {...defaultProps} contentSource={listValueBuilder.withAmountOfItems(6)} />
            );
            fireContainerLayout(carousel, { width: 300, height: 150 });
            const itemWidth = 300 * 0.7;

            fireEvent(carousel.getByTestId("carousel$carousel"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: itemWidth } }
            });

            expect(
                carousel.getByTestId("carousel$content$0", { includeHiddenElements: true }).props
                    .accessibilityElementsHidden
            ).toBe(true);
            expect(carousel.getByTestId("carousel$content$1").props.accessibilityElementsHidden).toBe(false);
        });

        it("steps forward and backward on a TalkBack/VoiceOver increment or decrement action", () => {
            const scrollToIndex = jest.spyOn(FlatList.prototype, "scrollToIndex").mockImplementation(() => undefined);
            const carousel = render(
                <Carousel {...defaultProps} contentSource={listValueBuilder.withAmountOfItems(6)} />
            );
            fireContainerLayout(carousel, { width: 300, height: 150 });
            const itemWidth = 300 * 0.7;
            const list = carousel.getByTestId("carousel$carousel");
            // scrollToIndex is mocked, so nothing actually moves the list; each step settles it manually at
            // the index the previous action asked for, same as a real scroll settling before the next gesture.
            const step = (actionName: "increment" | "decrement"): void => {
                const callsBefore = scrollToIndex.mock.calls.length;
                fireEvent(carousel.getByTestId("carousel$pagination"), "accessibilityAction", {
                    nativeEvent: { actionName }
                });
                // Already at that end: the action was a no-op, so there is nothing to settle.
                if (scrollToIndex.mock.calls.length === callsBefore) {
                    return;
                }
                const index = scrollToIndex.mock.lastCall![0].index as number;
                fireEvent(list, "momentumScrollEnd", { nativeEvent: { contentOffset: { x: index * itemWidth } } });
            };

            step("increment");
            expect(scrollToIndex).toHaveBeenLastCalledWith({ index: 1, animated: true });

            step("decrement");
            expect(scrollToIndex).toHaveBeenLastCalledWith({ index: 0, animated: true });

            scrollToIndex.mockRestore();
        });

        it("does not step past either end of the carousel", () => {
            const scrollToIndex = jest.spyOn(FlatList.prototype, "scrollToIndex").mockImplementation(() => undefined);
            const carousel = render(
                <Carousel {...defaultProps} contentSource={listValueBuilder.withAmountOfItems(6)} />
            );
            fireContainerLayout(carousel, { width: 300, height: 150 });
            const itemWidth = 300 * 0.7;
            const list = carousel.getByTestId("carousel$carousel");
            const step = (actionName: "increment" | "decrement"): void => {
                const callsBefore = scrollToIndex.mock.calls.length;
                fireEvent(carousel.getByTestId("carousel$pagination"), "accessibilityAction", {
                    nativeEvent: { actionName }
                });
                // Already at that end: the action was a no-op, so there is nothing to settle.
                if (scrollToIndex.mock.calls.length === callsBefore) {
                    return;
                }
                const index = scrollToIndex.mock.lastCall![0].index as number;
                fireEvent(list, "momentumScrollEnd", { nativeEvent: { contentOffset: { x: index * itemWidth } } });
            };

            // Already on the first slide: decrementing has nowhere to go, so the no-op scroll is skipped.
            step("decrement");
            expect(scrollToIndex).not.toHaveBeenCalled();

            // Incrementing past the last slide (index 5 of 6) stays put rather than running off the end.
            for (let i = 0; i < 6; i++) {
                step("increment");
            }
            expect(scrollToIndex).toHaveBeenLastCalledWith({ index: 5, animated: true });

            scrollToIndex.mockRestore();
        });
    });

    it("preserves expected style key set", () => {
        const keys = Object.keys(defaultCarouselStyle).sort();
        expect(keys).toEqual(["cardLayout", "container", "fullWidthLayout"]);
    });
});
