import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppEvents } from "../../../../packages/pluggableWidgets/app-events-native/src/AppEvents";
import { actionValue } from "../../shared/mendixValues";
import { variables } from "../../shared/atlasStyles";
import { StoryFrame } from "../../shared/StoryFrame";

/**
 * This widget renders `null`, so every story here is a log panel.
 *
 * It exists only for its side effects: it subscribes to app state and connectivity on mount, schedules
 * a timer, and calls actions. There is nothing to look at and nothing to style — Atlas has no entry and
 * the widget declares `Props<undefined>` — so the only way to see it work is to record what its actions
 * do. `EventLog` below is that recorder, and it is what each story actually renders.
 */
const styles = StyleSheet.create({
    hint: {
        color: variables.contrast.high,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.small
    },
    log: {
        backgroundColor: variables.background.secondary,
        borderRadius: 6,
        flex: 1,
        padding: variables.spacing.small
    },
    entry: {
        color: variables.contrast.highest,
        fontFamily: variables.font.familyMonospace ?? "monospace",
        fontSize: variables.font.sizeSmall,
        marginBottom: 2
    },
    empty: {
        color: variables.contrast.low,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        fontStyle: "italic"
    }
});

interface LogHandle {
    entries: string[];
    record: (event: string) => void;
}

/**
 * A growing list of events, newest last.
 *
 * `record` is stable across renders on purpose: it goes into `actionValue`, which goes into the
 * widget's props, and the widget captures its props in `componentDidMount` subscriptions that are never
 * re-created. A handler that changed identity would leave those subscriptions calling a stale closure —
 * the log would stop updating after the first event, which looks like the widget missing events rather
 * than the story dropping them.
 */
function useEventLog(): LogHandle {
    const [entries, setEntries] = useState<string[]>([]);
    const counter = useRef(0);
    const record = useCallback((event: string) => {
        counter.current += 1;
        setEntries(previous => [...previous, `${counter.current}. ${event}`]);
    }, []);
    return { entries, record };
}

function EventLog({ hint, entries }: { hint: string; entries: string[] }): ReactElement {
    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.hint}>{hint}</Text>
            <ScrollView style={styles.log}>
                {entries.length === 0 ? (
                    <Text style={styles.empty}>nothing yet</Text>
                ) : (
                    entries.map(entry => (
                        <Text key={entry} style={styles.entry}>
                            {entry}
                        </Text>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const baseProps = {
    name: "app-events",
    style: [],
    onResumeTimeout: 0,
    onOnlineTimeout: 0,
    onOfflineTimeout: 0,
    timerType: "once" as const,
    delayTime: 2
};

const meta = {
    title: "Widgets/AppEvents",
    component: AppEvents,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof AppEvents>;

export default meta;

/**
 * On load, which fires once on mount — before anything else the widget does.
 *
 * Guarded by `canExecute` as well as by a flag, so an action that cannot run yet is simply skipped
 * rather than deferred. In an app this is the page-open hook; here, switching to this story is the page
 * opening, so the entry appears immediately.
 */
export const OnLoad: StoryObj<typeof AppEvents> = {
    render: () => {
        const log = useEventLog();
        return (
            <>
                <AppEvents {...baseProps} onLoadAction={actionValue("onLoad", () => log.record("onLoad"))} />
                <EventLog hint="Fired on mount. Switch away and back to see it again." entries={log.entries} />
            </>
        );
    }
};

/**
 * On unload, which is the hard one to observe.
 *
 * It runs in `componentWillUnmount`, so by the time it fires the story that would display it is being
 * torn down too — the log below can never show its own unload. What it *can* show is the previous
 * mount's: the counter is inside the story, so switching away and back gives a fresh log. So this story
 * logs to the console instead, and the panel says where to look.
 */
export const OnUnload: StoryObj<typeof AppEvents> = {
    render: () => {
        const log = useEventLog();
        return (
            <>
                <AppEvents
                    {...baseProps}
                    onLoadAction={actionValue("onLoad", () => log.record("onLoad — this mount"))}
                    onUnloadAction={actionValue("onUnload")}
                />
                <EventLog
                    hint="onUnload fires as this story is destroyed, so it cannot appear here — watch the console for '[story] action fired: onUnload' when you switch away."
                    entries={log.entries}
                />
            </>
        );
    }
};

/**
 * The timer, in its two modes.
 *
 * `once` is a `setTimeout` and `interval` a `setInterval`, both in seconds, both started on mount and
 * cleared on unmount. Two widgets here rather than one because a single widget has a single
 * `timerType` — an app that wants both needs two instances, which is not obvious from the properties.
 */
export const Timer: StoryObj<typeof AppEvents> = {
    render: () => {
        const log = useEventLog();
        return (
            <>
                <AppEvents
                    {...baseProps}
                    timerType="once"
                    delayTime={2}
                    onTimeoutAction={actionValue("timeout", () => log.record("once — 2s after mount"))}
                />
                <AppEvents
                    {...baseProps}
                    timerType="interval"
                    delayTime={3}
                    onTimeoutAction={actionValue("interval", () => log.record("interval — every 3s"))}
                />
                <EventLog hint="One 2s timeout and one 3s interval, both started on mount." entries={log.entries} />
            </>
        );
    }
};

/**
 * On resume, which fires when the app returns to the foreground.
 *
 * Backgrounding is the trigger — the home button, the app switcher, a phone call — not navigating
 * within the app. `onResumeTimeout` is a debounce in seconds: a resume sooner than that after the last
 * one is dropped, so an app does not re-sync every time someone glances at a notification. Two widgets
 * here, one with no debounce and one with ten seconds, so the difference is visible in the same log.
 */
export const OnResume: StoryObj<typeof AppEvents> = {
    render: () => {
        const log = useEventLog();
        return (
            <>
                <AppEvents
                    {...baseProps}
                    onResumeTimeout={0}
                    onResumeAction={actionValue("resume", () => log.record("resume (no debounce)"))}
                />
                <AppEvents
                    {...baseProps}
                    onResumeTimeout={10}
                    onResumeAction={actionValue("resume 10s", () => log.record("resume (10s debounce)"))}
                />
                <EventLog
                    hint="Background the app and return — home button, then the app switcher. The debounced one skips a resume within 10s of the last."
                    entries={log.entries}
                />
            </>
        );
    }
};

/**
 * Online and offline, from NetInfo.
 *
 * The widget takes a connectivity reading on mount and only reports *changes* after it — so neither
 * action fires just because the device is already online. Toggling airplane mode is the way to see both.
 * `onOnlineTimeout`/`onOfflineTimeout` debounce the same way resume does, which matters on a flaky
 * connection that flaps: without them an app would re-sync on every blip.
 */
export const Connectivity: StoryObj<typeof AppEvents> = {
    render: () => {
        const log = useEventLog();
        return (
            <>
                <AppEvents
                    {...baseProps}
                    onOnlineAction={actionValue("online", () => log.record("online"))}
                    onOfflineAction={actionValue("offline", () => log.record("offline"))}
                />
                <EventLog
                    hint="Toggle airplane mode or wifi. Nothing fires on mount — only on a change from the state the widget read when it started."
                    entries={log.entries}
                />
            </>
        );
    }
};

/**
 * Everything at once, which is how the widget is usually configured.
 *
 * One instance can carry all six actions, and they are independent — the subscriptions are each set up
 * only if their action is bound, so an unused event costs nothing. This is the story to leave running
 * while backgrounding the app and toggling the network.
 */
export const AllEvents: StoryObj<typeof AppEvents> = {
    render: () => {
        const log = useEventLog();
        return (
            <>
                <AppEvents
                    {...baseProps}
                    timerType="interval"
                    delayTime={5}
                    onLoadAction={actionValue("onLoad", () => log.record("onLoad"))}
                    onUnloadAction={actionValue("onUnload")}
                    onResumeAction={actionValue("onResume", () => log.record("onResume"))}
                    onOnlineAction={actionValue("onOnline", () => log.record("onOnline"))}
                    onOfflineAction={actionValue("onOffline", () => log.record("onOffline"))}
                    onTimeoutAction={actionValue("onTimeout", () => log.record("onTimeout (every 5s)"))}
                />
                <EventLog
                    hint="All six on one widget. Background the app, toggle airplane mode, and wait for the 5s interval."
                    entries={log.entries}
                />
            </>
        );
    }
};
