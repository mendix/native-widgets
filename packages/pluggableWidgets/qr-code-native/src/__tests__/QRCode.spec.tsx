import { dynamicValue } from "@mendix/piw-utils-internal";
import { createElement } from "react";
import { render } from "@testing-library/react-native";

import { Props, QRCode } from "../QRCode";

describe("QRCode", () => {
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "qr-code-test",
            accessible: "yes",
            style: [],
            value: dynamicValue("Hello, world!")
        };
    });

    it("renders a qr code", () => {
        const component = render(<QRCode {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders an empty container when there is no value", () => {
        const component = render(<QRCode {...defaultProps} value={dynamicValue()} />);
        expect(component.toJSON()).toMatchSnapshot();
    });
});
