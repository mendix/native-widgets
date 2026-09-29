import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PopupMenu } from "../../../../packages/pluggableWidgets/popup-menu-native/src/PopupMenu";
import type { PopupMenuStyle } from "../../../../packages/pluggableWidgets/popup-menu-native/src/ui/Styles";
import type {
    BasicItemsType,
    CustomItemsType
} from "../../../../packages/pluggableWidgets/popup-menu-native/typings/PopupMenuProps";
import { actionValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Every story here has to be tapped: the menu has no `visible` prop and no way to open it from the
 * outside. It keeps a `react-native-material-menu` ref and calls `show()` from the trigger's own
 * `onPress`, so a still frame of this widget is only ever the trigger.
 *
 * Two things about the styling are worth knowing before reading the override stories below.
 *
 * This widget flattens `props.style` with `StyleSheet.flatten`, not with `flattenStyles` — and
 * `StyleSheet.flatten` merges only the *top* level: for each key it assigns the later value outright
 * rather than spreading into the earlier one. So `atlas.concat([{ basic: { dividerColor: "red" } }])`
 * does not tint the divider on top of Atlas, it replaces the whole `basic` object and takes the item
 * text styling with it. Overrides here respread the Atlas values they mean to keep, which is what an
 * app's own theme entry does too.
 *
 * And a selected item's action does not run for half a second: `handlePress` hides the menu and then
 * `setTimeout(…, 500)` before executing, because the menu's modal would dismiss any alert the action
 * opened. Watch the console for `[story] action fired` and expect the delay.
 */
const atlas = atlasStyle("com.mendix.widget.native.popupmenu.PopupMenu") as PopupMenuStyle[];

/** Atlas's own entry, for the overrides that have to rebuild a branch of it by hand. */
const [atlasBase] = atlas as [PopupMenuStyle];

const styles = StyleSheet.create({
    trigger: {
        alignSelf: "flex-start",
        backgroundColor: variables.brand.primary,
        borderRadius: variables.border.radiusSmall,
        paddingHorizontal: variables.spacing.regular,
        paddingVertical: variables.spacing.small
    },
    triggerText: {
        // `background.primary` rather than a literal white, so the trigger inverts correctly if the
        // theme is switched to dark mode — Atlas has no "on brand colour" font token.
        color: variables.background.primary,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold"
    },
    // The custom render mode puts whatever a modeller dropped in each row, so a story has to supply
    // its own row layout — there is no caption property to fall back on.
    customRow: { alignItems: "center", flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10 },
    customLabel: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        marginLeft: 12
    },
    swatch: { borderRadius: 6, height: 12, width: 12 }
});

/** A tappable trigger, since `menuTriggerer` is a bare `ReactNode` and an absent one is invisible. */
function trigger(label: string): ReactNode {
    return (
        <View style={styles.trigger}>
            <Text style={styles.triggerText}>{label}</Text>
        </View>
    );
}

const item = (caption: string, styleClass: BasicItemsType["styleClass"] = "defaultStyle"): BasicItemsType => ({
    itemType: "item",
    caption,
    action: actionValue(`popup menu: ${caption}`),
    styleClass
});

const divider: BasicItemsType = { itemType: "divider", caption: "", styleClass: "defaultStyle" };

const basicItems: BasicItemsType[] = [item("Open"), item("Duplicate"), item("Share")];

/** One of each `styleClass`, plus the divider that separates the destructive one. */
const styledItems: BasicItemsType[] = [
    item("Open"),
    item("Save as draft", "primaryStyle"),
    item("Rename", "customStyle"),
    divider,
    item("Delete", "dangerStyle")
];

/**
 * A caption long enough to need `ellipsizeMode`.
 *
 * The menu sizes itself to its widest item up to a screen-width limit, so this is what decides
 * whether a long caption is truncated and where. Atlas sets `"tail"`.
 */
const longItems: BasicItemsType[] = [item("Export this record and everything attached to it"), item("Short one")];

const customItems: CustomItemsType[] = [
    {
        content: (
            <View style={styles.customRow}>
                <View style={[styles.swatch, { backgroundColor: variables.brand.success }]} />
                <Text style={styles.customLabel}>Approved</Text>
            </View>
        ),
        action: actionValue("popup menu: Approved")
    },
    {
        content: (
            <View style={styles.customRow}>
                <View style={[styles.swatch, { backgroundColor: variables.brand.warning }]} />
                <Text style={styles.customLabel}>Needs review</Text>
            </View>
        ),
        action: actionValue("popup menu: Needs review")
    },
    {
        content: (
            <View style={styles.customRow}>
                <View style={[styles.swatch, { backgroundColor: variables.brand.danger }]} />
                <Text style={styles.customLabel}>Rejected</Text>
            </View>
        ),
        action: actionValue("popup menu: Rejected")
    }
];

const baseProps = {
    name: "popup-menu",
    style: atlas,
    popupRenderMode: "basic" as const,
    basicItems,
    // Required by the typings whichever mode is active — the widget reads only the one that matches
    // `popupRenderMode`, and the runtime passes both for the same reason.
    customItems: [],
    menuTriggerer: trigger("Actions")
};

const meta = {
    title: "Widgets/PopupMenu",
    component: PopupMenu,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof PopupMenu>;

export default meta;

/**
 * Three plain items on Atlas's rounded, shadowed surface. Tap "Actions" to open it.
 *
 * `args` as well as a `render`, unlike the stories below: the args feed Storybook's controls panel,
 * so this is the one to change a property on and watch.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The four `styleClass` values, and the divider.
 *
 * A class is picked per item in Studio Pro and names an entry under `basic.itemStyle` in the theme —
 * so what "danger" looks like is the theme's business, not the widget's. Atlas gives `primaryStyle`
 * the brand colour, `dangerStyle` the danger colour, and leaves `customStyle` empty, which is why
 * "Rename" below is indistinguishable from "Open": an unfilled hook, not a broken one.
 *
 * `itemType: "divider"` ignores the caption entirely and draws a line in `basic.dividerColor`.
 */
export const ItemStyles: StoryObj<typeof PopupMenu> = {
    render: () => <PopupMenu {...baseProps} basicItems={styledItems} menuTriggerer={trigger("Record")} />
};

/**
 * `popupRenderMode: "custom"`, where each row is a widget rather than a caption.
 *
 * The trade is total layout control for having to supply everything: there is no caption, no text
 * style and no `styleClass`, so `basic.itemStyle` is not consulted at all and the rows below draw
 * their own padding. `custom.container` styles each row's wrapper, and on Android the widget puts
 * that same style on both the `TouchableNativeFeedback` and the `View` inside it.
 */
export const CustomItems: StoryObj<typeof PopupMenu> = {
    render: () => (
        <PopupMenu
            {...baseProps}
            popupRenderMode="custom"
            basicItems={[]}
            customItems={customItems}
            menuTriggerer={trigger("Status")}
        />
    )
};

/**
 * `basic.itemStyle.ellipsizeMode`, which decides where a caption too wide for the menu is cut.
 *
 * The menu measures its own content and stops at the screen width less an 8pt indent, so the first
 * item in each row below is truncated. Atlas's `"tail"` is the usual choice; `"middle"` keeps the
 * end of the caption visible, which is what a filename or an id needs.
 *
 * Both rows rebuild `basic` from Atlas's own values rather than adding to it — see the header. Drop
 * the `...atlasBase.basic` spread and the item text loses its colour and size entirely.
 */
export const LongCaptions: StoryObj<typeof PopupMenu> = {
    render: () => (
        <StoryRows>
            <StoryRow label='ellipsizeMode: "tail" — Atlas default'>
                <PopupMenu {...baseProps} basicItems={longItems} menuTriggerer={trigger("Tail")} />
            </StoryRow>
            <StoryRow label='ellipsizeMode: "middle"'>
                <PopupMenu
                    {...baseProps}
                    basicItems={longItems}
                    menuTriggerer={trigger("Middle")}
                    style={atlas.concat([
                        {
                            basic: {
                                ...atlasBase.basic,
                                itemStyle: { ...atlasBase.basic?.itemStyle, ellipsizeMode: "middle" }
                            }
                        }
                    ])}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The surface itself, restyled.
 *
 * `container` is the popup's own background, radius and elevation, and the widget also reads
 * `container.borderRadius` a second time — for the clipping `View` it wraps the items in, so that a
 * pressed item's ripple does not square off the rounded corner. Setting the radius in one place gets
 * both. `basic.container` is the per-item row, which is where the row height lives.
 *
 * `buttonContainer` styles the trigger's wrapper rather than the menu, which is the only hook for
 * spacing around whatever a modeller dropped in as the triggerer.
 */
export const SurfaceStyling: StoryObj<typeof PopupMenu> = {
    render: () => (
        <PopupMenu
            {...baseProps}
            basicItems={styledItems}
            menuTriggerer={trigger("Restyled")}
            style={atlas.concat([
                {
                    container: {
                        ...atlasBase.container,
                        backgroundColor: variables.background.primary,
                        borderColor: variables.border.color,
                        borderRadius: 4,
                        borderWidth: 1
                    },
                    basic: {
                        ...atlasBase.basic,
                        dividerColor: variables.brand.danger,
                        container: { ...atlasBase.basic?.container, height: 52 },
                        itemStyle: {
                            ...atlasBase.basic?.itemStyle,
                            rippleColor: variables.brand.primaryLight,
                            defaultStyle: {
                                ...atlasBase.basic?.itemStyle?.defaultStyle,
                                fontSize: variables.font.sizeSmall
                            }
                        }
                    },
                    buttonContainer: { paddingVertical: variables.spacing.smallest }
                }
            ])}
        />
    )
};

/**
 * No Atlas variants story and no empty-items story.
 *
 * `com_mendix_widget_native_popupmenu_PopupMenu` is the only entry Atlas exports for this widget —
 * there are no design-property classes — and `ItemStyles` above already shows the whole of it.
 *
 * An empty `basicItems` is not worth a story either: the trigger still opens a menu, and what appears
 * is Atlas's rounded surface at its minimum size with nothing in it. Nothing about that is specific
 * to the widget, and it is the same in the custom mode.
 */
