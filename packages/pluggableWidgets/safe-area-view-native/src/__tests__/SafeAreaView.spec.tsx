import { render } from "@testing-library/react-native";
import { SafeAreaView } from "../SafeAreaView";
import { SafeAreaViewProps } from "../../typings/SafeAreaViewProps";
import { SafeAreaViewStyle } from "../ui/Styles";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

jest.mock("@react-navigation/bottom-tabs", () => ({
    useBottomTabBarHeight: jest.fn(() => 50)
}));

describe("Safe area view", () => {
    let defaultProps: SafeAreaViewProps<SafeAreaViewStyle>;

    beforeEach(() => {
        defaultProps = {
            name: "safe-area-view-test",
            style: [],
            content: <Text>Content</Text>
        };
    });

    it("renders with content", () => {
        const component = render(
            <SafeAreaProvider>
                <SafeAreaView name={defaultProps.name} style={defaultProps.style} content={defaultProps.content} />
            </SafeAreaProvider>
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders without content", () => {
        delete defaultProps.content;
        const component = render(
            <SafeAreaProvider>
                <SafeAreaView {...defaultProps} />
            </SafeAreaProvider>
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with custom styling", () => {
        defaultProps.style = [
            {
                container: { backgroundColor: "blue" }
            },
            { container: { backgroundColor: "green" } }
        ];
        const component = render(
            <SafeAreaProvider>
                <SafeAreaView {...defaultProps} />
            </SafeAreaProvider>
        );
        expect(component.toJSON()).toMatchSnapshot();
    });
});
