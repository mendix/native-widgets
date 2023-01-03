import { createElement, ReactElement } from "react";
import { ActivityIndicator as RNActivityIndicator, View } from "react-native";

import { flattenStyles } from "@mendix/piw-native-utils-internal";

import { ActivityIndicatorProps } from "../typings/ActivityIndicatorProps";
import { ActivityIndicatorStyle, defaultActivityStyle } from "./ui/Styles";

export type Props = ActivityIndicatorProps<ActivityIndicatorStyle>;

export function ActivityIndicator(props: Props): ReactElement {
    const styles = flattenStyles(defaultActivityStyle, props.style);

    return (
        <View style={styles.container}>
            <RNActivityIndicator
                accessible={props.accessible === "yes"}
                accessibilityLabel={props.screenReaderCaption?.value}
                accessibilityHint={props.screenReaderHint?.value}
                accessibilityState={{ busy: true }}
                testID={props.name}
                size={styles.indicator.size}
                color={styles.indicator.color}
            />
        </View>
    );
}
