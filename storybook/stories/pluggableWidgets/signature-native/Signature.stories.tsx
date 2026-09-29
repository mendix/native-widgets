import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Signature } from "../../../../packages/pluggableWidgets/signature-native/src/Signature";
import type { SignatureStyle } from "../../../../packages/pluggableWidgets/signature-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { variables } from "../../shared/atlasStyles";
import { StoryFrame } from "../../shared/StoryFrame";

/**
 * A canvas you draw on with a finger, plus a Clear and a Save button.
 *
 * Under the hood it is not a native canvas at all: `react-native-signature-canvas` renders a WebView
 * whose page runs signature_pad.js, and the widget talks to it through a ref — `readSignature()` and
 * `clearSignature()` are `injectJavaScript` calls, and everything coming back arrives as a
 * `postMessage`. That indirection explains most of what is odd about this widget:
 *
 * - The canvas has no intrinsic size and the page is `position: absolute` on all four edges, so the
 *   widget's `container` is `flex: 1` and it fills whatever it is given. Inside a `ScrollView` it
 *   collapses to nothing, which is why every story here is `scroll={false}` with an explicit height.
 * - Saving is asynchronous by nature. The tap injects JS, the page serialises the canvas to a data URL,
 *   and the widget's `onOK` handler runs a round trip later. Nothing on screen indicates the wait.
 * - The buttons you see are the widget's own React ones. The page has a Clear and a Save button too,
 *   in its footer, and the widget hides them with `webStyles` (`.m-signature-pad--footer { display:
 *   none }`) rather than by not rendering them.
 *
 * The value it produces is a base64 PNG data URL written into `imageAttribute` via `setValue`. Stories
 * that want to prove a signature was captured render that string back through an `Image`, which is the
 * only way to see that the round trip worked rather than merely fired.
 *
 * Atlas has no entry for this widget — `atlasStyle("com.mendix.widget.native.signature.Signature")`
 * returns `[]` — so every story starts from `defaultSignatureStyle` in the widget's own `ui/Styles.ts`,
 * and the theming stories below are written against Atlas *variables* rather than an Atlas class.
 */
const styles = StyleSheet.create({
    note: {
        color: variables.contrast.high,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.smaller
    },
    log: {
        color: variables.contrast.highest,
        fontFamily: variables.font.familyMonospace ?? "monospace",
        fontSize: variables.font.sizeSmall,
        marginBottom: 2
    },
    empty: {
        color: variables.contrast.low,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        fontStyle: "italic"
    },
    // A border rather than a background: the canvas is white and the story frame is white, so without
    // an outline there is nothing to say where the drawable area ends and the buttons begin.
    pad: {
        borderColor: variables.contrast.lower,
        borderWidth: 1,
        // The widget is flex: 1 inside here, and the buttons are laid out below the canvas — so this
        // has to be tall enough for both or the canvas is squeezed to a few pixels.
        height: 320
    },
    preview: {
        borderColor: variables.contrast.lower,
        borderWidth: 1,
        height: 90,
        marginTop: variables.spacing.small,
        // `resizeMode="contain"` on a data URL of unknown aspect ratio needs a defined box.
        width: "100%"
    }
});

const baseProps = {
    name: "signature",
    style: [] as SignatureStyle[],
    imageAttribute: editableValue<string>("")
};

const meta = {
    title: "Widgets/Signature",
    component: Signature,
    decorators: [
        (Story: () => ReactElement) => (
            // scroll={false} throughout: the widget is flex: 1 and would collapse in a ScrollView, and
            // a drag on the canvas would be stolen by the outer scroll even if it did not.
            <StoryFrame scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Signature>;

export default meta;

/**
 * The widget as shipped, with the value it produces rendered back beside it.
 *
 * Draw something and tap Save: `imageAttribute.setValue` receives a `data:image/png;base64,...` string
 * and the preview below shows it. The important thing to notice is that the canvas goes blank at the
 * same moment — the widget passes `autoClear` to the signature view unconditionally, so a successful
 * save always wipes the pad. There is no property to turn that off.
 *
 * Tapping Save on an empty pad does nothing visible here: the page posts "EMPTY", which routes to
 * `onEmpty` rather than to `onOK`, so the attribute is left alone. `Events` below makes that audible.
 */
export const Default: StoryObj<typeof Signature> = {
    render: () => {
        const [signature, setSignature] = useState("");
        return (
            <View style={{ flex: 1 }}>
                <Text style={styles.note}>Draw with a finger, then tap Save.</Text>
                <View style={styles.pad}>
                    <Signature {...baseProps} imageAttribute={editableValue<string>(signature, setSignature)} />
                </View>
                {signature ? (
                    <>
                        <Text style={styles.note}>{`imageAttribute — ${signature.length} characters of base64`}</Text>
                        <Image resizeMode="contain" source={{ uri: signature }} style={styles.preview} />
                    </>
                ) : (
                    <Text style={styles.empty}>imageAttribute is still empty.</Text>
                )}
            </View>
        );
    }
};

/**
 * All four events, logged in the order they arrive.
 *
 * They are not four independent hooks — three of them are decided by the same tap:
 *
 * - `onEnd` fires per stroke, when a finger lifts. A three-stroke signature fires it three times.
 * - `onSave` and `onEmpty` are the two outcomes of the Save button, chosen by `signaturePad.isEmpty()`
 *   in the page. Exactly one of them fires per tap, never both.
 * - `onClear` fires from the Clear button — but *not* from the automatic clear that follows a save,
 *   because that path calls `signaturePad.clear()` directly instead of going through the page's clear
 *   handler that posts "CLEAR".
 *
 * That last asymmetry is the one worth knowing: an app that reacts to `onClear` to mark a form dirty
 * will not hear about the wipe that a save causes.
 *
 * There is no `onBegin` in the widget's properties even though the library offers one, so the start of
 * a stroke is not observable to a Mendix app.
 */
export const Events: StoryObj<typeof Signature> = {
    render: () => {
        const [log, setLog] = useState<string[]>([]);
        const record = (event: string): void =>
            setLog(previous => [...previous, `${previous.length + 1}. ${event}`].slice(-8));
        return (
            <View style={{ flex: 1 }}>
                <Text style={styles.note}>Draw a stroke, tap Save, tap Clear, then tap Save on the empty pad.</Text>
                <View style={styles.pad}>
                    <Signature
                        {...baseProps}
                        onEnd={actionValue("onEnd", () => record("onEnd — a stroke finished"))}
                        onSave={actionValue("onSave", () => record("onSave — canvas had ink"))}
                        onEmpty={actionValue("onEmpty", () => record("onEmpty — Save on a blank canvas"))}
                        onClear={actionValue("onClear", () => record("onClear — the Clear button"))}
                    />
                </View>
                <View style={{ marginTop: variables.spacing.small }}>
                    {log.length === 0 ? (
                        <Text style={styles.empty}>nothing yet</Text>
                    ) : (
                        log.map(entry => (
                            <Text key={entry} style={styles.log}>
                                {entry}
                            </Text>
                        ))
                    )}
                </View>
            </View>
        );
    }
};

/**
 * The two captions, and what happens when they are left out.
 *
 * Both are text templates, and both are optional — the widget falls back to "Clear" and "Save" with
 * `?? `, so an unbound caption is the English default rather than a blank button. The fallback is on
 * `.value`, not on the prop, so a caption that is still loading also shows the default for a frame.
 *
 * The captions here are deliberately long: `buttonWrapper` is `flexDirection: "row"` with each button
 * `flex: 1`, so the two always split the width evenly and a long caption wraps inside its half rather
 * than pushing the other button aside.
 */
export const Captions: StoryObj<typeof Signature> = {
    render: () => (
        <View style={{ flex: 1 }}>
            <Text style={styles.note}>Custom captions; both properties are optional text templates.</Text>
            <View style={styles.pad}>
                <Signature
                    {...baseProps}
                    buttonCaptionClear={dynamicValue("Start over")}
                    buttonCaptionSave={dynamicValue("Accept signature")}
                />
            </View>
        </View>
    )
};

/**
 * `penColor` and the canvas background, which are style keys rather than properties.
 *
 * This is the widget's one genuinely unusual styling trick. `container` is a `ViewStyle` *plus*
 * `penColor`, and the widget runs `extractStyles(styles.container, ["penColor", "backgroundColor"])` —
 * so those two keys are pulled out of the style object and passed to the signature view as props,
 * where they end up interpolated into the page's JavaScript. Everything else in `container` stays a
 * real React Native style on the wrapping `View`.
 *
 * `backgroundColor` is therefore doing two jobs at once, and only one of them is the usual one: it
 * colours the canvas the ink is drawn on, and because `extractStyles` *moves* the key rather than
 * copying it, it no longer reaches the container `View` at all. So the ink and the paper are both the
 * page's, and a theme cannot set the wrapper's background through this key.
 */
export const PenAndPaper: StoryObj<typeof Signature> = {
    render: () => (
        <View style={{ flex: 1 }}>
            <Text style={styles.note}>
                penColor and backgroundColor are extracted from container and sent to the page.
            </Text>
            <View style={styles.pad}>
                <Signature
                    {...baseProps}
                    style={[
                        {
                            container: {
                                penColor: variables.brand.primary,
                                backgroundColor: variables.background.secondary
                            }
                        } as SignatureStyle
                    ]}
                />
            </View>
        </View>
    )
};

/**
 * Both buttons restyled, including the three keys that are not styles.
 *
 * `buttonClearContainer` and `buttonSaveContainer` are `ViewStyle` plus `rippleColor`, `activeOpacity`
 * and `underlayColor`, and the widget extracts those three the same way it extracts `penColor` — they
 * are handed to the `Touchable` wrapper rather than applied as styles. Which of them has any effect
 * depends on the platform and on each other: on Android only `rippleColor` is read, and on iOS the
 * component picks `TouchableHighlight` when `underlayColor` is set and `TouchableOpacity` otherwise,
 * so `activeOpacity` is ignored unless `underlayColor` is also present.
 *
 * The captions are separate keys (`buttonClearCaption`, `buttonSaveCaption`) and are full `TextStyle`s,
 * which is what lets the two buttons diverge — the default theme already does this, giving Clear an
 * outline and Save a fill.
 */
export const ButtonStyling: StoryObj<typeof Signature> = {
    render: () => (
        <View style={{ flex: 1 }}>
            <Text style={styles.note}>Both buttons themed; rippleColor is extracted, not applied as a style.</Text>
            <View style={styles.pad}>
                <Signature
                    {...baseProps}
                    buttonCaptionClear={dynamicValue("Clear")}
                    buttonCaptionSave={dynamicValue("Save")}
                    style={[
                        {
                            buttonWrapper: { paddingTop: variables.spacing.regular },
                            buttonClearContainer: {
                                backgroundColor: variables.background.secondary,
                                borderColor: variables.brand.warning,
                                borderRadius: 24,
                                borderWidth: 2,
                                paddingVertical: variables.spacing.small,
                                // Extracted by the widget and passed to Touchable, not styled.
                                rippleColor: variables.brand.warning
                            },
                            buttonSaveContainer: {
                                backgroundColor: variables.brand.success,
                                borderColor: variables.brand.success,
                                borderRadius: 24,
                                paddingVertical: variables.spacing.small,
                                rippleColor: variables.brand.successLight
                            },
                            buttonClearCaption: {
                                color: variables.brand.warning,
                                fontSize: variables.font.sizeSmall
                            },
                            buttonSaveCaption: { color: "#fff", fontSize: variables.font.sizeSmall }
                        } as SignatureStyle
                    ]}
                />
            </View>
        </View>
    )
};

/**
 * A read-only attribute, which the widget does not honour.
 *
 * `imageAttribute` is an `EditableValue`, and an `EditableValue` can be read-only — but nothing in the
 * widget checks `readOnly` or `status`. The canvas stays drawable, both buttons stay live, and Save
 * calls `setValue` on an attribute the runtime will refuse. So a page that shows a signed document
 * with the attribute set read-only looks editable and silently discards what is drawn.
 *
 * `editableValue` here is built with no `onChange`, which is what makes it report `readOnly: true` —
 * the same shape the runtime hands over for a non-editable attribute. `setValue` on it is a no-op, so
 * the only feedback a Save gives is the auto-clear: the pad goes blank exactly as it does in `Default`,
 * and nothing anywhere records what was drawn.
 */
export const ReadOnlyAttribute: StoryObj<typeof Signature> = {
    render: () => (
        <View style={{ flex: 1 }}>
            <Text style={styles.note}>
                imageAttribute is read-only, and the widget does not check. Drawing and Save both still work.
            </Text>
            <View style={styles.pad}>
                <Signature {...baseProps} imageAttribute={editableValue<string>("")} />
            </View>
        </View>
    )
};
