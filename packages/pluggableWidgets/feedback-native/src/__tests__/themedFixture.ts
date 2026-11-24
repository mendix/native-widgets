import { FeedbackStyle } from "../ui/styles";

/**
 * A theme that gives every one of the nine style keys a distinctive value, so a test can check each one reaches
 * the element it is meant for. The keys that carry both style and props (textAreaInput, switchInput, dialog and
 * button) get values on both sides of the split.
 */
export const themedFixture: Partial<FeedbackStyle> = {
    floatingButton: { backgroundColor: "#a1a1a1" },
    dialog: { backgroundColor: "#b2b2b2", opacity: 0.9, borderRadius: 21 },
    title: { color: "#c3c3c3", fontSize: 31 },
    textAreaInput: {
        color: "#d4d4d4",
        fontSize: 17,
        fontFamily: "ThemedFont",
        fontWeight: "700",
        borderColor: "#e5e5e5",
        height: 123,
        placeholderTextColor: "#f6f6f6",
        selectionColor: "#071717",
        underlineColorAndroid: "#182828",
        numberOfLines: 7
    },
    switchLabel: { color: "#293939", fontSize: 19 },
    switchInput: {
        margin: 3,
        trackColorOn: "#3a4a4a",
        trackColorOff: "#4b5b5b",
        thumbColorOn: "#5c6c6c",
        thumbColorOff: "#6d7d7d"
    },
    button: { color: "#7e8e8e", borderColor: "#8f9f9f", borderWidth: 3 },
    buttonDisabled: { color: "#90a0a0" },
    activityIndicator: { color: "#a1b1b1" }
};
