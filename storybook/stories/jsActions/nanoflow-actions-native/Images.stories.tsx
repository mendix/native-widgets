/**
 * Story for `Base64DecodeToImage`.
 *
 * Kept apart from the other `other` actions because of what it depends on. react-native-blob-util is
 * linked here, so the import succeeds — but the action also needs `NativeModules.MxFileSystem`, which
 * only the Mendix native shell provides. That one cannot be installed by adding a package: it is
 * part of the host app you deploy into, so the write path is only reachable inside a real Mendix app.
 *
 * The action swallows that failure rather than surfacing it: the native branch catches everything and
 * resolves `false`, logging "Failed to decode base64 to image". So the two real cases resolve false
 * here, which is the action's documented behaviour and not a crash. Only the input guards reject.
 *
 * The require stays inside each case thunk anyway: blob-util's fs module calls `getConstants()` on
 * its native binding while being imported, so if this app ever stops linking it, the failure would
 * happen at import time — and Storybook evaluates every story module at startup, which would take
 * the whole app down instead of failing one row.
 */
import type { StoryObj } from "@storybook/react-native";
import { ActionRunner } from "../../shared/ActionRunner";
import { fakeMxObject } from "../../shared/mxStub";

const meta = { title: "Nanoflow Commons/Images" };
export default meta;

const ACTIONS = "../../../../packages/jsActions/nanoflow-actions-native/src";

// A 1x1 transparent PNG — the smallest valid input that still exercises the decode path.
const PNG_1X1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export const Base64DecodeToImage: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Base64DecodeToImage writes a decoded PNG into a System.Image object. " +
                "react-native-blob-util is linked here, but the action also needs " +
                "NativeModules.MxFileSystem, which only the Mendix native shell provides — so the " +
                "write path is not reachable outside a real Mendix app no matter what is installed. " +
                "The action catches that and resolves false rather than rejecting, so the first two " +
                "cases resolve false: that is the documented behaviour, and worth knowing, because a " +
                "nanoflow calling this action gets no error to branch on. Only the input guards throw."
            }
            cases={[
                {
                    label: "Base64DecodeToImage — 1x1 PNG",
                    note: "Resolves false: MxFileSystem is absent and the action swallows the failure.",
                    run: () =>
                        require(`${ACTIONS}/other/Base64DecodeToImage`).Base64DecodeToImage(
                            PNG_1X1,
                            fakeMxObject("image-1", {}, "System.Image")
                        )
                },
                {
                    label: "Base64DecodeToImage — data URI prefix",
                    note: "The action strips a 'data:image/png;base64,' prefix before decoding. Also false here.",
                    run: () =>
                        require(`${ACTIONS}/other/Base64DecodeToImage`).Base64DecodeToImage(
                            `data:image/png;base64,${PNG_1X1}`,
                            fakeMxObject("image-1", {}, "System.Image")
                        )
                },
                {
                    label: "Base64DecodeToImage — empty base64",
                    note: "Guard only: throws before requiring anything native.",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/other/Base64DecodeToImage`).Base64DecodeToImage(
                            "",
                            fakeMxObject("image-1", {}, "System.Image")
                        )
                },
                {
                    label: "Base64DecodeToImage — no image object",
                    note: "The other guard.",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/other/Base64DecodeToImage`).Base64DecodeToImage(PNG_1X1, undefined as never)
                }
            ]}
        />
    )
};
