import type { Meta, StoryObj } from "@storybook/react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Big } from "big.js";
import { ValueStatus } from "mendix";
// Imported straight from the widget package's source: Metro watches the repo root, so a story
// exercises the same code the mpk is built from, with no build step in between.
import { IntroScreen } from "../../packages/pluggableWidgets/intro-screen-native/src/IntroScreen";
import type { IntroScreenStyle } from "../../packages/pluggableWidgets/intro-screen-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "./mendixValues";

const slideStyles = StyleSheet.create({
    slide: { flex: 1, alignItems: "center", justifyContent: "center" },
    slideText: { fontSize: 28, fontWeight: "bold", color: "#fff" }
});

const slide = (label: string, color: string) => ({
    name: label,
    content: (
        <View style={[slideStyles.slide, { backgroundColor: color }]}>
            <Text style={slideStyles.slideText}>{label}</Text>
        </View>
    )
});

// Same three slides and colours the Maestro flow drives, so what a story shows lines up with what
// the e2e video shows.
const threeSlides = [slide("Slide 1", "#d9534f"), slide("Slide 2", "#0275d8"), slide("Slide 3", "#5cb85c")];

// How long the attribute is made to take to arrive, cycled by the story's own button. 150ms is
// roughly what the runtime does; the longer ones widen the window so a tap can land inside it.
const DELAYS = [150, 3000, 0];

// How long a written value spends in flight. The runtime does not simply swap the value: the write
// round-trips, and while it does the attribute can report Loading with no value at all — the same
// shape a cold page open has. Modelled here because it is the state a "wait for the value" gate is
// sensitive to, and the story is useless for testing that gate without it.
const WRITE_ROUNDTRIP_MS = 200;

const baseProps = {
    name: "intro-screen",
    style: [] as IntroScreenStyle[],
    slides: threeSlides,
    showMode: "fullscreen" as const,
    buttonPattern: "all" as const,
    slideIndicators: "between" as const,
    hideIndicatorLastSlide: false,
    // Empty means "always show": a non-empty identifier makes the widget remember it was dismissed
    // in AsyncStorage, which would blank the story on every reload after the first.
    identifier: "",
    skipCaption: dynamicValue("SKIP"),
    previousCaption: dynamicValue("PREVIOUS"),
    nextCaption: dynamicValue("NEXT"),
    doneCaption: dynamicValue("FINISH")
};

const meta = {
    title: "Widgets/IntroScreen",
    component: IntroScreen
} satisfies Meta<typeof IntroScreen>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The widget wired to a live attribute, with the counters the Maestro flow asserts on.
 *
 * This is the configuration the failing e2e test uses. `activeSlideAttribute` round-trips through
 * state, so the value the widget writes comes back on the next render exactly as the runtime would
 * deliver it — which is the path the flash-list `initialScrollIndex` bug lives on.
 */
// Typed against the component rather than `meta`: this story supplies everything through `render`,
// and StoryObj<typeof meta> would still demand an `args` it never uses.
export const WithActiveSlideAttribute: StoryObj<typeof IntroScreen> = {
    render: () => {
        const [activeSlide, setActiveSlide] = useState(new Big(2));
        const [changes, setChanges] = useState(0);

        return (
            <View style={styles.host}>
                <IntroScreen
                    {...baseProps}
                    activeSlideAttribute={editableValue<Big>(activeSlide, setActiveSlide)}
                    onSlideChange={actionValue("onSlideChange", () => setChanges(c => c + 1))}
                    onDone={actionValue("onDone")}
                    onSkip={actionValue("onSkip")}
                />
                <View style={styles.readout}>
                    <Text style={styles.readoutText}>Active slide: {activeSlide.toString()}</Text>
                    <Text style={styles.readoutText}>Changes: {changes}</Text>
                </View>
            </View>
        );
    }
};

/**
 * Re-entering the page while the active slide attribute is still loading.
 *
 * This is the e2e failure the `WithActiveSlideAttribute` story cannot show. That story hands the
 * widget an attribute that is Available from the first render, but the runtime does not: the test
 * project's setup nanoflow creates the object and writes activeSlide = 2, and until that lands the
 * attribute is Loading with no value. The widget seeds `activeIndex` once at mount, and
 * `refreshActiveSlideAttribute` answers 0 for a value that is not there yet — so losing that race
 * opens the widget on slide 1 while the attribute says 2.
 *
 * "Leave and come back" is what makes it reachable: SKIP hides the modal, which unmounts
 * SwipeableContainer and discards the state that had been correct. Re-entry re-seeds from an
 * attribute that has not arrived yet. Set the delay above zero and re-enter to reproduce the CI
 * signature — "Active slide: 1" with a SKIP/NEXT pagination, on a run where 2 was requested.
 */
export const ReEntryWhileAttributeLoading: StoryObj<typeof IntroScreen> = {
    render: () => {
        // How long the runtime takes to deliver the value. 0 mirrors what a story normally does
        // (already loaded); anything above a frame mirrors a cold page open. The long settings are
        // there to be tapped through: the race only shows if a button is pressed while the attribute
        // is still on its way, which at runtime speed is a window too short to hit by hand.
        const [delay, setDelay] = useState(DELAYS[0]);
        const [visit, setVisit] = useState(0);
        const [activeSlide, setActiveSlide] = useState<Big | undefined>(undefined);
        const [changes, setChanges] = useState(0);

        // Remount the widget on every visit and re-run the delayed "write" the runtime would do,
        // so each entry starts from the same place a fresh page open does.
        useEffect(() => {
            setActiveSlide(undefined);
            setChanges(0);
            if (delay === 0) {
                setActiveSlide(new Big(2));
                return;
            }
            const timer = setTimeout(() => setActiveSlide(new Big(2)), delay);
            return () => clearTimeout(timer);
        }, [visit, delay]);

        const loaded = activeSlide !== undefined;

        // The widget covers the screen, so the readout below can be hard to see. Mirror it to the
        // log as well, where `adb logcat -s ReactNativeJS` can read it while the modal is up.
        console.log(
            `[story] visit=${visit + 1} delay=${delay} activeSlide=${
                loaded ? activeSlide!.toString() : "loading"
            } changes=${changes}`
        );

        // The readout has to live inside the slides. The widget renders as a fullscreen Modal, which
        // on Android is a separate window: anything rendered as a sibling of it — even another modal
        // — ends up behind, so it would never appear on screen or in a screenshot.
        const readout = (
            <View style={styles.readout}>
                <Text style={styles.readoutText}>Active slide: {loaded ? activeSlide!.toString() : "(loading)"}</Text>
                <Text style={styles.readoutText}>Changes: {changes}</Text>
                <Text style={styles.readoutText}>
                    Visit {visit + 1} · attribute arrives after {delay}ms
                </Text>
                <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={() => setVisit(v => v + 1)}>
                        <Text style={styles.buttonText}>Re-enter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setDelay(DELAYS[(DELAYS.indexOf(delay) + 1) % DELAYS.length])}
                    >
                        <Text style={styles.buttonText}>delay {delay}ms</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );

        return (
            <View style={styles.host}>
                <IntroScreen
                    // Remount on re-entry: this is what SKIP does through the modal, and it is the
                    // step that throws the corrected index away.
                    key={visit}
                    {...baseProps}
                    slides={threeSlides.map((s, i) => ({
                        ...s,
                        content: (
                            <View style={styles.host}>
                                {s.content}
                                {/* Only the visible slide's copy is on screen, so the numbers read
                                    the same wherever the list happens to be parked. */}
                                <View style={styles.readoutHost} testID={`readout${i}`}>
                                    {readout}
                                </View>
                            </View>
                        )
                    }))}
                    activeSlideAttribute={editableValue<Big>(
                        activeSlide ?? new Big(2),
                        next => {
                            // Blank the value for a moment first, the way the runtime does while the
                            // write is in flight, then deliver it.
                            setActiveSlide(undefined);
                            setTimeout(() => setActiveSlide(next), WRITE_ROUNDTRIP_MS);
                        },
                        loaded ? ValueStatus.Available : ValueStatus.Loading
                    )}
                    onSlideChange={actionValue("onSlideChange", () => setChanges(c => c + 1))}
                    onDone={actionValue("onDone")}
                    onSkip={actionValue("onSkip", () => setVisit(v => v + 1))}
                />
            </View>
        );
    }
};

/**
 * The attribute already agreeing with the slide the widget opens on.
 *
 * `WithActiveSlideAttribute` starts at 2 while the widget seeds index 0, so the sync effect always
 * has a correction to make on its first run. Starting at 1 removes that: attribute and index agree,
 * the effect's `slide !== activeIndex` branch never runs, and anything the widget only does inside
 * that branch never happens at all. Swipe from here and watch whether the counters move.
 */
export const AttributeAgreesAtMount: StoryObj<typeof IntroScreen> = {
    render: () => {
        const [activeSlide, setActiveSlide] = useState(new Big(1));
        const [changes, setChanges] = useState(0);

        return (
            <View style={styles.host}>
                <IntroScreen
                    {...baseProps}
                    slides={threeSlides.map(s => ({
                        ...s,
                        content: (
                            <View style={styles.host}>
                                {s.content}
                                <View style={styles.readoutHost}>
                                    <View style={styles.readout}>
                                        <Text style={styles.readoutText}>Active slide: {activeSlide.toString()}</Text>
                                        <Text style={styles.readoutText}>Changes: {changes}</Text>
                                    </View>
                                </View>
                            </View>
                        )
                    }))}
                    activeSlideAttribute={editableValue<Big>(activeSlide, setActiveSlide)}
                    onSlideChange={actionValue("onSlideChange", () => setChanges(c => c + 1))}
                    onDone={actionValue("onDone")}
                    onSkip={actionValue("onSkip")}
                />
            </View>
        );
    }
};

/** Buttons stacked below the dots instead of flanking them. */
export const BottomButtons: StoryObj<typeof meta> = {
    args: { ...baseProps, slideIndicators: "above" }
};

/** Dots hidden on the last slide — the state the e2e video used to tell slides apart. */
export const HideIndicatorOnLastSlide: StoryObj<typeof meta> = {
    args: { ...baseProps, hideIndicatorLastSlide: true }
};

const styles = StyleSheet.create({
    host: { flex: 1 },
    readoutHost: { position: "absolute", top: 0, left: 0, right: 0 },
    readout: { padding: 12, backgroundColor: "#222" },
    readoutText: { color: "#fff", fontSize: 14 },
    row: { flexDirection: "row", marginTop: 8 },
    button: { backgroundColor: "#0275d8", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, marginRight: 8 },
    buttonText: { color: "#fff", fontSize: 13, fontWeight: "bold" }
});
