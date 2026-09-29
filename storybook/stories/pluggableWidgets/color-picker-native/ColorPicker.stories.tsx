import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ValueStatus } from "mendix";
import { ColorPicker } from "../../../../packages/pluggableWidgets/color-picker-native/src/ColorPicker";
import type { ColorPickerStyle } from "../../../../packages/pluggableWidgets/color-picker-native/src/ui/Styles";
import type { FormatEnum } from "../../../../packages/pluggableWidgets/color-picker-native/typings/ColorPickerProps";
import { actionValue, editableValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Three things about this widget shape every story below.
 *
 * It renders `null` unless `color.status` is Available *and* `color.value` is non-empty — so an
 * attribute that is merely empty, not merely loading, makes the whole widget disappear rather than
 * showing an unset swatch. `EmptyAndLoading` is that case, and it is worth seeing because there is no
 * placeholder to hint at what happened.
 *
 * `readOnly` is inferred from the attribute rather than passed as a property: there is no `editable`
 * prop. The story stubs mark an attribute read-only when no `onChange` is given, which is what
 * `ReadOnly` below relies on.
 *
 * And each drag handler starts from `props.color.value`, not from the widget's own in-progress state
 * (`tinycolor(this.props.color.value).toHsl()` in every `onChange*`). Only `onSlidingComplete` writes
 * back through `setValue`. So a story whose attribute does not round-trip — one wired to a value that
 * never changes — would appear to reset on every touch. Every story here passes a `useState` setter for
 * that reason, which is also what the real runtime does.
 *
 * The theme reaches almost none of this. `flattenStyles` iterates the *widget's* default style keys, so
 * only `container` and `preview` survive from `props.style`; every slider dimension — the 32pt row, the
 * 6pt gradient strip, the 20pt Android thumb — is hardcoded in `PickerSlider`, and the thumb's colour
 * and border are computed from the current colour. Atlas's entry exports `container` and `thumbnail`,
 * and `thumbnail` is not one of the two keys read, so it is dead: the preview swatch keeps the widget's
 * own `borderRadius: 5, minHeight: 50`. `Theming` shows what is left.
 */
const atlas = atlasStyle("com.mendix.widget.native.colorpicker.ColorPicker") as ColorPickerStyle[];

const styles = StyleSheet.create({
    /** The current value as text, since the widget itself never shows it. */
    readout: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        fontWeight: "bold",
        marginTop: variables.spacing.smallest
    },
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    },
    /** A visible boundary, so a picker that renders nothing can be told from one that is absent. */
    outline: {
        borderColor: variables.brand.primary,
        borderStyle: "dashed",
        borderWidth: 1,
        height: 60,
        justifyContent: "center",
        marginBottom: variables.spacing.smallest
    }
});

const baseProps = {
    name: "color-picker",
    style: atlas,
    format: "hex" as FormatEnum,
    showPreview: true,
    showSaturation: true,
    showLightness: true,
    showAlpha: true
};

/**
 * A picker wired to state, with the value printed underneath.
 *
 * The readout is the point of the wrapper: the widget writes through `setValue` on release only, so
 * without it there is no way to tell a drag that committed from one that did not.
 */
function LiveColorPicker(props: {
    initial: string;
    format?: FormatEnum;
    showPreview?: boolean;
    showSaturation?: boolean;
    showLightness?: boolean;
    showAlpha?: boolean;
    style?: ColorPickerStyle[];
}): ReactElement {
    const { initial, style, ...rest } = props;
    const [color, setColor] = useState(initial);
    return (
        <View>
            <ColorPicker
                {...baseProps}
                {...rest}
                style={style ?? atlas}
                color={editableValue(color, setColor)}
                onChange={actionValue("color picker: onChange")}
            />
            <Text style={styles.readout}>{color}</Text>
        </View>
    );
}

const meta = {
    title: "Widgets/ColorPicker",
    component: ColorPicker,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ColorPicker>;

export default meta;

/**
 * A hex picker: the preview swatch, then hue, saturation and lightness.
 *
 * Drag a thumb, or tap anywhere on a track — `PickerSlider` measures itself on `onPressIn` and
 * positions from `locationX`, so a tap jumps the thumb rather than being ignored. Release commits: the
 * readout updates and `[story] action fired` appears in the console. Nothing is written mid-drag.
 *
 * No alpha slider here, and not because `showAlpha` is off — see `Formats`.
 *
 * `args` as well as a `render`, unlike the stories below: the args feed Storybook's controls panel.
 * Note that changing a style there will not reach a mounted picker, since `flattenStyles` runs in a
 * field initialiser.
 */
export const Default: StoryObj<typeof meta> = {
    args: { ...baseProps, color: editableValue<string>("#3b7ad9") },
    render: () => <LiveColorPicker initial="#3b7ad9" />
};

/**
 * `format`, which decides both what gets written to the attribute and whether alpha is offered at all.
 *
 * The alpha slider is gated on `format !== "hex"` as well as on `showAlpha`, because a hex string has
 * nowhere to put it — `getColor()` calls `toHexString()`, which drops it. So the first row below has
 * `showAlpha: true` and three sliders, and the others have four. That coupling is invisible from Studio
 * Pro, where the two properties look independent.
 *
 * Watch the readout: each format writes a different string for the same colour, and the attribute has
 * to be a string wide enough for it — `rgba(59, 122, 217, 0.5)` is 24 characters where the hex is 7.
 */
export const Formats: StoryObj<typeof ColorPicker> = {
    render: () => (
        <StoryRows>
            <StoryRow label="hex — no alpha slider even with showAlpha on, and alpha is dropped on write">
                <LiveColorPicker initial="#3b7ad9" format="hex" />
            </StoryRow>
            <StoryRow label="rgb — four sliders, writes rgb()/rgba()">
                <LiveColorPicker initial="rgb(59, 122, 217)" format="rgb" />
            </StoryRow>
            <StoryRow label="hsl — writes hsl()/hsla()">
                <LiveColorPicker initial="hsl(215, 68%, 54%)" format="hsl" />
            </StoryRow>
            <StoryRow label="hsv — writes hsv()/hsva(), which CSS does not accept">
                <LiveColorPicker initial="hsv(215, 73%, 85%)" format="hsv" />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The three visibility toggles, which subtract sliders rather than disabling them.
 *
 * Hue has no toggle — it is the one control that is always present, so the smallest configuration is a
 * bare hue strip. `showPreview: false` removes the swatch, which is the only element that shows the
 * chosen colour at full size; with it off, the thumb's own tint is the only feedback.
 *
 * Turning saturation and lightness off does not clamp them: whatever the attribute already held is kept
 * and only the hue moves. So a picker restricted this way can still be sitting on a washed-out colour
 * the user cannot fix — the fourth row starts on one deliberately.
 */
export const Visibility: StoryObj<typeof ColorPicker> = {
    render: () => (
        <StoryRows>
            <StoryRow label="showPreview: false — no swatch, only the thumbs are tinted">
                <LiveColorPicker initial="#3b7ad9" showPreview={false} />
            </StoryRow>
            <StoryRow label="showSaturation: false">
                <LiveColorPicker initial="#3b7ad9" showSaturation={false} />
            </StoryRow>
            <StoryRow label="hue only — both off, the smallest the widget gets">
                <LiveColorPicker initial="#3b7ad9" showSaturation={false} showLightness={false} />
            </StoryRow>
            <StoryRow label="hue only, starting desaturated — the user cannot correct it">
                <LiveColorPicker initial="#9aa7b8" showSaturation={false} showLightness={false} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A read-only attribute, which is a different widget rather than a greyed-out one.
 *
 * `readOnly` suppresses saturation, lightness and alpha outright — all three return `null` — so the
 * only thing left is the hue row, and it swaps `HueGradient` for `DisabledHueGradient`: a flat strip in
 * the current colour instead of the spectrum. The result is a swatch and a bar, which reads as a
 * read-out rather than as a disabled control, and it is not obvious it was ever a picker.
 *
 * The preview is unaffected and still shows the colour, which is what makes this usable at all.
 */
export const ReadOnly: StoryObj<typeof ColorPicker> = {
    render: () => (
        <StoryRows>
            <StoryRow label="editable — the spectrum, three sliders">
                <LiveColorPicker initial="#3b7ad9" />
            </StoryRow>
            <StoryRow label="read-only — a flat strip, and saturation/lightness/alpha gone entirely">
                <View>
                    {/* No onChange, which is what makes the stub attribute read-only. */}
                    <ColorPicker {...baseProps} color={editableValue<string>("#3b7ad9")} />
                    <Text style={styles.readout}>#3b7ad9</Text>
                </View>
            </StoryRow>
            <StoryRow label="read-only, rgb format — the alpha slider is suppressed too">
                <View>
                    <ColorPicker {...baseProps} format="rgb" color={editableValue<string>("rgba(59, 122, 217, 0.5)")} />
                    <Text style={styles.readout}>rgba(59, 122, 217, 0.5)</Text>
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The two style keys that exist, and what the theme cannot reach.
 *
 * `container` is the wrapping `View` — padding, background, a border. `preview` is the swatch, and its
 * `backgroundColor` is overwritten by the widget on every render, so that one property is the theme's
 * only no-op here; height, radius and margin all work.
 *
 * Everything else belongs to `PickerSlider` and is out of reach: the 32pt row height, the 6pt gradient
 * strip, the transparent tracks, and the thumb, whose size comes from a `Platform.select` and whose
 * colour and 1pt border are computed from the current colour on each render. There is no theme hook for
 * a taller slider or a larger thumb.
 *
 * Atlas's entry has `container` and `thumbnail`, both empty. `thumbnail` is not a key the widget reads —
 * `flattenStyles` iterates the widget's own default style, whose keys are `container` and `preview` — so
 * it would be dropped even if it were filled in. Renaming it would be the fix; until then the swatch
 * can only be styled from an app's own theme entry using `preview`.
 */
export const Theming: StoryObj<typeof ColorPicker> = {
    render: () => (
        <StoryRows>
            <StoryRow label="Atlas as shipped — both its keys are empty, so this is the widget's own default">
                <LiveColorPicker initial="#3b7ad9" />
            </StoryRow>
            <StoryRow label="container and preview overridden — a framed picker with a tall, square swatch">
                <LiveColorPicker
                    initial="#3b7ad9"
                    style={
                        atlas.concat([
                            {
                                container: {
                                    backgroundColor: variables.background.secondary,
                                    borderColor: variables.border.color,
                                    borderRadius: variables.border.radiusLarge,
                                    borderWidth: 1,
                                    padding: variables.spacing.regular
                                },
                                preview: {
                                    borderColor: variables.contrast.lower,
                                    borderRadius: 0,
                                    borderWidth: 1,
                                    marginBottom: variables.spacing.regular,
                                    minHeight: 90
                                    // A `backgroundColor` here would be overwritten by the current colour.
                                }
                            }
                        ]) as ColorPickerStyle[]
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * An empty attribute and a loading one — both render nothing, and for the same reason.
 *
 * The guard is `status !== Available || !color.value`, so an empty string fails it just as a Loading
 * status does. An app whose colour attribute has no default therefore shows no picker at all until
 * something writes a first value, and there is no way for the user to write one from here. The dashed
 * outlines are the story's, to show where the widget would be.
 *
 * `!color.value` also rejects any falsy string, so this is not specific to Loading: it is the widget's
 * position that there is no such thing as an unset colour.
 */
export const EmptyAndLoading: StoryObj<typeof ColorPicker> = {
    render: () => (
        <StoryRows>
            <StoryRow label="an empty attribute — nothing renders, and nothing can set a first value">
                <View style={styles.outline}>
                    <ColorPicker {...baseProps} color={editableValue<string>("", () => undefined)} />
                </View>
                <Text style={styles.note}>value: &quot;&quot;</Text>
            </StoryRow>
            <StoryRow label="still loading — identical, so the two states are indistinguishable">
                <View style={styles.outline}>
                    <ColorPicker
                        {...baseProps}
                        color={editableValue<string>("#3b7ad9", () => undefined, ValueStatus.Loading)}
                    />
                </View>
                <Text style={styles.note}>status: Loading</Text>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_colorpicker_ColorPicker` is the only entry, and `Theming` above covers both
 * of its keys — one of which the widget does not read.
 *
 * No `onChange` story either. It is an ordinary action that runs on release, after `setValue`, and every
 * story here already passes one — the console line under each drag is it firing. It also fires when the
 * colour did *not* change (the `setValue` guard is inside `onChangeComplete`, the `executeAction` after
 * it), so a tap that lands on the current value still triggers the microflow.
 */
