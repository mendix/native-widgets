import { createElement } from "react";
import { render, act } from "@testing-library/react-native";
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

    it("renders", async () => {
        const component = render(<IntroScreen {...defaultProps} />);
        await act(async () => {
            /* Wait for any async operations to complete */
        });
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with 1 bottom button", async () => {
        const component = render(
            <IntroScreen {...defaultProps} slideIndicators={"above"} buttonPattern={"nextDone"} />
        );
        await act(async () => {
            /* Wait for any async operations to complete */
        });
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with 2 bottom button", async () => {
        const component = render(<IntroScreen {...defaultProps} slideIndicators={"above"} buttonPattern={"all"} />);
        await act(async () => {
            /* Wait for any async operations to complete */
        });
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with active slide attribute", async () => {
        const component = render(
            <IntroScreen
                {...defaultProps}
                activeSlideAttribute={new EditableValueBuilder<Big>().withValue(new Big(1)).build()}
            />
        );
        await act(async () => {
            /* Wait for any async operations to complete */
        });
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with async storage identifier", async () => {
        const component = render(<IntroScreen {...defaultProps} identifier="test1" />);
        await act(async () => {
            /* Wait for any async operations to complete */
        });
        expect(component.toJSON()).toMatchSnapshot();
    });
});
