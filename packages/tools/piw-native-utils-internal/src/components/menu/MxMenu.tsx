import { ReactElement, ReactNode, RefObject, useCallback, useState } from "react";
import {
    I18nManager,
    LayoutChangeEvent,
    Platform,
    StatusBar,
    StyleProp,
    StyleSheet,
    useWindowDimensions,
    View,
    ViewStyle
} from "react-native";
import { MxOverlay } from "../MxOverlay";
import { computeMenuPosition, MenuPlacement, MenuRect, MenuSize, toStyleLeft } from "./position";

const DEFAULT_ANIMATION_DURATION = 150;
const DEFAULT_RADIUS = 4;
const transparentBackdrop: ViewStyle = { backgroundColor: "transparent" };

export interface MxMenuProps {
    visible: boolean;
    /** Where the trigger is, see useMxMenu */
    anchor: MenuRect | null;
    /** Called for a press outside the menu and for the Android back button */
    onRequestClose: () => void;
    /** "overlap" puts the menu on the trigger like a Material menu, "below" puts it under it like a drop-down */
    placement?: MenuPlacement;
    /** Make the menu as wide as the trigger */
    matchAnchorWidth?: boolean;
    maxHeight?: number;
    /** Styles the menu surface. It has a white background, rounded corners and a shadow unless this changes them */
    style?: StyleProp<ViewStyle>;
    animationDuration?: number;
    /** Receives accessibility focus when the menu has closed, the trigger */
    returnFocusRef?: RefObject<View | null>;
    accessibilityLabel?: string;
    /** On the element that holds the items. The overlay's own elements get "-overlay" as a suffix. */
    testID?: string;
    children?: ReactNode;
}

/**
 * A menu that opens next to its trigger. It is presented through MxOverlay, so it gets the back button,
 * focus handling and modal behaviour of every overlay, and adds the menu role.
 *
 * About the double modal on iOS: the drop-down in the client re-created the library's menu with a new `key`
 * every time it had hidden, because the modal could otherwise show twice on iOS. That is kept: once the overlay
 * has completely closed (its modal is gone) it is remounted, so every opening starts from a fresh overlay and
 * there is never more than one modal.
 */
export function MxMenu(props: MxMenuProps): ReactElement {
    const {
        visible,
        anchor,
        onRequestClose,
        placement = "overlap",
        matchAnchorWidth = false,
        maxHeight,
        style,
        animationDuration = DEFAULT_ANIMATION_DURATION,
        returnFocusRef,
        accessibilityLabel,
        testID,
        children
    } = props;

    const { width, height } = useWindowDimensions();
    // The modal starts below the status bar (see statusBarTranslucent below), so that part of the window is not
    // available to the menu. react-native-material-menu took it off the window height in the same way.
    const window = { width, height: height - (StatusBar.currentHeight ?? 0) };
    const [size, setSize] = useState<MenuSize | null>(null);
    const [instance, setInstance] = useState(0);

    const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        setSize(previous =>
            previous && previous.width === layout.width && previous.height === layout.height
                ? previous
                : { width: layout.width, height: layout.height }
        );
    }, []);

    const handleClosed = useCallback(() => {
        setSize(null);
        setInstance(count => count + 1);
    }, []);

    const rtl = I18nManager.isRTL;
    const position = anchor && size ? computeMenuPosition({ anchor, menu: size, window, rtl, placement }) : null;
    const swapsInRtl = rtl && I18nManager.doLeftAndRightSwapInRTL;

    const surfaceStyle = StyleSheet.flatten<ViewStyle>([styles.surface, style]);

    return (
        <MxOverlay
            key={instance}
            visible={visible}
            onRequestClose={onRequestClose}
            onClosed={handleClosed}
            placement="positioned"
            position={
                position && size
                    ? { top: position.y, left: toStyleLeft(position.x, size.width, window.width, swapsInRtl) }
                    : { top: 0, left: 0 }
            }
            backdropStyle={transparentBackdrop}
            respectSafeArea={false}
            // The anchor is measured with measureInWindow, which counts from below the status bar on Android. A
            // translucent modal counts from the very top of the screen, which puts the menu a status bar too high.
            statusBarTranslucent={false}
            animationDuration={animationDuration}
            returnFocusRef={returnFocusRef}
            testID={testID ? `${testID}-overlay` : undefined}
        >
            <View
                onLayout={handleLayout}
                style={[
                    surfaceStyle,
                    matchAnchorWidth && anchor ? { width: anchor.width } : undefined,
                    maxHeight !== undefined ? { maxHeight } : undefined,
                    // Invisible until it has been measured, so it does not flash in the wrong place
                    position ? undefined : styles.measuring
                ]}
            >
                <View
                    testID={testID}
                    accessibilityRole="menu"
                    accessibilityLabel={accessibilityLabel}
                    style={[styles.clip, { borderRadius: surfaceStyle.borderRadius ?? DEFAULT_RADIUS }]}
                >
                    {children}
                </View>
            </View>
        </MxOverlay>
    );
}

const styles = StyleSheet.create({
    surface: {
        backgroundColor: "white",
        borderRadius: DEFAULT_RADIUS,
        ...Platform.select<ViewStyle>({
            ios: {
                shadowColor: "black",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.14,
                shadowRadius: 2
            },
            default: { elevation: 8 }
        })
    },
    // Lets the items shrink to the menu's maximum height, so a list inside can scroll
    clip: {
        overflow: "hidden",
        flexShrink: 1
    },
    measuring: {
        opacity: 0
    }
});
