import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "../../../../packages/pluggableWidgets/bottom-sheet-native/src/BottomSheet";
import type { BottomSheetStyle } from "../../../../packages/pluggableWidgets/bottom-sheet-native/src/ui/Styles";
import type { ItemsBasicType } from "../../../../packages/pluggableWidgets/bottom-sheet-native/typings/BottomSheetProps";
import { actionValue, editableValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame } from "../../shared/StoryFrame";

/**
 * Three widgets share one name here. `type` and `modalRendering` pick between components with almost
 * nothing in common — `NativeBottomSheet`, `CustomModalSheet` and `ExpandingDrawer` — so the stories
 * below are grouped by which of the three they exercise rather than by property.
 *
 * The two modal ones are opened by writing `true` to `triggerAttribute`, not by a press: there is no
 * trigger inside the widget. Each story therefore supplies its own button, and the widget writes `false`
 * back through `setValue` when the sheet closes — which is only a round trip because `editableValue` is
 * wired to state. Give it a plain value and the sheet cannot be reopened after the first close.
 *
 * Writing `false` is not what dismisses it, though. `mounted` is only cleared from the sheet's own
 * `onChange(-1)`, so the attribute going false while the sheet is up has no effect — see `BasicModal`.
 *
 * `ExpandingDrawer` needs no trigger at all: it is always mounted, pinned to the bottom at its collapsed
 * snap point, and cannot be dismissed (`enablePanDownToClose={false}`). It also fills its container with
 * `StyleSheet.absoluteFill`, so its story gets a fixed-height box; the modal ones do not, since a
 * `Modal` escapes the layout entirely.
 *
 * Like the popup menu, this widget flattens with `StyleSheet.flatten` rather than `flattenStyles`, so an
 * override replaces a whole top-level key instead of merging into it. `ItemStyling` below respreads the
 * Atlas values it means to keep.
 *
 * All of this rides on `@gorhom/bottom-sheet`, which needs `GestureHandlerRootView` above it —
 * `App.tsx` has one at the root, so the drag gestures work here.
 */
// `as unknown as` rather than a direct cast, unlike most stories here: `BottomSheetStyle` declares all
// four of its keys as required, so TypeScript will not accept a plain assertion from the helper's
// `Record<string, unknown>[]`. Atlas does supply all four; the widget's type is simply stricter than a
// partial-style array.
const atlas = atlasStyle("com.mendix.widget.native.bottomsheet.BottomSheet") as unknown as BottomSheetStyle[];

const [atlasBase] = atlas;

const styles = StyleSheet.create({
    trigger: {
        alignSelf: "flex-start",
        backgroundColor: variables.brand.primary,
        borderRadius: variables.border.radiusSmall,
        marginBottom: variables.spacing.regular,
        paddingHorizontal: variables.spacing.regular,
        paddingVertical: variables.spacing.small
    },
    triggerText: {
        color: variables.background.primary,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold"
    },
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    },
    /** Stands in for a page, for the expanding drawer — which fills whatever contains it. */
    page: {
        backgroundColor: variables.background.secondary,
        borderColor: variables.border.color,
        borderRadius: variables.border.radiusLarge,
        borderWidth: 1,
        height: 420,
        overflow: "hidden"
    },
    // Sheet content. A modeller would drop widgets in here; these stand in for them, and they are
    // deliberately plain so the sheet's own framing is what shows.
    handle: {
        alignSelf: "center",
        backgroundColor: variables.contrast.lower,
        borderRadius: 2,
        height: 4,
        marginBottom: variables.spacing.small,
        marginTop: variables.spacing.small,
        width: 40
    },
    heading: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeLarge,
        fontWeight: "bold",
        paddingHorizontal: variables.spacing.regular
    },
    paragraph: {
        color: variables.contrast.high,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        lineHeight: variables.font.lineHeight,
        paddingHorizontal: variables.spacing.regular,
        paddingVertical: variables.spacing.small
    },
    swatchRow: { flexDirection: "row", paddingHorizontal: variables.spacing.regular, paddingVertical: 6 },
    swatch: { borderRadius: 4, height: 40, marginRight: 8, width: 40 }
});

/** A button to write `true` into the trigger attribute, since the widget has no trigger of its own. */
function Trigger({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
    return (
        <Pressable onPress={onPress} style={styles.trigger}>
            <Text style={styles.triggerText}>{label}</Text>
        </Pressable>
    );
}

const item = (caption: string, styleClass: ItemsBasicType["styleClass"] = "defaultStyle"): ItemsBasicType => ({
    caption,
    styleClass,
    action: actionValue(`bottom sheet: ${caption}`)
});

const basicItems: ItemsBasicType[] = [item("Take a photo"), item("Choose from library"), item("Use last photo")];

/** One of each `styleClass`, to show what the theme does with them. */
const styledItems: ItemsBasicType[] = [
    item("Open"),
    item("Save as draft", "primaryStyle"),
    item("Rename", "customStyle"),
    item("Delete", "dangerStyle")
];

/** Long enough to exceed the sheet's height cap, so the list has to scroll. */
const manyItems: ItemsBasicType[] = Array.from({ length: 20 }, (_, index) => item(`Option ${index + 1}`));

const heading = (text: string): ReactNode => <Text style={styles.heading}>{text}</Text>;
const paragraph = (text: string): ReactNode => <Text style={styles.paragraph}>{text}</Text>;

/** Custom sheet content — arbitrary widgets, in place of the caption-and-action list. */
const customContent: ReactNode = (
    <View>
        <View style={styles.handle} />
        {heading("Filter results")}
        {paragraph("Anything a modeller can put on a page goes here, and the sheet grows to fit it.")}
        <View style={styles.swatchRow}>
            {[variables.brand.primary, variables.brand.success, variables.brand.warning, variables.brand.danger].map(
                color => (
                    <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
                )
            )}
        </View>
        {paragraph("Dynamic sizing measures this content and snaps to it, up to 90% of the window height.")}
    </View>
);

/** Tall enough to hit the 90% cap that `maxDynamicContentSize` imposes. */
const tallContent: ReactNode = (
    <View>
        <View style={styles.handle} />
        {heading("Terms")}
        {Array.from({ length: 14 }, (_, index) => (
            <Text key={index} style={styles.paragraph}>
                {index + 1}. Content taller than the window, so the sheet stops at 90% and scrolls the rest.
            </Text>
        ))}
    </View>
);

const drawerSmall: ReactNode = (
    <View>
        <View style={styles.handle} />
        {heading("3 stops · 12 min")}
    </View>
);

const drawerLarge: ReactNode = (
    <View>
        {paragraph("Drag the drawer up. This is the largeContent — the middle snap point.")}
        {paragraph("Waterloo · 2 min")}
        {paragraph("Embankment · 5 min")}
        {paragraph("Charing Cross · 12 min")}
    </View>
);

const drawerFullscreen: ReactNode = (
    <View>
        {heading("Every departure")}
        {Array.from({ length: 12 }, (_, index) => (
            <Text key={index} style={styles.paragraph}>
                {String(6 + index).padStart(2, "0")}:15 — platform {(index % 4) + 1}
            </Text>
        ))}
    </View>
);

const baseProps = {
    name: "bottom-sheet",
    style: atlas,
    type: "modal" as const,
    modalRendering: "basic" as const,
    itemsBasic: basicItems,
    nativeImplementation: false,
    showFullscreenContent: false
};

const meta = {
    title: "Widgets/BottomSheet",
    component: BottomSheet,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof BottomSheet>;

export default meta;

/**
 * The basic modal: a list of captions with an action each, opened by writing to the trigger attribute.
 *
 * The sheet's height is arithmetic rather than measurement — `items × 44 + 36`, capped at 90% of the
 * window — so a row whose caption wraps overflows its own 50pt Atlas row height rather than making the
 * sheet taller.
 *
 * Picking an item sets the trigger back to `false` and delays the action by 500ms, for the same reason
 * the popup menu does: a closing modal would dismiss an alert the action opened. Watch the console for
 * `[story] action fired` and expect the pause.
 *
 * But the sheet does not close — verified on Android. `actionHandler` writes the attribute and nothing
 * else; it never calls `close()`, and the `Modal`'s `mounted` flag is cleared only from the sheet's own
 * `onChange(-1)`, which needs the pan-down gesture or a backdrop press. So an app whose items each open a
 * page gets the page pushed *behind* a sheet that is still up. Only the backdrop and the drag dismiss it,
 * and both write `false` back correctly.
 */
export const BasicModal: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Add a photo" onPress={() => setOpen(true)} />
                <Text style={styles.note}>
                    Tap an item: the action fires after 500ms and the sheet stays open. Only the backdrop or a drag down
                    closes it.
                </Text>
                <BottomSheet {...baseProps} triggerAttribute={editableValue(open, setOpen)} />
            </View>
        );
    }
};

/**
 * The four `styleClass` values, and the one that does nothing.
 *
 * These are the same four names the popup menu uses, keyed under `modalItems` here. Atlas gives
 * `primaryStyle` the brand colour and `dangerStyle` the danger colour, and defines `customStyle`
 * identically to `defaultStyle` — so "Rename" below is indistinguishable from "Open" until an app fills
 * that hook in. Unlike the popup menu there is no divider item type, so a destructive action cannot be
 * separated from the rest.
 */
export const ItemStyleClasses: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Record actions" onPress={() => setOpen(true)} />
                <Text style={styles.note}>
                    default, primary, custom, danger — in that order. custom matches default in Atlas.
                </Text>
                <BottomSheet {...baseProps} itemsBasic={styledItems} triggerAttribute={editableValue(open, setOpen)} />
            </View>
        );
    }
};

/**
 * More items than fit, which is where the height cap shows.
 *
 * Twenty rows want 916pt; the sheet stops at 90% of the window and the list scrolls inside it. The
 * scrolling is `BottomSheetScrollView`'s, so the first downward drag from the top of the list closes the
 * sheet rather than scrolling — that interplay is the reason to try it rather than read about it.
 */
export const ScrollingItems: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Twenty options" onPress={() => setOpen(true)} />
                <Text style={styles.note}>Capped at 90% of the window height, and scrolls from there.</Text>
                <BottomSheet {...baseProps} itemsBasic={manyItems} triggerAttribute={editableValue(open, setOpen)} />
            </View>
        );
    }
};

/**
 * `nativeImplementation`, which is an iOS-only branch that also disables the theme.
 *
 * On iOS this abandons the sheet entirely and calls `ActionSheetIOS.showActionSheetWithOptions`, adding
 * a "Cancel" option the widget appends itself — so the item list is the system action sheet's, matching
 * the platform and ignoring `modalItems` completely. The widget then renders an empty `View`.
 *
 * On Android — which is what this story shows — it keeps the sheet but swaps every style for a hardcoded
 * blue-on-white 20pt row with a hairline divider, meant to look like a Material dialog. Atlas is not
 * consulted for the container or the text, so this row is the same on any theme. Compare it with
 * `BasicModal` above: same items, same widget, and none of the theme's typography.
 */
export const NativeImplementation: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Native styling" onPress={() => setOpen(true)} />
                <Text style={styles.note}>
                    Android: hardcoded blue rows, theme ignored. iOS: a system action sheet with its own Cancel.
                </Text>
                <BottomSheet {...baseProps} nativeImplementation triggerAttribute={editableValue(open, setOpen)} />
            </View>
        );
    }
};

/**
 * `modalRendering: "custom"`, where the sheet holds widgets instead of a list.
 *
 * The content comes from `largeContent` — the same property the expanding drawer uses for its middle
 * state, which is worth noting because the two modes read different props for what looks like the same
 * slot. `smallContent` and `fullscreenContent` are ignored here entirely.
 *
 * Sizing is `enableDynamicSizing`: the sheet measures the content and snaps to its height, up to 90% of
 * the window. So unlike the basic mode there is nothing to configure and nothing to get wrong — but also
 * no way to ask for a specific height.
 *
 * Note that neither modal mode draws a drag handle: `handleComponent={null}` and `handleStyle: {display:
 * "none"}`. The grey pill in these stories is part of the story's content, not the widget's — an app that
 * wants one has to put it there.
 */
export const CustomModal: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Filters" onPress={() => setOpen(true)} />
                <Text style={styles.note}>Arbitrary content in largeContent; the sheet snaps to its height.</Text>
                <BottomSheet
                    {...baseProps}
                    modalRendering="custom"
                    largeContent={customContent}
                    triggerAttribute={editableValue(open, setOpen)}
                />
            </View>
        );
    }
};

/** Content past the 90% cap, which stops growing and scrolls instead. */
export const CustomModalTallContent: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Terms" onPress={() => setOpen(true)} />
                <Text style={styles.note}>Taller than the window: capped at 90%, and the rest scrolls.</Text>
                <BottomSheet
                    {...baseProps}
                    modalRendering="custom"
                    largeContent={tallContent}
                    triggerAttribute={editableValue(open, setOpen)}
                />
            </View>
        );
    }
};

/**
 * `type: "expanding"` — the persistent drawer, which is a different widget in every respect.
 *
 * No trigger, no backdrop, no dismissal: it mounts at its collapsed snap point and stays. The three
 * content props are the three snap points — `smallContent` is a sticky header that is always visible,
 * `largeContent` is the middle state, and `fullscreenContent` is a third that only exists when
 * `showFullscreenContent` is on. This story has all three; drag the header up twice.
 *
 * Every snap point is measured, not configured. The drawer renders all three contents a second time in a
 * hidden, zero-opacity tree purely to measure their heights, then builds the snap points from them:
 * header + 25, `min(halfScreen, header + large) + 25`, and `screenHeight - 25`. So a snap point that
 * looks wrong is usually content that measures differently than it appears — and until the header has a
 * measured height the drawer renders nothing at all.
 *
 * `onOpen` and `onClose` fire on expansion and collapse rather than on mount and dismissal — `onClose`
 * runs when the drawer returns to its collapsed state, which it can always be dragged back to. With one
 * exception, visible in the console here: `onOpen` also fires once on mount, because `onChange`'s
 * `hasOpened` branch treats the first `-1 → 0` transition as an open. So an `onOpen` that navigates or
 * logs runs once before the user has touched anything.
 *
 * The console also carries four "Text strings must be rendered within a <Text> component" errors on every
 * render, which are the widget's rather than the story's: `ExpandingDrawer.tsx` writes
 * `<View onLayout={…}> {props.largeContent} </View>` at lines 210 and 215, and those literal spaces are
 * string children of a `View`. They are harmless but noisy, and an app cannot silence them.
 */
export const ExpandingDrawer: StoryObj<typeof BottomSheet> = {
    render: () => (
        <View>
            <Text style={styles.note}>
                Always present, cannot be dismissed. Drag the header up: header → middle → full.
            </Text>
            <View style={styles.page}>
                <Text style={styles.paragraph}>
                    Page content behind the drawer. The drawer fills this box because it uses absoluteFill.
                </Text>
                <BottomSheet
                    {...baseProps}
                    type="expanding"
                    smallContent={drawerSmall}
                    largeContent={drawerLarge}
                    showFullscreenContent
                    fullscreenContent={drawerFullscreen}
                    onOpen={actionValue("bottom sheet: onOpen")}
                    onClose={actionValue("bottom sheet: onClose")}
                />
            </View>
        </View>
    )
};

/**
 * The drawer with `showFullscreenContent` off, which is two snap points rather than three.
 *
 * The expanded point becomes `min(halfScreen, header + large)`, so a drawer whose content is short stops
 * at its content rather than at half the screen — this one does. It also keeps `container` as its
 * background in both states, where the three-point version swaps to
 * `containerWhenExpandedFullscreen` (a full-height, stretched variant) as soon as it is expanded at all.
 */
export const ExpandingDrawerTwoStates: StoryObj<typeof BottomSheet> = {
    render: () => (
        <View>
            <Text style={styles.note}>Two snap points. Stops at its content, not at half the screen.</Text>
            <View style={styles.page}>
                <Text style={styles.paragraph}>Page content behind the drawer.</Text>
                <BottomSheet
                    {...baseProps}
                    type="expanding"
                    smallContent={drawerSmall}
                    largeContent={drawerLarge}
                    onOpen={actionValue("bottom sheet: onOpen")}
                    onClose={actionValue("bottom sheet: onClose")}
                />
            </View>
        </View>
    )
};

/**
 * The theme, on the basic modal.
 *
 * `container` is the sheet's own surface — Atlas's rounded top corners and upward shadow come from here,
 * and it is also what the drawer uses. `modal` styles the sheet's wrapper inside the `Modal`, which Atlas
 * uses only to pin it to the bottom (`justifyContent: "flex-end"`, `margin: 0`); it is the hook for
 * insetting the sheet from the screen edges, as below.
 *
 * `modalItems.container` is the row, and carries a non-standard `rippleColor` that the widget does not
 * actually read — rows use a hardcoded `underlayColor` of `rgba(0,0,0,0.25)` on both platforms, so that
 * key has no effect today.
 *
 * Both keys are respread from Atlas rather than replaced, because `StyleSheet.flatten` does not merge
 * below the top level — drop `...atlasBase.modalItems` and the four text classes disappear with it.
 */
export const ItemStyling: StoryObj<typeof BottomSheet> = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View>
                <Trigger label="Restyled" onPress={() => setOpen(true)} />
                <Text style={styles.note}>Inset from the edges, taller rows, brand-coloured captions.</Text>
                <BottomSheet
                    {...baseProps}
                    itemsBasic={styledItems}
                    triggerAttribute={editableValue(open, setOpen)}
                    style={atlas.concat([
                        {
                            container: {
                                ...atlasBase.container,
                                backgroundColor: variables.background.primary,
                                borderColor: variables.border.color,
                                borderRadius: variables.border.radiusLarge,
                                borderWidth: 1
                            },
                            modal: { ...atlasBase.modal, marginHorizontal: variables.spacing.regular },
                            modalItems: {
                                ...atlasBase.modalItems,
                                container: { ...atlasBase.modalItems?.container, height: 60 },
                                defaultStyle: {
                                    ...atlasBase.modalItems?.defaultStyle,
                                    fontSize: variables.font.sizeLarge
                                },
                                customStyle: {
                                    ...atlasBase.modalItems?.customStyle,
                                    color: variables.brand.info,
                                    fontStyle: "italic"
                                }
                            }
                        }
                    ] as BottomSheetStyle[])}
                />
            </View>
        );
    }
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_bottomsheet_BottomSheet` is the only entry — the rounded shadowed surface,
 * the bottom-pinned modal wrapper, 50pt rows, and the four text classes `ItemStyleClasses` shows.
 *
 * Two things in the widget's own styles file are worth knowing and are not worth a story. It exports
 * `defaultPaddings` and `defaultMargins` that add 24pt of bottom inset on notched iPhones — but the list
 * stops at the iPhone 11 generation, so every device since gets 0, and in any case nothing in the widget
 * imports either constant. And that check calls `react-native-device-info` at module load, which is why
 * this widget pulls a native dependency in for styling it does not apply.
 */
