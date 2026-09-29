import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { ValueStatus } from "mendix";
import { Carousel } from "../../../../packages/pluggableWidgets/carousel-native/src/Carousel";
import type { CarouselStyle } from "../../../../packages/pluggableWidgets/carousel-native/src/ui/styles";
import { listValue, listWidgetValue } from "../../shared/mendixValues";
import type { Row } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Every story here needs a height on the container, and the reason is worth knowing before reading the
 * overrides below.
 *
 * The widget measures itself with `onLayout` and passes the result to `react-native-snap-carousel` as
 * `sliderWidth`/`sliderHeight`, and it renders nothing until both that and the slide width are non-zero.
 * The slide size comes from `slideItem.width`/`height` in the theme, and percentages are resolved by the
 * widget itself because the library only accepts numbers — `width: "70%"` becomes 70% of the measured
 * container width. So the container has to have a height from somewhere. Atlas gives `slideItem` a
 * `height: 250` and the widget copies that up into the container when `container.height` is unset, which
 * is what makes the default work; the stories that change the slide height rely on the same path.
 *
 * `renderItem` has an empty dependency array, so it closes over the first render's
 * `layoutSpecificStyle` for the life of the component. Switching `layout` on a mounted carousel therefore
 * keeps the old slide style — invisible in Storybook, which remounts between stories, but it means the
 * property cannot be flipped at runtime. It also `delete`s `width` off the *shared* style object it took
 * from the merged theme, mutating it, which is why the width is read before that happens.
 *
 * Styles merge with `deepmerge.all` rather than `flattenStyles` — the only widget in the repo that does
 * — so unlike the popup menu and the bottom sheet, a partial override *does* merge into Atlas's nested
 * objects instead of replacing them. The overrides below are written that way.
 */
const atlas = atlasStyle("com.mendix.widget.native.carousel.Carousel") as CarouselStyle[];

const styles = StyleSheet.create({
    slide: {
        backgroundColor: variables.background.secondary,
        borderRadius: variables.border.radiusLarge,
        flex: 1,
        overflow: "hidden"
    },
    slideImage: { flex: 1, width: "100%" },
    slideCaption: {
        color: variables.font.colorTitle,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold",
        padding: variables.spacing.small
    },
    /** A plain coloured slide, for the stories where an image would distract from the layout. */
    colourSlide: {
        alignItems: "center",
        borderRadius: variables.border.radiusLarge,
        flex: 1,
        justifyContent: "center"
    },
    colourLabel: {
        color: variables.background.primary,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeH4,
        fontWeight: "bold"
    },
    /** A visible boundary, so a carousel that renders nothing can be told from one that is absent. */
    outline: {
        borderColor: variables.brand.primary,
        borderStyle: "dashed",
        borderWidth: 1,
        height: 120,
        justifyContent: "center"
    },
    note: {
        color: variables.contrast.regular,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    }
});

const landscape = require("../../shared/assets/landscape.png");

const places: Row[] = [
    { title: "Amsterdam", tint: variables.brand.primary },
    { title: "Rotterdam", tint: variables.brand.success },
    { title: "Utrecht", tint: variables.brand.warning },
    { title: "Eindhoven", tint: variables.brand.danger }
];

/** More than five rows, which is the threshold where the dots become an "n/total" counter. */
const many: Row[] = Array.from({ length: 8 }, (_, index) => ({
    title: `Slide ${index + 1}`,
    tint: index % 2 === 0 ? variables.brand.primary : variables.brand.info
}));

const imageSlide = (row: Row): ReactElement => (
    <View style={styles.slide}>
        <Image source={landscape} style={styles.slideImage} resizeMode="cover" />
        <Text style={styles.slideCaption}>{String(row.title)}</Text>
    </View>
);

const colourSlide = (row: Row): ReactElement => (
    <View style={[styles.colourSlide, { backgroundColor: String(row.tint) }]}>
        <Text style={styles.colourLabel}>{String(row.title)}</Text>
    </View>
);

/** A source and its matching content prop, since both have to close over the same rows. */
function carouselContent(rows: Row[], render: (row: Row) => ReactElement, status?: ValueStatus) {
    const source = listValue(rows, { status });
    return { contentSource: source.value, content: listWidgetValue(source, render) };
}

const imageCards = carouselContent(places, imageSlide);
const colourCards = carouselContent(places, colourSlide);
const eightColourCards = carouselContent(many, colourSlide);
const oneCard = carouselContent([places[0]], colourSlide);
const loadingCards = carouselContent(places, colourSlide, ValueStatus.Loading);
const noCards = carouselContent([], colourSlide);

const baseProps = {
    name: "carousel",
    style: atlas,
    layout: "card" as const,
    showPagination: true,
    activeSlideAlignment: "center" as const,
    ...imageCards
};

const meta = {
    title: "Widgets/Carousel",
    component: Carousel,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Carousel>;

export default meta;

/**
 * Atlas's card layout: a 70%-wide, 250pt-tall slide with a shadow, the neighbours peeking in at 80%
 * opacity, and brand-coloured dots below.
 *
 * Swipe it. The dots are tappable too (`tappableDots`), which is not something the widget exposes a
 * property for — it is hardcoded on.
 *
 * `args` as well as a `render`, unlike the stories below: the args feed Storybook's controls panel, so
 * this is the one to flip `showPagination` on and watch. Note that changing `layout` there will *not*
 * restyle the slides, for the `renderItem` reason in the header.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * `layout`, which picks between the two style branches rather than between two behaviours.
 *
 * Both layouts are the same carousel; the difference is entirely which of `cardLayout` and
 * `fullWidthLayout` the widget reads. Atlas makes `card` a 70% slide with a shadow and dimmed
 * neighbours, and `fullWidth` a 100% slide with `inactiveSlideItem` explicitly at opacity 1 and scale 1
 * — so nothing dims, because at full width the neighbour is off screen anyway.
 *
 * The pagination moves with it: `fullWidthLayout` positions its container `absolute` at the bottom with
 * white dots, so it sits *over* the slide, while `cardLayout` puts dark dots below it. Slides here are
 * flat colour rather than the photo, so the overlaid dots are visible against them.
 */
export const Layout: StoryObj<typeof Carousel> = {
    render: () => (
        <StoryRows>
            <StoryRow label="card — 70% wide, neighbours visible at 80%, dots below">
                <Carousel {...baseProps} layout="card" {...colourCards} />
            </StoryRow>
            <StoryRow label="fullWidth — 100% wide, no dimming, white dots overlaid on the slide">
                <Carousel {...baseProps} layout="fullWidth" {...colourCards} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `activeSlideAlignment`, which only does anything in the card layout.
 *
 * `center` keeps the active slide centred with a sliver of both neighbours; `start` pins it to the left
 * edge, so the slide before it is off screen and only the next one shows. At full width the slide fills
 * the viewport and the two are indistinguishable, which is why both rows here are cards.
 *
 * Swipe the first row once before judging it: on slide 1 there is no previous slide, so `center` looks
 * like `start` with extra left padding. It is from slide 2 on that the two are obviously different.
 */
export const ActiveSlideAlignment: StoryObj<typeof Carousel> = {
    render: () => (
        <StoryRows>
            <StoryRow label="center — a sliver of the slide on each side">
                <Carousel {...baseProps} activeSlideAlignment="center" {...colourCards} />
            </StoryRow>
            <StoryRow label="start — flush left, only the next slide peeks in">
                <Carousel {...baseProps} activeSlideAlignment="start" {...colourCards} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The pagination, and the five-item threshold that silently changes what it is.
 *
 * At five slides or fewer the widget renders the library's `Pagination` — a row of tappable dots. At six
 * or more it renders its own `<Text>{active + 1}/{total}</Text>` instead, styled from `pagination.text`,
 * and the dots and their tappability go away entirely. The cutoff is `contentLength > 5` in the widget
 * with no property behind it, so a list that grows past five changes its own affordance.
 *
 * That also means `pagination.dotStyle` and `pagination.text` are never both in play, and an app that
 * themes only one of them has an unstyled fallback waiting on the other side of the threshold.
 *
 * `showPagination: false` removes both. The counter row is a full-width layout so its absolute-positioned
 * text has a dark slide to sit on.
 */
export const Pagination: StoryObj<typeof Carousel> = {
    render: () => (
        <StoryRows>
            <StoryRow label="four slides — tappable dots">
                <Carousel {...baseProps} {...colourCards} />
            </StoryRow>
            <StoryRow label="eight slides — the dots become a 1/8 counter, no longer tappable">
                <Carousel {...baseProps} layout="fullWidth" {...eightColourCards} />
            </StoryRow>
            <StoryRow label="showPagination: false — neither">
                <Carousel {...baseProps} showPagination={false} {...colourCards} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The theme, on the card layout.
 *
 * `slideItem` is where the size lives, and both dimensions accept a percentage string that the widget
 * resolves itself — but note it resolves a percentage *height* against the container's **width**
 * (`onLayout` uses `viewWidth` for both), so `height: "50%"` is half the width, not half the height. The
 * override below uses a number to stay out of that.
 *
 * `inactiveSlideItem` takes only `opacity` and `scale`; anything else in it is dropped. `dotStyle.color`
 * and `inactiveDotStyle`'s `color`/`opacity`/`scale` are pulled out and passed to `Pagination` as props
 * rather than styles, so a `color` written into `dotStyle` works while `backgroundColor` does not.
 *
 * `container` is the outer `View` and the one place to set an explicit height — worth knowing because
 * setting it stops the widget copying the slide height up, which is the mechanism the other stories rely
 * on.
 */
export const Theming: StoryObj<typeof Carousel> = {
    render: () => (
        <Carousel
            {...baseProps}
            {...colourCards}
            style={atlas.concat([
                {
                    container: { backgroundColor: variables.background.secondary, paddingVertical: 8 },
                    cardLayout: {
                        slideItem: { width: "55%", height: 180, padding: 4 },
                        // Only opacity and scale are read here; a third key would be ignored.
                        inactiveSlideItem: { opacity: 0.35, scale: 0.88 },
                        pagination: {
                            container: { paddingTop: 8 },
                            // `color` is lifted out and passed as `dotColor`, not applied as a style.
                            dotStyle: { color: variables.brand.danger, height: 10, width: 10, borderRadius: 5 },
                            inactiveDotStyle: { color: variables.contrast.lower, scale: 0.7 }
                        }
                    }
                }
            ] as CarouselStyle[])}
        />
    )
};

/**
 * Loading, empty, and a single slide — three states that look like one bug each and are not.
 *
 * Loading shows the spinner, whose colour comes from `cardLayout.indicator.color`. That is worth spelling
 * out: Atlas writes the colour to a top-level `activityIndicator` key, but the widget reads
 * `layoutSpecificStyle.indicator.color` — a key Atlas never sets — so the colour that actually applies is
 * the widget's own `"blue"` default, and Atlas's `activityIndicator` is dead. The row below is that blue,
 * not the theme's.
 *
 * A loaded-but-empty list renders nothing at all: the widget's guard requires `items.length > 0`, and
 * there is no empty state. So an empty carousel and an absent one are indistinguishable — the dashed
 * outline is the story's, to show where it would be.
 *
 * One slide renders the slide and *no* pagination — verified on Android. The widget asks for it
 * (`showPagination` is on and `contentLength` is 1, below the counter threshold), but the library's
 * `Pagination` returns `false` outright when `dotsLength < 2`, so the row below has a slide and nothing
 * under it. A carousel that is sometimes one item therefore loses its affordance without asking.
 */
export const EmptyAndLoading: StoryObj<typeof Carousel> = {
    render: () => (
        <StoryRows>
            <StoryRow label="loading — the spinner, in the widget's hardcoded blue rather than the theme's">
                <View style={styles.outline}>
                    <Carousel {...baseProps} {...loadingCards} />
                </View>
            </StoryRow>
            <StoryRow label="loaded but empty — nothing at all, no empty state">
                <View style={styles.outline}>
                    <Carousel {...baseProps} {...noCards} />
                </View>
            </StoryRow>
            <StoryRow label="one slide — no dot at all, because the library hides pagination below two">
                <Carousel {...baseProps} {...oneCard} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_carousel_Carousel` is the only entry — the two layout branches `Layout`
 * covers, plus the `activityIndicator` colour that `EmptyAndLoading` explains is never read. An app that
 * wants a second carousel style has to add its own class.
 *
 * `react-native-snap-carousel` is unmaintained and its README recommends moving off it; this widget still
 * pins it, which is why the library's own props (`loop`, `autoplay`, vertical mode) are not exposed here —
 * the widget passes a fixed set and nothing in the theme reaches the rest.
 */
