import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { ValueStatus } from "mendix";
import { Gallery } from "../../../../packages/pluggableWidgets/gallery-native/src/Gallery";
import type { GalleryStyle } from "../../../../packages/pluggableWidgets/gallery-native/src/ui/Styles";
import { dynamicValue, listActionValue, listWidgetValue, useListValue } from "../../shared/mendixValues";
import type { ListSource, Row } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Every story here builds its data source with `useListValue` rather than `listValue`, and that is the
 * thing to know before reading them.
 *
 * The gallery does not just read its rows: it writes back. `setLimit` is how it pages — an effect calls
 * it with `pageSize` on mount, because the runtime hands the source over with
 * `limit: POSITIVE_INFINITY` — and `setFilter` is how a nested filter widget narrows the list. Both are
 * no-ops on the plain `listValue` stub, so a Load more button would do nothing and a text filter would
 * filter nothing. `useListValue` keeps the limit and the condition in state and slices the rows itself,
 * which is the runtime's half of the exchange.
 *
 * Two consequences worth spelling out, since they shape what these stories can show.
 *
 * `setFilter` is called from the widget's *render body*, not from an effect — every render, unconditionally
 * (`if (filters.length) setFilter(...) else if (filtered) setFilter(undefined) else setFilter(viewState)`).
 * A source that applied it synchronously would be setting state during another component's render, so the
 * stub defers to a microtask and compares the serialised condition before accepting it. That comparison is
 * what stops the loop; without it the widget would re-render forever.
 *
 * And `numColumns` is read once, from `DeviceInfo.isTablet()`, at render: `tabletColumns` on a tablet,
 * `phoneColumns` otherwise. There is no breakpoint and no re-measure, so on the phone emulator these
 * stories all show `phoneColumns` and `tabletColumns` is dead. `Columns` below says which is which.
 *
 * The list is `@shopify/flash-list`, not `FlatList`, and only in the vertical direction does the widget
 * pass `numColumns` — a horizontal gallery is always one row deep. The horizontal case also gives each
 * item the full window width (`{ width }` from `useWindowDimensions`), so a horizontal gallery is a pager
 * of full-width slides whatever the column count says.
 */
const atlas = atlasStyle("com.mendix.widget.native.gallery.Gallery") as GalleryStyle[];

const styles = StyleSheet.create({
    /** A card, standing in for the widgets a modeller nests in the content placeholder. */
    card: {
        backgroundColor: variables.background.secondary,
        borderRadius: variables.border.radiusLarge,
        overflow: "hidden",
        padding: variables.spacing.small
    },
    cardImage: { borderRadius: variables.border.radiusSmall, height: 64, marginBottom: variables.spacing.smallest },
    cardTitle: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold"
    },
    cardMeta: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall
    },
    /** A plain row, for the stories about paging rather than layout. */
    listRow: { paddingVertical: variables.spacing.small },
    empty: { alignItems: "center", padding: variables.spacing.large },
    emptyText: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.size
    },
    /** A height, because a FlashList inside a ScrollView has no bound of its own. */
    box: { height: 300 },
    shortBox: { height: 180 },
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    },
    /** A visible boundary, so a gallery that renders nothing can be told from one that is absent. */
    outline: {
        borderColor: variables.brand.primary,
        borderStyle: "dashed",
        borderWidth: 1,
        height: 140
    }
});

const landscape = require("../../shared/assets/landscape.png");

const products: Row[] = [
    { name: "Desk lamp", price: "€ 39.00", stock: 12 },
    { name: "Office chair", price: "€ 249.00", stock: 3 },
    { name: "Monitor arm", price: "€ 79.00", stock: 0 },
    { name: "Keyboard", price: "€ 119.00", stock: 24 },
    { name: "Standing desk", price: "€ 649.00", stock: 2 },
    { name: "Desk mat", price: "€ 29.00", stock: 41 },
    { name: "Webcam", price: "€ 89.00", stock: 7 },
    { name: "Headset", price: "€ 149.00", stock: 15 },
    { name: "Laptop stand", price: "€ 45.00", stock: 9 },
    { name: "Cable tray", price: "€ 19.00", stock: 33 },
    { name: "Footrest", price: "€ 35.00", stock: 5 },
    { name: "Desk drawer", price: "€ 99.00", stock: 1 }
];

/** The content placeholder: a card per row, with an image so a grid cell has something to fill. */
function productCard(source: ListSource): ReturnType<typeof listWidgetValue> {
    return listWidgetValue(source, row => (
        <View style={styles.card}>
            <Image source={landscape} style={styles.cardImage} resizeMode="cover" />
            <Text style={styles.cardTitle}>{String(row.name)}</Text>
            <Text style={styles.cardMeta}>{String(row.price)}</Text>
        </View>
    ));
}

/** The same rows without the image, for the stories where the card would only add height. */
function productRow(source: ListSource): ReturnType<typeof listWidgetValue> {
    return listWidgetValue(source, row => (
        <View style={styles.listRow}>
            <Text style={styles.cardTitle}>{String(row.name)}</Text>
            <Text style={styles.cardMeta}>
                {String(row.price)} — {String(row.stock)} in stock
            </Text>
        </View>
    ));
}

const emptyPlaceholder = (
    <View style={styles.empty}>
        <Text style={styles.emptyText}>No products match.</Text>
    </View>
);

/**
 * `container: { flex: 1 }`, appended to Atlas for every story here, and it is not cosmetic.
 *
 * Atlas leaves `container` empty, and the widget puts the `FlashList` inside that `View` with nothing to
 * give either one a height. A `FlashList` has no intrinsic height — unlike a `ScrollView` it will not
 * grow to its content — so an unsized gallery lays out at zero and renders nothing at all: no rows, and
 * not even the empty placeholder. Verified on device: without this the stories are entirely blank.
 *
 * In an app the height comes from the page, which is a flex column, so the gallery gets one for free.
 * Here the surrounding `StoryFrame` is a `ScrollView`, whose children size to their content, so the
 * stories have to supply it themselves — a fixed height on the wrapping `View` plus this `flex: 1` to
 * fill it. Worth knowing for a real app too: a gallery inside a scroll container needs the same.
 */
const fill = [{ container: { flex: 1 } }] as GalleryStyle[];

/**
 * The props every story starts from, minus the data source — which has to come from a hook, so each
 * story builds its own.
 */
const baseProps = {
    name: "gallery",
    style: atlas.concat(fill),
    scrollDirection: "vertical" as const,
    tabletColumns: 3,
    phoneColumns: 2,
    pageSize: 6,
    pagination: "virtualScrolling" as const,
    filterList: [],
    emptyPlaceholder
};

const meta = {
    title: "Widgets/Gallery",
    component: Gallery,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Gallery>;

export default meta;

/**
 * Twelve products in a two-column grid, six at a time.
 *
 * `pageSize: 6` and `virtualScrolling`, so the first page is six cards and scrolling to the bottom loads
 * the rest — the widget calls `loadMoreItems` from `onEndReached` at a 0.6 threshold, which fires well
 * before the last row is visible. Tap a card and the console shows which one: `onClick` is a
 * `ListActionValue`, one action per row.
 *
 * No `args` here, unlike most files in this folder — `useListValue` is a hook, so the data source cannot
 * be built at module scope and every story has to own a `render`. That costs the controls panel: args are
 * what populate it, and a `render` that ignores them leaves the panel empty. The enum and number
 * properties are shown as separate rows below instead.
 */
export const Default: StoryObj<typeof Gallery> = {
    render: () => {
        const source = useListValue(products, { pageSize: 6 });
        return (
            <View style={styles.box}>
                <Gallery
                    {...baseProps}
                    datasource={source.value}
                    content={productCard(source)}
                    onClick={listActionValue(source, "gallery item", row => String(row.name))}
                />
            </View>
        );
    }
};

/**
 * `phoneColumns` and `tabletColumns` — one of which is doing nothing on any given device.
 *
 * The widget picks between them with `DeviceInfo.isTablet()` and nothing else. There is no orientation
 * check and no width breakpoint, so a phone in landscape still gets `phoneColumns` and a tablet in
 * portrait still gets `tabletColumns`. On this emulator that means the numbers below are `phoneColumns`;
 * `tabletColumns` is set to a different value in each row and changes nothing, which is the point.
 *
 * The column count also only applies vertically — `numColumns` is passed to the list only when
 * `scrollDirection` is `vertical`. See `ScrollDirection`.
 */
export const Columns: StoryObj<typeof Gallery> = {
    render: () => {
        const one = useListValue(products, { pageSize: 6 });
        const two = useListValue(products, { pageSize: 6 });
        const three = useListValue(products, { pageSize: 6 });
        return (
            <StoryRows>
                <StoryRow label="phoneColumns 1 (tabletColumns 4, unused here)">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            phoneColumns={1}
                            tabletColumns={4}
                            datasource={one.value}
                            content={productCard(one)}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="phoneColumns 2">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            phoneColumns={2}
                            tabletColumns={1}
                            datasource={two.value}
                            content={productCard(two)}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="phoneColumns 3 — the cards get narrow, and nothing stops them">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            phoneColumns={3}
                            tabletColumns={1}
                            datasource={three.value}
                            content={productCard(three)}
                        />
                    </View>
                </StoryRow>
            </StoryRows>
        );
    }
};

/**
 * `scrollDirection`, which changes more than the axis.
 *
 * Horizontal drops the column count — `numColumns` is only passed when vertical — and gives every item
 * `width` from `useWindowDimensions`, so each card is exactly one screen wide regardless of what the
 * content asks for. That makes a horizontal gallery a full-page pager rather than a strip of cards; an
 * app that wants a narrow carousel has to size the *content* and accept the full-width cell around it,
 * because the cell's width is not themeable.
 *
 * Pull-to-refresh is also vertical-only: `onRefresh` is passed to the list only when vertical, so a
 * horizontal gallery ignores `pullDown` entirely even though Studio Pro still offers it. See `PullDown`.
 */
export const ScrollDirection: StoryObj<typeof Gallery> = {
    render: () => {
        const vertical = useListValue(products, { pageSize: 6 });
        const horizontal = useListValue(products, { pageSize: 6 });
        return (
            <StoryRows>
                <StoryRow label="vertical — two columns, scrolls down">
                    <View style={styles.shortBox}>
                        <Gallery {...baseProps} datasource={vertical.value} content={productCard(vertical)} />
                    </View>
                </StoryRow>
                <StoryRow label="horizontal — one full-width item per screen, columns ignored">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            scrollDirection="horizontal"
                            datasource={horizontal.value}
                            content={productCard(horizontal)}
                        />
                    </View>
                </StoryRow>
            </StoryRows>
        );
    }
};

/**
 * `pagination`, and the button Atlas styles as a primary button.
 *
 * `virtualScrolling` loads the next page from `onEndReached`; `buttons` renders a footer button instead
 * and loads only when it is pressed. The button appears only while `hasMoreItems` is true, so it
 * disappears on the last page rather than going disabled — there is no exhausted state to style.
 *
 * Its caption comes from `loadMoreButtonCaption`, a text template, and falls back to a hardcoded English
 * `"Load more"` when unset — the fallback does not go through the app's language, so an app that leaves
 * it empty ships an English string.
 *
 * The button is a `Pressable` with `android_ripple` on Android and a `TouchableOpacity` on iOS, and the
 * four ripple keys (`rippleColor`, `borderless`, `radius`, `foreground`) live in
 * `loadMoreButtonPressableContainer` alongside the ordinary `ViewStyle` properties — `extractStyles`
 * splits them out. So a ripple colour belongs in the theme, which is not where anyone would look.
 */
export const Pagination: StoryObj<typeof Gallery> = {
    render: () => {
        const scrolling = useListValue(products, { pageSize: 4 });
        const buttons = useListValue(products, { pageSize: 4 });
        const captioned = useListValue(products, { pageSize: 4 });
        return (
            <StoryRows>
                <StoryRow label="virtualScrolling — the next page loads as you reach the end">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            datasource={scrolling.value}
                            content={productRow(scrolling)}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="buttons — a footer button, four more rows per press, gone on the last page">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            pagination="buttons"
                            datasource={buttons.value}
                            content={productRow(buttons)}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="a custom caption, and a ripple colour out of the theme">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            pagination="buttons"
                            loadMoreButtonCaption={dynamicValue("Show four more")}
                            datasource={captioned.value}
                            content={productRow(captioned)}
                            style={
                                atlas.concat(fill).concat([
                                    {
                                        loadMoreButtonPressableContainer: {
                                            // Split out by `extractStyles` and handed to android_ripple.
                                            rippleColor: variables.brand.warning,
                                            backgroundColor: variables.brand.success,
                                            borderColor: variables.brand.success
                                        }
                                    }
                                ]) as GalleryStyle[]
                            }
                        />
                    </View>
                </StoryRow>
            </StoryRows>
        );
    }
};

/**
 * The empty placeholder, which is the widget's only built-in state.
 *
 * It is a widget slot, not a caption: whatever a modeller drops in is wrapped in a `View` styled from
 * `emptyPlaceholder` and passed as the list's `ListEmptyComponent`. Leave it unset and an empty gallery
 * still renders that wrapping `View`, now around nothing — and since Atlas leaves the `emptyPlaceholder`
 * key empty there is nothing to see at all, which is the second row below. The dashed outlines are the
 * story's, to show where the gallery is.
 *
 * A *loading* source hits the same branch. The widget passes `props.datasource.items ?? []`, so Loading
 * and empty are one state to the list and the placeholder shows during the first load too — an app whose
 * placeholder says "No results" flashes that while the data is still on the wire.
 */
export const EmptyAndLoading: StoryObj<typeof Gallery> = {
    render: () => {
        const empty = useListValue([], { pageSize: 6 });
        const bare = useListValue([], { pageSize: 6 });
        const loading = useListValue(products, { pageSize: 6, status: ValueStatus.Loading });
        return (
            <StoryRows>
                <StoryRow label="empty, with a placeholder">
                    <View style={styles.outline}>
                        <Gallery {...baseProps} datasource={empty.value} content={productRow(empty)} />
                    </View>
                </StoryRow>
                <StoryRow label="empty, no placeholder — a styled box around nothing">
                    <View style={styles.outline}>
                        <Gallery
                            {...baseProps}
                            emptyPlaceholder={undefined}
                            datasource={bare.value}
                            content={productRow(bare)}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="still loading — the same placeholder, no spinner of its own">
                    <View style={styles.outline}>
                        <Gallery {...baseProps} datasource={loading.value} content={productRow(loading)} />
                    </View>
                </StoryRow>
            </StoryRows>
        );
    }
};

/**
 * `pullDown`, the refresh action.
 *
 * It reaches the list as `onRefresh`, so the affordance is the platform's own spinner rather than
 * anything the widget draws — and `refreshing` is driven by `pullDown.isExecuting`, the action's own
 * flag, which a story action never sets. So the spinner here appears and retracts immediately; in an app
 * it stays up for as long as the microflow runs.
 *
 * Vertical only. The widget passes `onRefresh` only when `scrollDirection` is vertical, so a horizontal
 * gallery silently ignores the action.
 */
export const PullDown: StoryObj<typeof Gallery> = {
    render: () => {
        const source = useListValue(products, { pageSize: 6 });
        return (
            <View>
                <Text style={styles.note}>
                    Drag down from the top of the grid. The console line is the action; the spinner is the
                    platform&apos;s.
                </Text>
                <View style={styles.box}>
                    <Gallery
                        {...baseProps}
                        datasource={source.value}
                        content={productCard(source)}
                        pullDown={{
                            canExecute: true,
                            isExecuting: false,
                            execute: () => {
                                // eslint-disable-next-line no-console
                                console.log("[story] action fired: gallery pullDown");
                            }
                        }}
                    />
                </View>
            </View>
        );
    }
};

/**
 * The nine style keys, and the two that only apply to one row each.
 *
 * `container` is the outer `View`, `list` the list itself, and `listItem` the wrapper around each item's
 * content — that last one is where a grid gap or a divider goes, since the widget draws no separator.
 * `firstItem` and `lastItem` are applied *in addition* to `listItem`, matched by id against the first and
 * last of the currently loaded rows: so `lastItem` moves as more pages load rather than marking the end
 * of the list, and in a multi-column grid "first" and "last" are the first and last cells, not rows.
 *
 * The three `loadMoreButton*` keys are covered by `Pagination`; `emptyPlaceholder` by `EmptyAndLoading`.
 *
 * Note that this widget merges with `deepmerge.all`, not `flattenStyles` — one of the few that do — so a
 * partial override merges into Atlas's nested objects instead of replacing them.
 */
export const Theming: StoryObj<typeof Gallery> = {
    render: () => {
        const source = useListValue(products, { pageSize: 6 });
        return (
            <View style={styles.box}>
                <Gallery
                    {...baseProps}
                    phoneColumns={1}
                    datasource={source.value}
                    content={productRow(source)}
                    style={
                        atlas.concat(fill).concat([
                            {
                                container: {
                                    backgroundColor: variables.background.secondary,
                                    borderRadius: variables.border.radiusLarge,
                                    padding: variables.spacing.small
                                },
                                listItem: {
                                    borderBottomColor: variables.border.color,
                                    borderBottomWidth: 1,
                                    paddingHorizontal: variables.spacing.small
                                },
                                // Both are matched against the loaded rows, so `lastItem` moves as pages load.
                                firstItem: { borderTopColor: variables.brand.primary, borderTopWidth: 2 },
                                lastItem: { borderBottomWidth: 0 }
                            }
                        ]) as GalleryStyle[]
                    }
                />
            </View>
        );
    }
};

/**
 * The Atlas design-property classes — this widget has more than any other in the batch.
 *
 * They fall into four groups, and only two of them do what their names suggest.
 *
 * `gridGap*` and `listItemBorder*` write to `listItem`, so they are per-cell padding, margin and
 * borders. These work as expected. `justifyPagination*` and `loadMoreButtonBackground*` write to
 * `loadMoreButtonPressableContainer`, so they only show when `pagination` is `buttons` — the rows below
 * are all `buttons` for that reason.
 *
 * The third group is where the names mislead. `galleryGridFlexRow`, `galleryGridFlexWrap`,
 * `galleryGridAlignSelf*` and `galleryGridJustifyContent*` also write to `listItem` — the *cell*, not the
 * grid. So "Render children horizontal" lays out the widgets a modeller nested inside one card
 * side by side; it does not turn the gallery into a row. The column count is `phoneColumns`, and no
 * design property touches it.
 *
 * `atlasClasses` rather than `atlasVariant`: this widget merges with `deepmerge.all`, which is a deep
 * merge already, so a class that sets one key of `listItem` keeps the rest.
 */
export const AtlasVariants: StoryObj<typeof Gallery> = {
    render: () => {
        const gap = useListValue(products, { pageSize: 4 });
        const divider = useListValue(products, { pageSize: 4 });
        const danger = useListValue(products, { pageSize: 4 });
        const centred = useListValue(products, { pageSize: 4 });
        return (
            <StoryRows>
                <StoryRow label="gridGapOuterMedium + listItemBorder — a gap and a box per cell">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            datasource={gap.value}
                            content={productRow(gap)}
                            style={atlas
                                .concat(fill)
                                .concat(atlasClasses("gridGapOuterMedium", "listItemBorder") as GalleryStyle[])}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="listItemBorderHorizontal — top and bottom only, so cells share edges">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            phoneColumns={1}
                            datasource={divider.value}
                            content={productRow(divider)}
                            style={atlas
                                .concat(fill)
                                .concat(atlasClasses("listItemBorderHorizontal") as GalleryStyle[])}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="loadMoreButtonBackgroundDanger — the button only, and only with pagination: buttons">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            pagination="buttons"
                            datasource={danger.value}
                            content={productRow(danger)}
                            style={atlas
                                .concat(fill)
                                .concat(atlasClasses("loadMoreButtonBackgroundDanger") as GalleryStyle[])}
                        />
                    </View>
                </StoryRow>
                <StoryRow label="justifyPaginationCenter + loadMoreButtonFixedSize — a centred, content-width button">
                    <View style={styles.shortBox}>
                        <Gallery
                            {...baseProps}
                            pageSize={4}
                            pagination="buttons"
                            datasource={centred.value}
                            content={productRow(centred)}
                            style={atlas
                                .concat(fill)
                                .concat(
                                    atlasClasses("loadMoreButtonFixedSize", "justifyPaginationCenter") as GalleryStyle[]
                                )}
                        />
                    </View>
                </StoryRow>
            </StoryRows>
        );
    }
};

/**
 * No filtering story here — `Widgets/GalleryTextFilter` is that story.
 *
 * `filterList` and `filtersPlaceholder` are half of a contract: the gallery publishes a React context
 * carrying the filterable attributes and a dispatcher, and a filter widget nested in the placeholder
 * consumes it. Neither side is worth looking at alone, so the pair is exercised from the filter's file,
 * where the gallery is the surrounding widget.
 *
 * Worth noting from this side: the context is stored on a *global*
 * (`global["com.mendix.widgets.native.filterable.filterContext"]`), created by whichever gallery renders
 * first and reused by every one after. So two galleries on a page share one context object — the values
 * differ per provider, but the identity does not.
 */
