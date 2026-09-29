/**
 * A harness for stories about nanoflow actions.
 *
 * The widget stories render a component and let you look at it. A nanoflow action has nothing to
 * look at: it is an async function that returns a value or throws, and whose interesting effects
 * are the calls it makes on the `mx` client. So the story renders this runner instead — a button
 * per action, and a log of what came back — which is the closest equivalent to "call it from a
 * nanoflow and see what happens".
 *
 * Two things here are load-bearing rather than cosmetic:
 *
 * - Actions are invoked through a thunk and `require`d inside it, not imported at the top of the
 *   story. Storybook evaluates every story module when the app starts, so a static import of an
 *   action that pulls in an unlinked native module would crash the whole Storybook rather than
 *   just fail its own row. Deferring the require turns that into a caught error in the log.
 * - The `mx` stub is installed for the duration of the call and removed after, so a story cannot
 *   leave a global behind for whatever runs next.
 */
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createMxStub, describeResult, type MxStubOptions } from "./mxStub";

export interface ActionCase {
    /** Button label — the action name, plus what makes this case different. */
    label: string;
    /**
     * Calls the action. Requires it inside the thunk rather than importing it at module scope, so a
     * missing native module surfaces as a failed row instead of a crashed app.
     */
    run: () => Promise<unknown>;
    /** Shown under the button: what this case is for, or which branch it takes. */
    note?: string;
    /** Marks a case that is expected to reject, so a rejection reads as a pass rather than a bug. */
    expectReject?: boolean;
}

export interface ActionRunnerProps {
    /** What the actions run against. Installed around each call. */
    mxOptions?: MxStubOptions;
    cases: ActionCase[];
    /** Explains what the group covers and anything a reader needs to know before tapping. */
    description?: string;
}

interface Outcome {
    label: string;
    state: "ok" | "error";
    detail: string;
    /** `mx` calls the action made, so effect-only actions have something to show. */
    mxCalls: string[];
    expected: boolean;
}

export function ActionRunner({ cases, mxOptions, description }: ActionRunnerProps): React.ReactElement {
    const [outcomes, setOutcomes] = useState<Outcome[]>([]);
    const [running, setRunning] = useState<string | undefined>(undefined);

    const runCase = useCallback(
        async (actionCase: ActionCase) => {
            setRunning(actionCase.label);
            const stub = createMxStub(mxOptions);
            const uninstall = stub.install();
            let outcome: Outcome;
            try {
                const value = await actionCase.run();
                outcome = {
                    label: actionCase.label,
                    state: "ok",
                    detail: describeResult(value),
                    mxCalls: [],
                    // A case that was supposed to reject and did not is the interesting failure.
                    expected: !actionCase.expectReject
                };
            } catch (error: unknown) {
                outcome = {
                    label: actionCase.label,
                    state: "error",
                    detail: error instanceof Error ? error.message : String(error),
                    mxCalls: [],
                    expected: Boolean(actionCase.expectReject)
                };
            } finally {
                uninstall();
            }
            // Read the calls after uninstalling: the action may still have been running when it
            // recorded them, and the array is shared with the stub.
            outcome.mxCalls = stub.calls.map(call => `mx.${call.method}`);
            setRunning(undefined);
            setOutcomes(previous => [outcome, ...previous].slice(0, 12));
        },
        [mxOptions]
    );

    return (
        <ScrollView style={styles.host} contentContainerStyle={styles.hostContent}>
            {description ? <Text style={styles.description}>{description}</Text> : null}

            {cases.map(actionCase => (
                <View key={actionCase.label} style={styles.caseRow}>
                    <TouchableOpacity
                        style={[styles.button, running === actionCase.label && styles.buttonRunning]}
                        disabled={running !== undefined}
                        onPress={() => runCase(actionCase)}
                    >
                        <Text style={styles.buttonText}>{actionCase.label}</Text>
                        {running === actionCase.label ? <ActivityIndicator color="#fff" size="small" /> : null}
                    </TouchableOpacity>
                    {actionCase.note ? <Text style={styles.note}>{actionCase.note}</Text> : null}
                </View>
            ))}

            <View style={styles.logHeaderRow}>
                <Text style={styles.logHeader}>Results (newest first)</Text>
                {outcomes.length > 0 ? (
                    <TouchableOpacity onPress={() => setOutcomes([])}>
                        <Text style={styles.clear}>clear</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {outcomes.length === 0 ? (
                <Text style={styles.empty}>Tap an action above to run it.</Text>
            ) : (
                outcomes.map((outcome, index) => (
                    <View
                        // Outcomes are append-only and the newest is first, so index is stable
                        // enough here and two runs of one action would otherwise collide on label.
                        key={`${outcome.label}-${index}`}
                        style={[styles.outcome, outcome.expected ? styles.outcomeExpected : styles.outcomeUnexpected]}
                    >
                        <Text style={styles.outcomeLabel}>
                            {outcome.state === "ok" ? "resolved" : "rejected"} · {outcome.label}
                            {outcome.expected ? "" : " · UNEXPECTED"}
                        </Text>
                        <Text style={styles.outcomeDetail}>{outcome.detail}</Text>
                        {outcome.mxCalls.length > 0 ? (
                            <Text style={styles.outcomeCalls}>{outcome.mxCalls.join(" → ")}</Text>
                        ) : null}
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    host: { flex: 1, backgroundColor: "#fff" },
    hostContent: { padding: 12, paddingBottom: 32 },
    description: { fontSize: 13, color: "#333", marginBottom: 12, lineHeight: 18 },
    caseRow: { marginBottom: 10 },
    button: {
        backgroundColor: "#0275d8",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    buttonRunning: { backgroundColor: "#025aa5" },
    buttonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
    note: { fontSize: 11, color: "#666", marginTop: 4, lineHeight: 15 },
    logHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 18,
        marginBottom: 6
    },
    logHeader: { fontSize: 13, fontWeight: "bold", color: "#222" },
    clear: { fontSize: 12, color: "#0275d8" },
    empty: { fontSize: 12, color: "#888", fontStyle: "italic" },
    outcome: { padding: 8, borderRadius: 4, marginBottom: 6, borderLeftWidth: 3 },
    outcomeExpected: { backgroundColor: "#f1f5f9", borderLeftColor: "#5cb85c" },
    outcomeUnexpected: { backgroundColor: "#fdf2f2", borderLeftColor: "#d9534f" },
    outcomeLabel: { fontSize: 12, fontWeight: "bold", color: "#222" },
    outcomeDetail: { fontSize: 12, color: "#333", marginTop: 2 },
    outcomeCalls: { fontSize: 11, color: "#555", marginTop: 4, fontStyle: "italic" }
});
