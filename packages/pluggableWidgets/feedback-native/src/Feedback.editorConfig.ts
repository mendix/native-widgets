import { Properties, hidePropertyIn, Problem } from "@mendix/pluggable-widgets-tools";

import { FeedbackPreviewProps } from "../typings/FeedbackProps";

export function getProperties(values: FeedbackPreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }
    return defaultProperties;
}

export function check(values: FeedbackPreviewProps): Problem[] {
    const errors: Problem[] = [];
    if (values.accessible === "yes" && !values.screenReaderCaption) {
        errors.push({
            property: "screenReaderCaption",
            severity: "error",
            message: "Screen reader caption cannot be empty.",
            url: ""
        });
    }
    return errors;
}
