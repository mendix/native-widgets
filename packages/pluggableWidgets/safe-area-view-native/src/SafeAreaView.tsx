import { createElement } from "react";
import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { SafeAreaViewStyle, defaultSafeAreaViewStyle } from "./ui/Styles";
import { SafeAreaViewProps } from "../typings/SafeAreaViewProps";
import { SafeAreaView as SafeAreaViewComponent } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { View } from "react-native";

export function useSafeBottomTabBarHeight(): number {
    try {
        const height = useBottomTabBarHeight();
        return height;
    } catch (e) {
        return 0;
    }
}

export const SafeAreaView = (props: SafeAreaViewProps<SafeAreaViewStyle>): JSX.Element => {
    const styles = flattenStyles(defaultSafeAreaViewStyle, props.style);
    const tabBarHeight = useSafeBottomTabBarHeight();

    const isBottomBarActive = tabBarHeight > 0;
    return (
        <SafeAreaViewComponent
            edges={isBottomBarActive ? ["top", "left", "right"] : undefined}
            style={{ flex: 1, ...{ backgroundColor: styles.container.backgroundColor } }}
            pointerEvents={"box-none"}
            testID={props.name}
        >
            <View style={styles.container} pointerEvents={"box-none"}>
                {props.content}
            </View>
        </SafeAreaViewComponent>
    );
};
