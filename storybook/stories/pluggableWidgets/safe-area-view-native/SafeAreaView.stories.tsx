import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "../../../../packages/pluggableWidgets/safe-area-view-native/src/SafeAreaView";
import type { SafeAreaViewStyle } from "../../../../packages/pluggableWidgets/safe-area-view-native/src/ui/Styles";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.safeareaview.SafeAreaView") as SafeAreaViewStyle[];

const styles = StyleSheet.create({
    // Filled corner to corner and outlined, because the widget's whole job is *where* its edges land.
    // A centred blob would show nothing; a border shows the inset the safe area applied.
    fill: {
        flex: 1,
        borderWidth: 2,
        borderColor: variables.brand.primary,
        alignItems: "center",
        justifyContent: "center",
        padding: variables.spacing.regular
    },
    text: {
        color: variables.contrast.high,
        fontFamily: variables.font.family,
        fontSize: variables.font.size,
        textAlign: "center"
    }
});

const marker = (text: string): ReactElement => (
    <View style={styles.fill}>
        <Text style={styles.text}>{text}</Text>
    </View>
);

const baseProps = {
    name: "safe-area-view",
    style: atlas,
    content: marker("The outline is the safe area.\nCompare its top and bottom against the screen edges.")
};

/**
 * `scroll: false` throughout.
 *
 * The widget is `flex: 1` twice over — an outer View and the inner SafeAreaView — so inside a
 * ScrollView's content container it collapses to nothing. It needs the full canvas, which also
 * happens to be the only arrangement where the insets are visible.
 */
const meta = {
    title: "Widgets/SafeAreaView",
    component: SafeAreaView,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof SafeAreaView>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * A background colour, which the widget deliberately applies twice.
 *
 * It reads `container.backgroundColor` out of the style and paints the *outer* view with it as well,
 * so the colour reaches into the inset area rather than stopping at the safe edge — otherwise a
 * notch or home indicator would sit on a white strip. This story is that behaviour: the colour
 * should run to the physical screen edge while the outlined content stays inside it.
 */
export const BackgroundReachesTheEdge: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        style: atlas.concat([
            { container: { flex: 1, backgroundColor: variables.brand.primary } } as SafeAreaViewStyle
        ]),
        content: marker("The blue runs past the outline, all the way to the screen edge.")
    }
};

/**
 * Padding on the container, stacked on top of the inset the safe area already adds.
 *
 * The two compose rather than replace each other, which is the mistake worth catching: a theme that
 * sets generous padding here ends up with roughly double it on a device with a notch.
 */
export const ContainerPadding: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        style: atlas.concat([{ container: { flex: 1, padding: variables.spacing.largest } } as SafeAreaViewStyle]),
        content: marker("Container padding adds to the safe-area inset — it does not replace it.")
    }
};

/**
 * No content, which is the state a half-built page is in.
 *
 * `content` is optional, and nothing here guards it — so this confirms an empty safe area is an
 * empty box rather than a crash. Tinted, since an unstyled empty view is indistinguishable from a
 * story that failed to render.
 */
export const NoContent: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        content: undefined,
        style: atlas.concat([
            { container: { flex: 1, backgroundColor: variables.background.secondary } } as SafeAreaViewStyle
        ])
    }
};

/**
 * Nested safe area views, which is a real modelling mistake rather than a contrived one.
 *
 * `react-native-safe-area-context` subtracts what an ancestor already consumed, so the inner one
 * should add no further inset and the two outlines should sit on top of each other. If they end up
 * doubly inset, the context is not being propagated.
 */
export const Nested: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        content: (
            <SafeAreaView
                name="safe-area-view-inner"
                style={atlas}
                content={marker("Inner safe area — its outline should not be inset any further.")}
            />
        )
    }
};

/**
 * No Atlas variants story: Atlas's entry for this widget is an empty container.
 *
 * `com_mendix_widget_native_safeareaview_SafeAreaView` declares `container: {}` and there are no
 * design-property classes, since the widget's behaviour comes from the device rather than the theme.
 * The base style is still passed in every story above, so a future Atlas release shows up here.
 */
