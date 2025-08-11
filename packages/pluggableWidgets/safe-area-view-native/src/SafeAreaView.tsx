import { createElement } from "react";
import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { SafeAreaViewStyle, defaultSafeAreaViewStyle } from "./ui/Styles";
import { SafeAreaViewProps } from "../typings/SafeAreaViewProps";
import { SafeAreaView as SafeAreaViewComponent } from "react-native-safe-area-context";
import { View } from "react-native";

export const SafeAreaView = (props: SafeAreaViewProps<SafeAreaViewStyle>): JSX.Element => {
    const styles = flattenStyles(defaultSafeAreaViewStyle, props.style);

    return (
        <View style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
            <SafeAreaViewComponent style={{ flex: 1 }} pointerEvents={"box-none"} testID={props.name}>
                <View style={styles.container} pointerEvents={"box-none"}>
                    {props.content}
                </View>
            </SafeAreaViewComponent>
        </View>
    );
};
