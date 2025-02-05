import { openBrowser } from "@swan-io/react-native-browser";

// BEGIN EXTRA CODE
// (Any extra code can be added here.)
// END EXTRA CODE

/**
 * @param {string} url - This field is required.
 * @param {string} toolbarColor - An optional custom background color for the browser toolbar. For example: 'red' or '#6200EE'.
 * @param {"done" | "close" | "cancel"} iosDismissButtonStyle - iOS only setting. The text that should be used for the button that closes the in-app browser.
 * @param {boolean} androidShowTitle - Android only setting. Not directly supported by @swan-io/react-native-browser.
 * @returns {Promise<void>}
 */
export async function OpenInAppBrowser(
    url?: string,
    toolbarColor?: string,
    iosDismissButtonStyle?: "done" | "close" | "cancel"
): Promise<void> {
    // BEGIN USER CODE
    if (!url) {
        return Promise.reject(new Error("Input parameter 'Url' is required"));
    }

    // Prepare options for openBrowser.
    const options = {
        // The background color for the in-app browser UI.
        barTintColor: toolbarColor,
        // iOS only: specifies the dismiss button style.
        dismissButtonStyle: iosDismissButtonStyle
        // Note: The androidShowTitle option is not supported by this package.
        // You may handle it separately if necessary.
        /*
        animationType?: AnimationType;
        dismissButtonStyle?: DismissButtonStyle;
        barTintColor?: string;
        controlTintColor?: string;
        onOpen?: () => void;
        onClose?: (url?: string) => void;
        */
    };

    try {
        await openBrowser(url, options);
    } catch (error) {
        console.error("Error opening browser:", error);
        throw error;
    }

    return Promise.resolve();
    // END USER CODE
}
