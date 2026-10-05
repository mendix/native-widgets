import { ReactElement } from "react";
import { Pressable, Text, View, ViewStyle, TextStyle } from "react-native";

export interface SegmentedControlProps {
    values: string[];
    selectedIndex: number;
    enabled: boolean;
    onTabPress: (index: number) => void;
    borderRadius: number;
    buttonStyle: ViewStyle;
    textStyle: TextStyle;
    activeButtonStyle: ViewStyle;
    activeTextStyle: TextStyle;
    testID: string;
}

export function SegmentedControl(props: SegmentedControlProps): ReactElement {
    const {
        values,
        selectedIndex,
        enabled,
        onTabPress,
        borderRadius,
        buttonStyle,
        textStyle,
        activeButtonStyle,
        activeTextStyle,
        testID
    } = props;

    const handlePress = (index: number) => {
        if (!enabled || index === selectedIndex) {
            return;
        }
        onTabPress(index);
    };

    return (
        <View style={{ flexDirection: "row" }} accessible={false} accessibilityRole="tablist">
            {values.map((value, index) => {
                const isSelected = index === selectedIndex;
                const isFirst = index === 0;
                const isLast = index === values.length - 1;

                return (
                    <Pressable
                        key={index}
                        accessible
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={value}
                        onPress={() => handlePress(index)}
                        disabled={!enabled}
                        style={({ pressed }) => [
                            {
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 5,
                                borderWidth: 1,
                                backgroundColor: "transparent",
                                opacity: pressed ? 0.6 : 1,
                                ...(isFirst && {
                                    borderTopLeftRadius: borderRadius,
                                    borderBottomLeftRadius: borderRadius
                                }),
                                ...(isLast && {
                                    borderTopRightRadius: borderRadius,
                                    borderBottomRightRadius: borderRadius
                                }),
                                ...(!isFirst && { marginLeft: -1 })
                            },
                            buttonStyle,
                            isSelected && activeButtonStyle
                        ]}
                        testID={`${testID}$button-${index}`}
                    >
                        <Text numberOfLines={1} style={[textStyle, isSelected && activeTextStyle]}>
                            {value}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
