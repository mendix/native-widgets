import {
    expectToMatchScreenshot,
    launchApp,
    sessionLogout,
    setText,
    tapMenuItem
} from "../../../../../detox/src/helpers";
import { element, by, waitFor } from "detox";

describe("Feedback widget", () => {
    const widgetName = "feedback";

    beforeEach(async () => {
        await launchApp();
        await tapMenuItem("Feedback");
    });

    afterEach(async () => {
        await sessionLogout();
    });

    it("should be able to submit a feedback item", async () => {
        await expectToMatchScreenshot(element(by.id(`${widgetName}$button`)));

        await element(by.id(`${widgetName}$button`)).tap();
        await expectToMatchScreenshot();

        await setText(element(by.id(`${widgetName}$input`)), "e2e test for feedback widget");
        await element(by.id(`${widgetName}$send`)).tap();

        await waitFor(element(by.text("Feedback successfully sent")))
            .toBeVisible()
            .withTimeout(5000);
    });
});
