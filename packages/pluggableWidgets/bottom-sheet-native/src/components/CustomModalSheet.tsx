import { ReactElement, ReactNode, useCallback, useRef, useState } from "react";
import { Modal, Pressable, useWindowDimensions } from "react-native";
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

export const CustomModalSheet = (props: CustomModalSheetProps): ReactElement => {
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

    const close = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const handleModalShow = useCallback(() => {
        setReady(true);
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

    const maxHeight = windowHeight * 0.9;

    return (
        <Modal transparent animationType="none" visible={mounted} onRequestClose={close} onShow={handleModalShow}>
            {ready && (
                <BottomSheet
                    ref={bottomSheetRef}
                    index={0}
                    animateOnMount
                    enableDynamicSizing
                    maxDynamicContentSize={maxHeight}
                    containerHeight={windowHeight}
                    enablePanDownToClose
                    onChange={handleChange}
                    onClose={() => handleChange(-1)}
                    backdropComponent={renderBackdrop}
                    style={[props.styles.modal]}
                    backgroundStyle={props.styles.container}
                    handleComponent={null}
                    handleStyle={{ display: "none" }}
                >
                    <BottomSheetScrollView style={[{ flex: 1 }]} contentContainerStyle={{ paddingBottom: 16 }}>
                        {props.content}
                    </BottomSheetScrollView>
                </BottomSheet>
            )}
        </Modal>
    );
};
