import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Big } from "big.js";
import { BackgroundGradient } from "../../../../packages/pluggableWidgets/background-gradient-native/src/BackgroundGradient";
import type { CustomStyle } from "../../../../packages/pluggableWidgets/background-gradient-native/src/ui/Styles";
import type { ColorListType } from "../../../../packages/pluggableWidgets/background-gradient-native/typings/BackgroundGradientProps";
import { actionValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

// Unlike the other widgets this one's style type makes `container` mandatory, so the array coming out
// of `atlasStyle` — partial style objects, which is what the runtime actually passes — needs the wider
// cast. The widget merges the array over its own defaults, so a partial entry is correct.
const atlas = atlasStyle("com.mendix.widget.native.backgroundgradient.BackgroundGradient") as unknown as CustomStyle[];

const styles = StyleSheet.create({
    // The widget draws a gradient behind whatever it contains and takes its size from that content,
    // so a story needs something with height in it or there is nothing to look at.
    panel: { height: 120, alignItems: "center", justifyContent: "center", padding: variables.spacing.regular },
    label: { color: "#fff", fontFamily: variables.font.family, fontSize: variables.font.sizeLarge, fontWeight: "bold" }
});

const panel = (text: string): ReactElement => (
    <View style={styles.panel}>
        <Text style={styles.label}>{text}</Text>
    </View>
);

const stop = (color: string, offset: number): ColorListType => ({ color, offset: new Big(offset) });

/** Two stops, brand primary into brand info — the pairing Atlas's own palette suggests. */
const twoStops: ColorListType[] = [stop(variables.brand.primary, 0), stop(variables.brand.info, 1)];

const baseProps = {
    name: "background-gradient",
    style: atlas,
    colorList: twoStops,
    content: panel("Gradient")
};

const meta = {
    title: "Widgets/BackgroundGradient",
    component: BackgroundGradient,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof BackgroundGradient>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * Stop counts, including the single-colour case the widget has to work around.
 *
 * One stop crashes `LinearGradient` on Android, so the widget duplicates it — which turns a
 * one-colour list into a flat fill rather than an error. Worth having a story for, because the fix
 * is invisible when it works and a hard crash when it regresses.
 */
export const ColorStops: StoryObj<typeof BackgroundGradient> = {
    render: () => (
        <StoryRows>
            <StoryRow label="one colour — duplicated internally, renders as a flat fill">
                <BackgroundGradient {...baseProps} colorList={[stop(variables.brand.primary, 0)]} />
            </StoryRow>
            <StoryRow label="two colours">
                <BackgroundGradient {...baseProps} />
            </StoryRow>
            <StoryRow label="four colours">
                <BackgroundGradient
                    {...baseProps}
                    colorList={[
                        stop(variables.brand.success, 0),
                        stop(variables.brand.warning, 0.35),
                        stop(variables.brand.danger, 0.7),
                        stop(variables.brand.primary, 1)
                    ]}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Stops given out of order, and stops bunched at one end.
 *
 * The widget sorts by offset before handing the list over, so the reversed list should look
 * identical to the sorted one — that is the whole point of this story. The bunched list shows what
 * an offset does: the same two colours, but the transition happens in the last fifth.
 */
export const StopOrdering: StoryObj<typeof BackgroundGradient> = {
    render: () => (
        <StoryRows>
            <StoryRow label="offsets 1 then 0 — sorted before use, so this matches Default">
                <BackgroundGradient
                    {...baseProps}
                    colorList={[stop(variables.brand.info, 1), stop(variables.brand.primary, 0)]}
                />
            </StoryRow>
            <StoryRow label="offsets 0 and 0.2 — transition crowded into the top fifth">
                <BackgroundGradient
                    {...baseProps}
                    colorList={[stop(variables.brand.primary, 0), stop(variables.brand.info, 0.2)]}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Angle and opacity, which come from the *style* rather than from props.
 *
 * Neither is a widget property: a modeller sets them through a design property, so the only way to
 * change them is another entry in the style array. That is why these are passed as objects here
 * rather than as props — and it is the reason the Atlas variants below exist at all.
 */
export const AngleAndOpacity: StoryObj<typeof BackgroundGradient> = {
    render: () => (
        <StoryRows>
            {[0, 45, 90, 180].map(angle => (
                <StoryRow key={angle} label={`angle: ${angle}`}>
                    <BackgroundGradient {...baseProps} style={atlas.concat([{ angle } as CustomStyle])} />
                </StoryRow>
            ))}
            {[25, 50, 100].map(opacity => (
                <StoryRow key={opacity} label={`opacity: ${opacity}`}>
                    <BackgroundGradient {...baseProps} style={atlas.concat([{ opacity } as CustomStyle])} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * An out-of-range opacity, which the widget warns about but still renders.
 *
 * It divides by 100 without clamping, so 150 becomes 1.5 — React Native treats that as fully opaque.
 * The console gets a warning; the story is here to confirm nothing worse happens.
 */
export const OpacityOutOfRange: StoryObj<typeof meta> = {
    args: { ...baseProps, style: atlas.concat([{ opacity: 150 } as CustomStyle]) }
};

/** Tappable, with the widget's own press feedback — it drops to 30% of the configured opacity. */
export const Clickable: StoryObj<typeof meta> = {
    args: { ...baseProps, content: panel("Tap me"), onClick: actionValue("onClick") }
};

/**
 * The colour list supplied by the style instead of by props.
 *
 * When the modeller leaves the property empty the widget falls back to `styles.colorList`, so a
 * theme can ship a gradient outright. Nothing in Atlas uses this yet, but the code path is live and
 * an empty list with no style fallback throws — which is what makes it worth pinning down.
 */
export const ColorListFromStyle: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        colorList: [],
        style: atlas.concat([
            { colorList: [stop(variables.brand.warning, 0), stop(variables.brand.danger, 1)] } as CustomStyle
        ])
    }
};

/** The Atlas variants — the opacity and angle design properties, applied over the base style. */
export const AtlasVariants: StoryObj<typeof BackgroundGradient> = {
    render: () => (
        <StoryRows>
            {(["opacity25", "opacity50", "opacity75", "angle45", "angle90"] as const).map(name => (
                <StoryRow key={name} label={name}>
                    <BackgroundGradient
                        {...baseProps}
                        style={atlas.concat(atlasClasses(name) as unknown as CustomStyle[])}
                    />
                </StoryRow>
            ))}
        </StoryRows>
    )
};
