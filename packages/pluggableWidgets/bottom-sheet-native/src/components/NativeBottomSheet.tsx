import { ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import {
    ActionSheetIOS,
    Appearance,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
} from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
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

    const snapPoints = useMemo(() => {
        // @gorhom/bottom-sheet relies on Reanimated worklets; passing a stable snapPoints array
        // avoids UI-thread "non-worklet function" crashes caused by unstable/undefined inputs.
        const itemCount = props.itemsBasic.length;
        const itemHeight = 44;
        const verticalPadding = 24;
        const maxHeight = Dimensions.get("window").height * 0.9;
        const estimatedHeight = itemCount * itemHeight + verticalPadding;

        return [Math.min(maxHeight, estimatedHeight)];
    }, [props.itemsBasic.length]);

    const isAvailable = props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available;
    const isOpen =
        props.triggerAttribute &&
        props.triggerAttribute.status === ValueStatus.Available &&
        props.triggerAttribute.value;

    const manageBottomSheet = () => {
        if (props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available) {
            if (props.triggerAttribute.value) {
                bottomSheetRef.current?.expand();
            } else {
                bottomSheetRef.current?.close();
            }
        }
    };

    useEffect(() => {
        manageBottomSheet();
    }, [props.triggerAttribute]);

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

    const renderBackdrop = (backdropProps: BottomSheetBackdropProps) => (
        <Pressable style={{ flex: 1 }} onPress={close}>
            <BottomSheetBackdrop
                {...backdropProps}
                pressBehavior={"close"}
                opacity={0.3}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
            />
        </Pressable>
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

    const containerStyle = useMemo(() => {
        if (props.useNative) {
            return [nativeAndroidStyles.sheetContainer];
        }
        return [styles.sheetContainer, props.styles.container];
    }, [props.useNative, props.styles.container]);

    const handleSheetChanges = (index: number) => {
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
    };

    if (props.useNative && Platform.OS === "ios") {
        return <View></View>;
    }

    const close = () => {
        bottomSheetRef.current?.close();
    };

    return (
        <Modal onRequestClose={close} transparent visible={isOpen}>
            <BottomSheet
                ref={bottomSheetRef}
                index={isOpen ? 0 : -1} // Start closed.
                snapPoints={snapPoints}
                enablePanDownToClose
                animateOnMount
                onClose={() => handleSheetChanges(-1)}
                onChange={handleSheetChanges}
                style={containerStyle}
                backdropComponent={renderBackdrop}
                backgroundStyle={props.styles.container}
                handleComponent={null}
                handleStyle={{ display: "none" }}
            >
                <BottomSheetView style={[{ flex: 1, paddingBottom: 16 }]}>
                    {props.itemsBasic.map((item, index) => renderItem(item, index))}
                </BottomSheetView>
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
