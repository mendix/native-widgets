import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { render } from "@testing-library/react-native";
import { BottomSheet } from "../BottomSheet";
import { BottomSheetProps } from "../../typings/BottomSheetProps";
import { BottomSheetStyle } from "../ui/Styles";
import { ActionSheetIOS, Text } from "react-native";

jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/lib/module/mock"));

jest.mock("react-native-reanimated", () => {
    const Reanimated = jest.requireActual("react-native-reanimated/lib/module/mock");

    if (Reanimated?.default && typeof Reanimated.default === "object") {
        Reanimated.default.call = () => undefined;
    }

    return Reanimated;
});

jest.mock("react-native-device-info", () => ({
    getDeviceId: () => "iPhone10,6"
}));

jest.mock("react-native/Libraries/Utilities/Platform", () => {
    const Platform = jest.requireActual("react-native/Libraries/Utilities/Platform");
    Platform.OS = "ios";
    Platform.default = { ...Platform.default, OS: "ios" };
    return Platform;
});

const defaultProps: BottomSheetProps<BottomSheetStyle> = {
    name: "bottom-sheet-test",
    style: [],
    nativeImplementation: true,
    type: "modal",
    modalRendering: "basic",
    itemsBasic: [
        {
            caption: "Item 1",
            styleClass: "defaultStyle"
        },
        {
            caption: "Item 2",
            styleClass: "defaultStyle"
        }
    ],
    showFullscreenContent: false,
    triggerAttribute: new EditableValueBuilder<boolean>().withValue(false).build()
};

describe("Bottom sheet", () => {
    // RN 0.83 test renderer may serialize iOS SafeAreaView as a plain View,
    // so snapshots in this suite no longer prove iOS-specific rendering by host tag.
    // This test explicitly verifies our Platform.OS override by asserting the iOS native path.
    it("uses iOS native action sheet when native implementation is enabled", () => {
        const actionSheetSpy = jest
            .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
            .mockImplementation(() => undefined);
        const props = {
            ...defaultProps,
            triggerAttribute: new EditableValueBuilder<boolean>().withValue(true).build()
        };

        render(<BottomSheet {...props} />);

        expect(actionSheetSpy).toHaveBeenCalled();
        expect(actionSheetSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                options: ["Item 1", "Item 2", "Cancel"],
                cancelButtonIndex: 2
            }),
            expect.any(Function)
        );
        actionSheetSpy.mockRestore();
    });

    it("renders a native bottom action sheet for ios (Basic modal)", () => {
        const component = render(<BottomSheet {...defaultProps} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a custom bottom action sheet for ios (Basic modal) with custom style", () => {
        const style: BottomSheetStyle = {
            container: {},
            containerWhenExpandedFullscreen: {},
            modal: {},
            modalItems: {
                defaultStyle: {
                    color: "red",
                    fontSize: 60
                }
            }
        };
        const component = render(<BottomSheet {...defaultProps} nativeImplementation={false} style={[style]} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a custom modal", () => {
        const component = render(<BottomSheet {...defaultProps} modalRendering="custom" largeContent={<Text />} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a expanding", () => {
        const component = render(
            <BottomSheet
                {...defaultProps}
                type="expanding"
                smallContent={<Text>Header</Text>}
                largeContent={<Text>Content</Text>}
            />
        );

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a expanding fullscreen", () => {
        const component = render(
            <BottomSheet
                {...defaultProps}
                type="expanding"
                smallContent={<Text>Header</Text>}
                largeContent={<Text>Content</Text>}
                showFullscreenContent
                fullscreenContent={<Text>Full screen content</Text>}
            />
        );

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a expanding fullscreen with custom styles", () => {
        const style: BottomSheetStyle = {
            container: {
                backgroundColor: "blue"
            },
            containerWhenExpandedFullscreen: {},
            modal: {},
            modalItems: {}
        };
        const component = render(
            <BottomSheet
                {...defaultProps}
                type="expanding"
                smallContent={<Text>Header</Text>}
                largeContent={<Text>Content</Text>}
                showFullscreenContent
                fullscreenContent={<Text>Full screen content</Text>}
                style={[style]}
            />
        );

        expect(component.toJSON()).toMatchSnapshot();
    });
});
