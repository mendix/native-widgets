import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { Icon } from "mendix/components/native/Icon";
import { ReactElement, useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Text, ViewStyle, Animated } from "react-native";

import { FloatingActionButtonProps } from "../typings/FloatingActionButtonProps";
import { defaultFloatingActionButtonStyle, FloatingActionButtonStyle } from "./ui/styles";
import { executeAction } from "@mendix/piw-utils-internal";

const defaultIconSource = { type: "glyph", iconClass: "glyphicon-plus" } as const;
const defaultActiveIconSource = { type: "glyph", iconClass: "glyphicon-remove" } as const;

export function FloatingActionButton(props: FloatingActionButtonProps<FloatingActionButtonStyle>): ReactElement {
    const [isOpen, setIsOpen] = useState(false);

    const styles = flattenStyles(defaultFloatingActionButtonStyle, props.style);
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animation, {
            toValue: isOpen ? 1 : 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true
        }).start();
    }, [isOpen, animation]);

    const iconRotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"]
    });

    const handlePress = (): void => {
        if (props.secondaryButtons?.length > 0) {
            setIsOpen(!isOpen);
        } else {
            executeAction(props.onClick);
        }
    };

    const margin = (styles.container.margin as number) ?? 30;
    const mainButtonSize = styles.button.size ?? 54;
    const secondaryButtonSize = styles.secondaryButton.size ?? 40;

    const isVerticalUp = props.verticalPosition === "bottom";
    const verticalDirection = isVerticalUp ? -1 : 1;
    const secondaryButtonGap = 20;
    const mainToFirstButtonGap = secondaryButtonGap;
    const firstButtonOffset = mainButtonSize / 2 + secondaryButtonSize / 2 + mainToFirstButtonGap;
    const buttonSpacing = secondaryButtonSize + secondaryButtonGap;

    const labelOnRight = props.horizontalPosition === "left";
    const captionSpacing = (styles.secondaryButtonCaptionContainer.marginHorizontal as number) ?? 15;

    // Horizontal positioning using edge-relative styles instead of pixel offsets
    const getHorizontalPosition = (buttonSize: number): ViewStyle => {
        const centerAlignmentOffset = (mainButtonSize - buttonSize) / 2;

        switch (props.horizontalPosition) {
            case "left":
                return { left: margin + centerAlignmentOffset };
            case "right":
                return { right: margin + centerAlignmentOffset };
            case "center":
            default:
                return { left: "50%", marginLeft: -buttonSize / 2 };
        }
    };

    const mainButtonHorizontal = getHorizontalPosition(mainButtonSize);
    const secondaryButtonHorizontal = getHorizontalPosition(secondaryButtonSize);
    const secondaryCenterAlignmentOffset = (mainButtonSize - secondaryButtonSize) / 2;

    const getLabelHorizontalPosition = (): ViewStyle => {
        switch (props.horizontalPosition) {
            case "left":
                return { left: margin + secondaryCenterAlignmentOffset + secondaryButtonSize + captionSpacing };
            case "right":
                return { right: margin + secondaryCenterAlignmentOffset + secondaryButtonSize + captionSpacing };
            case "center":
            default:
                return labelOnRight
                    ? { left: "50%", marginLeft: secondaryButtonSize / 2 + captionSpacing }
                    : { right: "50%", marginRight: secondaryButtonSize / 2 + captionSpacing };
        }
    };

    const secondaryLabelHorizontal = getLabelHorizontalPosition();

    const containerStyle: ViewStyle = {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        direction: "ltr",
        zIndex: 999,
        pointerEvents: "box-none"
    };

    const mainButtonTop = props.verticalPosition === "top" ? margin : undefined;
    const mainButtonBottom = props.verticalPosition === "bottom" ? margin : undefined;

    const currentIcon = (() => {
        const shouldShowActive = isOpen && props.secondaryButtons.length > 0;
        return shouldShowActive
            ? props.iconActive?.value || defaultActiveIconSource
            : props.icon?.value || defaultIconSource;
    })();

    return (
        <View style={containerStyle}>
            {/* Secondary buttons */}
            {props.secondaryButtons?.map((button, index) => {
                const yOffset = verticalDirection * (firstButtonOffset + index * buttonSpacing);
                const staggerDelay = Math.min(index * 0.08, 0.4);

                const opacity = animation.interpolate({
                    inputRange: [0, staggerDelay, Math.min(staggerDelay + 0.2, 1)],
                    outputRange: [0, 0, 1],
                    extrapolate: "clamp"
                });

                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, yOffset]
                });

                const buttonTop = props.verticalPosition === "top" ? margin : undefined;
                const buttonBottom = props.verticalPosition === "bottom" ? margin : undefined;

                return (
                    <View key={`button${index}`} pointerEvents="box-none">
                        {/* Button */}
                        <Animated.View
                            style={[
                                {
                                    position: "absolute",
                                    opacity,
                                    transform: [{ translateY }],
                                    top: buttonTop,
                                    bottom: buttonBottom,
                                    width: secondaryButtonSize,
                                    height: secondaryButtonSize
                                },
                                secondaryButtonHorizontal
                            ]}
                        >
                            <TouchableOpacity
                                testID={`${props.name}$button${index}`}
                                accessibilityRole="button"
                                accessibilityLabel={button.caption?.value}
                                style={[
                                    styles.secondaryButton,
                                    {
                                        width: secondaryButtonSize,
                                        height: secondaryButtonSize,
                                        borderRadius: secondaryButtonSize / 2,
                                        justifyContent: "center",
                                        alignItems: "center"
                                    }
                                ]}
                                onPress={() => {
                                    setIsOpen(false);
                                    executeAction(button.onClick);
                                }}
                                activeOpacity={0.2}
                            >
                                {button.icon.value && (
                                    <Icon
                                        icon={button.icon.value}
                                        size={styles.secondaryButtonIcon.size}
                                        color={styles.secondaryButtonIcon.color}
                                    />
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Label */}
                        {button.caption?.value && (
                            <Animated.View
                                style={[
                                    styles.secondaryButtonCaptionContainer,
                                    {
                                        position: "absolute",
                                        opacity,
                                        transform: [{ translateY }],
                                        top: buttonTop,
                                        bottom: buttonBottom,
                                        height: secondaryButtonSize,
                                        justifyContent: "center",
                                        alignItems: labelOnRight ? "flex-start" : "flex-end"
                                    },
                                    secondaryLabelHorizontal
                                ]}
                            >
                                <Text numberOfLines={1} style={styles.secondaryButtonCaption}>
                                    {button.caption.value}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                );
            })}

            {/* Main FAB button */}
            <View
                style={[
                    {
                        position: "absolute",
                        top: mainButtonTop,
                        bottom: mainButtonBottom,
                        width: mainButtonSize,
                        height: mainButtonSize
                    },
                    mainButtonHorizontal
                ]}
            >
                <TouchableOpacity
                    testID={props.name}
                    accessibilityRole="button"
                    accessibilityLabel="Floating action button"
                    accessibilityState={{ expanded: isOpen }}
                    onPress={handlePress}
                    activeOpacity={0.2}
                    style={[
                        styles.button,
                        styles.buttonContainer,
                        {
                            width: mainButtonSize,
                            height: mainButtonSize,
                            borderRadius: mainButtonSize / 2
                        }
                    ]}
                >
                    <Animated.View
                        testID={`${props.name}$IconView`}
                        style={[styles.buttonIconContainer, { transform: [{ rotate: iconRotation }] }]}
                    >
                        <Icon icon={currentIcon} size={styles.buttonIcon.size} color={styles.buttonIcon.color} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
