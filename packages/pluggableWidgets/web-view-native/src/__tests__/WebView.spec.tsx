import { actionValue, dynamicValue } from "@mendix/piw-utils-internal";
import { createElement } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { WebView as RNWebView } from "react-native-webview";

import { Props, WebView } from "../WebView";

jest.mock("react-native", () => {
    const RN = jest.requireActual("react-native");
    RN.NativeModules.RNCWebView = { isFileUploadSupported: jest.fn(() => true) };
    return RN;
});

describe("WebView", () => {
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "webview-test",
            style: [],
            url: dynamicValue("https://mendix.com"),
            requestMethod: "GET",
            headerList: [],
            userAgent: "",
            openLinksExternally: false
        };
    });

    it("renders a web view when a url is provided", () => {
        const component = render(<WebView {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a web view when a url with POST method and body is provided", () => {
        const component = render(
            <WebView {...defaultProps} requestMethod="POST" postBody={dynamicValue('{ testKey: "testValue" }')} />
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a web view when a url with headers is provided", () => {
        const component = render(
            <WebView
                {...defaultProps}
                headerList={[
                    { headerName: dynamicValue("testName1"), headerValue: dynamicValue("testValue1") },
                    { headerName: dynamicValue("testName2"), headerValue: dynamicValue("testValue2") }
                ]}
            />
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders a web view when html content is provided", () => {
        const component = render(<WebView {...defaultProps} content={dynamicValue("Hello, world!")} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders an error when no url or content is provided", () => {
        const component = render(<WebView {...defaultProps} url={dynamicValue()} content={dynamicValue()} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("executes the on load action", () => {
        const onLoadAction = actionValue();
        const component = render(<WebView {...defaultProps} onLoad={onLoadAction} />);

        fireEvent(component.UNSAFE_getByType(RNWebView), "load");

        expect(onLoadAction.execute).toHaveBeenCalledTimes(1);
    });

    it("executes the on error action", () => {
        const onErrorAction = actionValue();
        const component = render(<WebView {...defaultProps} onError={onErrorAction} />);

        fireEvent(component.UNSAFE_getByType(RNWebView), "error");

        expect(onErrorAction.execute).toHaveBeenCalledTimes(1);
    });
});
