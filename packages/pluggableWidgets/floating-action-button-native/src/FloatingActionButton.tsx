import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { executeAction } from "@mendix/piw-utils-internal";
import { Icon } from "mendix/components/native/Icon";
import { JSX, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View, ViewStyle } from "react-native";

import {
    FloatingActionButtonProps,
    HorizontalPositionEnum,
    VerticalPositionEnum
} from "../typings/FloatingActionButtonProps";
import { defaultFloatingActionButtonStyle, FloatingActionButtonStyle, styles } from "./ui/styles";

const defaultIconSource = { type: "glyph", iconClass: "glyphicon-plus" } as const;
const defaultActiveIconSource = { type: "glyph", iconClass: "glyphicon-remove" } as const;
const SECONDARY_GAP = 16;

interface AnimatedMainIconProps {
    active: boolean;
    hasSecondaryButtons: boolean;
    style: FloatingActionButtonStyle;
    icon: FloatingActionButtonProps<FloatingActionButtonStyle>["icon"];
    iconActive: FloatingActionButtonProps<FloatingActionButtonStyle>["iconActive"];
}

interface SecondaryActionItemProps {
    active: boolean;
    index: number;
    direction: "up" | "down";
    horizontalPosition: "left" | "right" | "center";
    name: string;
    button: FloatingActionButtonProps<FloatingActionButtonStyle>["secondaryButtons"][number];
    style: FloatingActionButtonStyle;
    mainButtonSize: number;
    secondaryButtonSize: number;
    onPress: () => void;
}

function getVerticalOrientation(verticalPosition: VerticalPositionEnum): "up" | "down" {
    switch (verticalPosition) {
        case "bottom":
            return "up";
        case "top":
        default:
            return "down";
    }
}

function getPositionStyle(
    verticalPosition: VerticalPositionEnum,
    horizontalPosition: HorizontalPositionEnum
): ViewStyle {
    const positionStyle: ViewStyle = {
        position: "absolute",
        left: 0,
        right: 0,
        zIndex: 999
    };

    switch (verticalPosition) {
        case "bottom":
            positionStyle.bottom = 0;
            break;
        case "top":
        default:
            positionStyle.top = 0;
            break;
    }

    switch (horizontalPosition) {
        case "left":
            positionStyle.alignItems = "flex-start";
            break;
        case "center":
            positionStyle.alignItems = "center";
            break;
        case "right":
        default:
            positionStyle.alignItems = "flex-end";
            break;
    }

    return positionStyle;
}

function AnimatedMainIcon(props: AnimatedMainIconProps): JSX.Element {
    const { active, hasSecondaryButtons, style, icon, iconActive } = props;

    const progress = useRef(new Animated.Value(active && hasSecondaryButtons ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: active && hasSecondaryButtons ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
        }).start();
    }, [active, hasSecondaryButtons, progress]);

    const rotate = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-180deg"]
    });

    const iconSource = icon?.value ? icon.value : defaultIconSource;
    const activeIconSource = iconActive?.value ? iconActive.value : defaultActiveIconSource;
    const source = active && hasSecondaryButtons ? activeIconSource : iconSource;

    return (
        <View testID={"FloatingAction$IconView"} style={[style.button, style.buttonContainer]}>
            <Animated.View style={[style.buttonIconContainer, { transform: [{ rotate }] }]}>
                <Icon icon={source} size={style.buttonIcon.size} color={style.buttonIcon.color} />
            </Animated.View>
        </View>
    );
}

function SecondaryActionItem(props: SecondaryActionItemProps): JSX.Element {
    const {
        active,
        index,
        direction,
        horizontalPosition,
        name,
        button,
        style,
        mainButtonSize,
        secondaryButtonSize,
        onPress
    } = props;

    const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: active ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
        }).start();
    }, [active, progress]);

    const labelOnRight = horizontalPosition === "left" || horizontalPosition === "center";
    const labelOnLeft = horizontalPosition === "right";

    const centerToCenterDistance =
        (mainButtonSize + secondaryButtonSize) / 2 + SECONDARY_GAP + index * (secondaryButtonSize + SECONDARY_GAP);

    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, direction === "up" ? -centerToCenterDistance : centerToCenterDistance]
    });

    const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1]
    });

    const anchorStyle: ViewStyle = {
        left: 0,
        right: 0,
        top: (mainButtonSize - secondaryButtonSize) / 2,
        alignItems: "center"
    };

    return (
        <Animated.View
            pointerEvents={active ? "auto" : "none"}
            style={[
                styles.secondaryAnchor,
                anchorStyle,
                {
                    opacity: progress,
                    transform: [{ translateY }, { scale }]
                }
            ]}
        >
            <View
                style={[
                    styles.secondaryRow,
                    horizontalPosition === "left"
                        ? styles.rowAlignLeft
                        : horizontalPosition === "right"
                        ? styles.rowAlignRight
                        : styles.rowAlignCenter
                ]}
            >
                {labelOnLeft && button.caption?.value ? (
                    <View
                        style={[
                            styles.captionInlineContainer,
                            styles.captionBeforeButton,
                            style.secondaryButtonCaptionContainer
                        ]}
                    >
                        <Text numberOfLines={1} style={[style.secondaryButtonCaption, styles.captionText]}>
                            {button.caption.value}
                        </Text>
                    </View>
                ) : null}

                <Pressable
                    testID={`${name}$button${index}`}
                    onPress={onPress}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={button.caption?.value || `Action button ${index + 1}`}
                    style={({ pressed }) => [
                        styles.secondaryButtonBase,
                        style.secondaryButton,
                        {
                            width: secondaryButtonSize,
                            height: secondaryButtonSize,
                            borderRadius: secondaryButtonSize / 2,
                            opacity: pressed ? 0.2 : 1
                        }
                    ]}
                >
                    {button.icon.value ? (
                        <Icon
                            icon={button.icon.value}
                            size={style.secondaryButtonIcon.size}
                            color={style.secondaryButtonIcon.color}
                        />
                    ) : null}
                </Pressable>

                {labelOnRight && button.caption?.value ? (
                    <View
                        style={[
                            styles.captionInlineContainer,
                            styles.captionAfterButton,
                            style.secondaryButtonCaptionContainer
                        ]}
                    >
                        <Text numberOfLines={1} style={[style.secondaryButtonCaption, styles.captionText]}>
                            {button.caption.value}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Animated.View>
    );
}

export function FloatingActionButton(props: FloatingActionButtonProps<FloatingActionButtonStyle>): JSX.Element {
    const [active, setActive] = useState(false);
    const style = flattenStyles(defaultFloatingActionButtonStyle, props.style);
    const { rippleColor: _, ...buttonStyle } = style.button;

    const mainButtonSize = style.button.size ?? 54;
    const secondaryButtonSize = style.secondaryButton.size ?? 40;
    const horizontalPosition = props.horizontalPosition ?? "right";
    const hasSecondaryButtons = !!props.secondaryButtons?.length;

    const handlePress = (): void => {
        if (props.secondaryButtons?.length) {
            setActive(prev => !prev);
            return;
        }

        executeAction(props.onClick);
    };

    const renderButtons = (
        style: FloatingActionButtonStyle,
        mainButtonSize: number,
        secondaryButtonSize: number,
        horizontalPosition: "left" | "right" | "center"
    ): JSX.Element[] | undefined => {
        return props.secondaryButtons?.map((button, index) => (
            <SecondaryActionItem
                key={`button${index}`}
                active={active}
                index={index}
                direction={getVerticalOrientation(props.verticalPosition)}
                horizontalPosition={horizontalPosition}
                name={props.name}
                button={button}
                style={style}
                mainButtonSize={mainButtonSize}
                secondaryButtonSize={secondaryButtonSize}
                onPress={() => {
                    setActive(false);
                    executeAction(button.onClick);
                }}
            />
        ));
    };

    return (
        <View
            pointerEvents="box-none"
            style={[
                styles.wrapper,
                style.container,
                getPositionStyle(props.verticalPosition, props.horizontalPosition)
            ]}
        >
            {renderButtons(style, mainButtonSize, secondaryButtonSize, horizontalPosition)}

            <Pressable
                testID={props.name}
                onPress={handlePress}
                accessible
                accessibilityRole="button"
                accessibilityLabel={hasSecondaryButtons ? "Floating action menu" : "Floating action button"}
                accessibilityState={{ expanded: hasSecondaryButtons ? active : undefined }}
                accessibilityHint={
                    hasSecondaryButtons
                        ? active
                            ? "Collapse secondary actions"
                            : "Expand to show secondary actions"
                        : undefined
                }
                style={({ pressed }) => [
                    styles.mainButtonBase,
                    buttonStyle,
                    {
                        width: mainButtonSize,
                        height: mainButtonSize,
                        borderRadius: mainButtonSize / 2,
                        opacity: pressed ? 0.2 : 1
                    }
                ]}
            >
                <AnimatedMainIcon
                    active={active}
                    hasSecondaryButtons={hasSecondaryButtons}
                    style={style}
                    icon={props.icon}
                    iconActive={props.iconActive}
                />
            </Pressable>
        </View>
    );
}
