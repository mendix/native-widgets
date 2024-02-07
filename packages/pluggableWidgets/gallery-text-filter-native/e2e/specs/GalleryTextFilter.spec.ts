/* eslint-disable jest/no-disabled-tests */
import { element, by } from "detox";
import {
    expectToMatchScreenshot,
    launchApp,
    sessionLogout,
    setText,
    tapMenuItem
} from "../../../../../detox/src/helpers";

describe("Gallery Text Filter", () => {
    beforeEach(async () => {
        await launchApp();
        await tapMenuItem("Gallery");
        await element(by.id("galleryTextFilterButton")).tap();
    });

    afterEach(async () => {
        await sessionLogout();
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("renders correctly", async () => {
        const gallery = element(by.id("gallery"));
        await expectToMatchScreenshot(gallery);
    });

    it.skip("filters by text", async () => {
        const gallery = element(by.id("gallery"));
        const filterTextBox = element(by.id("textFilter1-text-input"));
        await setText(filterTextBox, "Title 5");
        await expectToMatchScreenshot(gallery);
    });

    it.skip("filters by text empty list", async () => {
        const gallery = element(by.id("gallery"));
        const filterTextBox = element(by.id("textFilter1-text-input"));
        await setText(filterTextBox, "Title 100");
        await expectToMatchScreenshot(gallery);
    });
});
