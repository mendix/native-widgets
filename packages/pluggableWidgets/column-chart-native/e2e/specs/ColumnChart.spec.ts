/* eslint-disable jest/no-disabled-tests */
import { element, by } from "detox";
import { expectToMatchScreenshot, launchApp, sessionLogout, tapMenuItem } from "../../../../../detox/src/helpers";

describe("Column chart", () => {
    beforeAll(async () => {
        await launchApp();
        await tapMenuItem("Column chart");
    });

    afterAll(async () => {
        await sessionLogout();
    });
    // Disabling this test since it is not implemented in the Test App
    it.skip("renders correctly", async () => {
        const columnChart = element(by.id("columnChart"));
        await expectToMatchScreenshot(columnChart);
    });
});
