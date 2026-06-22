import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActionSheetIOS,
    Appearance,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableHighlight,
    useWindowDimensions,
    View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
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

    const handleChange = useCallback(
        (index: number) => {
            if (index === 0) {
                didOpenRef.current = true;
                return;
            }

            if (index === -1 && didOpenRef.current) {
                didOpenRef.current = false;
                setReady(false);
                props.triggerAttribute?.setValue(false);
                setMounted(false);
            }
        },
        [props.triggerAttribute]
    );

    const renderBackdrop = useCallback(
        (backdropProps: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...backdropProps}
                pressBehavior="close"
                opacity={0.3}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
            />
        ),
        []
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

    const getButtonStyle = () => {
        if (props.useNative) {
            return [nativeAndroidStyles.buttonContainer];
        }
        return [styles.buttonContainer, buttonContainerStyle];
    };

    const renderItem = (item: ItemsBasicType, index: number) => {
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

    const getContainerStyle = () => {
        if (props.useNative) {
            return [nativeAndroidStyles.sheetContainer];
        }
        return [styles.sheetContainer, props.styles.container];
    };

    const snapPoints = useMemo(() => {
        const maxHeight = windowHeight * 0.9;
        return [Math.min(props.itemsBasic.length * ITEM_ROW_HEIGHT + VERTICAL_PADDING, maxHeight)];
    }, [props.itemsBasic.length, windowHeight]);

    if (props.useNative && Platform.OS === "ios") {
        return <View></View>;
    }

    return (
        <Modal onRequestClose={close} transparent animationType="none" visible={mounted} onShow={handleModalShow}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                {ready && (
                    <BottomSheet
                        ref={bottomSheetRef}
                        index={0}
                        snapPoints={snapPoints}
                        animateOnMount
                        enablePanDownToClose
                        onChange={handleChange}
                        onClose={() => handleChange(-1)}
                        style={getContainerStyle()}
                        backdropComponent={renderBackdrop}
                        backgroundStyle={props.styles.container}
                        handleComponent={null}
                        handleStyle={{ display: "none" }}
                    >
                        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM }}>
                            {props.itemsBasic.map((item, index) => renderItem(item, index))}
                        </BottomSheetScrollView>
                    </BottomSheet>
                )}
            </GestureHandlerRootView>
        </Modal>
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
