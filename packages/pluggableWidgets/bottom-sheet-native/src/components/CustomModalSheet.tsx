import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, InteractionManager, LayoutChangeEvent, Modal, Pressable } from "react-native";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { EditableValue, ValueStatus } from "mendix";
import { BottomSheetStyle } from "../ui/Styles";

interface CustomModalSheetProps {
    triggerAttribute?: EditableValue<boolean>;
    content?: ReactNode;
    styles: BottomSheetStyle;
}

let lastIndexRef = -1;

export const CustomModalSheet = (props: CustomModalSheetProps): ReactElement => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(false);

    const isAvailable = props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available;

    const isOpen =
        props.triggerAttribute &&
        props.triggerAttribute.status === ValueStatus.Available &&
        props.triggerAttribute.value;

    const onContentLayoutHandler = useCallback(
        (event: LayoutChangeEvent): void => {
            const layoutHeight = event.nativeEvent.layout.height;
            if (layoutHeight > 0 && layoutHeight !== contentHeight) {
                setContentHeight(layoutHeight);
            }
        },
        [contentHeight]
    );

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
        if (contentHeight === 0) {
            return [1]; // During measurement
        }

        // Use actual measured content height, cap at 90% screen
        const maxHeight = Dimensions.get("screen").height * 0.9;
        const snapHeight = Math.min(contentHeight, maxHeight);
        return [snapHeight];
    }, [contentHeight]);

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
                <BottomSheetScrollView
                    style={[{ flex: 1 }]}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    onLayout={onContentLayoutHandler}
                >
                    {props.content}
                </BottomSheetScrollView>
            </BottomSheet>
        </Modal>
    );
};
