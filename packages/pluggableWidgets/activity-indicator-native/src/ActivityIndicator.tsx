import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { JSX } from "react";
import { ActivityIndicator as RNActivityIndicator, View } from "react-native";

import { ActivityIndicatorProps } from "../typings/ActivityIndicatorProps";
import { ActivityIndicatorStyle, defaultActivityStyle } from "./ui/Styles";

export type Props = ActivityIndicatorProps<ActivityIndicatorStyle>;

export function ActivityIndicator(props: Props): JSX.Element {
    const styles = flattenStyles(defaultActivityStyle, props.style);

    return (
        <View style={styles.container}>
            <RNActivityIndicator testID={props.name} size={styles.indicator.size} color={styles.indicator.color} />
        </View>
    );
}
