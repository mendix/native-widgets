/**
 * The frame the widget stories render inside.
 *
 * Most native widgets stretch to fill whatever contains them, and Storybook's canvas has no padding
 * of its own, so an unwrapped widget sits edge-to-edge with nothing to tell where it starts. This
 * gives it a labelled, padded surface — and takes its background and spacing from Atlas, so the
 * frame matches the theme the widget is styled with rather than competing with it.
 */
import type { ReactNode, ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { variables } from "./atlasStyles";

const { background, contrast, font, spacing } = variables;

interface StoryFrameProps {
    children: ReactNode;
    /** What the widget below is showing, when the story is one of several in a row. */
    label?: string;
    /** Off for widgets that need the full height — a map, a scanner, anything with its own scroll. */
    scroll?: boolean;
    /** Centre a small widget instead of letting it sit at the top edge. */
    center?: boolean;
}

export function StoryFrame({ children, label, scroll = true, center = false }: StoryFrameProps): ReactElement {
    const body = (
        <>
            {label !== undefined && <Text style={styles.label}>{label}</Text>}
            {children}
        </>
    );

    if (!scroll) {
        return <View style={[styles.host, center && styles.centered]}>{body}</View>;
    }

    return (
        <ScrollView style={styles.host} contentContainerStyle={[styles.content, center && styles.centered]}>
            {body}
        </ScrollView>
    );
}

/** Two or more variants of the same widget stacked, each under its own caption. */
export function StoryRows({ children }: { children: ReactNode }): ReactElement {
    return <View style={styles.rows}>{children}</View>;
}

/** One captioned cell of a `StoryRows` stack. */
export function StoryRow({ label, children }: { label: string; children: ReactNode }): ReactElement {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    host: { flex: 1, backgroundColor: background.primary },
    content: { padding: spacing.regular, flexGrow: 1 },
    centered: { justifyContent: "center", alignItems: "center" },
    rows: { alignSelf: "stretch" },
    row: { marginBottom: spacing.large, alignSelf: "stretch" },
    label: {
        color: contrast.high,
        fontFamily: font.family,
        fontSize: font.sizeSmall,
        fontWeight: "bold",
        marginBottom: spacing.smallest
    }
});
