import { EditableValueBuilder } from "@mendix/piw-utils-internal";
import { act, fireEvent, render } from "@testing-library/react-native";
import { EditableValue } from "mendix";
import { Modal } from "react-native";
import { NativeBottomSheet } from "../components/NativeBottomSheet";
import { BottomSheetStyle } from "../ui/Styles";

/** The methods the sheet exposes on its ref, so the close path can be asserted. */
const mockSheetMethods = { close: jest.fn(), forceClose: jest.fn() };
/** Whether the mocked sheet reports reaching its snap point on mount, as a fully opened sheet does. */
let mockReportsOpen = true;
/** The props the mocked sheet was last rendered with, so tests can fire its callbacks. */
let mockSheetProps: any;

jest.mock("@gorhom/bottom-sheet", () => {
    const React = require("react");
    const { View } = require("react-native");

    return {
        __esModule: true,
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => mockSheetMethods);
            // The real sheet animates open on mount and reports the index it landed on,
            // which is what tells the widget it has something to close.
            mockSheetProps = props;
            React.useEffect(() => {
                if (mockReportsOpen) {
                    props.onChange?.(0);
                }
            }, []);

            return React.createElement(View, null, props.children);
        }),
        BottomSheetBackdrop: () => null,
        BottomSheetScrollView: (props: any) => React.createElement(View, null, props.children)
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

describe("NativeBottomSheet", () => {
    let triggerAttribute: EditableValue<boolean>;

    const renderSheet = (): ReturnType<typeof render> =>
        render(
            <NativeBottomSheet
                name="sheet"
                triggerAttribute={triggerAttribute}
                itemsBasic={[]}
                useNative={false}
                styles={styles}
            />
        );

    /** Opens the sheet, up to and including the sheet reporting that it is open. */
    const openSheet = (): ReturnType<typeof render> => {
        const component = renderSheet();
        // The sheet is only mounted once the modal is on screen.
        fireEvent(component.UNSAFE_getByType(Modal), "show");

        return component;
    };

    const dismissSheet = (component: ReturnType<typeof render>): void => {
        triggerAttribute.setValue(false);
        component.rerender(
            <NativeBottomSheet
                name="sheet"
                triggerAttribute={triggerAttribute}
                itemsBasic={[]}
                useNative={false}
                styles={styles}
            />
        );
    };

    beforeEach(() => {
        mockSheetMethods.close.mockClear();
        mockSheetMethods.forceClose.mockClear();
        mockReportsOpen = true;
        mockSheetProps = undefined;
        triggerAttribute = new EditableValueBuilder<boolean>().withValue(true).build();
    });

    it("removes the modal when the sheet closes before it finished opening", () => {
        // Tapping the backdrop while the sheet is still animating open closes it without it
        // ever reaching its snap point, so only onClose reports it. The transparent modal must
        // still go away, or it stays on screen and blocks every touch.
        mockReportsOpen = false;
        const component = openSheet();

        act(() => mockSheetProps.onClose());

        expect(triggerAttribute.value).toBe(false);
        expect(component.UNSAFE_getByType(Modal).props.visible).toBe(false);
    });

    it("closes the sheet once it opens when the trigger attribute went false during the open", () => {
        mockReportsOpen = false;
        const component = openSheet();

        dismissSheet(component);
        expect(mockSheetMethods.close).not.toHaveBeenCalled();

        act(() => mockSheetProps.onChange(0));

        expect(mockSheetMethods.close).toHaveBeenCalled();
    });
});
