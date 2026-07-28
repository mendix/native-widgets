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

        it("does not report a slide change for a scroll the user did not start", () => {
            // The regression this guards: the list also emits momentumScrollEnd when it re-clamps
            // its own offset after a layout or data change. Treating that as a swipe wrote the
            // clamped offset (page 0) back to the attribute, so the widget jumped to slide 1 and
            // counted a change that never happened.
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(2)).build();
            const onSlideChange = jest.fn();
            const component = render(
                <IntroScreen
                    {...defaultProps}
                    slides={threeSlides}
                    activeSlideAttribute={activeSlideAttribute}
                    onSlideChange={onSlideChange as any}
                />
            );
            layout(component, "intro-screen-test");

            fireEvent(component.getByTestId("intro-screen-test"), "momentumScrollEnd", {
                nativeEvent: { contentOffset: { x: 0 } }
            });

            expect(activeSlideAttribute.setValue).not.toHaveBeenCalled();
            expect(onSlideChange).not.toHaveBeenCalled();
        });

        it("reports a slide change for a scroll the user started", () => {
            const activeSlideAttribute = new EditableValueBuilder<Big>().withValue(new Big(1)).build();
            const component = render(
                <IntroScreen {...defaultProps} slides={threeSlides} activeSlideAttribute={activeSlideAttribute} />
            );
            layout(component, "intro-screen-test");

            const list = component.getByTestId("intro-screen-test");
            fireEvent(list, "scrollBeginDrag");
            fireEvent(list, "momentumScrollEnd", { nativeEvent: { contentOffset: { x: 400 } } });

            // Offset 400 with a 400pt slide is index 1, reported one-based.
            expect(activeSlideAttribute.setValue).toHaveBeenCalledWith(new Big(2));
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
    });
});
