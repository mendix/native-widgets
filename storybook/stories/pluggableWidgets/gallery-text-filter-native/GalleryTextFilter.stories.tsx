import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gallery } from "../../../../packages/pluggableWidgets/gallery-native/src/Gallery";
import type { GalleryStyle } from "../../../../packages/pluggableWidgets/gallery-native/src/ui/Styles";
import { GalleryTextFilter } from "../../../../packages/pluggableWidgets/gallery-text-filter-native/src/GalleryTextFilter";
import type { GalleryTextFilterStyle } from "../../../../packages/pluggableWidgets/gallery-text-filter-native/src/ui/Styles";
import type { DefaultFilterEnum } from "../../../../packages/pluggableWidgets/gallery-text-filter-native/typings/GalleryTextFilterProps";
import {
    actionValue,
    dynamicValue,
    listAttributeValue,
    listWidgetValue,
    useListValue
} from "../../shared/mendixValues";
import type { ListSource, Row } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * This widget is half of a contract, so every story here is really two widgets.
 *
 * The filter renders nothing of its own until it finds a gallery above it. It looks for a React context
 * on a *global* — `global["com.mendix.widgets.native.filterable.filterContext"]`, created by the first
 * gallery to render and shared by every one after — reads the filterable attributes out of it, and pushes
 * a `getFilterCondition` back through the dispatcher. So the filter has to be nested in the gallery's
 * `filtersPlaceholder`, and the gallery has to list the attribute in `filterList`, or nothing works.
 *
 * The failure modes are all *text*, not a blank: outside a gallery it renders
 * "The Text filter widget must be placed inside the header of the Gallery widget."; given only non-string
 * attributes it renders a longer message about needing a "Hashed string or String" attribute. That is
 * unusual — most widgets in this repo fail silently — and `NotInAGallery` below is worth seeing for it.
 *
 * `filterList` is also what gates the placeholder: the gallery computes
 * `isFilterable = props.filterList.length > 0` and renders the whole provider — placeholder included — only
 * when that holds. So a modeller who drops a filter into the header without adding an entry to the
 * gallery's filter list gets no widget and no error, because the filter never mounts to complain.
 * `NoFilterList` is that case.
 *
 * The rows actually narrow here because the stories use `useListValue`, whose `setFilter` evaluates the
 * condition against the rows client-side — the part the Mendix server does in an app. See the header of
 * `stories/shared/mendixValues.ts` for why that has to be a hook.
 */
/**
 * The gallery needs `container: { flex: 1 }` appended to Atlas or it renders nothing here.
 *
 * Atlas leaves `container` empty, the widget's list is a `FlashList`, and a `FlashList` has no
 * intrinsic height — so inside the `ScrollView` that `StoryFrame` is, an unstyled gallery lays out at
 * zero and shows no rows at all. The fixed height on the wrapping `View` gives it something to fill
 * and this gives it the fill. Verified on device; `Gallery.stories.tsx` documents it at length.
 */
const galleryAtlas = (atlasStyle("com.mendix.widget.native.gallery.Gallery") as GalleryStyle[]).concat([
    { container: { flex: 1 } } as GalleryStyle
]);
const atlas = atlasStyle("com.mendix.widget.native.gallerytextfilter.GalleryTextFilter") as GalleryTextFilterStyle[];

const styles = StyleSheet.create({
    row: { paddingVertical: variables.spacing.smaller },
    title: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold"
    },
    meta: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall
    },
    count: {
        color: variables.brand.primary,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        fontWeight: "bold",
        marginBottom: variables.spacing.smallest
    },
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    },
    box: { height: 220 },
    shortBox: { height: 150 },
    /** A visible boundary, so a filter that renders nothing can be told from one that is absent. */
    outline: {
        borderColor: variables.brand.primary,
        borderStyle: "dashed",
        borderWidth: 1,
        padding: variables.spacing.smaller
    }
});

const products: Row[] = [
    { name: "Desk lamp", category: "Lighting" },
    { name: "Desk mat", category: "Accessories" },
    { name: "Office chair", category: "Seating" },
    { name: "Monitor arm", category: "Mounts" },
    { name: "Monitor stand", category: "Mounts" },
    { name: "Keyboard", category: "Input" },
    { name: "Standing desk", category: "Desks" },
    { name: "Laptop stand", category: "Mounts" },
    { name: "Webcam", category: "Video" },
    { name: "Headset", category: "Audio" }
];

const filterProps = {
    name: "text-filter",
    style: atlas,
    delay: 300,
    defaultFilter: "contains" as DefaultFilterEnum
};

/** The gallery around a filter, with a live count so a narrowed list is unmistakable. */
function FilteredGallery(props: {
    filter: ReactElement;
    /** Which column the gallery offers the filter. Only String types are accepted. */
    field?: string;
    height?: "box" | "shortBox";
    /** Omitted deliberately by `NoFilterList`, to show the placeholder being gated. */
    withFilterList?: boolean;
    /** More than one, for the `or`-across-columns case in `Attributes`. */
    fields?: string[];
}): ReactElement {
    const { filter, field = "name", height = "box", withFilterList = true, fields } = props;
    const source = useListValue(products, { pageSize: 20 });
    const columns = fields ?? [field];
    return (
        <View>
            <Text style={styles.count}>
                {source.visible.length} of {products.length} shown
            </Text>
            <View style={styles[height]}>
                <Gallery
                    name="gallery"
                    style={galleryAtlas}
                    datasource={source.value}
                    content={row(source)}
                    scrollDirection="vertical"
                    tabletColumns={2}
                    phoneColumns={1}
                    pageSize={20}
                    pagination="virtualScrolling"
                    filterList={
                        withFilterList ? columns.map(column => ({ filter: listAttributeValue(source, column) })) : []
                    }
                    filtersPlaceholder={filter}
                />
            </View>
        </View>
    );
}

function row(source: ListSource): ReturnType<typeof listWidgetValue> {
    return listWidgetValue(source, item => (
        <View style={styles.row}>
            <Text style={styles.title}>{String(item.name)}</Text>
            <Text style={styles.meta}>{String(item.category)}</Text>
        </View>
    ));
}

const meta = {
    title: "Widgets/GalleryTextFilter",
    component: GalleryTextFilter,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof GalleryTextFilter>;

export default meta;

/**
 * A filter over the product name, in the gallery's header.
 *
 * Type into it and the count above the list drops. The clear button — an inline SVG X, not an icon from
 * the theme — appears as soon as the committed value is non-empty, and pressing it clears the input and
 * refocuses it.
 *
 * The clear button is keyed off the *debounced* value, not the text in the input, so with `delay: 300` it
 * lags a keystroke behind: type one character quickly and the X arrives 300ms later. The X's stroke colour
 * is hardcoded `#606671` in the component, so it does not follow the theme's contrast colours.
 *
 * `defaultValue` is applied through an effect that writes both the input and the committed value, so a
 * filter with a default starts already filtered — and because that effect depends on `props.value`, a
 * `defaultValue` that changes at runtime overwrites whatever the user has typed.
 */
export const Default: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <FilteredGallery
            filter={
                <GalleryTextFilter
                    {...filterProps}
                    placeholder={dynamicValue("Search products")}
                    onChange={actionValue("text filter: onChange")}
                />
            }
        />
    )
};

/**
 * `defaultFilter`, which is the comparison the condition is built from — and it is set at design time
 * only.
 *
 * There is no operator picker on the widget: a modeller chooses one of eleven and the user gets that one.
 * `contains`, `startsWith` and `endsWith` are the substring three; `equal`/`notEqual` and the four
 * ordering operators (`greater`, `greaterEqual`, `smaller`, `smallerEqual`) compare the whole value, which
 * for a String attribute means a lexicographic comparison — try `M` in the fourth row and everything from
 * "Monitor arm" on matches.
 *
 * `empty` and `notEmpty` are the odd pair: they map onto `equals`/`notEqual` against
 * `literal(undefined)`, and they are the two the widget applies *even when the input is empty* — the guard
 * is `type !== "empty" && type !== "notEmpty" && !value`. So a filter set to `empty` narrows the list the
 * moment it mounts, ignores everything typed into it, and its text box is decoration. The last row is
 * that, and it shows zero rows because no product has an empty name.
 */
export const DefaultFilter: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="contains — the default; try 'desk'">
                <FilteredGallery
                    height="shortBox"
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("contains")} />}
                />
            </StoryRow>
            <StoryRow label="startsWith — 'desk' now matches two, not three">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            defaultFilter="startsWith"
                            placeholder={dynamicValue("startsWith")}
                        />
                    }
                />
            </StoryRow>
            <StoryRow label="equal — the whole name or nothing; try 'Keyboard'">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter {...filterProps} defaultFilter="equal" placeholder={dynamicValue("equal")} />
                    }
                />
            </StoryRow>
            <StoryRow label="greaterEqual — lexicographic, so 'M' keeps everything from Monitor on">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            defaultFilter="greaterEqual"
                            placeholder={dynamicValue("greaterEqual")}
                        />
                    }
                />
            </StoryRow>
            <StoryRow label="empty — filters on mount, ignores the input entirely">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            defaultFilter="empty"
                            placeholder={dynamicValue("typing here does nothing")}
                        />
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `delay`, the debounce before the condition is rebuilt.
 *
 * Every keystroke updates the visible text immediately and schedules the commit; only the commit reaches
 * the gallery. At 0 the count moves with each character; at 1200 the list sits still for over a second
 * after you stop typing, which reads as a hang rather than as a delay.
 *
 * Two things to know about the debounce. It is `useCallback(debounce(...), [props.delay])`, so changing
 * `delay` on a mounted filter replaces the debouncer and any pending keystroke is dropped rather than
 * flushed. And the clear button is on the committed value, so at 1200 the X is late by the same amount —
 * visible in the third row.
 *
 * `onChange` and `valueAttribute` are also on the committed side: the action fires once per debounce
 * window, not once per keystroke, which is what makes it safe to point at a microflow.
 */
export const Delay: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="delay 0 — the count moves with every character">
                <FilteredGallery
                    height="shortBox"
                    filter={<GalleryTextFilter {...filterProps} delay={0} placeholder={dynamicValue("delay 0")} />}
                />
            </StoryRow>
            <StoryRow label="delay 300 — the shipped default">
                <FilteredGallery
                    height="shortBox"
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("delay 300")} />}
                />
            </StoryRow>
            <StoryRow label="delay 1200 — the clear button is a second late too">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter {...filterProps} delay={1200} placeholder={dynamicValue("delay 1200")} />
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `defaultValue`, `valueAttribute` and `onChange` — the three props that connect the filter to the rest of
 * an app.
 *
 * `defaultValue` seeds the input *and* the committed value, so the first row starts filtered on "desk"
 * with the text and the clear button already there. `valueAttribute` is written on every commit, which is
 * how a modeller keeps the search term in the domain model — the second row prints the attribute back
 * underneath so the write is visible.
 *
 * `onChange` fires on the same tick as that write, and only when the value actually differs from what the
 * attribute holds: the guard is `if (value !== attributeCurrentValue)`. So it does not fire on mount for a
 * `defaultValue` that already matches, and it does not fire twice for a debounce window that committed the
 * same string.
 *
 * Note the ordering — `setValue` then `execute` — so a microflow behind `onChange` sees the new value.
 */
export const ValueAndOnChange: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="defaultValue 'desk' — starts filtered, clear button already present">
                <FilteredGallery
                    height="shortBox"
                    filter={<GalleryTextFilter {...filterProps} defaultValue={dynamicValue("desk")} />}
                />
            </StoryRow>
            <StoryRow label="valueAttribute + onChange — the console logs each commit">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            placeholder={dynamicValue("watch the console")}
                            onChange={actionValue("text filter: onChange")}
                        />
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Which attribute the filter picks up, and the two ways that goes wrong.
 *
 * The gallery hands over *all* of `filterList` as `multipleAttributes`, and the filter keeps the ones
 * whose `type` matches `/HashString|String/`. If more than one survives it builds a condition per
 * attribute and `or`s them together — so one text box can search several columns at once, which is not
 * something Studio Pro spells out. The first row is that: typing `mounts` matches on category, `desk` on
 * name.
 *
 * If none survive, the filter renders the long "requires a Hashed string or String attribute" message
 * rather than nothing. There is also a third path — `getAttributeTypeErrorMessage`, which reports a
 * wrong-typed *single* attribute — that this widget can never reach from a gallery, because the gallery
 * only ever sets `multipleAttributes` and the type filter has already removed anything wrong by then.
 *
 * The story stubs type every attribute `"String"`, so a non-string column cannot be built here — the
 * wrong-type message is the one claim in this file that is reasoned from the source rather than seen.
 */
export const Attributes: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="filtering on category instead of name — try 'mounts'">
                <FilteredGallery
                    height="shortBox"
                    field="category"
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("search category")} />}
                />
            </StoryRow>
            <StoryRow label="both columns — one box, two conditions, or'd together">
                <FilteredGallery
                    height="shortBox"
                    fields={["name", "category"]}
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("name or category")} />}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The four style keys, and the one that is dead.
 *
 * `textInputContainer` is the row holding the input and the clear button — Atlas gives it the 1pt border
 * and 6pt radius that make it look like an input. `textInput` is the `TextInput` itself, and it carries
 * four properties that are not styles at all: `autoCapitalize`, `placeholderTextColor`, `selectionColor`
 * and `underlineColorAndroid`, which `extractStyles` pulls out and passes as props. So the placeholder
 * colour is set in the theme, next to the font size, which is the only place it can be set.
 * `textInputClearIcon` is the button around the X — position and padding only; the X's own colour is
 * hardcoded.
 *
 * `textInputContainerFocused` is the dead one. Atlas defines it (a `brand.primary` border) and the style
 * interface declares it, but the component's `onFocus` spreads `props.styles?.textInputContainerOnFocus` —
 * a key that exists nowhere else in the repo. So focusing the input applies `undefined`, the border never
 * changes, and Atlas's focus colour is unreachable. Focus the first row below and watch the border: it
 * stays grey.
 *
 * The second row proves it is a naming mismatch rather than a broken mechanism, by writing the same border
 * under the name the component actually reads. That key is not in `GalleryTextFilterStyle`, hence the
 * cast — which is itself the point: a theme written against the published type cannot reach this.
 */
export const Theming: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="Atlas as shipped — focus it, the border does not change">
                <FilteredGallery
                    height="shortBox"
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("tap me")} />}
                />
            </StoryRow>
            <StoryRow label="the same focus style under the key the component reads — now it does">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            placeholder={dynamicValue("tap me")}
                            style={atlas.concat([
                                {
                                    // Not `textInputContainerFocused`, which is what the type declares.
                                    textInputContainerOnFocus: {
                                        borderColor: variables.brand.danger,
                                        borderWidth: 2
                                    }
                                } as unknown as GalleryTextFilterStyle
                            ])}
                        />
                    }
                />
            </StoryRow>
            <StoryRow label="container, input and clear icon overridden">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            placeholder={dynamicValue("styled")}
                            style={atlas.concat([
                                {
                                    textInputContainer: {
                                        backgroundColor: variables.background.secondary,
                                        borderColor: variables.brand.primary,
                                        borderRadius: 24,
                                        borderWidth: 2
                                    },
                                    textInput: {
                                        backgroundColor: "transparent",
                                        color: variables.font.colorTitle,
                                        fontSize: variables.font.sizeSmall,
                                        height: 48,
                                        // Extracted by `extractStyles` and passed as props, not styles.
                                        placeholderTextColor: variables.brand.warning,
                                        selectionColor: variables.brand.primary,
                                        autoCapitalize: "characters"
                                    },
                                    textInputClearIcon: { paddingHorizontal: variables.spacing.small }
                                } as GalleryTextFilterStyle
                            ])}
                        />
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The Atlas design-property classes: 28 of them, and all 28 are one margin each.
 *
 * `galleryTextFilterSpacingOuter{Top,Bottom,Left,Right}{Smallest…Largest}` write a single margin to
 * `textInputContainer` and nothing else — there is no colour, size or shape variant for this widget. So
 * an app that wants a rounded or a filled search box has to add its own theme entry; the design
 * properties only move it around.
 *
 * `atlasClasses` rather than `atlasVariant` is fine here: the widget merges with `deepmerge.all`, and
 * these classes each set one key of `textInputContainer`, so the border from the base survives.
 */
export const AtlasVariants: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="as shipped — flush with the top of the gallery">
                <FilteredGallery
                    height="shortBox"
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("no spacing")} />}
                />
            </StoryRow>
            <StoryRow label="SpacingOuterBottomLarge + SpacingOuterLeftLarge — margins, nothing else">
                <FilteredGallery
                    height="shortBox"
                    filter={
                        <GalleryTextFilter
                            {...filterProps}
                            placeholder={dynamicValue("with margins")}
                            style={atlas.concat(
                                atlasClasses(
                                    "galleryTextFilterSpacingOuterBottomLarge",
                                    "galleryTextFilterSpacingOuterLeftLarge"
                                ) as GalleryTextFilterStyle[]
                            )}
                        />
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The filter with no gallery above it — the error message, verbatim from the widget.
 *
 * Two different nothings, and they are worth telling apart. `useFilterContext` puts its context on a
 * global the first time *any* gallery renders, and it is never cleared — so on a fresh app launch this
 * story shows the `FilterContext?.Consumer` fallback, and after any other story in this folder has
 * rendered it shows the consumer's own fallback instead. Both print the same sentence, so the story looks
 * identical either way; the path through it is not.
 *
 * That shared global is worth remembering for a different reason: two galleries on one page do not get
 * two contexts. They get the same context object with different provider values, which works because
 * React resolves a consumer against its nearest provider — but it means the context identity is process-
 * wide state created by whichever gallery mounted first.
 */
export const NotInAGallery: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <StoryRows>
            <StoryRow label="on its own — an error sentence rather than a blank">
                <View style={styles.outline}>
                    <GalleryTextFilter {...filterProps} placeholder={dynamicValue("never shown")} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A filter nested in the gallery's header with the gallery's `filterList` left empty — and therefore no
 * filter at all.
 *
 * The gallery's `isFilterable` is `props.filterList.length > 0`, and the whole provider, placeholder
 * included, is `null` when that is false. So the widget never mounts: there is no error message, because
 * the code that would print one does not run. The dashed outline is the story's, and the gallery below it
 * is unfiltered and complete.
 *
 * This is the one configuration mistake this pair fails silently on, and it is an easy one to make —
 * "Filters" in the gallery's properties and the header placeholder are separate things in Studio Pro, and
 * only one of them is where the widget goes.
 */
export const NoFilterList: StoryObj<typeof GalleryTextFilter> = {
    render: () => (
        <View>
            <Text style={styles.note}>
                The gallery below has a filter in its header and an empty `filterList`. Nothing renders where the search
                box should be.
            </Text>
            <View style={styles.outline}>
                <FilteredGallery
                    height="shortBox"
                    withFilterList={false}
                    filter={<GalleryTextFilter {...filterProps} placeholder={dynamicValue("never mounted")} />}
                />
            </View>
        </View>
    )
};
