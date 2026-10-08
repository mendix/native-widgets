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

        expect(carousel.getByText("1/6")).toBeDefined();
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

        expect(carousel.getByText("2/6")).toBeDefined();
    });

    it("scrolls to the slide behind a tapped dot", () => {
        const scrollToIndex = jest.spyOn(FlatList.prototype, "scrollToIndex").mockImplementation(() => undefined);
        const carousel = render(<Carousel {...defaultProps} />);
        fireContainerLayout(carousel, { width: 300, height: 150 });

        fireEvent.press(carousel.getAllByRole("button")[1]);

        expect(scrollToIndex).toHaveBeenCalledWith({ index: 1, animated: true });
        scrollToIndex.mockRestore();
    });

    it("preserves expected style key set", () => {
        const keys = Object.keys(defaultCarouselStyle).sort();
        expect(keys).toEqual(["cardLayout", "container", "fullWidthLayout"]);
    });
});
