/**
 * Stories for the `other` and `datetime` nanoflow actions.
 *
 * These are the actions with no device dependency: encoding, waiting, arithmetic on dates, and the
 * MxObject helpers. They are the ones whose behaviour is fully determined by their inputs, so each
 * case pins down one branch — including the required-parameter rejections, which are most of what
 * these actions actually contain.
 */
import type { StoryObj } from "@storybook/react-native";
import { Big } from "big.js";
import { ActionRunner } from "../../shared/ActionRunner";
import { fakeMxObject } from "../../shared/mxStub";

const meta = { title: "Nanoflow Commons/Other" };
export default meta;

const ACTIONS = "../../../../packages/jsActions/nanoflow-actions-native/src";

/** A fixed pair of dates, so the difference a story shows is the same on every run. */
const START = new Date("2026-07-01T00:00:00.000Z");
const END = new Date("2026-07-08T06:00:00.000Z"); // 7 days and 6 hours later

export const Base64: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Base64Encode and Base64Decode wrap js-base64. The round trip is the point: encode " +
                "then decode should return the original string, including the non-ASCII case, which " +
                "is where a naive btoa implementation breaks."
            }
            cases={[
                {
                    label: "Base64Encode — ASCII",
                    note: '"Hello Mendix" → SGVsbG8gTWVuZGl4',
                    run: () => require(`${ACTIONS}/other/Base64Encode`).Base64Encode("Hello Mendix")
                },
                {
                    label: "Base64Encode — non-ASCII",
                    note: "Emoji and accents survive because js-base64 encodes UTF-8 first.",
                    run: () => require(`${ACTIONS}/other/Base64Encode`).Base64Encode("café 🚀")
                },
                {
                    label: "Base64Decode — round trip",
                    note: "Decodes what the non-ASCII case above produces; should read café 🚀.",
                    run: () => require(`${ACTIONS}/other/Base64Decode`).Base64Decode("Y2Fmw6kg8J+agA==")
                }
            ]}
        />
    )
};

export const DatesAndWaiting: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "TimeBetween converts a date difference into the requested unit, and rejects when a " +
                "required field is missing. Wait resolves after its delay — tap it and the button " +
                "stays busy for the duration, which is the only visible thing it does."
            }
            cases={[
                {
                    label: "TimeBetween — DAY",
                    note: "1 Jul → 8 Jul 06:00 is 7.25 days.",
                    run: () => require(`${ACTIONS}/datetime/TimeBetween`).TimeBetween(START, END, "DAY")
                },
                {
                    label: "TimeBetween — HOUR",
                    note: "The same span in hours: 174.",
                    run: () => require(`${ACTIONS}/datetime/TimeBetween`).TimeBetween(START, END, "HOUR")
                },
                {
                    label: "TimeBetween — negative",
                    note: "End before start is not an error; the difference is signed.",
                    run: () => require(`${ACTIONS}/datetime/TimeBetween`).TimeBetween(END, START, "HOUR")
                },
                {
                    label: "TimeBetween — unknown unit",
                    note: "Throws rather than returning a wrong number.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/datetime/TimeBetween`).TimeBetween(START, END, "FORTNIGHT" as never)
                },
                {
                    label: "TimeBetween — missing endDate",
                    note: "Required-field guard.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/datetime/TimeBetween`).TimeBetween(START, undefined as never, "DAY")
                },
                {
                    label: "Wait — 1500ms",
                    note: "Resolves void after the delay.",
                    run: () => require(`${ACTIONS}/other/Wait`).Wait(new Big(1500))
                },
                {
                    label: "Wait — missing delay",
                    note: "Required-field guard.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/other/Wait`).Wait(undefined)
                }
            ]}
        />
    )
};

export const Platform: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "GetPlatform branches on globals rather than a build flag. Inside this Storybook it " +
                "should answer Native_mobile: React Native defines navigator.product = 'ReactNative', " +
                "and although it also aliases global.window to global, the cordova check above it " +
                "fails first. GenerateUniqueID reads the session id off mx and keeps a counter in " +
                "AsyncStorage, so consecutive taps return incrementing values."
            }
            cases={[
                {
                    label: "GetPlatform",
                    note: "Expect Native_mobile in this host app.",
                    run: () => require(`${ACTIONS}/other/GetPlatform`).GetPlatform()
                },
                {
                    label: "GenerateUniqueID",
                    note: "sessionId:counter:random — tap twice, the counter moves.",
                    run: () => require(`${ACTIONS}/other/GenerateUniqueID`).GenerateUniqueID()
                }
            ]}
        />
    )
};

export const MxObjectHelpers: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "GetGuid, GetObjectByGuid and FindObjectWithGUID all deal in MxObjects. The stub " +
                "client knows about guid-1 and guid-2 only, so the lookups have both a hit and a " +
                "miss to show. GetObjectByGuid rejects on a miss; FindObjectWithGUID resolves " +
                "undefined, because it is a list search rather than a client call."
            }
            mxOptions={{
                objects: {
                    "guid-1": fakeMxObject("guid-1", { Name: "First", Age: 41 }),
                    "guid-2": fakeMxObject("guid-2", { Name: "Second", Age: 7 })
                }
            }}
            cases={[
                {
                    label: "GetGuid",
                    run: () => require(`${ACTIONS}/other/GetGuid`).GetGuid(fakeMxObject("guid-1", { Name: "First" }))
                },
                {
                    label: "GetGuid — no object",
                    note: "Required-field guard.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/other/GetGuid`).GetGuid(undefined as never)
                },
                {
                    label: "GetObjectByGuid — found",
                    note: "Resolves the object the stub client holds for guid-2.",
                    run: () =>
                        require(`${ACTIONS}/other/GetObjectByGuid`).GetObjectByGuid("NanoflowCommons.Demo", "guid-2")
                },
                {
                    label: "GetObjectByGuid — not found",
                    note: "mx.data.get calls back with nothing, so the action rejects.",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/other/GetObjectByGuid`).GetObjectByGuid("NanoflowCommons.Demo", "missing")
                },
                {
                    label: "FindObjectWithGUID — found",
                    run: () =>
                        require(`${ACTIONS}/other/FindObjectWithGUID`).FindObjectWithGUID(
                            [fakeMxObject("guid-1"), fakeMxObject("guid-2")],
                            "guid-2"
                        )
                },
                {
                    label: "FindObjectWithGUID — absent",
                    note: "Resolves undefined rather than rejecting — it is just Array.find.",
                    run: () =>
                        require(`${ACTIONS}/other/FindObjectWithGUID`).FindObjectWithGUID(
                            [fakeMxObject("guid-1")],
                            "guid-9"
                        )
                }
            ]}
        />
    )
};
