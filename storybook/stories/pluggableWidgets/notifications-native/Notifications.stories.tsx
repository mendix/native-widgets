import type { Meta, StoryObj } from "@storybook/react-native";
import { Component, type ErrorInfo, type ReactElement, type ReactNode, useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import notifee, { EventType } from "react-native-notify-kit";
import { Notifications } from "../../../../packages/pluggableWidgets/notifications-native/src/Notifications";
import { actionValue, editableValue } from "../../shared/mendixValues";
import { variables } from "../../shared/atlasStyles";
import { StoryFrame } from "../../shared/StoryFrame";
import { ValueStatus } from "mendix";

/**
 * A widget that renders `null` and exists entirely for its subscriptions.
 *
 * It bridges two libraries. `@react-native-firebase/messaging` delivers remote pushes — `onMessage`
 * while the app is in the foreground, `onNotificationOpenedApp` and `getInitialNotification` when a
 * notification launches or resumes the app. `react-native-notify-kit` (a maintained Notifee fork)
 * delivers the *local* side: its `onForegroundEvent` fires with `EventType.PRESS` when a notification
 * already on the shade is tapped while the app is running. Both paths funnel into one
 * `handleNotification`, which writes the notification's fields into attributes and then runs actions.
 *
 * Two things make it hard to story honestly, and both shaped the design here:
 *
 * - Its firebase effect calls `messaging()`. This host app has no `google-services.json`, so whether
 *   that resolves a default app or throws "No Firebase App '[DEFAULT]' has been created" is a property
 *   of the build, not of the widget. A throw inside an effect tears down the whole story, so every
 *   story below mounts the widget behind a button and wraps it in an error boundary — the failure
 *   becomes a line of text instead of Storybook's error screen. Note that the throw lands on the render
 *   *after* the gate opens rather than on mount, because the call sits inside `if (loadNotifications)`
 *   and that flag starts `false`; `LoadingAttribute` below never opens the gate and so never fails.
 *   The notifee effect is gated by the same flag but runs first once it opens, which is why the
 *   "send press" buttons still work in a story whose mount reported a failure.
 * - There is no way to send it a real push from here. But the notifee half needs no native call to
 *   drive: `notifee.emitter` is a plain JS `EventEmitter` (see `NotifeeJSEventEmitter`) and
 *   `onForegroundEvent` subscribes to it by name, so emitting `app.notifee.notification-event` from a
 *   story reaches the widget through exactly the code path a real tap would. That is what the "send"
 *   buttons below do, and it is the one path here that can be exercised end to end without a server.
 *
 * The widget takes `Props<undefined>` and Atlas has no entry for it, so there is nothing to theme and
 * no styling story to write.
 */
const FOREGROUND_EVENT = "app.notifee.notification-event";

/** The widget's own dedup key on Android; iOS reads `gcm.message_id` instead. */
const MESSAGE_ID = "google.message_id";

/**
 * The emitter `onForegroundEvent` listens on, which the package's public type does not admit to.
 *
 * `emitter` is a real public getter on `NotifeeNativeModule`, but the default export is typed
 * `ModuleWithStatics` — the `Module` interface plus statics — and that interface lists only the API
 * methods. So the cast is about the type surface, not about reaching into a private: the getter is the
 * same one the widget's own subscription goes through.
 */
const notifeeEmitter = (notifee as unknown as { emitter: { emit: (event: string, payload: unknown) => void } }).emitter;

const styles = StyleSheet.create({
    note: {
        color: variables.contrast.high,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: variables.spacing.smaller
    },
    button: {
        backgroundColor: variables.brand.primary,
        borderRadius: 6,
        marginBottom: variables.spacing.smaller,
        paddingHorizontal: variables.spacing.small,
        paddingVertical: variables.spacing.smaller
    },
    buttonIdle: { backgroundColor: variables.contrast.low },
    buttonText: { color: "#fff", fontFamily: variables.font.family, fontSize: variables.font.sizeSmall },
    log: {
        color: variables.contrast.highest,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        marginBottom: 2
    },
    empty: {
        color: variables.contrast.low,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        fontStyle: "italic"
    },
    failure: {
        backgroundColor: variables.brand.dangerLight,
        borderRadius: 6,
        color: variables.brand.danger,
        fontFamily: variables.font.family,
        fontSize: variables.font.sizeSmall,
        padding: variables.spacing.small
    },
    panel: {
        backgroundColor: variables.background.secondary,
        borderRadius: 6,
        marginTop: variables.spacing.small,
        padding: variables.spacing.small
    }
});

/**
 * Catches what the widget's effects throw, so one unavailable native module costs one story row.
 *
 * A class component because that is the only way to implement `componentDidCatch`, and there is no hook
 * equivalent. It reports rather than recovers: re-mounting the same widget would throw again, so the
 * boundary keeps the message on screen and leaves the retry to the toggle above it.
 */
class MountBoundary extends Component<{ children: ReactNode }, { error?: string }> {
    state: { error?: string } = {};

    static getDerivedStateFromError(error: unknown): { error: string } {
        return { error: error instanceof Error ? error.message : String(error) };
    }

    componentDidCatch(error: Error, _info: ErrorInfo): void {
        // eslint-disable-next-line no-console
        console.log(`[story] Notifications failed to mount: ${error.message}`);
    }

    render(): ReactNode {
        if (this.state.error !== undefined) {
            return <Text style={styles.failure}>{`Mount failed — ${this.state.error}`}</Text>;
        }
        return this.props.children;
    }
}

interface SentNotification {
    title?: string;
    body?: string;
    actionName?: string;
    guid?: string;
    messageId?: string;
}

/**
 * A synthetic notifee foreground press, shaped the way the widget reads it.
 *
 * `data` carries the two fields the Mendix runtime puts there — `actionName`, which the widget matches
 * against its configured actions, and `guid`, the object the notification is about. The message id goes
 * in under the platform key the widget dedups on, not as a sibling of `type`.
 */
function sendForegroundPress(notification: SentNotification): void {
    notifeeEmitter.emit(FOREGROUND_EVENT, {
        type: EventType.PRESS,
        detail: {
            notification: {
                title: notification.title,
                body: notification.body,
                subtitle: undefined,
                data: {
                    actionName: notification.actionName,
                    guid: notification.guid,
                    ...(notification.messageId === undefined ? {} : { [MESSAGE_ID]: notification.messageId })
                }
            }
        }
    });
}

/** The five attributes the widget writes, held as story state so the writes are visible. */
function useAttributes(): {
    written: Record<string, string>;
    props: {
        guid: ReturnType<typeof editableValue<string>>;
        title: ReturnType<typeof editableValue<string>>;
        subtitle: ReturnType<typeof editableValue<string>>;
        body: ReturnType<typeof editableValue<string>>;
        action: ReturnType<typeof editableValue<string>>;
    };
} {
    const [written, setWritten] = useState<Record<string, string>>({});
    const write = useCallback(
        (key: string) =>
            (next: string): void =>
                setWritten(previous => ({ ...previous, [key]: next })),
        []
    );
    return {
        written,
        props: {
            guid: editableValue<string>(written.guid ?? "", write("guid")),
            title: editableValue<string>(written.title ?? "", write("title")),
            subtitle: editableValue<string>(written.subtitle ?? "", write("subtitle")),
            body: editableValue<string>(written.body ?? "", write("body")),
            action: editableValue<string>(written.action ?? "", write("action"))
        }
    };
}

function AttributePanel({ written }: { written: Record<string, string> }): ReactElement {
    const keys = Object.keys(written);
    return (
        <View style={styles.panel}>
            {keys.length === 0 ? (
                <Text style={styles.empty}>No attribute has been written yet.</Text>
            ) : (
                keys.map(key => (
                    <Text key={key} style={styles.log}>
                        {`${key} = ${written[key] === "" ? "(empty string)" : written[key]}`}
                    </Text>
                ))
            )}
        </View>
    );
}

const meta = {
    title: "Widgets/Notifications",
    component: Notifications,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Notifications>;

export default meta;

/**
 * Mounting it, which is the first thing to establish and the thing most likely to fail here.
 *
 * Nothing appears when it mounts — the widget returns `null` — so the only evidence either way is the
 * absence of the boundary's message. What it does on mount is three effects: subscribe to notifee's
 * foreground events, register for remote messages and attach the two firebase listeners, and check
 * that every bound attribute is `Available` before allowing the first two to run.
 *
 * That third effect is the gate, and it is the reason the order matters. `loadNotifications` starts
 * `false` and both subscription effects are wrapped in `if (loadNotifications)`, so on the very first
 * render the widget subscribes to nothing at all; the attribute check flips it a render later. An app
 * whose notification attributes arrive slowly therefore has a window where a push is not handled, and
 * that is deliberate — handling one early would call `setValue` on an attribute that is still loading.
 */
export const Mounting: StoryObj<typeof Notifications> = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <View style={{ flex: 1 }}>
                <Text style={styles.note}>
                    The widget renders null. Mounting it runs its three effects — a clean mount shows nothing below.
                </Text>
                <TouchableOpacity
                    style={[styles.button, !mounted && styles.buttonIdle]}
                    onPress={() => setMounted(current => !current)}
                >
                    <Text style={styles.buttonText}>{mounted ? "unmount" : "mount"}</Text>
                </TouchableOpacity>
                {mounted ? (
                    <MountBoundary>
                        <Notifications name="notifications" style={[]} actions={[{ name: "OrderShipped" }]} />
                    </MountBoundary>
                ) : (
                    <Text style={styles.empty}>not mounted</Text>
                )}
            </View>
        );
    }
};

/**
 * A foreground tap, driven through notifee's own emitter.
 *
 * This is the local-notification path, and the only one a story can complete: the widget's
 * `onForegroundEvent` handler reads `detail.notification`, matches `data.actionName` against its
 * configured actions, writes the five attributes, and runs each matched action's `onOpen`.
 *
 * Two details of that order are worth watching in the panel below. The attributes are written *before*
 * the actions run, so an action can read them — that is how a Mendix nanoflow gets at the payload. And
 * every bound attribute is written on every handled notification, including the ones the notification
 * does not carry: `subtitle` here becomes an empty string rather than staying at its previous value,
 * because the handler coalesces a missing field to `""`.
 *
 * `onReceive` is not reachable this way. It is wired only to firebase's `onMessage`, so a locally
 * tapped notification fires `onOpen` alone.
 */
export const ForegroundPress: StoryObj<typeof Notifications> = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        const [log, setLog] = useState<string[]>([]);
        const attributes = useAttributes();
        const record = (entry: string): void => setLog(previous => [...previous, entry].slice(-6));
        return (
            <ScrollView style={{ flex: 1 }}>
                <Text style={styles.note}>
                    Mount, then send. The send button emits notifee&apos;s foreground event, which is what a tap on the
                    shade does.
                </Text>
                <TouchableOpacity
                    style={[styles.button, !mounted && styles.buttonIdle]}
                    onPress={() => setMounted(current => !current)}
                >
                    <Text style={styles.buttonText}>{mounted ? "unmount" : "mount"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        sendForegroundPress({
                            title: "Order shipped",
                            body: "Your order #4711 is on its way.",
                            actionName: "OrderShipped",
                            guid: "9007199254740993"
                        })
                    }
                >
                    <Text style={styles.buttonText}>send press — actionName &quot;OrderShipped&quot;</Text>
                </TouchableOpacity>
                {mounted ? (
                    <MountBoundary>
                        <Notifications
                            name="notifications"
                            style={[]}
                            actions={[
                                {
                                    name: "OrderShipped",
                                    onOpen: actionValue("onOpen", () => record("onOpen — OrderShipped")),
                                    onReceive: actionValue("onReceive", () => record("onReceive — unreachable here"))
                                }
                            ]}
                            {...attributes.props}
                        />
                    </MountBoundary>
                ) : (
                    <Text style={styles.empty}>not mounted — sending now does nothing</Text>
                )}
                <AttributePanel written={attributes.written} />
                <View style={styles.panel}>
                    {log.length === 0 ? (
                        <Text style={styles.empty}>no action has run</Text>
                    ) : (
                        log.map((entry, index) => (
                            <Text key={`${entry}-${index}`} style={styles.log}>
                                {entry}
                            </Text>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }
};

/**
 * Action matching, which is a filter rather than a lookup.
 *
 * The widget does `props.actions.filter(item => item.name === data.actionName)` and returns early on an
 * empty result — so a notification whose `actionName` matches nothing is dropped entirely, attributes
 * included. Nothing is logged and no attribute moves; from the outside it is indistinguishable from the
 * notification never arriving.
 *
 * Because it is a filter, two configured actions with the *same* name both run, and the `action`
 * attribute receives their names joined by a space. That is what the property's description means by
 * "the name of all actions joined by spaces" — it is not a list of everything configured, it is the
 * matched subset. The third button below sends a name no action carries.
 */
export const ActionMatching: StoryObj<typeof Notifications> = {
    render: () => {
        const [log, setLog] = useState<string[]>([]);
        const attributes = useAttributes();
        const record = (entry: string): void => setLog(previous => [...previous, entry].slice(-6));
        return (
            <ScrollView style={{ flex: 1 }}>
                <Text style={styles.note}>
                    Two actions are configured under the same name, plus one under another. Watch the `action`
                    attribute.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => sendForegroundPress({ title: "Twice", actionName: "Duplicated" })}
                >
                    <Text style={styles.buttonText}>send &quot;Duplicated&quot; — two actions match</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => sendForegroundPress({ title: "Once", actionName: "Single" })}
                >
                    <Text style={styles.buttonText}>send &quot;Single&quot; — one action matches</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => sendForegroundPress({ title: "Ignored", actionName: "NotConfigured" })}
                >
                    <Text style={styles.buttonText}>send &quot;NotConfigured&quot; — dropped entirely</Text>
                </TouchableOpacity>
                <MountBoundary>
                    <Notifications
                        name="notifications"
                        style={[]}
                        actions={[
                            {
                                name: "Duplicated",
                                onOpen: actionValue("first", () => record("onOpen — Duplicated #1"))
                            },
                            {
                                name: "Duplicated",
                                onOpen: actionValue("second", () => record("onOpen — Duplicated #2"))
                            },
                            { name: "Single", onOpen: actionValue("single", () => record("onOpen — Single")) }
                        ]}
                        {...attributes.props}
                    />
                </MountBoundary>
                <AttributePanel written={attributes.written} />
                <View style={styles.panel}>
                    {log.length === 0 ? (
                        <Text style={styles.empty}>no action has run</Text>
                    ) : (
                        log.map((entry, index) => (
                            <Text key={`${entry}-${index}`} style={styles.log}>
                                {entry}
                            </Text>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }
};

/**
 * The message-id guard, which makes handling once-only per id — for the lifetime of the mount.
 *
 * `knownIds` is a `useRef(new Set())`, so the first notification with a given id is handled and every
 * later one with that id is dropped. This exists because the same push can arrive twice on Android: FCM
 * can deliver it and the notification can also be tapped, and both routes reach `handleNotification`.
 *
 * The two limits of the guard are what the buttons show. It is keyed on
 * `data["google.message_id"]` on Android (`gcm.message_id` on iOS), so a notification with no id set is
 * never deduped — `id !== undefined` gates the whole check, and the "no id" button can be tapped
 * repeatedly. And the set lives on a ref, so unmounting and remounting the widget forgets every id;
 * in an app that means a page reopened will handle a notification it already handled.
 *
 * Note that the guard is checked *after* the action filter, so an unmatched notification never records
 * its id — the same id can still be handled later if the matching action is configured by then.
 */
export const MessageIdDedup: StoryObj<typeof Notifications> = {
    render: () => {
        const [mounted, setMounted] = useState(true);
        const [log, setLog] = useState<string[]>([]);
        const record = (entry: string): void => setLog(previous => [...previous, entry].slice(-8));
        return (
            <ScrollView style={{ flex: 1 }}>
                <Text style={styles.note}>
                    The first button logs once however often it is tapped. Remount to clear the remembered ids.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        sendForegroundPress({ title: "Deduped", actionName: "Repeat", messageId: "message-1" })
                    }
                >
                    <Text style={styles.buttonText}>send with id &quot;message-1&quot;</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => sendForegroundPress({ title: "Never deduped", actionName: "Repeat" })}
                >
                    <Text style={styles.buttonText}>send with no id — handled every time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, !mounted && styles.buttonIdle]}
                    onPress={() => setMounted(current => !current)}
                >
                    <Text style={styles.buttonText}>{mounted ? "unmount (forgets ids)" : "mount"}</Text>
                </TouchableOpacity>
                {mounted ? (
                    <MountBoundary>
                        <Notifications
                            name="notifications"
                            style={[]}
                            actions={[
                                {
                                    name: "Repeat",
                                    onOpen: actionValue("repeat", () => record("onOpen — handled"))
                                }
                            ]}
                        />
                    </MountBoundary>
                ) : (
                    <Text style={styles.empty}>not mounted</Text>
                )}
                <View style={styles.panel}>
                    {log.length === 0 ? (
                        <Text style={styles.empty}>nothing handled yet</Text>
                    ) : (
                        log.map((entry, index) => (
                            <Text key={`${entry}-${index}`} style={styles.log}>
                                {`${index + 1}. ${entry}`}
                            </Text>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }
};

/**
 * A loading attribute, which switches the widget off entirely.
 *
 * The gate effect requires every *bound* attribute to be `Available`; one that is still `Loading` sets
 * `loadNotifications` back to `false`, and both subscription effects then tear their listeners down
 * through their cleanup functions. So this is not merely "the first notification is missed" — for as
 * long as an attribute is loading the widget is not subscribed at all, and pushes that arrive in that
 * window are gone rather than queued.
 *
 * The story cannot show the recovery, because `editableValue` builds a value with a fixed status and
 * nothing here promotes it to `Available` the way the runtime would. What it can show is the state: the
 * send button below reaches a mounted widget that has no listener attached, so nothing happens.
 *
 * This is also the one story here with no mount-failure row, and for the same reason. `messaging()` is
 * inside the gated effect, so a widget that never opens the gate never reaches the missing Firebase
 * app either — the closed gate hides an unrelated fault, which is worth knowing when reading the other
 * stories' red rows.
 *
 * Only bound attributes count. Leaving all five unset — as `Mounting` and `MessageIdDedup` above do —
 * passes the gate immediately, since each check is `props.x && props.x.status !== Available`.
 */
export const LoadingAttribute: StoryObj<typeof Notifications> = {
    render: () => {
        const [log, setLog] = useState<string[]>([]);
        return (
            <ScrollView style={{ flex: 1 }}>
                <Text style={styles.note}>
                    `title` is Loading, so the widget subscribes to nothing. Sending a press should do nothing at all.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => sendForegroundPress({ title: "Lost", actionName: "Gated" })}
                >
                    <Text style={styles.buttonText}>send press</Text>
                </TouchableOpacity>
                <MountBoundary>
                    <Notifications
                        name="notifications"
                        style={[]}
                        actions={[
                            {
                                name: "Gated",
                                onOpen: actionValue("gated", () => setLog(previous => [...previous, "onOpen — ran"]))
                            }
                        ]}
                        title={editableValue<string>("", undefined, ValueStatus.Loading)}
                    />
                </MountBoundary>
                <View style={styles.panel}>
                    {log.length === 0 ? (
                        <Text style={styles.empty}>nothing handled — as expected while an attribute is loading</Text>
                    ) : (
                        log.map((entry, index) => (
                            <Text key={`${entry}-${index}`} style={styles.log}>
                                {entry}
                            </Text>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }
};
