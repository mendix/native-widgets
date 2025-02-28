import { createElement, ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import { InteractionManager, LayoutChangeEvent, Modal, SafeAreaView, StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import { EditableValue, ValueStatus } from "mendix";
import { BottomSheetStyle, defaultPaddings, padding } from "../ui/Styles";

interface CustomModalSheetProps {
    triggerAttribute?: EditableValue<boolean>;
    content?: ReactNode;
    styles: BottomSheetStyle;
}
let lastIndexRef = -1;

export const CustomModalSheet = (props: CustomModalSheetProps): ReactElement => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [height, setHeight] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(false);
    const isAvailable = props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available;

    const onLayoutFullscreenHandler = (event: LayoutChangeEvent): void => {
        const layoutHeight = event.nativeEvent.layout.height;
        if (layoutHeight > 0 && layoutHeight !== height) {
            setHeight(layoutHeight);
        }
    };

    useEffect(() => {
        if (!isAvailable) {
            return;
        }
        if (props.triggerAttribute?.value && !currentStatus) {
            InteractionManager.runAfterInteractions(() => setCurrentStatus(true));
        } else if (!props.triggerAttribute?.value && currentStatus) {
            bottomSheetRef.current?.close();
            setCurrentStatus(false);
        }
    }, [props.triggerAttribute, currentStatus]);

    if (height === 0) {
        return (
            <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0 }}>
                <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutFullscreenHandler} />
            </View>
        );
    }

    const snapPoints = [height - Number(defaultPaddings.paddingBottom)];

    const isOpen =
        props.triggerAttribute &&
        props.triggerAttribute.status === ValueStatus.Available &&
        props.triggerAttribute.value;

    const renderBackdrop = (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...backdropProps} opacity={0.3} appearsOnIndex={0} disappearsOnIndex={-1} />
    );

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

    return (
        <Modal transparent visible={isOpen}>
            <BottomSheet
                ref={bottomSheetRef}
                index={isOpen ? 0 : -1}
                snapPoints={snapPoints}
                enablePanDownToClose
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                style={[props.styles.modal]}
                backgroundStyle={props.styles.container}
            >
                <BottomSheetView style={[props.styles.container, defaultPaddings, padding]}>
                    {props.content}
                </BottomSheetView>
            </BottomSheet>
        </Modal>
    );
};
