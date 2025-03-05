import { createElement, ReactNode, ReactElement, useCallback, useState, useRef, Children } from "react";
import { Dimensions, LayoutChangeEvent, Modal, Pressable, SafeAreaView, StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetStyle } from "../ui/Styles";

interface ExpandingDrawerProps {
    smallContent?: ReactNode;
    largeContent?: ReactNode;
    fullscreenContent?: ReactNode;
    onOpen?: () => void;
    onClose?: () => void;
    styles: BottomSheetStyle;
}
let lastIndexRef = -1;

const OFFSET_VALUE = 48;

export const ExpandingDrawer = (props: ExpandingDrawerProps): ReactElement => {
    const [heightContent, setHeightContent] = useState(0);
    const [heightHeader, setHeightHeader] = useState(0);
    const [fullscreenHeight, setFullscreenHeight] = useState(0);
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const maxHeight = Dimensions.get("screen").height;
    const isSmallContentValid = Children.count(props.smallContent) > 0;
    const isLargeContentValid = Children.count(props.largeContent) > 0;

    const onLayoutHandlerHeader = (event: LayoutChangeEvent): void => {
        const height = event.nativeEvent.layout.height;
        if (height > 0 && height <= maxHeight) {
            setHeightHeader(height);
        }
    };

    const onLayoutHandlerContent = (event: LayoutChangeEvent): void => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) {
            if (height <= maxHeight) {
                setHeightContent(height);
            } else if (!props.fullscreenContent) {
                setHeightContent(maxHeight);
            }
        }
    };

    const onLayoutFullscreenHandler = (event: LayoutChangeEvent): void => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) {
            setFullscreenHeight(height);
        }
    };

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

    const containerStyle =
        props.fullscreenContent && isOpen ? props.styles.containerWhenExpandedFullscreen : props.styles.container;

    const renderContent = useCallback((): ReactNode => {
        const content = (
            <View onLayout={onLayoutHandlerContent} pointerEvents="box-none">
                <View
                    onLayout={onLayoutHandlerHeader}
                    style={!isSmallContentValid ? { height: 20 } : {}}
                    pointerEvents="box-none"
                >
                    {props.smallContent}
                </View>
                {props.largeContent}
            </View>
        );

        if (props.fullscreenContent) {
            return (
                <View style={[{ height: fullscreenHeight }]} pointerEvents="box-none">
                    {content}
                    {props.fullscreenContent}
                </View>
            );
        }
        return content;
    }, [props.smallContent, props.largeContent, props.fullscreenContent, isOpen, fullscreenHeight]);

    if (props.fullscreenContent && fullscreenHeight === 0) {
        return (
            <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0 }}>
                <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutFullscreenHandler} />
            </View>
        );
    }

    if (heightHeader === 0 || (isLargeContentValid && heightContent === 0)) {
        return <View style={{ position: "absolute", bottom: -maxHeight }}>{renderContent()}</View>;
    }

    const snapPoints =
        props.fullscreenContent && heightContent
            ? [fullscreenHeight, heightContent, heightHeader]
            : props.fullscreenContent
            ? [fullscreenHeight, heightHeader]
            : isLargeContentValid
            ? [heightContent + OFFSET_VALUE, heightHeader]
            : [heightHeader];

    const collapsedIndex = snapPoints.length - 1;

    const onChange = (index: number) => {
        const hasOpened = lastIndexRef === -1 && index === 0;
        const hasClosed = index === -1;

        if (hasOpened) {
            props.onOpen?.();
            setIsOpen(true);
        }
        if (hasClosed) {
            props.onClose?.();
            setIsOpen(false);
        }
        lastIndexRef = index;
    };

    const close = () => {
        bottomSheetRef.current?.close();
    };

    return (
        <Modal onRequestClose={close} transparent visible={isOpen}>
            <BottomSheet
                ref={bottomSheetRef}
                index={isOpen ? collapsedIndex : -1}
                snapPoints={snapPoints}
                onClose={() => setIsOpen(false)}
                onChange={onChange}
                animateOnMount
                backdropComponent={renderBackdrop}
                backgroundStyle={containerStyle}
            >
                <BottomSheetView style={[{ flex: 1 }]}>{renderContent()}</BottomSheetView>
            </BottomSheet>
        </Modal>
    );
};
