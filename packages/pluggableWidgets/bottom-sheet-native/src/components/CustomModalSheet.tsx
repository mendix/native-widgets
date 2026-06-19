import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, LayoutChangeEvent, Modal, Pressable, View } from "react-native";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { EditableValue, ValueStatus } from "mendix";
import { BottomSheetStyle } from "../ui/Styles";

const BACKDROP_FADE_IN_DURATION = 200;
const BACKDROP_FADE_OUT_DURATION = 150;
// Delay before animating sheet open to ensure Modal and BottomSheet are fully laid out
const SHEET_ANIMATION_DELAY = 50;

// Styles for off-screen measurement container
const MEASUREMENT_CONTAINER_STYLE = {
    position: "absolute" as const,
    opacity: 0,
    top: -10000, // Position far off-screen to avoid any layout interference
    left: 0,
    pointerEvents: "none" as const
};

interface CustomModalSheetProps {
    triggerAttribute?: EditableValue<boolean>;
    content?: ReactNode;
    styles: BottomSheetStyle;
}

export const CustomModalSheet = (props: CustomModalSheetProps): ReactElement => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(false);
    const [isMeasured, setIsMeasured] = useState(false);
    const backdropOpacity = useRef(new Animated.Value(0)).current;

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
                setIsMeasured(true);
            }
        },
        [contentHeight]
    );

    const close = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const renderBackdrop = useCallback(
        (backdropProps: BottomSheetBackdropProps) => (
            <Animated.View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    opacity: backdropOpacity
                }}
            >
                <Pressable style={{ flex: 1 }} onPress={close}>
                    <BottomSheetBackdrop
                        {...backdropProps}
                        pressBehavior={"close"}
                        opacity={0}
                        appearsOnIndex={0}
                        disappearsOnIndex={-1}
                    />
                </Pressable>
            </Animated.View>
        ),
        [close, backdropOpacity]
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

            const hasClosed = index === -1;
            if (hasClosed && props.triggerAttribute?.value) {
                props.triggerAttribute?.setValue(false);
                setCurrentStatus(false);
            }
        },
        [isAvailable, props.triggerAttribute]
    );

    useEffect(() => {
        if (!isAvailable) {
            return;
        }

        const shouldBeOpen = props.triggerAttribute?.value === true;

        if (shouldBeOpen && !currentStatus) {
            setCurrentStatus(true);
            requestAnimationFrame(() => {
                // Fade in backdrop - this helps smooth the transition as the sheet opens, reducing the perception of any initial stuttering.
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: BACKDROP_FADE_IN_DURATION,
                    useNativeDriver: true
                }).start();
                // Delay animation to ensure Modal and BottomSheet are fully mounted and laid out
                setTimeout(() => {
                    bottomSheetRef.current?.snapToIndex(0);
                }, SHEET_ANIMATION_DELAY);
            });
        } else if (!shouldBeOpen && currentStatus) {
            bottomSheetRef.current?.close();
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: BACKDROP_FADE_OUT_DURATION,
                useNativeDriver: true
            }).start(() => {
                setCurrentStatus(false);
            });
        }
    }, [props.triggerAttribute?.value, currentStatus, isAvailable, backdropOpacity]);

    return (
        <>
            {/* Off-screen measurement - measure content before showing Modal to prevent sudden jumps in layout */}
            {!isMeasured && (
                <View
                    style={[MEASUREMENT_CONTAINER_STYLE, { width: Dimensions.get("screen").width }]}
                    onLayout={onContentLayoutHandler}
                >
                    {props.content}
                </View>
            )}

            <Modal onRequestClose={close} transparent visible={isOpen && isMeasured}>
                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
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
                    <BottomSheetScrollView style={[{ flex: 1 }]} contentContainerStyle={{ paddingBottom: 16 }}>
                        {props.content}
                    </BottomSheetScrollView>
                </BottomSheet>
            </Modal>
        </>
    );
};
