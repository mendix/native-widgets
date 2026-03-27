import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, LayoutChangeEvent, Modal, Pressable, SafeAreaView, StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import { EditableValue, ValueStatus } from "mendix";
import { BottomSheetStyle, defaultPaddings } from "../ui/Styles";

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

    const isOpen =
        props.triggerAttribute &&
        props.triggerAttribute.status === ValueStatus.Available &&
        props.triggerAttribute.value;

    const onLayoutFullscreenHandler = (event: LayoutChangeEvent): void => {
        const layoutHeight = event.nativeEvent.layout.height;
        if (layoutHeight > 0 && layoutHeight !== height) {
            setHeight(layoutHeight);
        }
    };

    const close = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const renderBackdrop = useCallback(
        (backdropProps: BottomSheetBackdropProps) => (
            <Pressable style={{ flex: 1 }} onPress={close}>
                <BottomSheetBackdrop
                    {...backdropProps}
                    pressBehavior={"close"}
                    opacity={0.3}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            </Pressable>
        ),
        [close]
    );

    const snapPoints = useMemo(() => {
        if (height === 0) {
            return [0];
        }
        return [height - Number(defaultPaddings.paddingBottom)];
    }, [height]);

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
    }, [props.triggerAttribute, currentStatus, isAvailable]);

    if (height === 0) {
        return (
            <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0 }}>
                <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutFullscreenHandler} />
            </View>
        );
    }

    return (
        <Modal onRequestClose={close} transparent visible={!!isOpen}>
            <BottomSheet
                ref={bottomSheetRef}
                index={isOpen ? 0 : -1}
                snapPoints={snapPoints}
                onClose={() => handleSheetChanges(-1)}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                style={[props.styles.modal]}
                backgroundStyle={props.styles.container}
                enablePanDownToClose={false}
                handleComponent={null}
                handleStyle={{ display: "none" }}
            >
                <BottomSheetView style={[props.styles.container, defaultPaddings]}>{props.content}</BottomSheetView>
            </BottomSheet>
        </Modal>
    );
};
