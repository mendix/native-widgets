import { expectToMatchScreenshot, launchApp, sessionLogout, tapMenuItem } from "../../../../../detox/src/helpers";
import { Alert } from "../../../../../detox/src/Alert";
import { expect, element, by, waitFor } from "detox";

describe("Background image", () => {
    beforeEach(async () => {
        await launchApp();
        await tapMenuItem("Background image");
    });

    afterEach(async () => {
        await sessionLogout();
    });

    it("renders the static images", async () => {
        const btnStaticImages = element(by.id("btnStaticImages"));
        await btnStaticImages.tap();

        await expectToMatchScreenshot();
    });

    it("renders the static svg images", async () => {
        const btnStaticSvgImages = element(by.id("btnStaticSvgImages"));
        await btnStaticSvgImages.tap();

        await expectToMatchScreenshot();
    });

    it("renders the dynamic image", async () => {
        const btnDynamicImage = element(by.id("btnDynamicImage"));
        await btnDynamicImage.tap();

        const dynamicImage = element(by.id("dynamicImageText"));
        await waitFor(dynamicImage).toBeVisible().withTimeout(10000);

        await expectToMatchScreenshot();
    });

    /**
     * Disabled this test becausae it fails on CI.
     * Tried to fix it, but the file that is used in the Java action
     * can not be found on CI. It looks like the file is there, but maybe
     * the contect is different sinsce we use a .mda file and thus
     * not have the deployment folder.
     */
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("renders the dynamic svg image", async () => {
        const btnDynamicSvgImage = element(by.id("btnDynamicSvgImage"));
        await btnDynamicSvgImage.tap();

        const dynamicImage = element(by.id("dynamicSvgImageText"));
        await waitFor(dynamicImage).toBeVisible().withTimeout(10000);

        await expectToMatchScreenshot();
    });

    it("renders the dynamic image with conditional visibility", async () => {
        const btnConditionalBgImage = element(by.id("btnConditionalBgImage"));
        await btnConditionalBgImage.tap();

        const checkboxImage = element(by.id("checkboxImage"));
        await checkboxImage.tap();

        await expectToMatchScreenshot();
    });

    it("renders the nested background image", async () => {
        const btnConditionalBgImage = element(by.id("btnNestedBgImage"));
        await btnConditionalBgImage.tap();

        await expectToMatchScreenshot();
    });

    it("renders the background image in a layout grid", async () => {
        const btnConditionalBgImage = element(by.id("btnLayoutGridBgImage"));
        await btnConditionalBgImage.tap();

        await expectToMatchScreenshot();
    });

    it("renders the background image with clickable container", async () => {
        const btnConditionalBgImage = element(by.id("btnClickableBgImage"));
        await btnConditionalBgImage.tap();
        await expectToMatchScreenshot();

        const clickableContainer = element(by.id("clickableContainer"));
        await clickableContainer.tap();

        const alert = Alert();
        await expect(alert.messageElement).toHaveText("Container clicked!");
    });
});
