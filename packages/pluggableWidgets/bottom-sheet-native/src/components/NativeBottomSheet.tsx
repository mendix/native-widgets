import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActionSheetIOS,
    Appearance,
    Dimensions,
    LayoutChangeEvent,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
} from "react-native";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { EditableValue, ValueStatus } from "mendix";
import { ItemsBasicType } from "../../typings/BottomSheetProps";
import { BottomSheetStyle, ModalItemContainerStyle } from "../ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";

interface NativeBottomSheetProps {
    name: string;
    triggerAttribute?: EditableValue<boolean>;
    itemsBasic: ItemsBasicType[];
    useNative: boolean;
    styles: BottomSheetStyle;
}

let lastIndexRef = -1;

export const NativeBottomSheet = (props: NativeBottomSheetProps): ReactElement => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [contentHeight, setContentHeight] = useState(0);

    const isAvailable = props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available;
    const isOpen =
        props.triggerAttribute &&
        props.triggerAttribute.status === ValueStatus.Available &&
        props.triggerAttribute.value;

    const manageBottomSheet = useCallback(() => {
        if (props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available) {
            if (props.triggerAttribute.value) {
                bottomSheetRef.current?.snapToIndex(0);
            } else {
                bottomSheetRef.current?.close();
            }
        }
    }, [props.triggerAttribute]);

    useEffect(() => {
        manageBottomSheet();
    }, [manageBottomSheet]);

    useEffect(() => {
        // Only show the ActionSheet if using native on iOS and the trigger is active.
        if (props.useNative && Platform.OS === "ios" && isOpen) {
            // Create the options from props.itemsBasic captions.
            const options = props.itemsBasic.map(item => item.caption);
            // Append a cancel option.
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
                        // Execute the corresponding action from itemsBasic.
                        executeAction(props.itemsBasic[buttonIndex].action);
                    }
                    // Reset the trigger so the ActionSheet will not show again until triggered.
                    if (props.triggerAttribute && !props.triggerAttribute.readOnly) {
                        props.triggerAttribute.setValue(false);
                    }
                }
            );
        }
    }, [isOpen]);

    const close = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

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

    const onLayoutHandler = useCallback(
        (event: LayoutChangeEvent) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height !== contentHeight) {
                setContentHeight(height);
            }
        },
        [contentHeight]
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

    // Render items with conditional style based on theme and platform.
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

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (!isAvailable) {
                return;
            }
            const hasOpened = lastIndexRef === -1 && index === 0;
            const hasClosed = index === -1;
            lastIndexRef = index;

            if (hasOpened) {
                props.triggerAttribute?.setValue(true);
            }
            if (hasClosed) {
                props.triggerAttribute?.setValue(false);
            }
        },
        [isAvailable, props.triggerAttribute]
    );

    const snapPoints = useMemo(() => {
        if (contentHeight === 0) {
            return [1]; // During measurement
        }

        // Use actual measured height, cap at 90% screen
        const maxHeight = Dimensions.get("screen").height * 0.9;

        const snapHeight = Math.min(contentHeight, maxHeight);
        return [snapHeight];
    }, [contentHeight]);

    if (props.useNative && Platform.OS === "ios") {
        return <View></View>;
    }

    return (
        <Modal onRequestClose={close} transparent visible={isOpen}>
            <BottomSheet
                ref={bottomSheetRef}
                index={isOpen && contentHeight > 0 ? 0 : -1}
                snapPoints={snapPoints}
                enablePanDownToClose
                animateOnMount={false}
                onClose={() => handleSheetChanges(-1)}
                onChange={handleSheetChanges}
                style={getContainerStyle()}
                backdropComponent={renderBackdrop}
                backgroundStyle={props.styles.container}
                handleComponent={null}
                handleStyle={{ display: "none" }}
            >
                <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 16 }} onLayout={onLayoutHandler}>
                    {props.itemsBasic.map((item, index) => renderItem(item, index))}
                </BottomSheetScrollView>
            </BottomSheet>
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
