/**
 * Stories for the `client` nanoflow actions.
 *
 * These are the actions whose only job is to call the Mendix client, so the recorded `mx` calls
 * under each result are the actual subject — for `RefreshEntity` or `ToggleSidebar` the resolved
 * value tells you nothing and the call tells you everything.
 *
 * The stub client is installed only for the duration of a call, so nothing here touches the real
 * runtime. `Reload` and `SignOut` would restart a real client; against the stub they just record.
 */
import type { StoryObj } from "@storybook/react-native";
import { Big } from "big.js";
import { ActionRunner } from "../../shared/ActionRunner";
import { fakeMxObject } from "../../shared/mxStub";

const meta = { title: "Nanoflow Commons/Client" };
export default meta;

const ACTIONS = "../../../../packages/jsActions/nanoflow-actions-native/src";

export const Progress: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "ShowProgress returns the identifier HideProgress needs, as a Big. The stub hands out " +
                "1, 2, 3… per run, so each tap shows a fresh id. In a real nanoflow you would pass " +
                "that id to HideProgress; here the ids are independent because every case gets its " +
                "own stub."
            }
            cases={[
                {
                    label: "ShowProgress — blocking",
                    note: "Resolves Big(1) — the id of the dialog it opened.",
                    run: () => require(`${ACTIONS}/client/ShowProgress`).ShowProgress("Loading…", true)
                },
                {
                    label: "ShowProgress — no message",
                    note: "Message is optional; the client picks a default.",
                    run: () => require(`${ACTIONS}/client/ShowProgress`).ShowProgress(undefined, false)
                },
                {
                    label: "HideProgress",
                    note: "Takes the id as a Big and resolves void.",
                    run: () => require(`${ACTIONS}/client/HideProgress`).HideProgress(new Big(1))
                },
                {
                    label: "HideProgress — missing identifier",
                    note: "Required-field guard. Note 0 is a valid id here: the check is == null.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/client/HideProgress`).HideProgress(undefined)
                }
            ]}
        />
    )
};

export const Refreshing: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "RefreshEntity and RefreshObject both resolve true and both do their real work through " +
                "mx.data.update — the recorded call under each result shows which key was sent: an " +
                "entity name for the first, a guid for the second."
            }
            cases={[
                {
                    label: "RefreshEntity",
                    run: () => require(`${ACTIONS}/client/RefreshEntity`).RefreshEntity("NanoflowCommons.Demo")
                },
                {
                    label: "RefreshEntity — missing name",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/client/RefreshEntity`).RefreshEntity("")
                },
                {
                    label: "RefreshObject",
                    note: "Sends the object's guid rather than its entity.",
                    run: () => require(`${ACTIONS}/client/RefreshObject`).RefreshObject(fakeMxObject("guid-1"))
                },
                {
                    label: "RefreshObject — missing object",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/client/RefreshObject`).RefreshObject(undefined as never)
                },
                {
                    label: "ToggleSidebar",
                    note: "Native path: mx.ui.toggleSidebar only. The CustomEvent dispatch is web-only.",
                    run: () => require(`${ACTIONS}/client/ToggleSidebar`).ToggleSidebar()
                },
                {
                    label: "DownloadWebFile — in browser",
                    note: "target=window. Named for the web, but it is just an mx.ui.downloadFile call.",
                    run: () =>
                        require(`${ACTIONS}/client/DownloadWebFile`).DownloadWebFile(fakeMxObject("file-1"), true)
                },
                {
                    label: "DownloadWebFile — to storage",
                    note: "target=internal.",
                    run: () =>
                        require(`${ACTIONS}/client/DownloadWebFile`).DownloadWebFile(fakeMxObject("file-1"), false)
                },
                {
                    label: "DownloadWebFile — missing file",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/client/DownloadWebFile`).DownloadWebFile(undefined)
                }
            ]}
        />
    )
};

export const Environment: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "GetRemoteUrl reads mx.remoteUrl straight off the client — whatever the stub reports. " +
                "IsConnectedToServer is the one action here that really goes out to the network: it " +
                "POSTs to `${mx.remoteUrl}xas/` and returns response.ok. Against the stub's fake " +
                "hostname that request fails, it catches, and answers false — which is the same answer " +
                "a genuinely offline device gives."
            }
            cases={[
                {
                    label: "GetRemoteUrl",
                    run: () => require(`${ACTIONS}/client/GetRemoteUrl`).GetRemoteUrl()
                },
                {
                    label: "IsConnectedToServer",
                    note: "Expect false: the stub's URL does not resolve. Never rejects, by design.",
                    run: () => require(`${ACTIONS}/client/IsConnectedToServer`).IsConnectedToServer()
                }
            ]}
        />
    )
};

export const Confirmation: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "ShowConfirmation on native shows a real Alert and resolves to which button you " +
                "pressed: true for proceed, false for cancel. The dialog is the story — tap, then " +
                "answer it, and check the resolved value matches the button you chose. Captions " +
                "default to Confirmation / Cancel / OK when left empty."
            }
            cases={[
                {
                    label: "ShowConfirmation — custom captions",
                    note: "Resolves true on Delete, false on Keep.",
                    run: () =>
                        require(`${ACTIONS}/client/ShowConfirmation`).ShowConfirmation(
                            "Delete draft?",
                            "This cannot be undone.",
                            "Keep",
                            "Delete"
                        )
                },
                {
                    label: "ShowConfirmation — default captions",
                    note: "Title, cancel and proceed all fall back to their defaults.",
                    run: () =>
                        require(`${ACTIONS}/client/ShowConfirmation`).ShowConfirmation(
                            undefined,
                            "Proceed with the import?",
                            undefined,
                            undefined
                        )
                },
                {
                    label: "ShowConfirmation — missing question",
                    note: "Required-field guard: no dialog appears.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/client/ShowConfirmation`).ShowConfirmation("Title", undefined)
                }
            ]}
        />
    )
};

/**
 * Sign-in, sign-out and reload — the actions that would disrupt a real client.
 *
 * Safe here only because they run against the stub. `Reload` is the odd one: it deliberately returns
 * a promise that never settles, so the nanoflow cannot continue while the client restarts. The
 * runner's button therefore stays busy for good once tapped, which is the correct behaviour rather
 * than a hang — reload the story to get the runner back.
 */
export const Session: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "SignIn resolves an HTTP-ish status as a Big: 200 on success, 401 on bad credentials. " +
                "It short-circuits to 401 without calling the client when either field is empty. " +
                "Passing useAuthToken switches it from mx.login to mx.login2 — visible in the " +
                "recorded call. Passwords are not recorded by the stub."
            }
            cases={[
                {
                    label: "SignIn — success",
                    note: "Stub accepts; resolves Big(200) via mx.login.",
                    run: () => require(`${ACTIONS}/client/SignIn`).SignIn("demo_user", "correct-horse")
                },
                {
                    label: "SignIn — with auth token",
                    note: "Same result, but routed through mx.login2.",
                    run: () => require(`${ACTIONS}/client/SignIn`).SignIn("demo_user", "correct-horse", true)
                },
                {
                    label: "SignIn — empty password",
                    note: "Resolves Big(401) without ever calling the client — note the empty call list.",
                    run: () => require(`${ACTIONS}/client/SignIn`).SignIn("demo_user", "")
                },
                {
                    label: "SignOut — signed in",
                    note: "isGuest false, so it logs out and resolves true.",
                    run: () => require(`${ACTIONS}/client/SignOut`).SignOut()
                }
            ]}
        />
    )
};

export const SessionAsGuest: StoryObj = {
    render: () => (
        <ActionRunner
            mxOptions={{ isGuest: true, loginStatus: 401 }}
            description={
                "The same two actions against a guest session with a client that rejects credentials. " +
                "SignOut resolves false and never calls logout — a guest has no session to end. " +
                "SignIn now resolves Big(401) after actually reaching the client, which is the " +
                "wrong-password path rather than the empty-field short circuit."
            }
            cases={[
                {
                    label: "SignOut — guest",
                    note: "Resolves false; the call list stops at session.isGuest.",
                    run: () => require(`${ACTIONS}/client/SignOut`).SignOut()
                },
                {
                    label: "SignIn — rejected credentials",
                    note: "Resolves Big(401) after mx.login, not before it.",
                    run: () => require(`${ACTIONS}/client/SignIn`).SignIn("demo_user", "wrong")
                }
            ]}
        />
    )
};

export const Reload: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Reload is separated out because it never resolves: it calls mx.reload() and then " +
                "returns a promise that is deliberately left pending, so nothing downstream in the " +
                "nanoflow runs while the client restarts. Tapping it therefore leaves the button " +
                "spinning and posts no result — that is the action working as intended. Reload the " +
                "story to reset. The recorded mx.reload appears in the Metro log."
            }
            cases={[
                {
                    label: "Reload — never settles",
                    note: "Expect a permanently busy button and no result row.",
                    run: () => require(`${ACTIONS}/client/Reload`).Reload()
                }
            ]}
        />
    )
};
