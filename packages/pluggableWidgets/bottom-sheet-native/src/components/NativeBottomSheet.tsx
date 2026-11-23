import {
    ReactElement,
    ReactNode,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {
    ActionSheetIOS,
    Appearance,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableHighlight,
    StyleProp,
    useWindowDimensions,
    View,
    ViewStyle
} from "react-native";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { SafeAreaInsetsContext, SafeAreaProvider } from "react-native-safe-area-context";
import { EditableValue, ValueStatus } from "mendix";
import { ItemsBasicType } from "../../typings/BottomSheetProps";
import { BottomSheetStyle, ModalItemContainerStyle } from "../ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";

const ITEM_ROW_HEIGHT = 44;
const CONTAINER_PADDING_TOP = 12;
const CONTAINER_PADDING_BOTTOM = 8;
const SCROLL_PADDING_BOTTOM = 16;
const VERTICAL_PADDING = CONTAINER_PADDING_TOP + CONTAINER_PADDING_BOTTOM + SCROLL_PADDING_BOTTOM;

interface NativeBottomSheetProps {
    name: string;
    triggerAttribute?: EditableValue<boolean>;
    itemsBasic: ItemsBasicType[];
    useNative: boolean;
    styles: BottomSheetStyle;
}

export const NativeBottomSheet = (props: NativeBottomSheetProps): ReactElement => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { height: windowHeight } = useWindowDimensions();

    const externalOpen =
        props.triggerAttribute?.status === ValueStatus.Available && props.triggerAttribute.value === true;

    const [mounted, setMounted] = useState(externalOpen);
    const [ready, setReady] = useState(false);
    const didOpenRef = useRef(false);

    if (externalOpen && !mounted) {
        setMounted(true);
    }

    const handleModalShow = useCallback(() => {
        setReady(true);
    }, []);

    useEffect(() => {
        if (props.useNative && Platform.OS === "ios" && externalOpen) {
            const options = props.itemsBasic.map(item => item.caption);
            options.push("Cancel");
            const cancelButtonIndex = options.length - 1;

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    userInterfaceStyle: Appearance.getColorScheme() === "dark" ? "dark" : "light"
                },
                buttonIndex => {
                    if (buttonIndex !== cancelButtonIndex) {
                        executeAction(props.itemsBasic[buttonIndex].action);
                    }
                    if (props.triggerAttribute && !props.triggerAttribute.readOnly) {
                        props.triggerAttribute.setValue(false);
                    }
                }
            );
        }
    }, [externalOpen]);

    const close = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    // Latest trigger value, read by `handleChange` once the sheet has finished opening.
    const externalOpenRef = useRef(externalOpen);
    useEffect(() => {
        externalOpenRef.current = externalOpen;
    }, [externalOpen]);

    useEffect(() => {
        if (!externalOpen && mounted && didOpenRef.current) {
            close();
        }
    }, [externalOpen, mounted, close]);

    const handleChange = useCallback(
        (index: number) => {
            if (index !== 0) {
                return;
            }
            didOpenRef.current = true;
            // Close now if the trigger attribute went false while the sheet was still opening.
            if (!externalOpenRef.current) {
                close();
            }
        },
        [close]
    );

    // Always clean up on close, also when the sheet closed before it finished opening.
    const handleClose = useCallback(() => {
        didOpenRef.current = false;
        setReady(false);
        props.triggerAttribute?.setValue(false);
        setMounted(false);
    }, [props.triggerAttribute]);

    const renderBackdrop = useCallback(
        (backdropProps: BottomSheetBackdropProps) => (
            <Pressable style={{ flex: 1 }} onPress={close}>
                <BottomSheetBackdrop
                    {...backdropProps}
                    pressBehavior="close"
                    opacity={0.3}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            </Pressable>
        ),
        [close]
    );

    const actionHandler = useCallback(
        (index: number) => {
            setTimeout(() => {
                executeAction(props.itemsBasic[index].action);
            }, 500);
            if (props.triggerAttribute && !props.triggerAttribute.readOnly) {
                props.triggerAttribute.setValue(false);
            }
        },
        [props.itemsBasic, props.triggerAttribute]
    );

    const buttonContainerStyle = { ...props.styles.modalItems?.container } as ModalItemContainerStyle;

    const getButtonStyle = (): StyleProp<ViewStyle> => {
        if (props.useNative) {
            return [nativeAndroidStyles.buttonContainer];
        }
        return [styles.buttonContainer, buttonContainerStyle];
    };

    const renderItem = (item: ItemsBasicType, index: number): ReactElement => {
        if (Platform.OS === "android" || !props.useNative) {
            return (
                <TouchableHighlight
                    underlayColor="rgba(0, 0, 0, 0.25)"
                    key={`${props.name}_item_${index}`}
                    onPress={() => actionHandler(index)}
                >
                    <View style={[{ flex: 1, paddingHorizontal: 16 }, getButtonStyle()]}>
                        <Text style={props.styles.modalItems[item.styleClass]}>{item.caption}</Text>
                    </View>
                </TouchableHighlight>
            );
        }
        return (
            <TouchableHighlight
                underlayColor="rgba(0, 0, 0, 0.25)"
                key={`${props.name}_item_${index}`}
                onPress={() => actionHandler(index)}
            >
                <View style={[{ flex: 1, paddingHorizontal: 16 }, getButtonStyle()]}>
                    <Text style={nativeAndroidStyles.text}>{item.caption}</Text>
                </View>
            </TouchableHighlight>
        );
    };

    const getContainerStyle = (): StyleProp<ViewStyle> => {
        if (props.useNative) {
            return [nativeAndroidStyles.sheetContainer];
        }
        return [styles.sheetContainer, props.styles.container];
    };

    if (props.useNative && Platform.OS === "ios") {
        return <View></View>;
    }

    return (
        <Modal
            onRequestClose={close}
            transparent
            animationType="none"
            visible={mounted}
            onShow={handleModalShow}
            supportedOrientations={["portrait", "portrait-upside-down", "landscape-left", "landscape-right"]}
        >
            {/* The modal is its own edge-to-edge window, so it needs insets measured for that window.
                The page's SafeAreaProvider reports the page's insets, which in a Mendix app stop above
                the Android navigation bar and leave the last row underneath it. */}
            <SafeAreaProvider>
                {ready && (
                    <InsetAwareSheet
                        ref={bottomSheetRef}
                        itemCount={props.itemsBasic.length}
                        windowHeight={windowHeight}
                        onChange={handleChange}
                        onClose={handleClose}
                        style={getContainerStyle()}
                        backdropComponent={renderBackdrop}
                        backgroundStyle={props.styles.container}
                    >
                        {props.itemsBasic.map((item, index) => renderItem(item, index))}
                    </InsetAwareSheet>
                )}
            </SafeAreaProvider>
        </Modal>
    );
};

interface InsetAwareSheetProps {
    ref: RefObject<BottomSheet | null>;
    itemCount: number;
    windowHeight: number;
    onChange: (index: number) => void;
    onClose: () => void;
    style: StyleProp<ViewStyle>;
    backdropComponent: (props: BottomSheetBackdropProps) => ReactElement;
    backgroundStyle: StyleProp<ViewStyle>;
    children: ReactNode;
}

/** The sheet itself, rendered under the modal's own SafeAreaProvider so it can read the modal's insets. */
const InsetAwareSheet = ({ ref, children, ...props }: InsetAwareSheetProps): ReactElement => {
    // Falls back to 0 when no inset is known, e.g. under a test renderer.
    const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

    const snapPoints = useMemo(() => {
        const maxHeight = props.windowHeight * 0.9;
        return [Math.min(props.itemCount * ITEM_ROW_HEIGHT + VERTICAL_PADDING + bottomInset, maxHeight)];
    }, [props.itemCount, props.windowHeight, bottomInset]);

    return (
        <BottomSheet
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            animateOnMount
            enablePanDownToClose
            onChange={props.onChange}
            onClose={props.onClose}
            style={props.style}
            backdropComponent={props.backdropComponent}
            backgroundStyle={props.backgroundStyle}
            handleComponent={null}
            handleStyle={{ display: "none" }}
        >
            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM + bottomInset }}>
                {children}
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    sheetContainer: {
        padding: 16
    },
    buttonContainer: {
        paddingVertical: 12,
        textAlign: "center"
    }
});

const nativeAndroidStyles = StyleSheet.create({
    sheetContainer: {
        paddingVertical: 16,
        elevation: 5,
        paddingBottom: 8,
        paddingTop: 12
    },
    buttonContainer: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
        height: 44,
        justifyContent: "center",
        alignContent: "center"
    },
    text: {
        fontSize: 20,
        textAlign: "center",
        color: "#2196F3",
        fontWeight: "500"
    }
});
