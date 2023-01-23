import { createElement, ReactElement, ReactNode, useCallback, useEffect, useState } from "react";
import { InteractionManager, LayoutChangeEvent, SafeAreaView, StyleSheet, View } from "react-native";
import Modal, { OnSwipeCompleteParams } from "react-native-modal";
import { DynamicValue, EditableValue, ValueStatus } from "mendix";
import { BottomSheetStyle, defaultPaddings } from "../ui/Styles";

interface CustomModalSheetProps {
    triggerAttribute?: EditableValue<boolean>;
    content?: ReactNode;
    styles: BottomSheetStyle;
    accessible?: boolean;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export const CustomModalSheet = (props: CustomModalSheetProps): ReactElement => {
    const [currentStatus, setCurrentStatus] = useState(false);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available) {
            if (props.triggerAttribute.value && !currentStatus) {
                InteractionManager.runAfterInteractions(() => setCurrentStatus(true));
            } else if (!props.triggerAttribute.value && currentStatus) {
                setCurrentStatus(false);
            }
        }
    }, [props.triggerAttribute, currentStatus]);

    const onOpenHandler = useCallback(() => {
        if (props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available) {
            props.triggerAttribute.setValue(true);
        }
    }, [props.triggerAttribute]);

    const onCloseHandler = useCallback(() => {
        if (props.triggerAttribute && props.triggerAttribute.status === ValueStatus.Available) {
            props.triggerAttribute.setValue(false);
        }
    }, [props.triggerAttribute]);

    const onSwipeDown = useCallback(
        (params: OnSwipeCompleteParams): void => {
            if (params.swipingDirection === "down") {
                onCloseHandler();
            }
        },
        [props.triggerAttribute]
    );

    const onLayoutFullscreenHandler = (event: LayoutChangeEvent): void => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) {
            setHeight(height);
        }
    };

    if (height === 0) {
        return (
            <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0 }}>
                <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutFullscreenHandler} />
            </View>
        );
    }

    return (
        <Modal
            accessible={props.accessible}
            accessibilityLabel={props.screenReaderCaption?.value}
            accessibilityHint={props.screenReaderHint?.value}
            accessibilityState={{ expanded: height > 0 }}
            isVisible={currentStatus}
            coverScreen
            backdropOpacity={0.5}
            onDismiss={onCloseHandler}
            onBackButtonPress={onCloseHandler}
            onBackdropPress={onCloseHandler}
            onModalShow={onOpenHandler}
            onSwipeComplete={onSwipeDown}
            style={props.styles.modal}
        >
            <View
                style={[
                    props.styles.container,
                    defaultPaddings,
                    { maxHeight: height - Number(defaultPaddings.paddingBottom) }
                ]}
                pointerEvents="box-none"
            >
                {props.content}
            </View>
        </Modal>
    );
};
