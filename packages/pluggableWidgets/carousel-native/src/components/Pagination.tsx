import { ReactElement } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

const DOT_SIZE = 7;
const DEFAULT_DOT_COLOR = "rgba(0, 0, 0, 0.75)";
const DEFAULT_INACTIVE_OPACITY = 0.5;
const DEFAULT_INACTIVE_SCALE = 0.5;

interface PaginationProps {
    dotsLength: number;
    activeDotIndex: number;
    containerStyle?: ViewStyle;
    dotContainerStyle?: ViewStyle;
    dotColor?: string;
    dotStyle?: ViewStyle;
    inactiveDotColor?: string;
    inactiveDotOpacity?: number;
    inactiveDotScale?: number;
    inactiveDotStyle?: ViewStyle;
    onDotPress: (index: number) => void;
    testID?: string;
}

/** A row of tappable dots indicating which slide of the carousel is active. */
export function Pagination(props: PaginationProps): ReactElement {
    const {
        dotColor = DEFAULT_DOT_COLOR,
        inactiveDotColor = dotColor,
        inactiveDotOpacity = DEFAULT_INACTIVE_OPACITY,
        inactiveDotScale = DEFAULT_INACTIVE_SCALE
    } = props;

    return (
        <View style={[styles.container, props.containerStyle]} testID={props.testID}>
            {Array.from({ length: props.dotsLength }, (_, index) => {
                const active = index === props.activeDotIndex;
                return (
                    <Pressable
                        key={index}
                        onPress={() => props.onDotPress(index)}
                        style={[styles.dotContainer, props.dotContainerStyle]}
                        accessibilityRole="button"
                        accessibilityLabel={`Go to slide ${index + 1}`}
                        accessibilityState={{ selected: active }}
                    >
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: active ? dotColor : inactiveDotColor },
                                active
                                    ? props.dotStyle
                                    : [
                                          { opacity: inactiveDotOpacity, transform: [{ scale: inactiveDotScale }] },
                                          props.inactiveDotStyle
                                      ]
                            ]}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    dotContainer: {
        alignItems: "center",
        justifyContent: "center"
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2
    }
});
