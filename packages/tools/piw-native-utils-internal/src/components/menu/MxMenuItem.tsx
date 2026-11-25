import { ReactElement, ReactNode } from "react";
import {
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextProps,
    TextStyle,
    TouchableNativeFeedback,
    View,
    ViewStyle
} from "react-native";

const DEFAULT_RIPPLE_COLOR = "rgba(0, 0, 0, 0.2)";
const DEFAULT_ACTIVE_OPACITY = 0.2;
const DEFAULT_DISABLED_TEXT_COLOR = "#bdbdbd";

export interface MxMenuItemProps {
    /** Text is wrapped in a single line label; any other content is rendered as is */
    children?: ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    /** Marks the item as the chosen one for screen readers, as in a drop-down */
    selected?: boolean;
    /** Android: the colour of the press ripple */
    rippleColor?: string;
    /** iOS: the background shown while the item is pressed */
    underlayColor?: string;
    /** iOS: how transparent the item gets while pressed */
    activeOpacity?: number;
    ellipsizeMode?: TextProps["ellipsizeMode"];
    textStyle?: StyleProp<TextStyle>;
    disabledTextColor?: string;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
    testID?: string;
}

/**
 * fontSize: 0 crashes React Native's new architecture, so it is turned into a hidden text instead.
 * https://github.com/facebook/react-native/blob/0d3a7ca52faea4dbe0dac5b9894b4f8bb5f380b3/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/TextAttributeProps.java#L400
 */
function withoutZeroFontSize(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
    const flat = StyleSheet.flatten(style);
    if (flat && flat.fontSize === 0) {
        const rest = { ...flat };
        delete rest.fontSize;
        return { ...rest, display: "none" };
    }
    return style;
}

export function MxMenuItem(props: MxMenuItemProps): ReactElement {
    const {
        children,
        onPress,
        disabled = false,
        selected,
        rippleColor,
        underlayColor,
        activeOpacity,
        ellipsizeMode,
        textStyle,
        disabledTextColor = DEFAULT_DISABLED_TEXT_COLOR,
        style,
        accessibilityLabel,
        testID
    } = props;

    const content =
        typeof children === "string" || typeof children === "number" ? (
            <Text
                ellipsizeMode={ellipsizeMode ?? (Platform.OS === "ios" ? "clip" : "tail")}
                numberOfLines={1}
                style={withoutZeroFontSize([
                    styles.text,
                    disabled ? { color: disabledTextColor } : undefined,
                    textStyle
                ])}
            >
                {children}
            </Text>
        ) : (
            children
        );

    const accessibility = {
        accessibilityRole: "menuitem" as const,
        accessibilityLabel,
        accessibilityState: { disabled, selected },
        testID
    };

    if (Platform.OS === "android") {
        return (
            <Pressable
                {...accessibility}
                onPress={onPress}
                disabled={disabled}
                android_ripple={{
                    color: rippleColor ?? DEFAULT_RIPPLE_COLOR,
                    borderless: false,
                    foreground: TouchableNativeFeedback.canUseNativeForeground()
                }}
            >
                <View style={[styles.container, style]}>{content}</View>
            </Pressable>
        );
    }

    // iOS has no ripple: show the underlay colour and dim the item while it is pressed
    return (
        <Pressable
            {...accessibility}
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) =>
                pressed
                    ? {
                          ...(underlayColor !== undefined && { backgroundColor: underlayColor }),
                          opacity: activeOpacity ?? DEFAULT_ACTIVE_OPACITY
                      }
                    : undefined
            }
        >
            <View style={[styles.container, style]}>{content}</View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: 48,
        minWidth: 124,
        justifyContent: "center"
    },
    text: {
        fontSize: 14,
        fontWeight: "400",
        paddingHorizontal: 16,
        textAlign: "left"
    }
});
