import { actionValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { createElement } from "react";
import { fireEvent, render, RenderAPI } from "@testing-library/react-native";

import { BarcodeScanner, Props } from "../BarcodeScanner";
import { RNCamera } from "./__mocks__/RNCamera";

jest.mock("react-native-vision-camera", () => jest.requireActual("./__mocks__/RNCamera"));

describe("BarcodeScanner", () => {
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            showAnimatedLine: false,
            showMask: false,
            name: "barcode-scanner-test",
            style: [],
            barcode: new EditableValueBuilder<string>().build()
        };
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

    it("sets a value and executes the on detect action when a new barcode is scanned", async () => {
        const onDetectAction = actionValue();
        const component = render(<BarcodeScanner {...defaultProps} onDetect={onDetectAction} />);

        detectBarcode(component, "value");
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);

        detectBarcode(component, "value1");
        jest.advanceTimersByTime(100);
        detectBarcode(component, "value2");
        // Events are not fired immediately by testing-library, so firing with 1999 will be already too late for the previous action
        jest.advanceTimersByTime(1800);
        detectBarcode(component, "value3");

        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value1");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(2);

        detectBarcode(component, "value2");
        detectBarcode(component, "value3");
        detectBarcode(component, "value4");

        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value2");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(3);
    });
});

function detectBarcode(component: RenderAPI, barcode: string): void {
    fireEvent(component.UNSAFE_getByType(RNCamera), "barCodeRead", {
        data: barcode,
        type: "qr",
        bounds: [
            { x: "", y: "" },
            { x: "", y: "" }
        ]
    });
}
