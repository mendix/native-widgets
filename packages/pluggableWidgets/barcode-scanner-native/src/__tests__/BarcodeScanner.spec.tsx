// __tests__/BarcodeScanner.spec.tsx
import { actionValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { createElement } from "react";
import { View } from "react-native";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";
import { BarcodeScanner, Props } from "../BarcodeScanner";
import { Camera } from "react-native-vision-camera";

jest.mock("react-native-vision-camera", () => ({
    Camera: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    useCameraDevice: () => "mock-device",
    useCodeScanner: () => jest.fn()
}));

jest.mock("react-native-barcode-mask", () => "BarcodeMask");

describe("BarcodeScanner", () => {
    let defaultProps: Props;

    beforeEach(() => {
        jest.useFakeTimers();
        defaultProps = {
            showAnimatedLine: false,
            showMask: false,
            name: "barcode-scanner-test",
            style: [],
            barcode: new EditableValueBuilder<string>().build()
        };
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it("renders", () => {
        const component = render(<BarcodeScanner {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with mask", () => {
        const component = render(<BarcodeScanner {...defaultProps} showMask />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with mask with animated line", () => {
        const component = render(<BarcodeScanner {...defaultProps} showMask showAnimatedLine />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("sets a value and executes the onDetect action when a new barcode is scanned", () => {
        const onDetectAction = actionValue();
        const component = render(<BarcodeScanner {...defaultProps} onDetect={onDetectAction} />);

        detectBarcode(component, "value");
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);

        detectBarcode(component, "value1");
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value1");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(2);
    });
});

function detectBarcode(component: RenderAPI, barcode: string): void {
    fireEvent(component.UNSAFE_getByType(Camera), "onCodeScanned", [
        {
            value: barcode,
            type: "qr"
        }
    ]);
}
