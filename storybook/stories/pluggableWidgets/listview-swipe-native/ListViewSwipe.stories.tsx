import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ListViewSwipe } from "../../../../packages/pluggableWidgets/listview-swipe-native/src/ListViewSwipe";
import type { ListViewSwipeStyle } from "../../../../packages/pluggableWidgets/listview-swipe-native/src/ui/styles";
import type {
    LeftRenderModeEnum,
    RightRenderModeEnum
} from "../../../../packages/pluggableWidgets/listview-swipe-native/typings/ListViewSwipeProps";
import { actionValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Every story here has to be swiped — there is no prop that opens a row, and a still frame of this
 * widget is just its content. Drag a row left or right and watch the console for `[story] action fired`.
 *
 * Two things about the styling are worth knowing before reading the stories below.
 *
 * `leftAction` and `rightAction` are not plain styles: `panelSize` and `threshold` are widget-read
 * numbers that live in the same object as the `ViewStyle` properties, and the widget strips both out
 * before handing the rest to React Native (`const { panelSize, ...normalStyle } = style; delete
 * normalStyle.threshold`). So they belong in the theme, which is not where anyone would look for a
 * gesture distance.
 *
 * And Atlas paints both panels `background.primary` — the same colour as the row itself. So on Atlas as
 * shipped a swipe reveals a white panel behind a white row, and the only thing that marks it is whatever
 * a modeller dropped inside. Every story below colours the panel from the story side for that reason;
 * `Theming` is the one that shows the shipped state next to a coloured one.
 */
const atlas = atlasStyle("com.mendix.widget.native.listviewswipe.ListViewSwipe") as ListViewSwipeStyle[];

const styles = StyleSheet.create({
    /** A row of list content, so the swipe has something recognisable to move. */
    row: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: variables.spacing.regular,
        paddingVertical: variables.spacing.regular
    },
    rowTitle: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold"
    },
    rowMeta: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall
    },
    /** A hairline under each row, since the widget draws no separator of its own. */
    separator: { backgroundColor: variables.border.color, height: StyleSheet.hairlineWidth },
    /** Panel content. The panel itself is styled from the theme; this is what sits inside it. */
    panel: { alignItems: "center", flexDirection: "row", justifyContent: "center", paddingHorizontal: 12 },
    panelLabel: {
        color: variables.background.primary,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        fontWeight: "bold"
    },
    /** Two buttons side by side, for the `buttons` render mode. */
    buttonRow: { flex: 1, flexDirection: "row" },
    button: { alignItems: "center", flex: 1, justifyContent: "center" },
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    }
});

function listRow(title: string, meta: string): ReactNode {
    return (
        <View>
            <View style={styles.row}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowMeta}>{meta}</Text>
            </View>
            <View style={styles.separator} />
        </View>
    );
}

/** A single-label panel, for the action render modes. */
function panel(label: string): ReactNode {
    return (
        <View style={styles.panel}>
            <Text style={styles.panelLabel}>{label}</Text>
        </View>
    );
}

/** Two tappable-looking cells, for the `buttons` render mode. */
function buttons(first: string, second: string): ReactNode {
    return (
        <View style={styles.buttonRow}>
            <View style={[styles.button, { backgroundColor: variables.brand.warning }]}>
                <Text style={styles.panelLabel}>{first}</Text>
            </View>
            <View style={[styles.button, { backgroundColor: variables.brand.danger }]}>
                <Text style={styles.panelLabel}>{second}</Text>
            </View>
        </View>
    );
}

/**
 * Atlas plus a colour on each panel, since Atlas's own is the row's own white.
 *
 * Written as a full `leftAction`/`rightAction` object rather than a partial one: `flattenStyles` spreads
 * one level below each top-level key, so a partial *does* merge correctly here — but `panelSize` has to
 * be carried along or Atlas's 160 is what survives, which is the intent for most of these stories.
 */
function panelColours(left: string, right: string, panelSize = 160): ListViewSwipeStyle[] {
    return atlas.concat([
        {
            leftAction: { panelSize, backgroundColor: left },
            rightAction: { panelSize, backgroundColor: right }
        }
    ] as ListViewSwipeStyle[]);
}

const baseProps = {
    name: "listview-swipe",
    style: panelColours(variables.brand.success, variables.brand.danger),
    content: listRow("Invoice 2024-118", "€ 1,240.00"),
    left: panel("Approve"),
    leftRenderMode: "swipeOutReset" as LeftRenderModeEnum,
    onSwipeLeft: actionValue("left panel: Approve"),
    right: panel("Delete"),
    rightRenderMode: "swipeOutReset" as RightRenderModeEnum,
    onSwipeRight: actionValue("right panel: Delete")
};

const meta = {
    title: "Widgets/ListViewSwipe",
    component: ListViewSwipe,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ListViewSwipe>;

export default meta;

/**
 * One row, with an action panel on each side.
 *
 * Swipe right to reveal Approve, left to reveal Delete. Past the threshold the row springs back and the
 * action fires — that is `swipeOutReset`, the mode most lists want. `overshootLeft`/`overshootRight` are
 * both `false` in the widget, so the row cannot be dragged past its panel.
 *
 * The panel is `flex: 1` in this mode, so it grows with the drag rather than sitting at a fixed width —
 * `panelSize` does nothing here. See `PanelSizeAndThreshold`.
 *
 * `args` as well as a `render`, unlike the stories below: the args feed Storybook's controls panel, so
 * this is the one to switch a render mode on and watch.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The five render modes, which choose what happens *after* the swipe passes the threshold rather than
 * how the panel looks.
 *
 * `swipeOutReset` closes the row and runs the action. `toggle` does the same two things in the same
 * order — the difference is entirely in the panel: `toggle` is the only action mode that respects
 * `panelSize`, pinning the panel at a fixed width (`flex: 0, width: panelSize`) instead of letting it
 * stretch. So the choice between them is a layout decision described as a behavioural one.
 *
 * `archive` animates the row's height to 0 over 200ms and runs the action when the animation finishes —
 * so the action sees a row that has already gone. If it does not actually remove the record, the row
 * stays collapsed to nothing with no way back; reload the story to bring it back. The height it animates
 * from is captured in `onLayout`, so a row that has not laid out yet animates from 0 and simply vanishes.
 *
 * `disabled` returns `undefined` from the render callback, which is how `Swipeable` is told there is
 * nothing on that side — the row will not move that way at all, and `left`/`right` are ignored even if
 * set. The fifth row below has both content and an action on the left, and neither is reachable.
 *
 * `buttons` is the odd one: it is the only mode where the panel is not an action. The other four wrap
 * the content in a `RectButton` whose `onPress` closes the row, so tapping anywhere on the panel just
 * dismisses it; `buttons` renders a plain `View` and leaves the tap handling to whatever is inside. That
 * is why an app that wants two distinct actions on one side has to use it — and why its own buttons have
 * to close the row themselves.
 */
export const RenderModes: StoryObj<typeof ListViewSwipe> = {
    render: () => (
        <StoryRows>
            <StoryRow label="swipeOutReset — closes, then runs the action; panel stretches with the drag">
                <ListViewSwipe
                    {...baseProps}
                    content={listRow("swipeOutReset", "swipe either way")}
                    leftRenderMode="swipeOutReset"
                    rightRenderMode="swipeOutReset"
                />
            </StoryRow>
            <StoryRow label="toggle — same behaviour, but the panel is pinned at panelSize">
                <ListViewSwipe
                    {...baseProps}
                    content={listRow("toggle", "note the fixed-width panel")}
                    leftRenderMode="toggle"
                    rightRenderMode="toggle"
                />
            </StoryRow>
            <StoryRow label="archive — collapses to nothing, then runs the action; reload to restore">
                <ListViewSwipe
                    {...baseProps}
                    content={listRow("archive", "the row will disappear")}
                    leftRenderMode="archive"
                    rightRenderMode="archive"
                />
            </StoryRow>
            <StoryRow label="buttons — a plain panel, not a RectButton; its cells handle their own taps">
                <ListViewSwipe
                    {...baseProps}
                    style={panelColours(variables.brand.primary, variables.brand.danger)}
                    content={listRow("buttons", "two actions on the right")}
                    leftRenderMode="disabled"
                    right={buttons("Flag", "Delete")}
                    rightRenderMode="buttons"
                />
            </StoryRow>
            <StoryRow label="disabled — the row will not move left, and its left panel is unreachable">
                <ListViewSwipe
                    {...baseProps}
                    content={listRow("disabled left", "only swipes right")}
                    leftRenderMode="disabled"
                    rightRenderMode="swipeOutReset"
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `panelSize` and `threshold`, the two numbers the theme carries that are not styles.
 *
 * `panelSize` only reaches the layout in two of the five modes — `toggle`, where it is the panel's fixed
 * width, and `buttons`, where it is the width of the container the buttons divide up. In `archive` and
 * `swipeOutReset` the panel is `flex: 1` and setting it changes nothing, which is the first two rows
 * below: identical `panelSize` values, and only the toggle row honours them.
 *
 * `threshold` is the drag distance at which the row counts as opened. The widget falls back to 100 for
 * an action mode and 40 for `buttons`, but that fallback is close to dead: `flattenStyles` merges over
 * the widget's own default, which already sets `threshold: 64` on both sides, so 64 is what applies
 * unless a theme overrides it — and Atlas does not. The fallback is only reachable by writing a falsy
 * value, since the check is `styles.leftAction.threshold ? … : …` rather than a null test. So
 * `threshold: 0` does not mean "open immediately"; it means "use 100".
 *
 * The last row is a very short threshold on the left and a long one on the right, which is what a list
 * with one safe action and one destructive one wants.
 */
export const PanelSizeAndThreshold: StoryObj<typeof ListViewSwipe> = {
    render: () => (
        <StoryRows>
            <StoryRow label="swipeOutReset, panelSize 80 — ignored, the panel still stretches">
                <ListViewSwipe
                    {...baseProps}
                    style={panelColours(variables.brand.success, variables.brand.danger, 80)}
                    content={listRow("panelSize 80", "no effect here")}
                />
            </StoryRow>
            <StoryRow label="toggle, panelSize 80 — the same value, now visible as the panel width">
                <ListViewSwipe
                    {...baseProps}
                    style={panelColours(variables.brand.success, variables.brand.danger, 80)}
                    content={listRow("panelSize 80", "pinned at 80pt")}
                    leftRenderMode="toggle"
                    rightRenderMode="toggle"
                />
            </StoryRow>
            <StoryRow label="toggle, panelSize 240 — Atlas's large-panels value, for a panel with a caption">
                <ListViewSwipe
                    {...baseProps}
                    style={panelColours(variables.brand.success, variables.brand.danger, 240)}
                    content={listRow("panelSize 240", "pinned at 240pt")}
                    leftRenderMode="toggle"
                    rightRenderMode="toggle"
                />
            </StoryRow>
            <StoryRow label="threshold 24 left, 200 right — a light approve and a deliberate delete">
                <ListViewSwipe
                    {...baseProps}
                    content={listRow("asymmetric thresholds", "left is easy, right is not")}
                    style={atlas.concat([
                        {
                            leftAction: {
                                panelSize: 160,
                                backgroundColor: variables.brand.success,
                                threshold: 24
                            },
                            rightAction: {
                                panelSize: 160,
                                backgroundColor: variables.brand.danger,
                                threshold: 200
                            }
                        }
                    ] as ListViewSwipeStyle[])}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The Atlas design-property classes — the only widget in this batch that has any.
 *
 * `listViewSwipeSmallPanels` and `listViewSwipeLargePanels` set nothing but `panelSize`, 80 and 240
 * against the base 160. Which means they are invisible on the render mode Atlas's own entry implies:
 * ticking "Small panels" on a `swipeOutReset` row changes nothing at all, for the reason
 * `PanelSizeAndThreshold` covers. The rows below are all `toggle` so the classes have somewhere to land.
 *
 * `atlasClasses` rather than `atlasVariant` is enough here: the style is two levels deep
 * (`leftAction.panelSize`), so `flattenStyles`' single-level spread merges the class into Atlas's
 * `leftAction` without dropping the `backgroundColor` alongside it. The colour override is concat'd
 * *after* the class, since later entries win and both touch the same key.
 */
export const AtlasVariants: StoryObj<typeof ListViewSwipe> = {
    render: () => (
        <StoryRows>
            {(
                [
                    ["base — panelSize 160", []],
                    ["listViewSwipeSmallPanels — 80", ["listViewSwipeSmallPanels"]],
                    ["listViewSwipeLargePanels — 240", ["listViewSwipeLargePanels"]]
                ] as Array<[string, string[]]>
            ).map(([label, classes]) => (
                <StoryRow key={label} label={label}>
                    <ListViewSwipe
                        {...baseProps}
                        content={listRow(label.split(" —")[0], "toggle mode, so panelSize applies")}
                        leftRenderMode="toggle"
                        rightRenderMode="toggle"
                        style={atlas.concat(atlasClasses(...classes) as ListViewSwipeStyle[]).concat([
                            {
                                leftAction: { backgroundColor: variables.brand.success },
                                rightAction: { backgroundColor: variables.brand.danger }
                            }
                        ] as ListViewSwipeStyle[])}
                    />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * The theme's three keys, and the panel colour Atlas leaves the way it does.
 *
 * The first row is Atlas exactly as shipped: swipe it and the row slides aside to reveal nothing at all —
 * a white panel behind a white row, and this story's panel label is white too (`panelLabel` uses
 * `background.primary`, for the coloured panels everywhere else), so not even the text marks the edge.
 * That is not a bug so much as a decision — the theme cannot know what an app's actions mean, so it
 * declines to colour them and leaves `background.primary` on both sides. It does mean every app has to
 * set these two colours itself, and an app that forgets gets a swipe that appears to do nothing.
 *
 * `container` is the row's own wrapper, and the place to put a row background: it is what sits above the
 * panel, so a transparent one shows the panel through the row. Its `onLayout` is also what seeds the
 * `archive` animation, so it is the height that matters there.
 *
 * The widget draws no separator between rows and has no key for one — the hairline in these stories is
 * part of the story's row content, not the theme's.
 */
export const Theming: StoryObj<typeof ListViewSwipe> = {
    render: () => (
        <StoryRows>
            <StoryRow label="Atlas as shipped — a white panel behind a white row">
                <ListViewSwipe
                    {...baseProps}
                    style={atlas}
                    content={listRow("Atlas default", "swipe: the panel is white")}
                />
            </StoryRow>
            <StoryRow label="both panels coloured, and a tinted row above them">
                <ListViewSwipe
                    {...baseProps}
                    content={listRow("Restyled", "the row sits above the panel")}
                    style={
                        atlas.concat([
                            {
                                container: { backgroundColor: variables.background.secondary },
                                leftAction: {
                                    panelSize: 160,
                                    backgroundColor: variables.brand.success,
                                    justifyContent: "flex-start"
                                },
                                rightAction: {
                                    panelSize: 160,
                                    backgroundColor: variables.brand.danger,
                                    justifyContent: "flex-end"
                                }
                            }
                        ]) as ListViewSwipeStyle[]
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A short list, which is how this widget is actually used.
 *
 * There is no data source here: the widget wraps one row, and a modeller puts it *inside* a list view or
 * a gallery so the runtime instantiates one per record. Each instance owns its own `Swipeable` and
 * nothing coordinates them — there is no "close the others" behaviour to configure.
 *
 * Whether that is visible depends on the render mode, which is the thing worth seeing here. The rows are
 * `buttons` on the right, the one mode that does *not* call `close()` after the swipe, so a row that is
 * opened stays open: swipe two of them right-to-left and both panels remain out at once. On the
 * `swipeOutReset` and `toggle` rows everywhere else in this file the widget closes the row itself, so an
 * open row is never a state a list can be left in — the independence is real either way, but only
 * `buttons` shows it.
 *
 * The left side is `swipeOutReset` for contrast: swipe a row the other way and it springs shut whatever
 * the others are doing.
 *
 * Each row also gets its own actions, which is what the per-row `ListActionValue` gives a modeller — the
 * console lines name the row that fired.
 */
export const InAList: StoryObj<typeof ListViewSwipe> = {
    render: () => (
        <View>
            <Text style={styles.note}>
                Three independent rows. Swipe two of them right-to-left — both panels stay out, because `buttons` is the
                one mode that leaves the row open.
            </Text>
            {[
                ["Invoice 2024-118", "€ 1,240.00"],
                ["Invoice 2024-119", "€ 87.50"],
                ["Invoice 2024-120", "€ 3,015.00"]
            ].map(([title, amount]) => (
                <ListViewSwipe
                    {...baseProps}
                    key={title}
                    style={panelColours(variables.brand.success, variables.brand.danger, 200)}
                    content={listRow(title, amount)}
                    leftRenderMode="swipeOutReset"
                    onSwipeLeft={actionValue(`approve: ${title}`)}
                    right={buttons("Flag", "Delete")}
                    rightRenderMode="buttons"
                    onSwipeRight={actionValue(`buttons panel: ${title}`)}
                />
            ))}
        </View>
    )
};
