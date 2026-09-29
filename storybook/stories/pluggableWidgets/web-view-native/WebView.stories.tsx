import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "../../../../packages/pluggableWidgets/web-view-native/src/WebView";
import type { WebViewStyle } from "../../../../packages/pluggableWidgets/web-view-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.webview.WebView") as WebViewStyle[];

/**
 * `scroll: false` throughout, and one story per canvas.
 *
 * The widget's container is `flex: 1` with `minHeight: 300`, and the WebView inside is `100%` of it —
 * so inside a ScrollView it either collapses or fights the outer scroll for touches. Stacking two of
 * them in a `StoryRows` would also mean two live browser instances on one screen, which is why the
 * stories here vary one thing each rather than showing rows side by side.
 */
const styles = StyleSheet.create({
    caption: {
        color: variables.contrast.high,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.smaller
    },
    frame: { flex: 1, borderWidth: 1, borderColor: variables.contrast.lower }
});

/** Inline HTML, so most stories need no network. Styled to look deliberate rather than unstyled. */
const page = (heading: string, body: string): string => `
<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="margin:0;padding:16px;font-family:sans-serif;color:#0A1326">
    <h2 style="color:${variables.brand.primary};margin-top:0">${heading}</h2>
    <p>${body}</p>
  </body>
</html>`;

const baseProps = {
    name: "web-view",
    style: atlas,
    content: dynamicValue(page("Inline content", "Rendered from the content property, no network needed.")),
    userAgent: "",
    openLinksExternally: false
};

const meta = {
    title: "Widgets/WebView",
    component: WebView,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof WebView>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * A url instead of inline content.
 *
 * `url` and `content` are alternatives, and `content` wins when both are set — the widget checks the
 * html first. This one needs a network; without one the WebView shows its own error page rather than
 * the widget's, which is worth knowing when a blank story turns up.
 */
export const Url: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        content: undefined,
        url: dynamicValue("https://www.mendix.com"),
        onLoad: actionValue("WebView onLoad")
    }
};

/**
 * Neither url nor content, which is the widget's one error state.
 *
 * It renders "No URL or content was provided." through `errorContainer`/`errorText` — the only part
 * of this widget the theme has anything to say about, so it doubles as the story for those keys.
 * Both an empty string and a still-loading value land here.
 */
export const NoSource: StoryObj<typeof meta> = {
    args: { ...baseProps, content: undefined, url: undefined }
};

/**
 * The error text with the theme's styling replaced, since Atlas leaves it at the default red.
 *
 * `errorText` is a full TextStyle and `errorContainer` a full ViewStyle, so a theme can make this
 * message fit the app instead of shouting. Nothing in Atlas does that yet; this is what it would look
 * like if it did.
 */
export const ErrorStyling: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        content: undefined,
        url: undefined,
        style: atlas.concat([
            {
                errorContainer: {
                    padding: variables.spacing.large,
                    backgroundColor: variables.brand.dangerLight,
                    borderRadius: 8
                },
                errorText: { color: variables.brand.danger, fontWeight: "normal" }
            } as WebViewStyle
        ])
    }
};

/**
 * `postMessage` from the page, written back into an attribute.
 *
 * This is the only two-way channel the widget has: the page calls
 * `window.ReactNativeWebView.postMessage(...)`, the widget pushes that string into `onMessageInput`
 * and then fires `onMessage`. Both halves matter — an app that sets the action but not the attribute
 * gets the callback with no payload. The caption above shows what has arrived so far.
 */
export const Messaging: StoryObj<typeof WebView> = {
    render: () => {
        const [received, setReceived] = useState("");
        return (
            <View style={{ flex: 1 }}>
                <Text style={styles.caption}>
                    {received ? `onMessageInput now holds: ${received}` : "Tap the button inside the page."}
                </Text>
                <View style={styles.frame}>
                    <WebView
                        {...baseProps}
                        content={dynamicValue(`
                            <!DOCTYPE html>
                            <html>
                              <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
                              <body style="margin:0;padding:16px;font-family:sans-serif">
                                <button
                                  style="padding:12px 16px;font-size:16px;background:${variables.brand.primary};color:#fff;border:0;border-radius:6px"
                                  onclick="window.ReactNativeWebView.postMessage('hello from the page at ' + new Date().toLocaleTimeString())">
                                  postMessage
                                </button>
                              </body>
                            </html>`)}
                        onMessageInput={editableValue<string>(received, setReceived)}
                        onMessage={actionValue("WebView onMessage")}
                    />
                </View>
            </View>
        );
    }
};

/**
 * `openLinksExternally`, which behaves differently for html than for a url.
 *
 * With inline content the widget hands *any* http(s) navigation to the OS browser, so every link
 * leaves the app. With a `url` it compares against the current one and only leaves for a different
 * host — so in-page navigation stays put. Same flag, two rules, and the html case is the surprising
 * one. Tapping the link below should open the system browser and leave this canvas untouched.
 */
export const OpenLinksExternally: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        openLinksExternally: true,
        content: dynamicValue(
            page(
                "External links",
                'With inline content every http link leaves the app: <a href="https://www.mendix.com">mendix.com</a>'
            )
        )
    }
};

/** A custom user agent, which the page can read back — the only way to confirm it took effect. */
export const UserAgent: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        userAgent: "MendixStorybook/1.0 (custom user agent)",
        content: dynamicValue(`
            <!DOCTYPE html>
            <html>
              <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
              <body style="margin:0;padding:16px;font-family:sans-serif">
                <h2 style="color:${variables.brand.primary};margin-top:0">navigator.userAgent</h2>
                <pre id="ua" style="white-space:pre-wrap"></pre>
                <script>document.getElementById("ua").textContent = navigator.userAgent;</script>
              </body>
            </html>`)
    }
};

/**
 * `onError`, which fires for a page that cannot be reached.
 *
 * Not the same as the no-source state above: the widget renders a WebView either way and the error
 * comes from the platform, so what shows is the browser's own failure page. `.invalid` is reserved
 * by RFC 2606 and never resolves, so this is reliable without depending on a site being down.
 */
export const LoadError: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        content: undefined,
        url: dynamicValue("https://this-host-does-not-exist.invalid"),
        onError: actionValue("WebView onError")
    }
};

/**
 * No Atlas variants story: Atlas's entry for this widget is effectively empty.
 *
 * `com_mendix_widget_native_webview_WebView` sets only the error text's font, leaving `container` and
 * `errorContainer` blank, and there are no design-property classes — a web view's contents are the
 * page's business. `ErrorStyling` above stands in for what a theme could do here.
 */
