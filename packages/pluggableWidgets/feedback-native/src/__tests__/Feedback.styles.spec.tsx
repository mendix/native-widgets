import "./iosPlatform";
import { cleanup, fireEvent, render, RenderAPI, waitFor } from "@testing-library/react-native";
import { ActivityIndicator, StyleSheet, Switch } from "react-native";
import { ReactTestInstance } from "react-test-renderer";
import { FeedbackProps } from "../../typings/FeedbackProps";
import { Feedback } from "../Feedback";
import { FeedbackStyle } from "../ui/styles";
import { themedFixture } from "./themedFixture";

jest.mock("react-native-view-shot", () => ({
    captureScreen: jest.fn(() => Promise.resolve(""))
}));

const fetchMock = jest.fn();
global.fetch = fetchMock;

type Style = Record<string, unknown>;

const styleOf = (node: ReactTestInstance): Style => (StyleSheet.flatten(node.props.style) as Style | undefined) ?? {};

/** Host elements whose flattened style satisfies the predicate */
const findByStyle = (component: RenderAPI, predicate: (style: Style) => boolean): ReactTestInstance[] =>
    component.UNSAFE_root.findAll(node => typeof node.type === "string" && predicate(styleOf(node)));

describe("Feedback themed styles", () => {
    let props: FeedbackProps<FeedbackStyle>;

    beforeEach(() => {
        fetchMock.mockReset().mockResolvedValue({ ok: true });
        props = {
            name: "feedback-test",
            style: [themedFixture as FeedbackStyle],
            sprintrapp: "sprintr-app-id",
            allowScreenshot: true
        };
    });

    afterEach(cleanup);

    const openTodoDialog = async (extra: Partial<FeedbackProps<FeedbackStyle>> = {}): Promise<RenderAPI> => {
        const component = render(<Feedback {...props} {...extra} />);
        fireEvent.press(component.getByTestId("feedback-test$button"));
        await waitFor(() => component.getByTestId("feedback-test$input"));
        return component;
    };

    it("applies floatingButton", () => {
        const component = render(<Feedback {...props} />);

        expect(findByStyle(component, s => s.backgroundColor === "#a1a1a1")).not.toHaveLength(0);
    });

    it("applies title", async () => {
        const component = await openTodoDialog();

        expect(styleOf(component.getByText("Send Feedback"))).toMatchObject({ color: "#c3c3c3", fontSize: 31 });
    });

    describe("textAreaInput", () => {
        it("keeps text styles on the style and moves the four prop keys to props", async () => {
            const component = await openTodoDialog();
            const input = component.getByTestId("feedback-test$input");

            expect(styleOf(input)).toMatchObject({
                color: "#d4d4d4",
                fontSize: 17,
                fontFamily: "ThemedFont",
                fontWeight: "700",
                borderColor: "#e5e5e5",
                height: 123
            });
            expect(input.props).toMatchObject({
                placeholderTextColor: "#f6f6f6",
                selectionColor: "#071717",
                underlineColorAndroid: "#182828",
                numberOfLines: 7
            });
            for (const key of ["placeholderTextColor", "selectionColor", "underlineColorAndroid", "numberOfLines"]) {
                expect(styleOf(input)).not.toHaveProperty(key);
            }
        });

        it("styles the description of the result dialogs with the text keys only", async () => {
            const component = render(<Feedback {...props} />);
            fireEvent.press(component.getByTestId("feedback-test$button"));
            fireEvent.changeText(await component.findByTestId("feedback-test$input"), "message");
            fireEvent.press(component.getByTestId("feedback-test$send"));

            const description = await component.findByTestId("feedback-test$success");

            expect(styleOf(description)).toMatchObject({
                color: "#d4d4d4",
                fontSize: 17,
                fontFamily: "ThemedFont",
                fontWeight: "700"
            });
            expect(styleOf(description)).not.toHaveProperty("height");
            expect(styleOf(description)).not.toHaveProperty("borderColor");
        });
    });

    describe("switchLabel and switchInput", () => {
        it("applies switchLabel", async () => {
            const component = await openTodoDialog();

            expect(styleOf(component.getByText("Include Screenshot"))).toMatchObject({
                color: "#293939",
                fontSize: 19
            });
        });

        it("uses the custom track and thumb colors and keeps them out of the style", async () => {
            const component = await openTodoDialog();
            const switchInput = component.UNSAFE_getByType(Switch);

            expect(switchInput.props.trackColor).toEqual({ true: "#3a4a4a", false: "#4b5b5b" });
            expect(switchInput.props.thumbColor).toBe("#5c6c6c");
            expect(StyleSheet.flatten(switchInput.props.style)).toMatchObject({ margin: 3 });
            for (const key of ["trackColorOn", "trackColorOff", "thumbColorOn", "thumbColorOff"]) {
                expect(StyleSheet.flatten(switchInput.props.style)).not.toHaveProperty(key);
            }
        });

        it("switches to the off thumb color when the toggle is turned off", async () => {
            const component = await openTodoDialog();

            fireEvent(component.UNSAFE_getByType(Switch), "valueChange", false);

            expect(component.UNSAFE_getByType(Switch).props.thumbColor).toBe("#6d7d7d");
        });
    });

    describe("button and buttonDisabled", () => {
        it("colors the buttons and uses buttonDisabled while the message is empty", async () => {
            const component = await openTodoDialog();

            expect(styleOf(component.getByTestId("feedback-test$cancel"))).toMatchObject({ color: "#7e8e8e" });
            expect(styleOf(component.getByTestId("feedback-test$send"))).toMatchObject({ color: "#90a0a0" });

            fireEvent.changeText(component.getByTestId("feedback-test$input"), "message");

            expect(styleOf(component.getByTestId("feedback-test$send"))).toMatchObject({ color: "#7e8e8e" });
        });

        it("draws the iOS button separator and footer border from borderColor and borderWidth", async () => {
            const component = await openTodoDialog();

            expect(findByStyle(component, s => s.backgroundColor === "#8f9f9f" && s.width === 3)).toHaveLength(1);
            expect(findByStyle(component, s => s.borderTopColor === "#8f9f9f" && s.borderTopWidth === 3)).toHaveLength(
                1
            );
        });
    });

    describe("dialog", () => {
        it("keeps the shape on the content and moves backgroundColor and opacity to the iOS blur", async () => {
            const component = await openTodoDialog();
            const [content] = findByStyle(component, s => s.borderRadius === 21);

            expect(content).toBeDefined();
            expect(styleOf(content)).not.toHaveProperty("backgroundColor");
            expect(styleOf(content)).not.toHaveProperty("opacity");
            expect(
                findByStyle(
                    component,
                    s => s.position === "absolute" && s.backgroundColor === "#b2b2b2" && s.opacity === 0.9
                )
            ).toHaveLength(1);
        });
    });

    it("applies activityIndicator while sending", async () => {
        fetchMock.mockReturnValue(new Promise(() => undefined));
        const component = render(<Feedback {...props} />);
        fireEvent.press(component.getByTestId("feedback-test$button"));
        fireEvent.changeText(await component.findByTestId("feedback-test$input"), "message");

        fireEvent.press(component.getByTestId("feedback-test$send"));

        await waitFor(() => expect(component.UNSAFE_getByType(ActivityIndicator).props.color).toBe("#a1b1b1"));
    });

    it("covers every style key of the widget", () => {
        expect(Object.keys(themedFixture).sort()).toEqual(
            [
                "activityIndicator",
                "button",
                "buttonDisabled",
                "dialog",
                "floatingButton",
                "switchInput",
                "switchLabel",
                "textAreaInput",
                "title"
            ].sort()
        );
    });
});
