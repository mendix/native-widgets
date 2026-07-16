import { FeedbackStyle } from "../ui/styles";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react-native";
import { FeedbackProps } from "../../typings/FeedbackProps";
import { Feedback } from "../Feedback";
import { dynamicValue } from "@mendix/piw-utils-internal";
import { NativeImage } from "mendix";

// @ts-ignore
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true
    })
);

jest.mock("react-native/Libraries/Utilities/Platform", () => {
    const Platform = jest.requireActual("react-native/Libraries/Utilities/Platform");
    Platform.OS = "ios";
    Platform.default = { ...Platform.default, OS: "ios" };
    return Platform;
});

jest.mock("react-native-view-shot", () => ({
    captureScreen: jest.fn(() => Promise.resolve(""))
}));

describe("Feedback", () => {
    let defaultProps: FeedbackProps<FeedbackStyle>;

    beforeEach(() => {
        defaultProps = {
            name: "feedback-test",
            style: [],
            sprintrapp: "sprintr-app-id",
            allowScreenshot: true,
            logo: dynamicValue<NativeImage>({ uri: "path/to/image" })
        };
    });

    afterEach(cleanup);

    it("renders", () => {
        const component = render(<Feedback {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("should not show screenshot option if 'allowScreenshots' is false", () => {
        defaultProps.allowScreenshot = false;
        const component = render(<Feedback {...defaultProps} />);
        expect(component.queryByText("Include Screenshot")).toBeNull();
        expect(component.queryByTestId("feedback-test$switch")).toBeNull();
    });

    it("should call the api when sending", async () => {
        const feedbackMsg = "unittest";
        const component = render(<Feedback {...defaultProps} />);

        fireEvent.press(component.getByTestId("feedback-test$button"));

        // Wait for async captureScreen mock to resolve and dialog to render
        await waitFor(() => component.getByTestId("feedback-test$input"));

        fireEvent.changeText(component.getByTestId("feedback-test$input"), feedbackMsg);

        fireEvent.press(component.getByTestId("feedback-test$send"));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const [url, request] = (fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("https://feedback-api.mendix.com/rest/v3/feedbackapi/projects/sprintr-app-id/issues");
        expect(request).toMatchObject({
            headers: { ClientIdentifier: "feedback-native-v2", "Content-Type": "application/json" },
            method: "POST",
            mode: "no-cors",
            referrer: "no-referrer"
        });

        const body = JSON.parse(request.body as string);
        expect(body).toMatchObject({
            title: "unittest",
            description: "",
            issueType: "Issue",
            submitter: {
                userId: "",
                email: "unknown@example.com",
                displayName: "Unknown Native User"
            },
            metadata: {
                userRoles: "",
                location: "",
                form: ""
            },
            imageAttachment: ""
        });
        expect(body.metadata.userAgent).toMatch(/^Native for (ios|android)$/);
        expect(typeof body.metadata.screenWidth).toBe("number");
        expect(typeof body.metadata.screenHeight).toBe("number");
    }, 15000);
});
