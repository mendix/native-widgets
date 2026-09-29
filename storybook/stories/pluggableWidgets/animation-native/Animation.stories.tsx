import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Animation } from "../../../../packages/pluggableWidgets/animation-native/src/Animation";
import type { AnimationStyle } from "../../../../packages/pluggableWidgets/animation-native/src/ui/Styles";
import { actionValue, dynamicValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.animation.Animation") as AnimationStyle[];

const styles = StyleSheet.create({
    // Something with an outline, so a movement animation has a visible edge to move. An unfilled
    // child makes fadeIn and slideIn look identical.
    card: {
        backgroundColor: variables.brand.primary,
        borderRadius: 8,
        padding: variables.spacing.regular,
        alignSelf: "flex-start"
    },
    cardText: { color: "#fff", fontFamily: variables.font.family, fontWeight: "bold" },
    replay: {
        alignSelf: "flex-start",
        backgroundColor: variables.contrast.lower,
        borderRadius: 6,
        marginBottom: variables.spacing.small,
        paddingHorizontal: variables.spacing.regular,
        paddingVertical: variables.spacing.smaller
    },
    replayText: { color: variables.contrast.highest, fontFamily: variables.font.family, fontWeight: "bold" }
});

const Card = ({ label }: { label: string }): ReactElement => (
    <View style={styles.card}>
        <Text style={styles.cardText}>{label}</Text>
    </View>
);

/**
 * A button that remounts whatever is under it.
 *
 * Entry and exit animations run exactly once, when the widget mounts, and then the child sits in its
 * settled state — so by the time anyone has read the caption the animation is over and the story looks
 * static. In an app that mount is a page opening; here it has to be triggered by hand. Changing the
 * `key` is what does it: React discards the subtree and builds a new one, which is a real remount
 * rather than a prop change the widget would ignore.
 */
const Replay = ({ children }: { children: (key: number) => ReactNode }): ReactElement => {
    const [run, setRun] = useState(0);
    return (
        <View>
            <Pressable style={styles.replay} onPress={() => setRun(run + 1)}>
                <Text style={styles.replayText}>replay</Text>
            </Pressable>
            {children(run)}
        </View>
    );
};

const baseProps = {
    name: "animation",
    style: atlas,
    animationType: "attention" as const,
    animationIn: "none" as const,
    animationAttention: "pulse" as const,
    animationOut: "none" as const,
    duration: 1000,
    delay: 0,
    easing: "ease" as const,
    // 0 means infinite, which is the only setting that keeps an attention animation visible for
    // longer than a second. `count` and `afterAnimationAction` are mutually exclusive because of it —
    // the widget warns if both are set.
    count: 0,
    direction: "normal" as const,
    content: <Card label="content" />
};

const meta = {
    title: "Widgets/Animation",
    component: Animation,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Animation>;

export default meta;

/** An infinitely pulsing card, which is the one configuration that needs no interaction to see. */
export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The three animation types, which are not three lists to pick freely from.
 *
 * `animationType` selects *which* of `animationIn`/`animationAttention`/`animationOut` the widget
 * reads and ignores the other two — and warns to the console if either is set to something other than
 * `none`. Getting that wrong is the most common mistake with this widget: setting an entry animation
 * while the type is still Attention does nothing at all, silently, apart from a warning nobody reads.
 */
export const AnimationTypes: StoryObj<typeof Animation> = {
    render: () => (
        <StoryRows>
            <StoryRow label="in: fadeInLeft — runs once on mount">
                <Replay>
                    {run => (
                        <Animation
                            {...baseProps}
                            key={run}
                            animationType="in"
                            animationIn="fadeInLeft"
                            animationAttention="none"
                            count={1}
                        />
                    )}
                </Replay>
            </StoryRow>
            <StoryRow label="attention: tada, infinite">
                <Animation {...baseProps} animationAttention="tada" />
            </StoryRow>
            <StoryRow label="out: zoomOut — ends invisible, so replay to see it again">
                <Replay>
                    {run => (
                        <Animation
                            {...baseProps}
                            key={run}
                            animationType="out"
                            animationOut="zoomOut"
                            animationAttention="none"
                            count={1}
                        />
                    )}
                </Replay>
            </StoryRow>
        </StoryRows>
    )
};

/** The attention animations, all looping — the set a modeller picks from for a nudge or a highlight. */
export const AttentionAnimations: StoryObj<typeof Animation> = {
    render: () => (
        <StoryRows>
            {(["bounce", "flash", "pulse", "rotate", "rubberBand", "shake", "swing", "tada", "wobble"] as const).map(
                animationAttention => (
                    <StoryRow key={animationAttention} label={animationAttention}>
                        <Animation
                            {...baseProps}
                            animationAttention={animationAttention}
                            content={<Card label={animationAttention} />}
                        />
                    </StoryRow>
                )
            )}
        </StoryRows>
    )
};

/**
 * A sample of the entry animations, grouped by what they vary.
 *
 * There are 23 of them and they are combinations of three axes — the effect (fade, slide, zoom,
 * bounce), the direction it comes from, and whether it travels a short distance or a `Big` one. Four
 * rows covering those axes says more than listing all 23.
 */
export const EntryAnimations: StoryObj<typeof Animation> = {
    render: () => (
        <Replay>
            {run => (
                <StoryRows>
                    {(["fadeIn", "fadeInUpBig", "slideInRight", "bounceInDown", "zoomIn"] as const).map(animationIn => (
                        <StoryRow key={animationIn} label={animationIn}>
                            <Animation
                                {...baseProps}
                                key={`${animationIn}-${run}`}
                                animationType="in"
                                animationIn={animationIn}
                                animationAttention="none"
                                count={1}
                                content={<Card label={animationIn} />}
                            />
                        </StoryRow>
                    ))}
                </StoryRows>
            )}
        </Replay>
    )
};

/**
 * Duration, delay, easing and direction — the timing, independent of which animation runs.
 *
 * `direction: alternate` makes every other iteration run backwards, which is what turns a one-way
 * attention animation into a loop that settles back where it started. It is only meaningful with a
 * count above one.
 */
export const Timing: StoryObj<typeof Animation> = {
    render: () => (
        <StoryRows>
            <StoryRow label="duration: 250 — fast">
                <Animation {...baseProps} duration={250} content={<Card label="250ms" />} />
            </StoryRow>
            <StoryRow label="duration: 3000 — slow enough to watch">
                <Animation {...baseProps} duration={3000} content={<Card label="3000ms" />} />
            </StoryRow>
            <StoryRow label="easing: ease_in_out_back — overshoots at both ends">
                <Animation
                    {...baseProps}
                    animationAttention="swing"
                    easing="ease_in_out_back"
                    content={<Card label="ease_in_out_back" />}
                />
            </StoryRow>
            <StoryRow label="direction: alternate — every second pass runs backwards">
                <Animation
                    {...baseProps}
                    animationAttention="rotate"
                    direction="alternate"
                    content={<Card label="alternate" />}
                />
            </StoryRow>
            <StoryRow label="delay: 1500 — nothing happens at first, which is not a broken story">
                <Replay>
                    {run => (
                        <Animation
                            {...baseProps}
                            key={run}
                            animationType="in"
                            animationIn="bounceIn"
                            animationAttention="none"
                            count={1}
                            delay={1500}
                            content={<Card label="delayed 1.5s" />}
                        />
                    )}
                </Replay>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `condition`, which gates the animation without unmounting the child.
 *
 * False, or still loading, and the widget passes no animation at all — the content renders plain. So
 * this is how an app animates only when something is true, rather than wrapping the widget in a
 * conditional container. The child is always there either way, which is the point.
 */
export const Condition: StoryObj<typeof Animation> = {
    render: () => {
        const [enabled, setEnabled] = useState(false);
        return (
            <View>
                <Pressable style={styles.replay} onPress={() => setEnabled(!enabled)}>
                    <Text style={styles.replayText}>{`condition: ${enabled}`}</Text>
                </Pressable>
                <StoryRows>
                    <StoryRow label="condition bound to the button above">
                        <Animation
                            {...baseProps}
                            condition={dynamicValue(enabled)}
                            content={<Card label={enabled ? "animating" : "still"} />}
                        />
                    </StoryRow>
                    <StoryRow label="condition still loading — treated as false">
                        <Animation
                            {...baseProps}
                            condition={{ status: "loading", value: undefined } as never}
                            content={<Card label="loading" />}
                        />
                    </StoryRow>
                </StoryRows>
            </View>
        );
    }
};

/**
 * `afterAnimationAction`, which only ever fires for a finite count.
 *
 * With `count: 0` the animation never ends, so the action never runs and the widget warns about it on
 * every render — worth seeing, because "my after-animation action does nothing" is almost always this.
 * Check the log for the first row and the warning for the second.
 */
export const AfterAnimationAction: StoryObj<typeof Animation> = {
    render: () => (
        <Replay>
            {run => (
                <StoryRows>
                    <StoryRow label="count: 2 — the action fires when the second pass ends">
                        <Animation
                            {...baseProps}
                            key={`finite-${run}`}
                            count={2}
                            afterAnimationAction={actionValue("Animation afterAnimationAction")}
                            content={<Card label="count: 2" />}
                        />
                    </StoryRow>
                    <StoryRow label="count: 0 with an action set — never fires, and warns">
                        <Animation
                            {...baseProps}
                            key={`infinite-${run}`}
                            afterAnimationAction={actionValue("never runs")}
                            content={<Card label="count: 0" />}
                        />
                    </StoryRow>
                </StoryRows>
            )}
        </Replay>
    )
};

/**
 * No Atlas variants story: Atlas's entry for this widget is an empty container.
 *
 * `com_mendix_widget_native_animation_Animation` declares `container` and sets nothing in it, and there
 * are no design-property classes — the widget only wraps whatever is inside it, so a theme has nothing
 * to say. `baseProps` still passes the Atlas array, so this matches what a real app renders.
 */
