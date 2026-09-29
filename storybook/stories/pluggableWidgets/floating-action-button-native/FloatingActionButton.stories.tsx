import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FloatingActionButton } from "../../../../packages/pluggableWidgets/floating-action-button-native/src/FloatingActionButton";
import type { FloatingActionButtonStyle } from "../../../../packages/pluggableWidgets/floating-action-button-native/src/ui/styles";
import type { SecondaryButtonsType } from "../../../../packages/pluggableWidgets/floating-action-button-native/typings/FloatingActionButtonProps";
import { actionValue, dynamicValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * The widget positions itself `absolute` with `left: 0, right: 0` and pins to the top or bottom of
 * whatever it is inside, at `zIndex: 999`. In an app that container is the page, so the button floats
 * over the content; here it would float over the whole Storybook canvas and overlap the next story,
 * so every story below puts it in a `relative`, fixed-height box that stands in for a page.
 *
 * The boxes are taller than the button needs because the secondary buttons animate *outside* it: they
 * are absolutely positioned children translated by `(main + secondary)/2 + 16 + index * (secondary +
 * 16)` points, which on Atlas's sizes is 56, 102 and 148 — a box only as tall as the button would clip
 * them.
 *
 * The default icons are `glyphicon-plus` and `glyphicon-remove`, which this host app resolves through
 * `mendix-stubs/components/native/Icon` onto Material Icons — so they draw as a real + and ×, unlike
 * the glyphs some other stories have to work around.
 */
const atlas = atlasStyle(
    "com.mendix.widget.native.floatingactionbutton.FloatingActionButton"
) as FloatingActionButtonStyle[];

const styles = StyleSheet.create({
    /** Stands in for a page: `relative` so the button's `absolute` positioning is bounded by it. */
    page: {
        backgroundColor: variables.background.secondary,
        borderColor: variables.border.color,
        borderRadius: variables.border.radiusLarge,
        borderWidth: 1,
        height: 220,
        overflow: "hidden",
        position: "relative"
    },
    /** Taller, for the stories that fan three secondary buttons out. */
    tallPage: {
        backgroundColor: variables.background.secondary,
        borderColor: variables.border.color,
        borderRadius: variables.border.radiusLarge,
        borderWidth: 1,
        height: 320,
        overflow: "hidden",
        position: "relative"
    },
    body: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        padding: variables.spacing.regular
    }
});

/** Page content, so it is visible that the button floats over it rather than displacing it. */
function pageText(text: string): ReactElement {
    return <Text style={styles.body}>{text}</Text>;
}

const glyph = (iconClass: string): SecondaryButtonsType["icon"] =>
    dynamicValue({ type: "glyph", iconClass }) as SecondaryButtonsType["icon"];

const secondary = (iconClass: string, caption?: string): SecondaryButtonsType => ({
    icon: glyph(iconClass),
    caption: caption === undefined ? undefined : dynamicValue(caption),
    onClick: actionValue(`fab secondary: ${caption ?? iconClass}`)
});

const threeActions: SecondaryButtonsType[] = [
    secondary("glyphicon-camera", "Photo"),
    secondary("glyphicon-search", "Search"),
    secondary("glyphicon-trash", "Delete")
];

/** The same three without captions, for the position story where a caption would not fit. */
const threeIcons: SecondaryButtonsType[] = [
    secondary("glyphicon-camera"),
    secondary("glyphicon-search"),
    secondary("glyphicon-trash")
];

const baseProps = {
    name: "fab",
    style: atlas,
    horizontalPosition: "right" as const,
    verticalPosition: "bottom" as const,
    onClick: actionValue("fab onClick"),
    secondaryButtons: []
};

const meta = {
    title: "Widgets/FloatingActionButton",
    component: FloatingActionButton,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof FloatingActionButton>;

export default meta;

/**
 * A single-action button, bottom right, on Atlas's brand-primary circle.
 *
 * With no secondary buttons the press runs `onClick` directly and nothing animates — the icon
 * rotation is keyed off `active && hasSecondaryButtons`, so it stays put here. Watch the console for
 * `[story] action fired`.
 *
 * `args` as well as a `render`, unlike the stories below: the args feed Storybook's controls panel,
 * and the render only supplies the page box.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps,
    render: args => (
        <View style={styles.page}>
            {pageText("A single-action button. Tapping it runs its own action; nothing expands.")}
            <FloatingActionButton {...args} />
        </View>
    )
};

/**
 * Secondary buttons, which change what a press does.
 *
 * As soon as `secondaryButtons` is non-empty the main press no longer runs `onClick` at all — it
 * toggles `active` instead, and `onClick` becomes dead. That is easy to miss when adding a second
 * action to a working button, so it is the first thing this story is for.
 *
 * The fan-out is not a list: each item is absolutely positioned and translated from the main button's
 * centre by an amount the widget computes from the two `size` values, so the 16pt gap between actions
 * is fixed in the code and only the sizes in the theme change the spread. The main icon crossfades to
 * `iconActive` and rotates -180° over 200ms while they appear.
 *
 * Selecting one closes the menu and runs that item's `onClick`; the main `onClick` never fires.
 */
export const SecondaryActions: StoryObj<typeof FloatingActionButton> = {
    render: () => (
        <View style={styles.tallPage}>
            {pageText("Tap the + — it expands instead of running its own action. Then pick one.")}
            <FloatingActionButton {...baseProps} secondaryButtons={threeActions} />
        </View>
    )
};

/**
 * `verticalPosition`, which sets both the edge and the direction the actions fan.
 *
 * One property does two things: `bottom` pins to the bottom and fans *up*, `top` pins to the top and
 * fans *down*. There is no way to pin to the bottom and fan down, which would go off screen anyway.
 * `top` is also the fallback for an unset value.
 */
export const VerticalPosition: StoryObj<typeof FloatingActionButton> = {
    render: () => (
        <StoryRows>
            <StoryRow label="bottom — pinned low, actions fan upward">
                <View style={styles.tallPage}>
                    {pageText("bottom")}
                    <FloatingActionButton {...baseProps} verticalPosition="bottom" secondaryButtons={threeActions} />
                </View>
            </StoryRow>
            <StoryRow label="top — pinned high, actions fan downward">
                <View style={styles.tallPage}>
                    {pageText("top")}
                    <FloatingActionButton {...baseProps} verticalPosition="top" secondaryButtons={threeActions} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `horizontalPosition`, which decides which side of each secondary button its caption sits on — and
 * whether it appears at all.
 *
 * `right` puts the caption to the *left* of the button and `left` puts it to the right, so the label
 * always points inward and never runs off the screen edge. `center` has nowhere to put it, and the
 * widget renders no caption at all rather than picking a side: the third row below has captions in its
 * props and shows none of them. Worth its own row, because it reads as the captions being broken.
 */
export const HorizontalPosition: StoryObj<typeof FloatingActionButton> = {
    render: () => (
        <StoryRows>
            <StoryRow label="right — captions to the left of each button">
                <View style={styles.tallPage}>
                    {pageText("right")}
                    <FloatingActionButton {...baseProps} horizontalPosition="right" secondaryButtons={threeActions} />
                </View>
            </StoryRow>
            <StoryRow label="left — captions to the right">
                <View style={styles.tallPage}>
                    {pageText("left")}
                    <FloatingActionButton {...baseProps} horizontalPosition="left" secondaryButtons={threeActions} />
                </View>
            </StoryRow>
            <StoryRow label="center — same captions in the props, none rendered">
                <View style={styles.tallPage}>
                    {pageText("center")}
                    <FloatingActionButton {...baseProps} horizontalPosition="center" secondaryButtons={threeActions} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `icon` and `iconActive`, and how little the second one is used.
 *
 * `iconActive` is drawn only while the menu is open, so on a button with no secondary buttons it can
 * never appear — there is no open state to be in. The first row is that case, with an `iconActive`
 * set and unreachable.
 *
 * Both are `DynamicValue<NativeIcon>` and both fall back when empty: `glyphicon-plus` for `icon`,
 * `glyphicon-remove` for `iconActive`. A `type: "image"` icon works too and is what an app with its
 * own artwork uses — the third row is a bundled PNG, tinted by `buttonIcon.color` the same way a
 * glyph would be.
 */
export const Icons: StoryObj<typeof FloatingActionButton> = {
    render: () => (
        <StoryRows>
            <StoryRow label="custom icon, no secondary buttons — iconActive is unreachable">
                <View style={styles.page}>
                    {pageText("A search button. iconActive is set and can never show.")}
                    <FloatingActionButton
                        {...baseProps}
                        icon={glyph("glyphicon-search")}
                        iconActive={glyph("glyphicon-remove")}
                    />
                </View>
            </StoryRow>
            <StoryRow label="custom icon and iconActive — tap to swap them">
                <View style={styles.tallPage}>
                    {pageText("menu ⇄ ok, and the rotation runs either way.")}
                    <FloatingActionButton
                        {...baseProps}
                        icon={glyph("glyphicon-menu-hamburger")}
                        iconActive={glyph("glyphicon-ok")}
                        secondaryButtons={threeIcons}
                    />
                </View>
            </StoryRow>
            <StoryRow label="an image icon rather than a glyph">
                <View style={styles.page}>
                    {pageText("type: image, tinted by buttonIcon.color.")}
                    <FloatingActionButton
                        {...baseProps}
                        icon={
                            dynamicValue({
                                type: "image",
                                iconUrl: require("../../shared/assets/star-filled.png")
                            }) as SecondaryButtonsType["icon"]
                        }
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The theme, and the two `size` keys that are not ordinary style properties.
 *
 * `button.size` and `secondaryButton.size` are read by the widget rather than passed to React Native:
 * it uses them for the width, the height, the border radius *and* the fan-out arithmetic, so a bigger
 * button also spaces its actions further apart. Setting `width`/`height` directly instead would size
 * the circle and leave the spacing wrong — which is what Atlas's `buttonContainer` does, since it has
 * `heigh: 50` rather than `height`. The typo is harmless because the widget also sets the height from
 * `button.size`, but it means `buttonContainer` is not the place to change the size from.
 *
 * `container.margin` is the gap to the screen edge — Atlas's 30 is what keeps the button off the
 * corner. `rippleColor` is stripped off `button` before the style reaches the `Pressable`, which uses
 * an opacity change instead, so it currently has no effect on either platform.
 */
export const Theming: StoryObj<typeof FloatingActionButton> = {
    render: () => (
        <View style={styles.tallPage}>
            {pageText("A larger button in a different colour, with its actions spaced to match.")}
            <FloatingActionButton
                {...baseProps}
                secondaryButtons={threeActions}
                style={atlas.concat([
                    {
                        container: { margin: variables.spacing.large },
                        button: { size: 68, backgroundColor: variables.brand.primary, borderWidth: 0 },
                        buttonContainer: { borderRadius: 34, height: 68, width: 68 },
                        buttonIcon: { color: variables.background.primary, size: 24 },
                        secondaryButton: {
                            size: 48,
                            backgroundColor: variables.background.primary,
                            borderColor: variables.brand.primary,
                            borderWidth: 1
                        },
                        secondaryButtonIcon: { color: variables.brand.primary, size: 20 },
                        secondaryButtonCaption: { color: variables.background.primary, fontSize: 13 },
                        secondaryButtonCaptionContainer: {
                            backgroundColor: variables.contrast.highest,
                            borderRadius: variables.border.radiusSmall,
                            paddingHorizontal: 8,
                            paddingVertical: 4
                        }
                    }
                ] as FloatingActionButtonStyle[])}
            />
        </View>
    )
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_floatingactionbutton_FloatingActionButton` is the only entry, and it takes
 * everything from the `floatingActionButton` block in Atlas's variables — a 54pt brand-primary circle
 * with a 30pt margin, 40pt white secondary buttons, and elevation on both. `Theming` above shows what
 * changing it does; an app that wants a variant per page has to add its own class.
 */
