import { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

export interface MxMenuDividerProps {
    color?: string;
    testID?: string;
}

export function MxMenuDivider({ color = "rgba(0, 0, 0, 0.12)", testID }: MxMenuDividerProps): ReactElement {
    return (
        <View
            testID={testID}
            accessibilityRole="none"
            importantForAccessibility="no"
            style={[styles.divider, { borderBottomColor: color }]}
        />
    );
}

const styles = StyleSheet.create({
    divider: {
        flex: 1,
        borderBottomWidth: StyleSheet.hairlineWidth
    }
});
