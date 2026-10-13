import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { fireEvent, render } from "@testing-library/react-native";
import { EditableValue } from "mendix";
import { Keyboard, Modal, Text } from "react-native";
import { CustomModalSheet } from "../components/CustomModalSheet";
import { BottomSheetStyle } from "../ui/Styles";

/** The methods the sheet exposes on its ref, so the close path can be asserted. */
const mockSheetMethods = { close: jest.fn(), forceClose: jest.fn() };

jest.mock("@gorhom/bottom-sheet", () => {
    const React = require("react");
    const { View } = require("react-native");

    return {
        __esModule: true,
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => mockSheetMethods);
            // The real sheet animates open on mount and reports the index it landed on,
            // which is what tells the widget it has something to close.
            React.useEffect(() => props.onChange?.(0), []);

            return React.createElement(View, null, props.children);
        }),
        BottomSheetBackdrop: () => null,
        BottomSheetScrollView: React.forwardRef((props: any, _ref: any) =>
            React.createElement(View, null, props.children)
        ),
        useBottomSheetInternal: () => ({ animatedKeyboardState: { get: () => ({}), set: () => undefined } })
    };
});

jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/lib/module/mock"));

jest.mock("react-native-reanimated", () => {
    const Reanimated = jest.requireActual("react-native-reanimated/lib/module/mock");

    if (Reanimated?.default && typeof Reanimated.default === "object") {
        Reanimated.default.call = () => undefined;
    }

    return Reanimated;
});

const styles: BottomSheetStyle = {
    container: {},
    containerWhenExpandedFullscreen: {},
    modal: {},
    modalItems: {}
};

describe("CustomModalSheet", () => {
    let triggerAttribute: EditableValue<boolean>;

    /** Opens the sheet, up to and including the sheet reporting that it is open. */
    const openSheet = (): ReturnType<typeof render> => {
        const component = render(
            <CustomModalSheet triggerAttribute={triggerAttribute} content={<Text />} styles={styles} />
        );
        // The sheet is only mounted once the modal is on screen.
        fireEvent(component.UNSAFE_getByType(Modal), "show");

        return component;
    };

    const dismissSheet = (component: ReturnType<typeof render>): void => {
        triggerAttribute.setValue(false);
        component.rerender(<CustomModalSheet triggerAttribute={triggerAttribute} content={<Text />} styles={styles} />);
    };

    beforeEach(() => {
        mockSheetMethods.close.mockClear();
        mockSheetMethods.forceClose.mockClear();
        triggerAttribute = new EditableValueBuilder<boolean>().withValue(true).build();
        jest.spyOn(Keyboard, "dismiss").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("forces the sheet closed, so that a keyboard hiding mid-close cannot restore it", () => {
        // A plain close is interruptible: the keyboard's blur behavior restores the sheet to
        // the snap point it is still recorded at, which cancels the close animation and
        // reports no index change -- leaving the sheet open with the trigger attribute false.
        const component = openSheet();

        dismissSheet(component);

        expect(mockSheetMethods.forceClose).toHaveBeenCalled();
        expect(mockSheetMethods.close).not.toHaveBeenCalled();
    });

    it("dismisses an open keyboard together with the sheet", () => {
        jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
        const component = openSheet();

        dismissSheet(component);

        expect(Keyboard.dismiss).toHaveBeenCalled();
    });

    it("leaves the keyboard alone when none is open", () => {
        jest.spyOn(Keyboard, "isVisible").mockReturnValue(false);
        const component = openSheet();

        dismissSheet(component);

        expect(Keyboard.dismiss).not.toHaveBeenCalled();
        expect(mockSheetMethods.forceClose).toHaveBeenCalled();
    });
});
