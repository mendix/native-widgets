import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feedback } from "../../../../packages/pluggableWidgets/feedback-native/src/Feedback";
import type { FeedbackStyle } from "../../../../packages/pluggableWidgets/feedback-native/src/ui/styles";
import { dynamicValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Pressing **Send** in these stories really does POST to Mendix's live feedback API —
 * `https://feedback-api.mendix.com/rest/v3/feedbackapi/projects/<appId>/issues` — because the widget
 * has no test mode and `sendToSprintr` is not injectable. Every story below therefore passes a
 * deliberately invalid App ID, so the request 404s and the widget shows its error dialog instead of
 * filing an issue against a real project. **Cancel** never sends anything.
 *
 * That is also the only way to see the error path, so it is a story in its own right rather than just a
 * caveat: `ErrorPath` below is the same configuration with the failure spelled out.
 *
 * Two more things shape how these stories are built.
 *
 * The button is `position: absolute, right: 0` at `marginTop: deviceHeight / 2 - 100` and `zIndex:
 * 9999` — halfway down the *screen*, not down whatever contains it, and measured from `Dimensions`
 * rather than from a layout. So it cannot be boxed into a story row the way the floating action button
 * can: on a phone it lands mid-screen on the right edge whatever is wrapped around it. The rows below
 * describe each variant and the button they refer to floats at that fixed spot; only one story at a
 * time is on screen, so there is no ambiguity about which is which.
 *
 * And the widget reads `props.style` **once**, in field initialisers on the instance
 * (`flattenStyles(...)` and `processStyles(...)` are assigned as class properties), so a style change
 * never reaches an already-mounted instance. Storybook remounts between stories, so this is invisible
 * here — but it means an app cannot restyle this widget at runtime.
 */
const atlas = atlasStyle("com.mendix.widget.native.feedback.Feedback") as FeedbackStyle[];

/**
 * Not a real App ID.
 *
 * A real one is a project uuid from Settings > General in the Developer Portal, and supplying one here
 * would mean these stories file issues into somebody's backlog every time a reviewer taps Send.
 */
const invalidAppId = "storybook-not-a-real-app-id";

const styles = StyleSheet.create({
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    }
});

const baseProps = {
    name: "feedback",
    style: atlas,
    sprintrapp: invalidAppId,
    allowScreenshot: true
};

const meta = {
    title: "Widgets/Feedback",
    component: Feedback,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Feedback>;

export default meta;

/**
 * The default configuration: a comment-bubble tab on the right edge, halfway down the screen.
 *
 * Tapping it captures a screenshot and then opens the dialog — the capture comes first, so the shot is
 * of the page as it was rather than of the dialog. **Send** is disabled until the message has a
 * non-blank character, which is `feedbackMessage.trim().length === 0` and so a message of only spaces
 * stays disabled.
 *
 * The tab's own artwork is a base64 PNG compiled into the widget, not a themeable asset; only the tile
 * behind it (`floatingButton`) comes from the theme, which is where Atlas's rounded left corners and
 * shadow come from.
 *
 * `args` as well as a `render`, unlike the stories below: the args feed Storybook's controls panel.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps,
    render: args => (
        <View>
            <Text style={styles.note}>
                The tab is on the right edge, halfway down the screen. Send will fail on purpose — see the file comment.
            </Text>
            <Feedback {...args} />
        </View>
    )
};

/**
 * `allowScreenshot: false`, which removes more than the toggle.
 *
 * The switch row disappears from the dialog, and `getScreenshot` also returns early without calling
 * `captureScreen` at all — so the dialog opens noticeably faster, and no image is ever held in state.
 * The widget's own documentation frames this as the setting for apps that may not transmit screen
 * contents for legal reasons, and this is what those apps get.
 */
export const WithoutScreenshot: StoryObj<typeof Feedback> = {
    render: () => (
        <View>
            <Text style={styles.note}>allowScreenshot: false — no toggle in the dialog, and no capture taken.</Text>
            <Feedback {...baseProps} allowScreenshot={false} />
        </View>
    )
};

/**
 * A custom logo on the tab.
 *
 * `logo` is an image prop and replaces the built-in bubble; the widget renders it through Mendix's own
 * `Image` component at a fixed 30×30 with `resizeMode: "contain"` and a 5pt margin, none of which the
 * theme can change — so an image of any aspect ratio is letterboxed into that square. The widget's
 * documentation asks for 90×90, which is that 30pt box at 3× density.
 */
export const CustomLogo: StoryObj<typeof Feedback> = {
    render: () => (
        <View>
            <Text style={styles.note}>A bundled PNG instead of the built-in bubble, in the same 30×30 box.</Text>
            <Feedback {...baseProps} logo={dynamicValue(require("../../shared/assets/star-filled.png"))} />
        </View>
    )
};

/**
 * Every caption the widget exposes, replaced.
 *
 * All of them are optional text templates with an English default baked into the widget, so an app that
 * sets none of them is still readable but is also stuck in English — the defaults do not go through the
 * app's language. Overriding them, as here, is how the dialog gets translated.
 *
 * `titleResult` captions both the success and the error dialog, so it cannot say "Thanks!" — it has to
 * be neutral enough for a failure too, which is what makes it awkward to translate well.
 */
export const CustomCaptions: StoryObj<typeof Feedback> = {
    render: () => (
        <View>
            <Text style={styles.note}>All captions replaced. titleResult has to work for success and failure.</Text>
            <Feedback
                {...baseProps}
                titleSendFeedback={dynamicValue("Tell us what went wrong")}
                titleSending={dynamicValue("Sending your report…")}
                titleResult={dynamicValue("Feedback")}
                labelFeedbackInput={dynamicValue("What were you trying to do?")}
                labelIncludeScreenshot={dynamicValue("Attach a screenshot of this page")}
                buttonCancel={dynamicValue("Not now")}
                buttonSend={dynamicValue("Submit")}
                buttonOk={dynamicValue("Close")}
                messageSuccess={dynamicValue("Thanks — the team has it.")}
                messageError={dynamicValue("That did not go through. Please try again later.")}
                accessibilityLabelFeedbackButton={dynamicValue("Report a problem with this page")}
            />
        </View>
    )
};

/**
 * The dialog, restyled.
 *
 * `textAreaInput` is the interesting entry: it is not a plain style but a mix of style properties and
 * `TextInput` *props*, which `processStyles` splits apart by key —
 * `placeholderTextColor`, `selectionColor`, `underlineColorAndroid` and `numberOfLines` are pulled out
 * and passed as props, and everything else stays a style. So `numberOfLines: 8` belongs in the theme
 * here, which is not where anyone would look for it. The same object also supplies the success and
 * error text's colour and font, via a second `only(...)` pass over four typography keys — restyling the
 * input therefore restyles the result dialogs' body text too.
 *
 * `switchInput` works the same way, with four non-standard keys (`trackColorOn/Off`,
 * `thumbColorOn/Off`) split out and handed to `Switch`'s own colour props.
 *
 * `button` accepts exactly three properties — `color`, `borderColor`, `borderWidth` — and the last two
 * are iOS-only, where they draw the dialog's footer separators. `buttonDisabled.color` is used only for
 * Send while the message is blank.
 */
export const DialogStyling: StoryObj<typeof Feedback> = {
    render: () => (
        <View>
            <Text style={styles.note}>A taller input, a danger-coloured switch, and brand-coloured buttons.</Text>
            <Feedback
                {...baseProps}
                style={atlas.concat([
                    {
                        floatingButton: {
                            backgroundColor: variables.brand.primary,
                            borderBottomLeftRadius: variables.border.radiusLarge,
                            borderTopLeftRadius: variables.border.radiusLarge
                        },
                        dialog: { backgroundColor: variables.background.primary },
                        title: { color: variables.brand.primary, fontSize: variables.font.sizeH5, fontWeight: "bold" },
                        textAreaInput: {
                            borderColor: variables.brand.primary,
                            borderRadius: variables.border.radiusLarge,
                            color: variables.font.colorTitle,
                            height: 140,
                            // Split out and passed as TextInput props, not applied as styles.
                            numberOfLines: 8,
                            placeholderTextColor: variables.contrast.regular
                        },
                        switchLabel: { color: variables.font.colorTitle, fontWeight: "bold" },
                        switchInput: {
                            trackColorOn: variables.brand.danger,
                            trackColorOff: variables.contrast.lower,
                            thumbColorOn: variables.background.primary,
                            thumbColorOff: variables.contrast.regular
                        },
                        button: { color: variables.brand.primary },
                        buttonDisabled: { color: variables.contrast.lower },
                        activityIndicator: { color: variables.brand.primary }
                    }
                ] as FeedbackStyle[])}
            />
        </View>
    )
};

/**
 * The failure path, which is what every story here actually reaches.
 *
 * `sendToSprintr` resolves `false` for any non-ok response *and* for a rejected fetch, so a 404 from a
 * bad App ID and a device with no network are indistinguishable to the widget — both land on
 * `messageError` with nothing to say which. There is no retry and the typed message is cleared either
 * way, so a user whose network dropped loses what they wrote.
 *
 * Type something, press Send, and the "Sending..." dialog appears briefly before the error. The two are
 * sequenced through a `closingDialog` state and a double `requestAnimationFrame`, because
 * `react-native-dialog` cannot swap contents while its close animation runs — hence the visible pause.
 */
export const ErrorPath: StoryObj<typeof Feedback> = {
    render: () => (
        <StoryRows>
            <StoryRow label="Send with an invalid App ID — the error dialog, with a real request behind it">
                <Text style={styles.note}>
                    The POST goes out and comes back 404. A dropped network looks identical to the widget, and the typed
                    message is discarded in both cases.
                </Text>
                <Feedback
                    {...baseProps}
                    titleSending={dynamicValue("Sending — watch for the pause")}
                    messageError={dynamicValue("Could not send. The App ID is invalid, which is deliberate here.")}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * No Atlas variants story, and no story for the success dialog.
 *
 * `com_mendix_widget_native_feedback_Feedback` is the only entry Atlas exports — there are no
 * design-property classes — and `DialogStyling` above covers what it can reach.
 *
 * The success dialog is not reachable from a story on purpose: it needs a real App ID and a POST that
 * actually files an issue. It is one line different from the error dialog — `messageSuccess` in place of
 * `messageError`, same title, same OK button — so `CustomCaptions` shows the text it would use.
 */
