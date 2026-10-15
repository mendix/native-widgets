import {
    Component,
    ReactElement,
    ReactNode,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import {
    AccessibilityInfo,
    Animated,
    findNodeHandle,
    Modal,
    ModalProps,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

export type MxOverlayPlacement = "center" | "bottom" | "fullscreen" | "positioned";

export interface MxOverlayProps {
    visible: boolean;
    /** Called when the overlay asks to be dismissed (Android back press, backdrop press). */
    onRequestClose?: () => void;
    /** When false, Android back is swallowed and nothing is dismissed. Defaults to true. */
    dismissOnBackPress?: boolean;
    /** When false, pressing the backdrop does nothing. Defaults to true. */
    dismissOnBackdropPress?: boolean;
    placement?: MxOverlayPlacement;
    /** Offset of the content from the top-left corner, used with placement "positioned". */
    position?: { top: number; left: number };
    backdropStyle?: StyleProp<ViewStyle>;
    /** Element that receives accessibility focus when the overlay opens. Defaults to the overlay content. */
    initialFocusRef?: RefObject<Component | null>;
    /** Element that receives accessibility focus once the overlay has closed, typically the trigger. */
    returnFocusRef?: RefObject<Component | null>;
    /** Enter/exit duration in ms. 0 disables the animation. Defaults to 200. */
    animationDuration?: number;
    /** Render a transparent modal so what is behind shows through. When false the platform provides an opaque background. Defaults to true. */
    transparent?: boolean;
    /** Orientations the overlay may rotate to (iOS only). Defaults to all four, so the device orientation is kept. */
    supportedOrientations?: ModalProps["supportedOrientations"];
    /** Draw the overlay under the Android status bar. Defaults to true. */
    statusBarTranslucent?: boolean;
    /** Pad the content by the safe-area insets. Defaults to true. */
    respectSafeArea?: boolean;
    testID?: string;
    children?: ReactNode;
}

const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_ANIMATION_DURATION = 200;
// iOS Modal defaults to portrait only, so list every orientation to keep the device orientation while it is open
const ALL_ORIENTATIONS: ModalProps["supportedOrientations"] = [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right"
];
const SLIDE_DISTANCE: Record<MxOverlayPlacement, number> = {
    center: 16,
    positioned: 16,
    bottom: 64,
    fullscreen: 0
};

function moveFocusTo(ref?: RefObject<Component | null>): void {
    const node = ref?.current ? findNodeHandle(ref.current) : null;
    if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
    }
}

export function MxOverlay(props: MxOverlayProps): ReactElement | null {
    const {
        visible,
        onRequestClose,
        dismissOnBackPress = true,
        dismissOnBackdropPress = true,
        placement = "center",
        position,
        backdropStyle,
        initialFocusRef,
        returnFocusRef,
        animationDuration = DEFAULT_ANIMATION_DURATION,
        respectSafeArea = true,
        transparent = true,
        supportedOrientations = ALL_ORIENTATIONS,
        statusBarTranslucent = true,
        testID,
        children
    } = props;

    const insets = useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
    const [mounted, setMounted] = useState(visible);
    const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
    const contentRef = useRef<View>(null);
    const focusMoved = useRef(false);
    const wasMounted = useRef(mounted);

    // Restore focus in its own effect: it must run after the Modal has actually unmounted, otherwise
    // the still-visible overlay (accessibilityViewIsModal) hides the element that should get focus.
    useEffect(() => {
        if (wasMounted.current && !mounted) {
            moveFocusTo(returnFocusRef);
        }
        wasMounted.current = mounted;
    }, [mounted, returnFocusRef]);

    useEffect(() => {
        if (visible) {
            focusMoved.current = false;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Keeps the modal mounted until the exit animation ends
            setMounted(true);
        }

        const finish = (): void => {
            if (!visible) {
                setMounted(false);
            }
        };

        if (!visible && !mounted) {
            return;
        }
        if (animationDuration <= 0) {
            progress.setValue(visible ? 1 : 0);
            finish();
            return;
        }
        Animated.timing(progress, {
            toValue: visible ? 1 : 0,
            duration: animationDuration,
            useNativeDriver: true
        }).start(({ finished }) => finished && finish());
    }, [visible]);

    // On Android the native Modal consumes the hardware back press and reports it through onRequestClose,
    // so it never reaches BackHandler or navigation. Handling it here covers both dismissing and swallowing.
    const handleBackPress = useCallback((): void => {
        if (dismissOnBackPress) {
            onRequestClose?.();
        }
    }, [dismissOnBackPress, onRequestClose]);

    const handleContentLayout = useCallback((): void => {
        if (!focusMoved.current) {
            focusMoved.current = true;
            moveFocusTo(initialFocusRef ?? contentRef);
        }
    }, [initialFocusRef]);

    if (!visible && !mounted) {
        return null;
    }

    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [SLIDE_DISTANCE[placement], 0]
    });

    // iOS needs accessibilityViewIsModal to hide what is behind the overlay; Android relies on importantForAccessibility.
    const modalSemantics =
        Platform.OS === "ios" ? { accessibilityViewIsModal: true } : { importantForAccessibility: "yes" as const };

    const safeAreaPadding: ViewStyle | undefined = respectSafeArea
        ? { paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom, paddingLeft: insets.left }
        : undefined;

    return (
        <Modal
            visible
            transparent={transparent}
            statusBarTranslucent={statusBarTranslucent}
            supportedOrientations={supportedOrientations}
            animationType="none"
            onRequestClose={handleBackPress}
        >
            <View style={[styles.container, placementStyles[placement], safeAreaPadding]} testID={testID}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={dismissOnBackdropPress ? onRequestClose : undefined}
                    accessible={false}
                    importantForAccessibility="no"
                    testID={testID ? `${testID}-backdrop` : undefined}
                >
                    <Animated.View
                        pointerEvents="none"
                        style={[styles.backdrop, backdropStyle, { opacity: progress }]}
                    />
                </Pressable>
                <Animated.View
                    ref={contentRef}
                    {...modalSemantics}
                    onLayout={handleContentLayout}
                    style={[
                        placement === "fullscreen" ? styles.fullscreenContent : undefined,
                        placement === "positioned" && position
                            ? { position: "absolute", top: position.top, left: position.left }
                            : undefined,
                        { opacity: progress, transform: [{ translateY }] }
                    ]}
                    testID={testID ? `${testID}-content` : undefined}
                >
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)"
    },
    fullscreenContent: {
        flex: 1
    }
});

const placementStyles = StyleSheet.create({
    center: { justifyContent: "center", alignItems: "center" },
    bottom: { justifyContent: "flex-end" },
    fullscreen: {},
    positioned: {}
});
