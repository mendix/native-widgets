import { render, act, fireEvent, RenderAPI } from "@testing-library/react-native";
import { IntroScreen } from "../IntroScreen";
import { IntroScreenProps } from "../../typings/IntroScreenProps";
import { IntroScreenStyle } from "../ui/Styles";
import { View } from "react-native";
import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Big } from "big.js";

jest.mock("react-native-device-info", () => ({
    hasNotch: jest.fn().mockReturnValue(true),
    getDeviceId: jest.fn().mockReturnValue("iPhone10,6")
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn().mockResolvedValue("gone"),
    setValue: jest.fn().mockResolvedValue(null)
}));

const layout = (component: RenderAPI, name: string): void => {
    fireEvent(component.getByTestId(name), "layout", {
        nativeEvent: { layout: { width: 400, height: 800 } }
    });
};

describe("Intro Screen", () => {
    let defaultProps: IntroScreenProps<IntroScreenStyle>;

    beforeEach(() => {
        defaultProps = {
            name: "intro-screen-notch-test",
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

        jest.useFakeTimers();
    });

    it("renders", () => {
        const component = render(<IntroScreen {...defaultProps} />);
        layout(component, "intro-screen-notch-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with 1 bottom button", () => {
        const component = render(
            <IntroScreen {...defaultProps} slideIndicators={"above"} buttonPattern={"nextDone"} />
        );
        layout(component, "intro-screen-notch-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with 2 bottom button", () => {
        const component = render(<IntroScreen {...defaultProps} slideIndicators={"above"} buttonPattern={"all"} />);
        layout(component, "intro-screen-notch-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with active slide attribute", () => {
        const component = render(
            <IntroScreen
                {...defaultProps}
                activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(1)).build()}
            />
        );
        layout(component, "intro-screen-notch-test");
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with async storage identifier", async () => {
        const component = render(<IntroScreen {...defaultProps} identifier="test1" />);
        // Wait for async storage to resolve
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await act(async () => {});
        layout(component, "intro-screen-notch-test");
        expect(component.toJSON()).toMatchSnapshot();
    });
});
