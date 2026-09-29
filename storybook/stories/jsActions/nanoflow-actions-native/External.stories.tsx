/**
 * Stories for the `external` nanoflow actions.
 *
 * These leave the app: they build a URL and hand it to `Linking`, or open the native share sheet.
 * They are the group where a story earns its keep, because the interesting part is the URL that
 * gets built from the inputs — the encoding of a phone number, how DraftEmail assembles its query
 * string — and a story can show that a device is willing to open it.
 *
 * Tapping these really does switch app. `canOpenURL` returning false is a normal outcome on an
 * emulator with no dialler, mail client or maps app installed, and the action resolves false rather
 * than rejecting; that is a property of the device, not a bug in the action.
 */
import type { StoryObj } from "@storybook/react-native";
import { ActionRunner } from "../../shared/ActionRunner";

const meta = { title: "Nanoflow Commons/External" };
export default meta;

const ACTIONS = "../../../../packages/jsActions/nanoflow-actions-native/src";

export const PhoneAndMessaging: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "CallPhoneNumber builds tel: and SendTextMessage builds sms:, both via encodeURI, so " +
                "the spaces and + in an international number survive. Each resolves true once the OS " +
                "accepts the URL, or false if nothing on the device can open it — on an emulator " +
                "without a dialler, false is the expected answer."
            }
            cases={[
                {
                    label: "CallPhoneNumber — international",
                    note: "tel:+31 20 123 4567 — opens the dialler if one exists.",
                    run: () => require(`${ACTIONS}/external/CallPhoneNumber`).CallPhoneNumber("+31 20 123 4567")
                },
                {
                    label: "CallPhoneNumber — missing number",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/external/CallPhoneNumber`).CallPhoneNumber(undefined)
                },
                {
                    label: "SendTextMessage",
                    note: "sms:+31201234567 — opens the messaging app.",
                    run: () => require(`${ACTIONS}/external/SendTextMessage`).SendTextMessage("+31201234567")
                },
                {
                    label: "SendTextMessage — missing number",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/external/SendTextMessage`).SendTextMessage(undefined)
                }
            ]}
        />
    )
};

export const Email: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "DraftEmail concatenates a mailto: URL from whichever fields are filled, then trims the " +
                "trailing separator. Worth knowing: the recipient is joined with '?' and every " +
                "subsequent field with '&', so a call with cc but no recipient produces " +
                "'mailto:cc=…' — a malformed URL the OS will refuse. The cases below cover both the " +
                "full form and that edge."
            }
            cases={[
                {
                    label: "DraftEmail — all fields",
                    note: "Recipient, cc, bcc, subject and body; note the URL-encoded body.",
                    run: () =>
                        require(`${ACTIONS}/external/DraftEmail`).DraftEmail(
                            "someone@example.com",
                            "cc@example.com",
                            "bcc@example.com",
                            "Nanoflow Commons",
                            "Sent from a Storybook story.\nSecond line."
                        )
                },
                {
                    label: "DraftEmail — recipient only",
                    note: "Trailing '?' is trimmed, leaving mailto:someone@example.com.",
                    run: () => require(`${ACTIONS}/external/DraftEmail`).DraftEmail("someone@example.com")
                },
                {
                    label: "DraftEmail — no arguments",
                    note: "Resolves rather than rejecting: it opens a bare 'mailto' with no fields.",
                    run: () => require(`${ACTIONS}/external/DraftEmail`).DraftEmail()
                },
                {
                    label: "DraftEmail — cc without recipient",
                    note: "Builds 'mailto:cc=…' with no '?'; expect the OS to decline it.",
                    run: () =>
                        require(`${ACTIONS}/external/DraftEmail`).DraftEmail(
                            undefined,
                            "cc@example.com",
                            undefined,
                            "No recipient"
                        )
                }
            ]}
        />
    )
};

export const Maps: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "OpenMap shows a place; NavigateTo asks for directions to it. Both pick their URL " +
                "scheme by platform — on Android geo: and google.navigation:, on iOS maps://. Both " +
                "accept either a free-text address or a lat,long pair."
            }
            cases={[
                {
                    label: "OpenMap — address",
                    note: "geo:0,0?q=… on Android, maps://?q=… on iOS.",
                    run: () => require(`${ACTIONS}/external/OpenMap`).OpenMap("Gustav Mahlerplein 2, Amsterdam")
                },
                {
                    label: "OpenMap — coordinates",
                    run: () => require(`${ACTIONS}/external/OpenMap`).OpenMap("52.3376,4.8916")
                },
                {
                    label: "OpenMap — missing location",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/external/OpenMap`).OpenMap(undefined)
                },
                {
                    label: "NavigateTo — address",
                    note: "google.navigation:q=… on Android, maps://?daddr=… on iOS.",
                    run: () => require(`${ACTIONS}/external/NavigateTo`).NavigateTo("Gustav Mahlerplein 2, Amsterdam")
                },
                {
                    label: "NavigateTo — missing location",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/external/NavigateTo`).NavigateTo(undefined)
                }
            ]}
        />
    )
};

export const Sharing: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Share opens the native share sheet and resolves true unless you dismiss it, in which " +
                "case it resolves false — so the two outcomes are worth trying deliberately: share " +
                "once, then swipe the sheet away and compare. When both text and url are given they " +
                "are combined into one message; url alone uses the url field, which on iOS is what " +
                "makes a target offer a link preview. At least one of the two is required."
            }
            cases={[
                {
                    label: "Share — text and url",
                    note: "Combined into 'text\\nurl' as the message.",
                    run: () =>
                        require(`${ACTIONS}/external/Share`).Share(
                            "https://github.com/mendix/native-widgets",
                            "Native widgets for Mendix",
                            "Nanoflow Commons"
                        )
                },
                {
                    label: "Share — url only",
                    note: "Uses the url field rather than message.",
                    run: () => require(`${ACTIONS}/external/Share`).Share("https://github.com/mendix/native-widgets")
                },
                {
                    label: "Share — text only",
                    run: () => require(`${ACTIONS}/external/Share`).Share(undefined, "Shared from a Storybook story")
                },
                {
                    label: "Share — neither",
                    note: "Required-field guard: needs text or url.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/external/Share`).Share()
                }
            ]}
        />
    )
};

export const Urls: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "OpenURL hands the URL to Linking on native — note that the mx.data.closeDbConnection " +
                "call in this action is on the web branch only, so nothing is recorded here. Tapping " +
                "the https case leaves Storybook for the browser; come back with the app switcher."
            }
            cases={[
                {
                    label: "OpenURL — https",
                    note: "Opens the browser.",
                    run: () =>
                        require(`${ACTIONS}/external/OpenURL`).OpenURL("https://github.com/mendix/native-widgets")
                },
                {
                    label: "OpenURL — unhandled scheme",
                    note: "Nothing claims mendix-story://; resolves false instead of rejecting.",
                    run: () => require(`${ACTIONS}/external/OpenURL`).OpenURL("mendix-story://nowhere")
                },
                {
                    label: "OpenURL — missing url",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/external/OpenURL`).OpenURL(undefined)
                }
            ]}
        />
    )
};
