import { Fragment, ReactElement, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
    I18nManager,
    LayoutChangeEvent,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    Text,
    TouchableNativeFeedback,
    TouchableNativeFeedbackProps,
    TouchableOpacity,
    TouchableOpacityProps,
    View
} from "react-native";
import { ButtonStyle, IntroScreenStyle } from "./ui/Styles";
import { Icon } from "mendix/components/native/Icon";
import { SlidesType } from "../typings/IntroScreenProps";
import { EditableValue, ValueStatus, DynamicValue, NativeIcon } from "mendix";
import { Big } from "big.js";
import { FlashList, FlashListRef } from "@shopify/flash-list";

interface SwipeableContainerProps {
    testID?: string;
    skipLabel?: string;
    skipIcon?: DynamicValue<NativeIcon>;
    doneLabel?: string;
    doneIcon?: DynamicValue<NativeIcon>;
    nextLabel?: string;
    nextIcon?: DynamicValue<NativeIcon>;
    previousLabel?: string;
    previousIcon?: DynamicValue<NativeIcon>;
    showDoneButton: boolean;
    showSkipButton: boolean;
    showNextButton: boolean;
    showPreviousButton: boolean;
    onSlideChange: (next: number, previous: number) => void;
    bottomButton: boolean;
    numberOfButtons: number;
    onDone: () => void;
    onSkip: () => void;
    slides: SlidesType[];
    hidePagination: boolean;
    hideIndicatorLastSlide: boolean;
    styles: IntroScreenStyle;
    activeSlide?: EditableValue<Big>;
}

type TouchableProps = TouchableNativeFeedbackProps | TouchableOpacityProps;

declare type Option<T> = T | undefined;

const isAndroidRTL = I18nManager.isRTL && Platform.OS === "android";
const Touchable: React.ComponentType<TouchableProps> =
    Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;

const refreshActiveSlideAttribute = (slides: SlidesType[], activeSlide?: EditableValue<Big>): number => {
    if (activeSlide && activeSlide.status === ValueStatus.Available && slides && slides.length > 0) {
        const slide = Number(activeSlide.value) - 1;
        if (slide < 0) {
            return 0;
        } else if (slide > slides.length - 1) {
            return slides.length - 1;
        }
        return slide;
    }
    return 0;
};

export const SwipeableContainer = (props: SwipeableContainerProps): ReactElement => {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    // Start on the slide the attribute points at, so activeIndex never lags the slide that
    // initialScrollIndex renders. Otherwise the first Next/Previous press moves relative to
    // slide 0 instead of the visible slide.
    const [activeIndex, setActiveIndex] = useState(() => refreshActiveSlideAttribute(props.slides, props.activeSlide));
    const flashList = useRef<FlashListRef<any>>(null);
    const hasAppliedInitialScroll = useRef(false);
    const isUserDragging = useRef(false);
    // Slide a programmatic scroll is currently heading for, or null when the list is
    // wherever the user left it. Used to recognise momentum events that contradict the
    // scroll we just asked for; see onMomentumScrollEnd.
    const pendingScrollTarget = useRef<number | null>(null);

    const rtlSafeIndex = useCallback(
        (i: number): number => (isAndroidRTL ? props.slides.length - 1 - i : i),
        [props.slides.length]
    );

    const goToSlide = useCallback(
        (pageNum: number, animated = true) => {
            setActiveIndex(pageNum);
            if (flashList && flashList.current) {
                pendingScrollTarget.current = pageNum;
                flashList.current.scrollToOffset({
                    offset: rtlSafeIndex(pageNum) * width,
                    animated
                });
            }
        },
        [rtlSafeIndex, width]
    );

    useEffect(() => {
        if (!width || props.activeSlide?.status !== ValueStatus.Available) {
            return;
        }
        const slide = refreshActiveSlideAttribute(props.slides, props.activeSlide);
        // Once width is known, force the list to the attribute's slide even when activeIndex
        // already matches: initialScrollIndex is applied before layout, so on remount the list
        // can sit at offset 0 while activeIndex says otherwise.
        if (!hasAppliedInitialScroll.current) {
            hasAppliedInitialScroll.current = true;
            // Jump without animation: activeIndex is applied immediately, and it drives which
            // slide is exposed to accessibility. An animated scroll would leave the exposed
            // slide off-screen until the animation lands.
            goToSlide(slide, false);
        } else if (slide !== activeIndex) {
            goToSlide(slide);
        }
    }, [props.activeSlide, activeIndex, width, props.slides, goToSlide]);

    const onNextPress = (): void => {
        goToSlide(activeIndex + 1);
        onSlideChange(activeIndex + 1, activeIndex);
    };

    const onPrevPress = (): void => {
        goToSlide(activeIndex - 1);
        onSlideChange(activeIndex - 1, activeIndex);
    };

    const onPaginationPress = (index: number): void => {
        const activeIndexBeforeChange = activeIndex;
        goToSlide(index);
        onSlideChange(index, activeIndexBeforeChange);
    };

    const renderItem = useCallback(
        ({ item, index }: any): ReactElement => {
            const isActive = index === activeIndex;
            return (
                <View
                    style={{ width, height }}
                    importantForAccessibility={isActive ? "auto" : "no-hide-descendants"}
                    accessibilityElementsHidden={!isActive}
                >
                    {item.content}
                </View>
            );
        },
        [width, height, activeIndex]
    );

    const renderButton = (
        caption: Option<string>,
        icon: Option<DynamicValue<NativeIcon>>,
        defaultIcon: string,
        style: ButtonStyle,
        onPress: () => void,
        testID: string
    ): ReactElement => {
        const iconSource = { type: "glyph", iconClass: `glyphicon-${defaultIcon}` } as const;
        let iconContent =
            !icon && !caption ? (
                <View style={{ alignSelf: "center" }}>
                    <Icon
                        icon={iconSource}
                        color={style.icon.color ? style.icon.color : "black"}
                        size={style.icon.size ? style.icon.size : undefined}
                    />
                </View>
            ) : null;
        if (icon && icon.status === ValueStatus.Available && icon.value) {
            iconContent = (
                <View style={{ alignSelf: "center" }}>
                    <Icon
                        icon={icon!.value}
                        color={style.icon.color ? style.icon.color : "black"}
                        size={style.icon.size ? style.icon.size : undefined}
                    />
                </View>
            );
        }
        const Container = props.bottomButton ? View : Fragment;
        const containerProps = props.bottomButton
            ? {
                  style: styles.flexOne
              }
            : {};
        return (
            <Container {...containerProps}>
                <Touchable onPress={onPress} testID={`${props.testID}$${testID}`}>
                    <View style={[style.container, !props.bottomButton ? { width: width / 3 } : {}]}>
                        {iconContent}
                        {caption && <Text style={style.caption}>{caption}</Text>}
                    </View>
                </Touchable>
            </Container>
        );
    };

    const onSlideChange = useCallback(
        (newIndex: number, lastIndex: number): void => {
            if (props.activeSlide && !props.activeSlide.readOnly) {
                props.activeSlide.setValue(new Big(newIndex + 1));
            }
            if (props.onSlideChange) {
                props.onSlideChange(newIndex, lastIndex);
            }
        },
        [props]
    );

    const renderNextButton = ({
        showNextButton = true,
        nextLabel,
        nextIcon,
        styles
    }: SwipeableContainerProps): ReactNode =>
        showNextButton &&
        renderButton(
            nextLabel,
            nextIcon,
            "chevron-right",
            props.bottomButton ? styles.paginationAbove.buttonNext : styles.paginationBetween.buttonNext,
            onNextPress,
            "buttonNext"
        );

    const renderPrevButton = ({
        showPreviousButton,
        previousLabel,
        previousIcon,
        styles
    }: SwipeableContainerProps): ReactNode =>
        showPreviousButton &&
        renderButton(
            previousLabel,
            previousIcon,
            "chevron-left",
            props.bottomButton ? styles.paginationAbove.buttonPrevious : styles.paginationBetween.buttonPrevious,
            onPrevPress,
            "buttonPrevious"
        );

    const renderDoneButton = ({
        showDoneButton = true,
        doneLabel,
        doneIcon,
        onDone,
        styles
    }: SwipeableContainerProps): ReactNode =>
        showDoneButton &&
        renderButton(
            doneLabel,
            doneIcon,
            "ok",
            props.bottomButton ? styles.paginationAbove.buttonDone : styles.paginationBetween.buttonDone,
            onDone,
            "buttonDone"
        );

    const renderSkipButton = ({
        showSkipButton,
        skipLabel,
        skipIcon,
        onSkip,
        slides,
        styles
    }: SwipeableContainerProps): ReactNode =>
        showSkipButton &&
        renderButton(
            skipLabel,
            skipIcon,
            "remove",
            props.bottomButton ? styles.paginationAbove.buttonSkip : styles.paginationBetween.buttonSkip,
            () => (onSkip ? onSkip() : goToSlide(slides.length - 1)),
            "buttonSkip"
        );

    const renderPagination = (): ReactElement => {
        const isLastSlide = activeIndex === props.slides.length - 1;
        const isFirstSlide = activeIndex === 0;

        const leftButton = (!isFirstSlide && renderPrevButton(props)) || (!isLastSlide && renderSkipButton(props));
        const rightButton = isLastSlide ? renderDoneButton(props) : renderNextButton(props);
        const paginationOverflow = props.slides.length > 5;
        const hidePagination = props.hidePagination || (isLastSlide && props.hideIndicatorLastSlide);

        return (
            <View style={[props.styles.paginationContainer, !props.bottomButton ? { flexDirection: "row" } : {}]}>
                {!props.bottomButton && leftButton}
                <View style={[styles.paginationDots, props.bottomButton ? { width: "100%" } : { width: width / 3 }]}>
                    {!hidePagination &&
                        !paginationOverflow &&
                        props.slides.length > 1 &&
                        props.slides.map((_, i) => (
                            <TouchableOpacity
                                testID={`${props.testID}$dot${i}`}
                                key={i}
                                style={[
                                    styles.dot,
                                    rtlSafeIndex(i) === activeIndex
                                        ? props.styles.activeDotStyle
                                        : props.styles.dotStyle
                                ]}
                                onPress={() => onPaginationPress(i)}
                                accessibilityRole="button"
                                accessibilityLabel={`Go to slide ${i + 1}`}
                                accessibilityState={{ selected: rtlSafeIndex(i) === activeIndex }}
                            />
                        ))}
                    {!hidePagination && paginationOverflow && (
                        <Text style={props.styles.paginationText} testID={`${props.testID}$paginationText`}>
                            {activeIndex + 1}/{props.slides.length}
                        </Text>
                    )}
                </View>
                {!props.bottomButton && rightButton}
                {props.bottomButton && (
                    <View style={props.styles.paginationAbove.buttonsContainer}>
                        {props.numberOfButtons === 2 && leftButton}
                        {rightButton}
                    </View>
                )}
            </View>
        );
    };

    const onScrollBeginDrag = useCallback(() => {
        isUserDragging.current = true;
        // The user takes over from here, so any programmatic scroll still in flight no
        // longer describes where the list is heading. Clearing the target also keeps it
        // from latching when a scroll never reports a momentum end of its own.
        pendingScrollTarget.current = null;
    }, []);

    const onMomentumScrollEnd = useCallback(
        (event: NativeSyntheticEvent<any>) => {
            const wasUserDragging = isUserDragging.current;
            isUserDragging.current = false;

            if (!width) {
                return;
            }
            const offset = event.nativeEvent.contentOffset.x;
            const newIndex = rtlSafeIndex(Math.round(offset / width));

            // While a programmatic scroll is in flight the list can report a momentum end
            // for the position it is leaving rather than the one it is heading to. Trusting
            // that offset rewrites activeIndex to a slide that is not on screen, and the
            // drag flag cannot tell the two apart because a fling reports momentum without
            // a fresh drag. Anything that disagrees with the requested slide is stale.
            const pendingTarget = pendingScrollTarget.current;
            if (pendingTarget !== null) {
                if (newIndex === pendingTarget) {
                    pendingScrollTarget.current = null;
                }
                return;
            }

            if (newIndex === activeIndex) {
                return;
            }

            // Only a user swipe reports a change here. Programmatic scrolls (initial positioning,
            // Next/Previous/pagination) already fired onSlideChange, so re-firing would double
            // count the change and, on remount, emit a spurious change back to slide 1.
            if (!wasUserDragging) {
                setActiveIndex(newIndex);
                return;
            }

            const lastIndex = activeIndex;
            setActiveIndex(newIndex);
            onSlideChange(newIndex, lastIndex);
        },
        [activeIndex, width, rtlSafeIndex, onSlideChange]
    );

    /**
     * Readjust the size of the slides if the size is different than the device dimensions
     */
    const onLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const layout = event.nativeEvent.layout;
            const newWidth = layout.width;
            if (newWidth !== width) {
                setWidth(newWidth);
            }
            const newHeight = layout.height;
            if (newHeight !== height) {
                setHeight(newHeight);
            }
        },
        [width, height]
    );

    return (
        <View style={styles.flexOne}>
            <FlashList
                testID={props.testID}
                initialScrollIndex={refreshActiveSlideAttribute(props.slides, props.activeSlide)}
                ref={flashList}
                data={props.slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                style={styles.flatList}
                renderItem={renderItem}
                onScrollBeginDrag={onScrollBeginDrag}
                onMomentumScrollEnd={onMomentumScrollEnd}
                scrollEventThrottle={50}
                extraData={[width, activeIndex]}
                onLayout={onLayout}
                keyExtractor={(_: any, index: number) => "screen_key_" + index}
                importantForAccessibility="no"
            />
            {renderPagination()}
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: {
        flex: 1
    },
    flatList: {
        flex: 1,
        flexDirection: isAndroidRTL ? "row-reverse" : "row"
    },
    paginationDots: {
        flexDirection: isAndroidRTL ? "row-reverse" : "row",
        justifyContent: "center",
        alignItems: "center"
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 4
    },
    bottomButtonDefault: {
        flex: 1,
        justifyContent: "center"
    }
});
