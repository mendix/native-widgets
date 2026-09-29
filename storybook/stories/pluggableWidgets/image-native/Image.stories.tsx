import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ValueStatus } from "mendix";
import { Image } from "../../../../packages/pluggableWidgets/image-native/src/Image";
import type { DefaultImageStyle } from "../../../../packages/pluggableWidgets/image-native/src/ui/Styles";
import { actionValue, dynamicValue } from "../../shared/mendixValues";
import { atlasMerge, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Atlas keys this widget by name, not by class — hence `atlasMerge` rather than `atlasStyle`.
 *
 * The theme exports `Image` and `ImageViewer`, the names the pre-9 static and dynamic image widgets
 * used, and never `com_mendix_widget_native_image_Image` — so the usual class-id lookup comes back
 * empty and every story here would render the bare fallback.
 *
 * Merging rather than appending, too: this style is three levels deep once the theme sets
 * `image.fill`, and `flattenStyles` only merges one. See the note on `atlasVariant`.
 */
const withClasses = (...names: string[]): DefaultImageStyle[] =>
    atlasMerge("Image", ...names) as unknown as DefaultImageStyle[];

const atlas = withClasses();

const styles = StyleSheet.create({
    // The widget sizes itself from the image, so a story only needs to bound it — otherwise a 640px
    // photo pushes every caption off screen.
    box: { width: 200, height: 130 },
    overlay: {
        color: "#fff",
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        fontWeight: "bold",
        backgroundColor: "rgba(0,0,0,0.45)",
        paddingHorizontal: variables.spacing.small
    },
    overlayBox: { height: 130, alignItems: "center", justifyContent: "center" }
});

// 640×400. Wider than it is tall, which is what makes the resize modes and the shape classes differ.
const landscape = dynamicValue(require("../../shared/assets/landscape.png"));
const avatar = dynamicValue(require("../../shared/assets/avatar.png"));

/**
 * An inline SVG, which is a genuinely separate code path.
 *
 * A `DynamicValue<NativeImage>` whose value is a *string* is treated as SVG markup rather than a
 * source: the widget parses width/height out of it, renders through `SvgXml`, and lets the theme's
 * `fill`/`color` recolour it. That last part is why the icon-tint classes below have anything to
 * act on — they do nothing to a photo.
 */
const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" stroke-width="6" />
    <path d="M30 50 L44 64 L68 34" fill="none" stroke="currentColor" stroke-width="8" />
</svg>`;

const baseProps = {
    name: "image",
    style: atlas,
    datasource: "image" as const,
    imageObject: landscape,
    isBackgroundImage: false,
    resizeMode: "cover" as const,
    opacity: 100,
    widthUnit: "auto" as const,
    customWidth: 0,
    heightUnit: "auto" as const,
    customHeight: 0,
    iconSize: 24,
    accessible: "yes" as const,
    onClickType: "action" as const
};

const meta = {
    title: "Widgets/Image",
    component: Image,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Image>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The three datasources, plus the two shapes an `image` datasource can take.
 *
 * `datasource` picks which of four mutually exclusive props the widget reads, and each resolves to a
 * different renderer — bundled asset and remote url go to FastImage, SVG markup to `SvgXml`, a glyph
 * icon to the icon font. Passing the wrong prop for the datasource is silent: the widget falls back
 * to an empty source and draws nothing, so seeing all of them side by side is the point.
 *
 * The glyph row needs `glyphicons-halflings-regular.ttf`, which the Mendix app bundles and this host
 * app does not — expect a placeholder box there rather than a tick. The image-type icon next to it
 * takes the bundled-asset branch and is unaffected.
 */
export const Datasources: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            <StoryRow label="datasource: image — a bundled asset">
                <View style={styles.box}>
                    <Image {...baseProps} />
                </View>
            </StoryRow>
            <StoryRow label="datasource: image — SVG markup, recoloured by the theme">
                <Image {...baseProps} imageObject={dynamicValue(svgMarkup) as never} />
            </StoryRow>
            <StoryRow label="datasource: imageUrl — needs a network">
                <View style={styles.box}>
                    <Image
                        {...baseProps}
                        datasource="imageUrl"
                        imageObject={undefined}
                        imageUrl={dynamicValue("https://www.mendix.com/wp-content/uploads/mendix-logo.png")}
                    />
                </View>
            </StoryRow>
            <StoryRow label="datasource: icon — glyph, so it needs the Halflings font">
                <Image
                    {...baseProps}
                    datasource="icon"
                    imageObject={undefined}
                    imageIcon={dynamicValue({ type: "glyph", iconClass: "glyphicon-ok" }) as never}
                    iconSize={32}
                />
            </StoryRow>
            <StoryRow label="datasource: icon — image type, which is just a bundled asset">
                <Image
                    {...baseProps}
                    datasource="icon"
                    imageObject={undefined}
                    imageIcon={
                        dynamicValue({
                            type: "image",
                            iconUrl: require("../../shared/assets/star-filled.png")
                        }) as never
                    }
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * An image that has not arrived, and the default that stands in for it.
 *
 * `defaultImageDynamic` is only consulted when the main one is *Unavailable* — an empty association,
 * a file that was never uploaded. While it is still `Loading` neither is used, which is the
 * distinction worth pinning down: a slow image shows nothing, a missing one shows the placeholder.
 */
export const DefaultImage: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            <StoryRow label="unavailable, with a default — the default shows">
                <View style={styles.box}>
                    <Image
                        {...baseProps}
                        imageObject={{ status: ValueStatus.Unavailable, value: undefined } as never}
                        defaultImageDynamic={avatar}
                    />
                </View>
            </StoryRow>
            <StoryRow label="loading — nothing yet, even with a default set">
                <View style={styles.box}>
                    <Image
                        {...baseProps}
                        imageObject={{ status: ValueStatus.Loading, value: undefined } as never}
                        defaultImageDynamic={avatar}
                    />
                </View>
            </StoryRow>
            <StoryRow label="unavailable, no default — an empty box, not an error">
                <View style={styles.box}>
                    <Image
                        {...baseProps}
                        imageObject={{ status: ValueStatus.Unavailable, value: undefined } as never}
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Explicit dimensions in points, against the automatic ones.
 *
 * `widthUnit: "points"` does not crop or letterbox — it feeds `customWidth` into the same scaling
 * the widget does on layout, so the image is fitted inside the box while keeping its aspect ratio.
 * Setting only one of the two is the common case and works: the other follows from the ratio.
 */
export const Sizing: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            <StoryRow label="auto — fills the width available">
                <Image {...baseProps} />
            </StoryRow>
            <StoryRow label="width 120pt, height auto">
                <Image {...baseProps} widthUnit="points" customWidth={120} />
            </StoryRow>
            <StoryRow label="width 200pt, height 60pt — fitted, so the ratio still holds">
                <Image {...baseProps} widthUnit="points" customWidth={200} heightUnit="points" customHeight={60} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Tap behaviour: run an action, or open the image full screen.
 *
 * `enlarge` is handled by the widget itself — a modal with a dimmed backdrop, sized from the image's
 * intrinsic dimensions, dismissed by tapping anywhere. Nothing needs modelling for it, and it
 * ignores `onClick` entirely, which is easy to mistake for a broken action.
 */
export const OnClick: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            <StoryRow label="action — check the log for the tap">
                <View style={styles.box}>
                    <Image {...baseProps} onClick={actionValue("Image onClick")} />
                </View>
            </StoryRow>
            <StoryRow label="enlarge — tap to open, tap the backdrop to close">
                <View style={styles.box}>
                    <Image {...baseProps} onClickType="enlarge" onClick={actionValue("never runs")} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Background mode, where the image sits behind whatever the modeller nested inside it.
 *
 * Two props only apply here — `resizeMode` and `opacity` — and this widget's opacity runs 0–100.
 * Worth saying out loud, because `background-image-native` takes 0–1 for the same idea and
 * `background-gradient-native` takes 0–100 through a style rather than a prop. Three sibling widgets,
 * three conventions.
 */
export const BackgroundMode: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            {(["cover", "contain", "stretch", "center"] as const).map(resizeMode => (
                <StoryRow key={resizeMode} label={`resizeMode: ${resizeMode}`}>
                    <Image {...baseProps} isBackgroundImage resizeMode={resizeMode}>
                        <View style={styles.overlayBox}>
                            <Text style={styles.overlay}>{resizeMode}</Text>
                        </View>
                    </Image>
                </StoryRow>
            ))}
            {[100, 40].map(opacity => (
                <StoryRow key={opacity} label={`opacity: ${opacity} — this widget's scale is 0–100`}>
                    <Image {...baseProps} isBackgroundImage opacity={opacity}>
                        <View style={styles.overlayBox}>
                            <Text style={styles.overlay}>{`${opacity}`}</Text>
                        </View>
                    </Image>
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * The Atlas shape and size classes.
 *
 * These are the design properties a modeller ticks, and they work by pinning `image.width`/`height`
 * or capping the maximums — so the shapes need an image that is not already square to show anything,
 * and the sizes are deliberately small (the icon class caps at 16pt).
 */
export const AtlasShapesAndSizes: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            {(["imageSquare", "imageCircle"] as const).map(name => (
                <StoryRow key={name} label={name}>
                    <View style={styles.box}>
                        <Image {...baseProps} style={withClasses(name)} imageObject={avatar} />
                    </View>
                </StoryRow>
            ))}
            {(["imageIcon", "imageSmall", "imageMedium", "imageLarge", "imageLarger"] as const).map(name => (
                <StoryRow key={name} label={name}>
                    <Image {...baseProps} style={withClasses(name)} imageObject={avatar} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * The Atlas icon tints, which only reach SVG content.
 *
 * Each sets `image.fill` and `image.color`, and the widget copies `color` into `fill` when the markup
 * has none of its own — so an SVG drawn with `currentColor` picks up the brand colour. A photo is
 * unaffected, which is the mistake these guard against: ticking "Primary" on a JPEG does nothing.
 */
export const AtlasIconColors: StoryObj<typeof Image> = {
    render: () => (
        <StoryRows>
            {(
                [
                    "imageIconPrimary",
                    "imageIconSecondary",
                    "imageIconSuccess",
                    "imageIconWarning",
                    "imageIconDanger",
                    "imageIconInfo"
                ] as const
            ).map(name => (
                <StoryRow key={name} label={name}>
                    <Image {...baseProps} style={withClasses(name)} imageObject={dynamicValue(svgMarkup) as never} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * The overlay class, which is how Atlas dims an image behind a caption.
 *
 * Unlike everything above it styles `container` rather than `image`, and absolutely — so it is only
 * useful stacked over something. Here it is the widget's own background mode doing the stacking.
 */
export const AtlasOverlay: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        isBackgroundImage: true,
        style: withClasses("imageOverlay"),
        children: (
            <View style={styles.overlayBox}>
                <Text style={styles.overlay}>imageOverlay</Text>
            </View>
        )
    }
};
