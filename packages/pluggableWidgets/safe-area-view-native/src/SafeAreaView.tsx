import { createElement } from "react";
import { View } from "react-native";
import { flattenStyles } from "@mendix/piw-native-utils-internal";

import { SafeAreaViewStyle, defaultSafeAreaViewStyle } from "./ui/Styles";
import { SafeAreaViewProps } from "../typings/SafeAreaViewProps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SafeAreaView = (props: SafeAreaViewProps<SafeAreaViewStyle>): JSX.Element => {
    const styles = flattenStyles(defaultSafeAreaViewStyle, props.style);
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                flex: 1,
                ...{
                    backgroundColor: styles.container.backgroundColor,
                    marginTop: insets.top,
                    marginBottom: insets.bottom,
                    marginLeft: insets.left,
                    marginRight: insets.right
                }
            }}
            pointerEvents={"box-none"}
            testID={props.name}
        >
            <View style={styles.container} pointerEvents={"box-none"}>
                {props.content}
            </View>
        </View>
    );
};
