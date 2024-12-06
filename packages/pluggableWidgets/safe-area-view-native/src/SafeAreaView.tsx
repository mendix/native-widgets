import { createElement } from "react";
import { View } from "react-native";
import { SafeAreaView as ReactSaveAreaView } from "react-native-safe-area-context";
import { flattenStyles } from "@mendix/piw-native-utils-internal";

import { SafeAreaViewStyle, defaultSafeAreaViewStyle } from "./ui/Styles";
import { SafeAreaViewProps } from "../typings/SafeAreaViewProps";

export const SafeAreaView = (props: SafeAreaViewProps<SafeAreaViewStyle>): JSX.Element => {
    const styles = flattenStyles(defaultSafeAreaViewStyle, props.style);

    return (
        <ReactSaveAreaView
            style={{ flex: 1, ...{ backgroundColor: styles.container.backgroundColor } }}
            pointerEvents={"box-none"}
            testID={props.name}
        >
            <View style={styles.container} pointerEvents={"box-none"}>
                {props.content}
            </View>
        </ReactSaveAreaView>
    );
};
