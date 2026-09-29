/**
 * Stories for the `local-storage` nanoflow actions.
 *
 * These run for real: AsyncStorage is one of the few native modules this host app links, so a value
 * written by one case is genuinely readable by the next. That makes ordering meaningful — the
 * stories are written to be tapped top to bottom, and the "before writing" cases only show their
 * intended branch on a first run.
 *
 * `navigator.product === "ReactNative"` holds here, so every action takes its AsyncStorage path;
 * the `window.localStorage` fallbacks in these files are web-only and are not reachable from this
 * host app.
 */
import type { StoryObj } from "@storybook/react-native";
import { ActionRunner } from "../../shared/ActionRunner";
import { fakeMxObject } from "../../shared/mxStub";

const meta = { title: "Nanoflow Commons/Local storage" };
export default meta;

const ACTIONS = "../../../../packages/jsActions/nanoflow-actions-native/src";

const STRING_KEY = "story.string";
const OBJECT_KEY = "story.object";
const LIST_KEY = "story.objectList";

export const Strings: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Set, check, read and remove a string. Tap in order: 'exists — before' answers false " +
                "only until the value is written, and 'get — after remove' rejects because a missing " +
                "key is an error for Get but merely false for Exists. Note that SetStorageItemString " +
                'rejects an empty value: the guard is falsy-based, so "" is treated as absent.'
            }
            cases={[
                {
                    label: "StorageItemExists — before",
                    note: "false on a first run; true if you have already written below.",
                    run: () => require(`${ACTIONS}/local-storage/StorageItemExists`).StorageItemExists(STRING_KEY)
                },
                {
                    label: "SetStorageItemString",
                    note: `Writes "stored by story" to ${STRING_KEY}.`,
                    run: () =>
                        require(`${ACTIONS}/local-storage/SetStorageItemString`).SetStorageItemString(
                            STRING_KEY,
                            "stored by story"
                        )
                },
                {
                    label: "GetStorageItemString",
                    note: "Reads the value back.",
                    run: () => require(`${ACTIONS}/local-storage/GetStorageItemString`).GetStorageItemString(STRING_KEY)
                },
                {
                    label: "SetStorageItemString — empty value",
                    note: "Rejects: the required-field guard treats an empty string as missing.",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/local-storage/SetStorageItemString`).SetStorageItemString(STRING_KEY, "")
                },
                {
                    label: "GetStorageItemString — missing key",
                    note: "A key that was never written rejects rather than resolving null.",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/local-storage/GetStorageItemString`).GetStorageItemString(
                            "story.neverWritten"
                        )
                },
                {
                    label: "RemoveStorageItem",
                    note: "Resolves true. Removing an absent key also resolves true.",
                    run: () => require(`${ACTIONS}/local-storage/RemoveStorageItem`).RemoveStorageItem(STRING_KEY)
                },
                {
                    label: "GetStorageItemString — after remove",
                    note: "Rejects again, confirming the remove landed.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/local-storage/GetStorageItemString`).GetStorageItemString(STRING_KEY)
                },
                {
                    label: "GetStorageItemString — missing key param",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/local-storage/GetStorageItemString`).GetStorageItemString(undefined)
                }
            ]}
        />
    )
};

/**
 * Objects, where the round trip is lossy in a way worth seeing.
 *
 * Set serializes an MxObject to `{ guid, ...attributes }`. Get parses that back, asks the client for
 * the guid, and — because the stub client does not know a guid it never created — takes the
 * re-create branch, so the object that comes back has a *different* guid to the one stored. That is
 * the documented behaviour ("the Mendix Object ID will never be the same"), and it is visible here:
 * write guid-1, read back created-1.
 */
export const Objects: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Write an MxObject then read it back. The guid changes on the way back — the stored " +
                "guid is not in the client, so Get re-creates the object from the stored attributes. " +
                "Get also rewrites the entry with the new guid, so a second Get returns a third guid."
            }
            cases={[
                {
                    label: "SetStorageItemObject",
                    note: "Stores guid-1 with Name/Age attributes.",
                    run: () =>
                        require(`${ACTIONS}/local-storage/SetStorageItemObject`).SetStorageItemObject(
                            OBJECT_KEY,
                            fakeMxObject("guid-1", { Name: "Stored", Age: 41 })
                        )
                },
                {
                    label: "GetStorageItemObject",
                    note: "Re-created: attributes survive, guid does not.",
                    run: () =>
                        require(`${ACTIONS}/local-storage/GetStorageItemObject`).GetStorageItemObject(
                            OBJECT_KEY,
                            "NanoflowCommons.Demo"
                        )
                },
                {
                    label: "GetStorageItemObject — missing entity",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/local-storage/GetStorageItemObject`).GetStorageItemObject(
                            OBJECT_KEY,
                            undefined
                        )
                },
                {
                    label: "SetStorageItemObjectList",
                    note: "Stores two objects under one key.",
                    run: () =>
                        require(`${ACTIONS}/local-storage/SetStorageItemObjectList`).SetStorageItemObjectList(
                            LIST_KEY,
                            [fakeMxObject("guid-1", { Name: "One" }), fakeMxObject("guid-2", { Name: "Two" })]
                        )
                },
                {
                    label: "GetStorageItemObjectList",
                    note: "Both come back re-created, in order.",
                    run: () =>
                        require(`${ACTIONS}/local-storage/GetStorageItemObjectList`).GetStorageItemObjectList(
                            LIST_KEY,
                            "NanoflowCommons.Demo"
                        )
                },
                {
                    label: "GetStorageItemObjectList — missing key",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/local-storage/GetStorageItemObjectList`).GetStorageItemObjectList(
                            "story.noList",
                            "NanoflowCommons.Demo"
                        )
                }
            ]}
        />
    )
};

/**
 * The create-failure case needs its own story: `failCreate` is set per-runner, not per-case.
 */
export const ObjectCreateFailure: StoryObj = {
    render: () => (
        <ActionRunner
            mxOptions={{ failCreate: true }}
            description={
                "The same read as above, but with a client that fails every create. Run " +
                "SetStorageItemObject in the 'Objects' story first so there is something stored to " +
                "read; without it the rejection is the 'does not exist' one instead."
            }
            cases={[
                {
                    label: "GetStorageItemObject — create fails",
                    note: "Rejects with 'Could not create ... object'.",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/local-storage/GetStorageItemObject`).GetStorageItemObject(
                            OBJECT_KEY,
                            "NanoflowCommons.Demo"
                        )
                }
            ]}
        />
    )
};

export const SessionAndClearing: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "ClearCachedSessionData delegates to the client and is recorded below. " +
                "ClearLocalStorage calls the bare global `localStorage`, which React Native does not " +
                "define — it catches the ReferenceError and resolves false rather than throwing, so " +
                "'resolved: false' is the correct native result, not a failure of the story."
            }
            cases={[
                {
                    label: "ClearCachedSessionData",
                    note: "Watch the recorded mx call underneath the result.",
                    run: () => require(`${ACTIONS}/local-storage/ClearCachedSessionData`).ClearCachedSessionData()
                },
                {
                    label: "ClearLocalStorage",
                    note: "Expect false on native: there is no localStorage global.",
                    run: () => require(`${ACTIONS}/local-storage/ClearLocalStorage`).ClearLocalStorage()
                }
            ]}
        />
    )
};
