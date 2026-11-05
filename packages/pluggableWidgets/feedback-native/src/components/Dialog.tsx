import { MxOverlay } from "@mendix/piw-native-utils-internal";
import {
    Children,
    cloneElement,
    createContext,
    isValidElement,
    JSX,
    ReactElement,
    ReactNode,
    Ref,
    RefObject,
    useContext,
    useRef
} from "react";
import {
    KeyboardAvoidingView,
    ModalProps,
    Platform,
    PlatformColor,
    StyleProp,
    StyleSheet,
    Text,
    TextProps,
    TextStyle,
    TouchableOpacity,
    useColorScheme,
    View,
    ViewStyle
} from "react-native";

/**
 * Dialog building blocks that replace react-native-dialog. The markup and the styles follow that library so the
 * widget keeps its look, but the dialog is presented through MxOverlay, which adds the modal accessibility
 * semantics, focus handling and Android back handling.
 */

const iOS = Platform.OS === "ios";
const BACKDROP_OPACITY = 0.3;
const ANIMATION_DURATION = 300;
const BUTTON_COLOR = iOS ? "#007ff9" : "#169689";
const backdropStyle: ViewStyle = { backgroundColor: `rgba(0, 0, 0, ${BACKDROP_OPACITY})` };

function useDialogStyles<T extends StyleSheet.NamedStyles<T>>(build: (isDark: boolean) => T): T {
    return build(useColorScheme() === "dark");
}

/* Title */

export interface DialogTitleProps extends TextProps {
    ref?: Ref<Text>;
}

/** Lets the container hand the title the ref that receives accessibility focus when the dialog opens */
const TitleFocusContext = createContext<RefObject<Text | null> | null>(null);

export function DialogTitle({ style, children, ref, ...rest }: DialogTitleProps): JSX.Element {
    const styles = useDialogStyles(buildTitleStyles);
    const focusRef = useContext(TitleFocusContext);
    return (
        <Text ref={ref ?? focusRef} accessibilityRole="header" style={[styles.text, style]} {...rest}>
            {children}
        </Text>
    );
}
DialogTitle.displayName = "DialogTitle";

const buildTitleStyles = (isDark: boolean): { text: TextStyle } =>
    StyleSheet.create({
        text: Platform.select<TextStyle>({
            ios: { color: PlatformColor("label"), textAlign: "center", fontSize: 18, fontWeight: "600" },
            android: {
                color: PlatformColor(`@android:color/${isDark ? "primary_text_dark" : "primary_text_light"}`),
                fontWeight: "500",
                fontSize: 18
            },
            default: {}
        }) as TextStyle
    });

/* Description */

export function DialogDescription({ style, children, ...rest }: TextProps): JSX.Element {
    const styles = useDialogStyles(buildDescriptionStyles);
    return (
        <Text style={[styles.text, style]} {...rest}>
            {children}
        </Text>
    );
}
DialogDescription.displayName = "DialogDescription";

const buildDescriptionStyles = (isDark: boolean): { text: TextStyle } =>
    StyleSheet.create({
        text: Platform.select<TextStyle>({
            ios: { textAlign: "center", color: PlatformColor("label"), fontSize: 13, marginTop: 4 },
            android: {
                color: PlatformColor(`@android:color/${isDark ? "secondary_text_dark" : "secondary_text_light"}`),
                fontSize: 16,
                marginTop: 10
            },
            default: {}
        }) as TextStyle
    });

/* Button */

export interface DialogButtonProps extends TextProps {
    label: string;
    color?: string;
    disabled?: boolean;
    bold?: boolean;
    onPress?: () => void;
}

export function DialogButton({
    label,
    color = BUTTON_COLOR,
    disabled = false,
    bold,
    onPress,
    style,
    ...rest
}: DialogButtonProps): JSX.Element {
    const styles = useDialogStyles(buildButtonStyles);
    // Like react-native-dialog, the remaining props (e.g. testID) land on the label, so e2e selectors keep working
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            <Text style={[styles.text, { color, fontWeight: bold ? "600" : "normal" }, style]} {...rest}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}
DialogButton.displayName = "DialogButton";

const buildButtonStyles = (): { button: ViewStyle; text: TextStyle } =>
    StyleSheet.create({
        button: Platform.select<ViewStyle>({
            ios: { flexGrow: 1, flexShrink: 1, height: 46, justifyContent: "center", alignItems: "center" },
            default: { justifyContent: "center", alignItems: "center" }
        }) as ViewStyle,
        text: Platform.select<TextStyle>({
            ios: { textAlign: "center", fontSize: 17, backgroundColor: "transparent" },
            default: {
                textAlign: "center",
                backgroundColor: "transparent",
                padding: 8,
                fontSize: 14,
                textTransform: "uppercase"
            }
        }) as TextStyle
    });

/* Container */

export interface DialogContainerProps {
    visible: boolean;
    children?: ReactNode;
    /** Called for the Android back button; when omitted the back button is swallowed and nothing closes. */
    onRequestClose?: () => void;
    contentStyle?: StyleProp<ViewStyle>;
    footerStyle?: StyleProp<ViewStyle>;
    buttonSeparatorStyle?: StyleProp<ViewStyle>;
    blurStyle?: StyleProp<ViewStyle>;
    keyboardVerticalOffset?: number;
    supportedOrientations?: ModalProps["supportedOrientations"];
    returnFocusRef?: RefObject<View | null>;
    testID?: string;
}

export function DialogContainer(props: DialogContainerProps): JSX.Element {
    const {
        visible,
        children,
        onRequestClose,
        contentStyle,
        footerStyle,
        buttonSeparatorStyle,
        blurStyle,
        keyboardVerticalOffset = 40,
        supportedOrientations,
        returnFocusRef,
        testID
    } = props;
    const styles = useDialogStyles(buildContainerStyles);
    const titleRef = useRef<Text>(null);

    const titles: ReactElement[] = [];
    const descriptions: ReactElement[] = [];
    const buttons: ReactElement[] = [];
    const others: ReactNode[] = [];

    Children.forEach(children, child => {
        if (isValidElement(child) && typeof child.type !== "string") {
            const name = (child.type as { displayName?: string }).displayName;
            if (name === DialogTitle.displayName) {
                titles.push(child);
                return;
            }
            if (name === DialogDescription.displayName) {
                descriptions.push(child);
                return;
            }
            if (name === DialogButton.displayName) {
                if (iOS && buttons.length > 0) {
                    buttons.push(<View style={[styles.buttonSeparatorHorizontal, buttonSeparatorStyle]} />);
                }
                buttons.push(child);
                return;
            }
        }
        others.push(child);
    });

    return (
        <MxOverlay
            visible={visible}
            onRequestClose={onRequestClose}
            dismissOnBackPress={onRequestClose !== undefined}
            dismissOnBackdropPress={false}
            placement="center"
            backdropStyle={backdropStyle}
            animationDuration={ANIMATION_DURATION}
            respectSafeArea={false}
            statusBarTranslucent={false}
            supportedOrientations={supportedOrientations}
            initialFocusRef={titleRef}
            returnFocusRef={returnFocusRef}
            testID={testID}
        >
            <TitleFocusContext.Provider value={titleRef}>
                <KeyboardAvoidingView
                    behavior={iOS ? "padding" : undefined}
                    keyboardVerticalOffset={iOS ? keyboardVerticalOffset : undefined}
                    style={styles.centeredView}
                >
                    <View style={[styles.content, contentStyle]}>
                        {iOS && <View style={[styles.blur, blurStyle]} />}
                        <View style={styles.header}>
                            {titles}
                            {descriptions}
                        </View>
                        {others}
                        {buttons.length > 0 && (
                            <>
                                {iOS && <View style={styles.buttonSeparatorVertical} />}
                                <View style={[styles.footer, footerStyle]}>
                                    {buttons.map((button, index) =>
                                        cloneElement(button, { key: `dialog-button-${index}` })
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </TitleFocusContext.Provider>
        </MxOverlay>
    );
}

const buildContainerStyles = (): Record<string, ViewStyle> =>
    StyleSheet.create({
        centeredView: { marginTop: 22 },
        blur: {
            position: "absolute",
            backgroundColor: PlatformColor("systemGray6"),
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        },
        content: Platform.select<ViewStyle>({
            ios: { width: 270, flexDirection: "column", borderRadius: 13, overflow: "hidden" },
            default: {
                backgroundColor: PlatformColor("?attr/colorBackgroundFloating"),
                flexDirection: "column",
                borderRadius: 3,
                padding: 16,
                margin: 16,
                overflow: "hidden",
                elevation: 4,
                minWidth: 300
            }
        }) as ViewStyle,
        header: Platform.select<ViewStyle>({ ios: { margin: 18 }, default: { margin: 12 } }) as ViewStyle,
        footer: {
            flexDirection: "row",
            ...Platform.select<ViewStyle>({
                ios: { justifyContent: "space-between" },
                default: { alignItems: "center", justifyContent: "flex-end", marginTop: 4 }
            })
        },
        buttonSeparatorHorizontal: {
            height: "100%",
            backgroundColor: PlatformColor("separator"),
            width: StyleSheet.hairlineWidth
        },
        buttonSeparatorVertical: {
            width: "100%",
            backgroundColor: PlatformColor("separator"),
            height: StyleSheet.hairlineWidth
        }
    });

export const Dialog = {
    Container: DialogContainer,
    Title: DialogTitle,
    Description: DialogDescription,
    Button: DialogButton
};
