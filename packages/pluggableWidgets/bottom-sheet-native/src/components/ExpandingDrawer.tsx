import { ReactNode, ReactElement, useCallback, useState, useRef, Children, useMemo } from "react";
import { Dimensions, LayoutChangeEvent, SafeAreaView, StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
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

const OFFSET_BOTTOM_SHEET = 25;

export const ExpandingDrawer = (props: ExpandingDrawerProps): ReactElement => {
    const [heightContent, setHeightContent] = useState(0);
    const [heightHeader, setHeightHeader] = useState(0);
    const [fullscreenHeight, setFullscreenHeight] = useState(0);
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const maxHeight = Dimensions.get("screen").height;
    const isSmallContentValid = Children.count(props.smallContent) > 0;
    const isLargeContentValid = Children.count(props.largeContent) > 0;

    const onLayoutHandlerHeader = useCallback(
        (event: LayoutChangeEvent): void => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height <= maxHeight) {
                setHeightHeader(height);
            }
        },
        [maxHeight]
    );

    const onLayoutHandlerContent = useCallback(
        (event: LayoutChangeEvent): void => {
            const height = event.nativeEvent.layout.height;
            if (height > 0) {
                if (height <= maxHeight) {
                    setHeightContent(height);
                } else if (!props.fullscreenContent) {
                    setHeightContent(maxHeight);
                }
            }
        },
        [maxHeight, props.fullscreenContent]
    );

    const onLayoutFullscreenHandler = (event: LayoutChangeEvent): void => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) {
            setFullscreenHeight(height);
        }
    };

    const containerStyle =
        props.fullscreenContent && isOpen ? props.styles.containerWhenExpandedFullscreen : props.styles.container;

    const snapPoints = useMemo(() => {
        if (props.fullscreenContent && heightContent) {
            return [fullscreenHeight, heightContent, heightHeader];
        }
        if (props.fullscreenContent) {
            return [fullscreenHeight, heightHeader];
        }
        if (isLargeContentValid) {
            return [heightContent, heightHeader];
        }
        return [heightHeader];
    }, [props.fullscreenContent, heightContent, fullscreenHeight, heightHeader, isLargeContentValid]);

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
    }, [
        props.smallContent,
        props.largeContent,
        props.fullscreenContent,
        fullscreenHeight,
        isSmallContentValid,
        onLayoutHandlerContent,
        onLayoutHandlerHeader
    ]);

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

    const collapsedIndex = 0;

    const onChange = (index: number): void => {
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

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {snapPoints.length > 1 && (
                <BottomSheet
                    ref={bottomSheetRef}
                    index={collapsedIndex}
                    snapPoints={snapPoints.map(p => p + OFFSET_BOTTOM_SHEET)}
                    onClose={() => setIsOpen(false)}
                    enablePanDownToClose={false}
                    onChange={onChange}
                    animateOnMount
                    backgroundStyle={containerStyle}
                >
                    <BottomSheetView style={{ height: heightHeader }}>{renderContent()}</BottomSheetView>
                </BottomSheet>
            )}
        </View>
    );
};
