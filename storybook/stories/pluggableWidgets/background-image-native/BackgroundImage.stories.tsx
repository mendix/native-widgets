import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Big } from "big.js";
import { ValueStatus } from "mendix";
import { BackgroundImage } from "../../../../packages/pluggableWidgets/background-image-native/src/BackgroundImage";
import type { BackgroundImageStyle } from "../../../../packages/pluggableWidgets/background-image-native/src/ui/Styles";
import { dynamicValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.backgroundimage.BackgroundImage") as BackgroundImageStyle[];

const styles = StyleSheet.create({
    // The image is absolutely positioned behind the content, so the container has no size of its own —
    // without a fixed height here there is nothing for the image to fill.
    panel: { height: 160, alignItems: "center", justifyContent: "center" },
    label: {
        color: "#fff",
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeLarge,
        fontWeight: "bold",
        // The picture behind is light in places, so the caption needs its own backing to stay legible.
        backgroundColor: "rgba(0,0,0,0.45)",
        paddingHorizontal: variables.spacing.small,
        paddingVertical: variables.spacing.smallest
    }
});

const panel = (text: string): ReactElement => (
    <View style={styles.panel}>
        <Text style={styles.label}>{text}</Text>
    </View>
);

// 640×400, so it is wider than the panel is tall — which is what makes the resize modes differ.
const landscape = dynamicValue(require("../../shared/assets/landscape.png"));

const baseProps = {
    name: "background-image",
    style: atlas,
    image: landscape,
    resizeMode: "cover" as const,
    opacity: new Big(1),
    content: panel("Background image")
};

const meta = {
    title: "Widgets/BackgroundImage",
    component: BackgroundImage,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof BackgroundImage>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * All four resize modes against the same wide image in a shorter box.
 *
 * The image's aspect ratio does not match the panel's, which is the only situation where these
 * differ — `cover` crops, `contain` letterboxes, `stretch` distorts, `center` neither scales nor
 * crops. A square image in a square box would make all four look identical.
 */
export const ResizeModes: StoryObj<typeof BackgroundImage> = {
    render: () => (
        <StoryRows>
            {(["cover", "contain", "stretch", "center"] as const).map(resizeMode => (
                <StoryRow key={resizeMode} label={resizeMode}>
                    <BackgroundImage {...baseProps} resizeMode={resizeMode} content={panel(resizeMode)} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * Opacity, which here runs 0–1 rather than 0–100.
 *
 * Worth stating explicitly because the sibling BackgroundGradient widget takes 0–100 for the same
 * concept, and this one clamps anything above 1 down to fully opaque — so a modeller who types 50
 * expecting half gets no transparency at all. The last row shows exactly that.
 */
export const Opacity: StoryObj<typeof BackgroundImage> = {
    render: () => (
        <StoryRows>
            {[1, 0.6, 0.25, 0].map(opacity => (
                <StoryRow key={opacity} label={`opacity: ${opacity}`}>
                    <BackgroundImage {...baseProps} opacity={new Big(opacity)} content={panel(`${opacity}`)} />
                </StoryRow>
            ))}
            <StoryRow label="opacity: 50 — clamped to 1, not half">
                <BackgroundImage {...baseProps} opacity={new Big(50)} content={panel("50 → 1")} />
            </StoryRow>
            <StoryRow label="opacity: -1 — clamped to 0">
                <BackgroundImage {...baseProps} opacity={new Big(-1)} content={panel("-1 → 0")} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The image still loading, and an unavailable one.
 *
 * Both make the widget return null — content included. That is the part worth knowing: the children
 * are inside the same early return, so an image that never arrives takes the whole layout with it
 * rather than degrading to a plain box.
 */
export const ImageUnavailable: StoryObj<typeof BackgroundImage> = {
    render: () => (
        <StoryRows>
            <StoryRow label="loading — renders nothing at all, content included">
                <BackgroundImage
                    {...baseProps}
                    image={{ status: ValueStatus.Loading, value: undefined } as never}
                    content={panel("never shown")}
                />
            </StoryRow>
            <StoryRow label="available but empty — same result">
                <BackgroundImage
                    {...baseProps}
                    image={{ status: ValueStatus.Available, value: undefined } as never}
                    content={panel("never shown")}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A remote url rather than a bundled asset, which takes a different sizing branch.
 *
 * The widget switches on the value's type: a number is a bundled `require` handle and gets its
 * intrinsic size, a string is a url and gets `100%`/`100%`. So this is not merely "the same picture
 * from elsewhere" — it is the other half of that branch. It needs a network, and shows an empty box
 * without one.
 */
export const RemoteUrl: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        image: dynamicValue("https://www.mendix.com/wp-content/uploads/mendix-logo.png") as never,
        resizeMode: "contain",
        content: panel("remote url")
    }
};

/**
 * No Atlas variants story: Atlas's entry for this widget is empty.
 *
 * `com_mendix_widget_native_backgroundimage_BackgroundImage` declares `container` and `image` with
 * nothing in them, and there are no design-property classes — a background image is whatever the
 * modeller points it at, so the theme has nothing to say. The base style is still passed everywhere
 * above, so if Atlas ever fills it in these stories pick it up.
 */
export const ImageStyleFromTheme: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        // What a theme entry would look like if it had one — a border on the container and a tint on
        // the image, applied through the same array Atlas supplies.
        style: atlas.concat([
            {
                container: { borderWidth: 2, borderColor: variables.brand.primary },
                image: {}
            } as BackgroundImageStyle
        ]),
        content: panel("styled container")
    }
};
