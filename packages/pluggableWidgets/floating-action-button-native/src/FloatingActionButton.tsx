import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { executeAction } from "@mendix/piw-utils-internal";
import { Icon } from "mendix/components/native/Icon";
import { Component, JSX } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { FloatingActionButtonProps } from "../typings/FloatingActionButtonProps";
import { defaultFloatingActionButtonStyle, FloatingActionButtonStyle } from "./ui/styles";

interface State {
    active: boolean;
}

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

function AnimatedMainIcon(props: AnimatedMainIconProps): JSX.Element {
    const { active, hasSecondaryButtons, style, icon, iconActive } = props;

    const progress = useSharedValue(active && hasSecondaryButtons ? 1 : 0);
    progress.value = withTiming(active && hasSecondaryButtons ? 1 : 0, {
        duration: 200,
        easing: Easing.out(Easing.ease)
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: `${interpolate(progress.value, [0, 1], [0, -180])}deg`
            }
        ]
    }));

    const iconSource = icon?.value ? icon.value : defaultIconSource;
    const activeIconSource = iconActive?.value ? iconActive.value : defaultActiveIconSource;
    const source = active && hasSecondaryButtons ? activeIconSource : iconSource;

    return (
        <View testID={"FloatingAction$IconView"} style={[style.button, style.buttonContainer]}>
            <Animated.View style={[style.buttonIconContainer, animatedStyle]}>
                <Icon icon={source} size={style.buttonIcon.size} color={style.buttonIcon.color} />
            </Animated.View>
        </View>
    );
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

    const progress = useSharedValue(active ? 1 : 0);
    progress.value = withTiming(active ? 1 : 0, {
        duration: 200,
        easing: Easing.out(Easing.ease)
    });

    const labelOnRight = horizontalPosition === "left";
    const labelOnLeft = horizontalPosition === "right";

    const animatedStyle = useAnimatedStyle(() => {
        const centerToCenterDistance =
            (mainButtonSize + secondaryButtonSize) / 2 + SECONDARY_GAP + index * (secondaryButtonSize + SECONDARY_GAP);

        return {
            opacity: progress.value,
            transform: [
                {
                    translateY: interpolate(
                        progress.value,
                        [0, 1],
                        [0, direction === "up" ? -centerToCenterDistance : centerToCenterDistance]
                    )
                },
                { scale: interpolate(progress.value, [0, 1], [0.8, 1]) }
            ]
        };
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
            style={[styles.secondaryAnchor, anchorStyle, animatedStyle]}
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

export class FloatingActionButton extends Component<FloatingActionButtonProps<FloatingActionButtonStyle>, State> {
    readonly state: State = {
        active: false
    };

    private readonly onPressHandler = this.onPress.bind(this);

    render(): JSX.Element {
        const style = flattenStyles(defaultFloatingActionButtonStyle, this.props.style);
        const buttonStyle = { ...style.button };
        delete buttonStyle.rippleColor;

        const mainButtonSize = style.button.size ?? 54;
        const secondaryButtonSize = style.secondaryButton.size ?? 40;
        const horizontalPosition = this.props.horizontalPosition ?? "right";
        const hasSecondaryButtons = !!this.props.secondaryButtons?.length;

        return (
            <View pointerEvents="box-none" style={[styles.wrapper, style.container, this.getPositionStyle()]}>
                {this.renderButtons(style, mainButtonSize, secondaryButtonSize, horizontalPosition)}

                <Pressable
                    testID={this.props.name}
                    onPress={this.onPressHandler}
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
                        active={this.state.active}
                        hasSecondaryButtons={hasSecondaryButtons}
                        style={style}
                        icon={this.props.icon}
                        iconActive={this.props.iconActive}
                    />
                </Pressable>
            </View>
        );
    }

    private renderButtons(
        style: FloatingActionButtonStyle,
        mainButtonSize: number,
        secondaryButtonSize: number,
        horizontalPosition: "left" | "right" | "center"
    ): JSX.Element[] | undefined {
        return this.props.secondaryButtons?.map((button, index) => (
            <SecondaryActionItem
                key={`button${index}`}
                active={this.state.active}
                index={index}
                direction={this.verticalOrientation}
                horizontalPosition={horizontalPosition}
                name={this.props.name}
                button={button}
                style={style}
                mainButtonSize={mainButtonSize}
                secondaryButtonSize={secondaryButtonSize}
                onPress={() => {
                    this.setState({ active: false });
                    executeAction(button.onClick);
                }}
            />
        ));
    }

    private get verticalOrientation(): "up" | "down" {
        switch (this.props.verticalPosition) {
            case "bottom":
                return "up";
            case "top":
                return "down";
            default:
                return "down";
        }
    }

    private getPositionStyle(): ViewStyle {
        const positionStyle: ViewStyle = {
            position: "absolute",
            left: 0,
            right: 0,
            zIndex: 999
        };

        switch (this.props.verticalPosition) {
            case "bottom":
                positionStyle.bottom = 0;
                break;
            case "top":
            default:
                positionStyle.top = 0;
                break;
        }

        switch (this.props.horizontalPosition) {
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

    private onPress(): void {
        if (this.props.secondaryButtons?.length) {
            // eslint-disable-next-line react/no-access-state-in-setstate
            this.setState({ active: !this.state.active });
            return;
        }

        executeAction(this.props.onClick);
    }
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: "flex-end"
    },
    mainButtonBase: {
        alignItems: "center",
        justifyContent: "center"
    },
    secondaryAnchor: {
        position: "absolute"
    },
    secondaryRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center"
    },
    rowAlignLeft: {
        justifyContent: "flex-start"
    },
    rowAlignRight: {
        justifyContent: "flex-end"
    },
    rowAlignCenter: {
        justifyContent: "center"
    },
    secondaryButtonBase: {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    captionInlineContainer: {
        flexShrink: 0
    },
    captionBeforeButton: {
        marginRight: 8,
        alignItems: "flex-end"
    },
    captionAfterButton: {
        marginLeft: 8,
        alignItems: "flex-start"
    },
    captionText: {
        flexShrink: 0
    }
});
