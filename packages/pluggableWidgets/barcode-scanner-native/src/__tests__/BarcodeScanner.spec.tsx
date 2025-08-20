// __tests__/BarcodeScanner.spec.tsx
import { actionValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { render } from "@testing-library/react-native";
import { createElement } from "react";
import { View } from "react-native";
import { BarcodeScanner, Props } from "../BarcodeScanner";

let mockOnCodeScanned: ((codes: Array<{ value: string }>) => void) | undefined;

jest.mock("react-native-vision-camera", () => ({
    Camera: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    useCameraDevice: () => "mock-device",
    useCodeScanner: (options: any) => {
        mockOnCodeScanned = options.onCodeScanned;
        return "mockCodeScanner";
    }
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
        render(<BarcodeScanner {...defaultProps} onDetect={onDetectAction} />);

        // Simulate scanning
        mockOnCodeScanned?.([{ value: "value" }]);
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);

        // Another scan
        mockOnCodeScanned?.([{ value: "value1" }]);
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value1");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(2);
    });
});
