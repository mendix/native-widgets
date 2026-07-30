import { Fragment, ReactElement, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
    I18nManager,
    LayoutChangeEvent,
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

// Which slide is on screen is asked of the list rather than inferred from scroll offsets and gesture
// phases. Changing this config after mount is not supported by flash-list, so it is a constant.
const VIEWABILITY_CONFIG = {
    // Slides are exactly one window wide, so no two of them can be 60% visible at once: whatever
    // passes this threshold is the slide the user is looking at, and there is only ever one.
    itemVisiblePercentThreshold: 60,
    // waitForInteraction is deliberately NOT set. It sounds like what isUserScrolling does, but it
    // is gated on flash-list's own hasInteracted, which is only ever set from onScroll and only
    // once isInitialScrollComplete — a flag flipped by a 100ms timer started after the first
    // layout. A drag that begins before that timer fires therefore records no interaction, and
    // since nothing re-records it once the gesture is over, every report for that whole swipe is
    // dropped: the list moves and the widget never hears about it. isUserScrolling makes the same
    // distinction from the touch itself, with no timer to lose the race against.
    // A slide has to hold the screen this long to count, so positions merely passed through on the
    // way somewhere else are never reported as arrivals.
    minimumViewTime: 250
} as const;

// A value is worth reading whenever there is one, not only when the attribute calls itself Available:
// a refresh can report Loading with the previous value still attached, and treating that as "nothing
// to go on" would answer slide 1.
const refreshActiveSlideAttribute = (slides: SlidesType[], activeSlide?: EditableValue<Big>): number => {
    if (activeSlide && activeSlide.value !== undefined && slides && slides.length > 0) {
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
    const [activeIndex, setActiveIndex] = useState(() => refreshActiveSlideAttribute(props.slides, props.activeSlide));
    const flashList = useRef<FlashListRef<any>>(null);
    // A value written to the attribute round-trips through the runtime, so it arrives back one or
    // more renders later. Until it does, the attribute still reads the slide we just left.
    const pendingWrite = useRef<{ replaced: number } | null>(null);
    // The list re-applies initialScrollIndex from current props for a short window after it mounts,
    // so passing live state there lets it overrule our own scrollToOffset. Freeze the slide the
    // list opens on instead.
    const initialIndex = useRef(activeIndex);
    // Only a scroll the user is driving may report a slide change. flash-list's own
    // waitForInteraction cannot do this job: it computes viewability from its commit effect without
    // consulting that flag, so on a slow device the list is still sitting at offset 0 when reports
    // begin and slide 1 is announced as an arrival, losing the slide the widget was asked to open
    // on — and worse, its interaction flag is itself gated on a 100ms timer, so it can swallow a
    // real swipe outright. Touch is the one signal that cannot be produced by the list scrolling
    // itself, and it needs no timer.
    const isUserScrolling = useRef(false);
    // An attribute is not handed over already loaded: on a fresh page it arrives Loading with no
    // value and the real one follows a render or more later. The list opens on initialScrollIndex and
    // flash-list applies that at most once — from a commit effect, behind a flag it sets true inside a
    // 100ms timer, with no retry afterwards. So whatever the attribute could answer at mount is where
    // the list stays: mounting while it is still Loading opens on slide 1 and leaves it there, while
    // the dots and buttons follow the value that arrives moments later. The two then disagree for
    // good, and the user's first swipe is spent bringing the content into line instead of moving a
    // slide.
    //
    // Unavailable is not worth waiting for — no value is coming, so slide 1 is the right answer
    // rather than a blank wait.
    const activeSlidePending =
        props.activeSlide?.status === ValueStatus.Loading && props.activeSlide.value === undefined;
    // Only ever goes false to true, so reading it while rendering is safe.
    const listMounted = useRef(false);

    // Until the list is mounted the slide it should open on is still free to change, so keep the
    // frozen value current for as long as it is unused — including on the render where the attribute
    // finally arrives, which is the one that mounts the list.
    if (!listMounted.current && !activeSlidePending) {
        initialIndex.current = refreshActiveSlideAttribute(props.slides, props.activeSlide);
        if (initialIndex.current !== activeIndex) {
            // The buttons and dots read activeIndex, so move it along with the frozen value rather
            // than leaving them on slide 1 for the render that mounts the list. Skipped while the
            // attribute is still pending: it can only answer slide 1 then, and writing that back
            // every render would fight anything else that moved the index in the meantime.
            setActiveIndex(initialIndex.current);
        }
    }

    const rtlSafeIndex = useCallback(
        (i: number): number => (isAndroidRTL ? props.slides.length - 1 - i : i),
        [props.slides.length]
    );

    const goToSlide = useCallback(
        (pageNum: number) => {
            setActiveIndex(pageNum);
            if (width > 0 && flashList && flashList.current) {
                flashList.current.scrollToOffset({
                    offset: rtlSafeIndex(pageNum) * width
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
        const pending = pendingWrite.current;
        if (pending) {
            if (slide === pending.replaced) {
                // Our own write has not come back yet: the attribute is still reporting the slide we
                // navigated away from. Acting on it would scroll straight back and, through
                // onSlideChange, overwrite the value we just wrote.
                return;
            }
            // Either the write arrived, or something else wrote in the meantime — and that value wins.
            pendingWrite.current = null;
        }
        if (slide !== activeIndex) {
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
                pendingWrite.current = { replaced: lastIndex };
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

    // A touch has landed on the list, so scrolling from here is the user's doing and the slide it
    // settles on is a real slide change. Nothing the list does on its own — opening scroll,
    // scrollToOffset from goToSlide, an offset correction — passes through here.
    const onScrollBeginDrag = useCallback(() => {
        isUserScrolling.current = true;
    }, []);

    // Which slide is showing comes from the list, not from arithmetic on scroll offsets: flash-list
    // reports viewability from its own scroll handling, so a slide that arrives without a momentum
    // phase — a drag lifted with no velocity — is reported like any other, and the widget no longer
    // has to work out for itself which gesture phase ends a swipe. It only has to know whether the
    // scroll being reported is one the user asked for.
    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
            // Reports also arrive while the list is opening on initialScrollIndex, before it has
            // reached that offset — announcing the slide it is passing rather than the one it was
            // asked for. Acting on those overwrote the active slide attribute with slide 1.
            if (!isUserScrolling.current) {
                return;
            }
            const visible = viewableItems.find(token => token.index !== null);
            if (!visible || visible.index === null) {
                return;
            }
            const newIndex = rtlSafeIndex(visible.index);
            if (newIndex === activeIndex) {
                return;
            }
            const lastIndex = activeIndex;
            setActiveIndex(newIndex);
            onSlideChange(newIndex, lastIndex);
        },
        [activeIndex, rtlSafeIndex, onSlideChange]
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

    // Slides are sized from the measured width, so mount the list only once it is known: earlier
    // lays every slide out at width zero, stacking them all on the first page. Wait for the active
    // slide attribute for the same reason — the list opens on initialScrollIndex and never re-applies
    // it, so mounting before the value is known opens it on the wrong slide and leaves it there.
    //
    // The wait is for the opening value only, which is why it ends for good once the list is up.
    // Every write to the attribute sends it back to Loading with no value while the runtime applies
    // it, and taking the list down again there would unmount the slide just navigated to and reopen
    // on the one it started on — the slide would spring back on every swipe.
    const showList = width > 0 && (listMounted.current || !activeSlidePending);

    // Latched on commit rather than during render: a render React discards must not freeze the slide
    // the list opens on, since nothing has mounted to hold it.
    useEffect(() => {
        if (showList) {
            listMounted.current = true;
        }
    }, [showList]);

    return (
        <View style={styles.flexOne}>
            {showList ? (
                <FlashList
                    testID={props.testID}
                    initialScrollIndex={initialIndex.current}
                    ref={flashList}
                    data={props.slides}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    style={styles.flatList}
                    renderItem={renderItem}
                    onScrollBeginDrag={onScrollBeginDrag}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={VIEWABILITY_CONFIG}
                    scrollEventThrottle={50}
                    // On by default in flash-list 2.x. It anchors the list to whichever item was
                    // first visible and, whenever a re-render moves that item, scrolls by the
                    // difference to hold it in place — which silently undid the scrollToOffset in
                    // goToSlide, leaving the buttons and dots on the new slide while the content
                    // stayed on the old one. Paged slides are all exactly one window wide and every
                    // position here is asked for explicitly, so there is nothing to preserve.
                    maintainVisibleContentPosition={{ disabled: true }}
                    extraData={[width, activeIndex]}
                    onLayout={onLayout}
                    keyExtractor={(_: any, index: number) => "screen_key_" + index}
                    importantForAccessibility="no"
                />
            ) : (
                <View testID={props.testID} style={styles.flatList} onLayout={onLayout} />
            )}
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
