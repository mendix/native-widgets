import { ReactNode, ReactElement, useCallback, useMemo, useState, useRef, Children } from "react";
import { Dimensions, LayoutChangeEvent, StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
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

const OFFSET_BOTTOM_SHEET = 25; // A small offset for visual padding or handle

export const ExpandingDrawer = (props: ExpandingDrawerProps): ReactElement => {
    // State to store measured heights
    const [smallContentHeight, setSmallContentHeight] = useState(0); // Height of the smallContent (header)
    const [largeContentOnlyHeight, setLargeContentOnlyHeight] = useState(0); // Height of largeContent ONLY
    const [fullscreenContentOnlyHeight, setFullscreenContentOnlyHeight] = useState(0); // Height of fullscreenContent ONLY
    const [isOpen, setIsOpen] = useState<boolean>(true); // Tracks if the drawer is open or closed
    const bottomSheetRef = useRef<BottomSheet>(null);

    const screenHeight = Dimensions.get("screen").height;
    const halfScreen = Math.round(screenHeight * 0.5);

    const isSmallContentValid = Children.count(props.smallContent) > 0;
    const isLargeContentValid = Children.count(props.largeContent) > 0;
    const isFullscreenContentValid = Children.count(props.fullscreenContent) > 0;

    // Handlers for measuring individual content sections
    const onLayoutSmallContent = useCallback(
        (event: LayoutChangeEvent): void => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height !== smallContentHeight) {
                setSmallContentHeight(height);
            }
        },
        [smallContentHeight]
    );

    const onLayoutLargeContent = useCallback(
        (event: LayoutChangeEvent): void => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height !== largeContentOnlyHeight) {
                setLargeContentOnlyHeight(height);
            }
        },
        [largeContentOnlyHeight]
    );

    const onLayoutFullscreenContent = useCallback(
        (event: LayoutChangeEvent): void => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height !== fullscreenContentOnlyHeight) {
                setFullscreenContentOnlyHeight(height);
            }
        },
        [fullscreenContentOnlyHeight]
    );

    // Determine the container style based on expansion state
    const containerStyle =
        isFullscreenContentValid && isOpen ? props.styles.containerWhenExpandedFullscreen : props.styles.container;

    const renderMeasurementTree = useCallback((): ReactElement => {
        return (
            <View
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0,
                    zIndex: -1,
                    pointerEvents: "none"
                }}
            >
                {/* Measure smallContent */}
                <View onLayout={onLayoutSmallContent} pointerEvents="box-none">
                    {props.smallContent}
                </View>
                {/* Measure largeContent */}
                <View onLayout={onLayoutLargeContent} pointerEvents="box-none">
                    {props.largeContent}
                </View>
                {/* Measure fullscreenContent */}
                {isFullscreenContentValid && (
                    <View onLayout={onLayoutFullscreenContent} pointerEvents="box-none">
                        {props.fullscreenContent}
                    </View>
                )}
            </View>
        );
    }, [
        props.smallContent,
        props.largeContent,
        props.fullscreenContent,
        isFullscreenContentValid,
        onLayoutSmallContent,
        onLayoutLargeContent,
        onLayoutFullscreenContent
    ]);

    // Calculate snap points based on measured heights
    const snapPoints = useMemo(() => {
        const points: number[] = [];

        if (smallContentHeight > 0) {
            points.push(smallContentHeight + OFFSET_BOTTOM_SHEET);
        } else {
            points.push(50 + OFFSET_BOTTOM_SHEET); // A reasonable default height
        }

        // Calculate the height for the intermediate snap point (largeContent + smallContent)
        const combinedLargeContentHeight = smallContentHeight + largeContentOnlyHeight;

        if (isFullscreenContentValid) {
            if (isLargeContentValid && largeContentOnlyHeight > 0) {
                const intermediateSnapPoint = Math.min(halfScreen, combinedLargeContentHeight) + OFFSET_BOTTOM_SHEET;
                if (intermediateSnapPoint > points[points.length - 1]) {
                    points.push(intermediateSnapPoint);
                }
            }

            if (fullscreenContentOnlyHeight > 0) {
                const fullScreenSnapPoint = screenHeight - OFFSET_BOTTOM_SHEET;
                if (fullScreenSnapPoint > points[points.length - 1]) {
                    points.push(fullScreenSnapPoint);
                }
            }
        } else {
            // If no fullscreenContent, the expanded state is the max of halfScreen or combined largeContent height
            if (isLargeContentValid && largeContentOnlyHeight > 0) {
                const expandedSnapPoint = Math.min(halfScreen, combinedLargeContentHeight) + OFFSET_BOTTOM_SHEET;
                if (expandedSnapPoint > points[points.length - 1]) {
                    points.push(expandedSnapPoint);
                }
            }
        }

        // Ensure snap points are unique and sorted in ascending order
        return Array.from(new Set(points)).sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : 0));
    }, [
        smallContentHeight,
        largeContentOnlyHeight,
        fullscreenContentOnlyHeight,
        isFullscreenContentValid,
        isLargeContentValid,
        halfScreen,
        screenHeight
    ]);

    const collapsedIndex = 0; // The initial snap point (smallContent)

    const onChange = useCallback(
        (index: number) => {
            // Determine if the drawer is opening or closing based on index changes
            const hasOpened = lastIndexRef === -1 && index === collapsedIndex; // Initial open to collapsed
            const hasClosed = index === -1; // Fully closed
            const hasExpanded = index > collapsedIndex && lastIndexRef <= collapsedIndex; // Expanded from collapsed or further
            const hasCollapsed = index === collapsedIndex && lastIndexRef > collapsedIndex; // Collapsed back to initial

            if (hasOpened || hasExpanded) {
                props.onOpen?.();
                setIsOpen(true);
            }
            if (hasClosed || hasCollapsed) {
                props.onClose?.();
                setIsOpen(index !== -1); // Set isOpen to false only if fully closed
            }
            lastIndexRef = index;
        },
        [props.onOpen, props.onClose, collapsedIndex]
    );

    const hasMinimumMeasurements = !isSmallContentValid || smallContentHeight > 0;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {renderMeasurementTree()}

            {hasMinimumMeasurements && snapPoints.length > 0 && (
                <BottomSheet
                    ref={bottomSheetRef}
                    index={collapsedIndex} // Start at the collapsed state
                    snapPoints={snapPoints}
                    onClose={() => setIsOpen(false)}
                    enablePanDownToClose={false}
                    onChange={onChange}
                    animateOnMount
                    backgroundStyle={containerStyle}
                    enableDynamicSizing={false}
                >
                    {/* Sticky header (smallContent) */}
                    <BottomSheetView onLayout={onLayoutSmallContent} style={!isSmallContentValid ? { height: 20 } : {}}>
                        {props.smallContent}
                    </BottomSheetView>

                    {/* Scrollable content area */}
                    <BottomSheetScrollView
                        style={{ flex: 1 }} // Allow it to take available space
                        contentContainerStyle={{ paddingBottom: 16 }}
                    >
                        {/* Render largeContent and measure it if needed */}
                        <View onLayout={onLayoutLargeContent}> {props.largeContent} </View>

                        {/* Render fullscreenContent only if it's enabled */}
                        {isFullscreenContentValid && (
                            // Render and measure fullscreenContent
                            <View onLayout={onLayoutFullscreenContent}> {props.fullscreenContent} </View>
                        )}
                    </BottomSheetScrollView>
                </BottomSheet>
            )}
        </View>
    );
};
