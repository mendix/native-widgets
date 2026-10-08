import { Fragment, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Text,
    View
} from "react-native";
import { CarouselProps } from "../typings/CarouselProps";
import { CarouselStyle, defaultCarouselStyle, LayoutStyle } from "./ui/styles";
import { Pagination } from "./components/Pagination";
import deepmerge from "deepmerge";
import { ObjectItem, ValueStatus } from "mendix";

export const Carousel = (props: CarouselProps<CarouselStyle>): ReactElement => {
    const [sliderDimensions, setSliderDimensions] = useState({
        slider: { width: 0, height: 0 },
        slide: { width: 0, height: 0 }
    });

    const customStyles = props.style ? props.style.filter(o => o != null) : [];

    const styles = deepmerge.all<CarouselStyle>([defaultCarouselStyle, ...customStyles]);

    const layoutSpecificStyle: LayoutStyle =
        props.layout === "fullWidth" ? styles.fullWidthLayout! : styles.cardLayout!;

    const listRef = useRef<FlatList<ObjectItem>>(null);
    // Drives the per-item scale/opacity below; native-driven, so it never touches the JS thread while scrolling.
    const [scrollX] = useState(() => new Animated.Value(0));

    const [activeSlide, setActiveSlide] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (props.contentSource?.status === ValueStatus.Available) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing external data source status to loading state
            setLoading(false);
        }
    }, [props.contentSource]);

    const itemWidth = sliderDimensions.slide.width;
    const sliderWidth = sliderDimensions.slider.width;
    // Centering leaves equal space on both sides so the neighbouring cards peek in; "start" flushes the active
    // card against the leading edge instead. Either way the trailing space is topped up so the last card can
    // still reach the same resting position as every other one.
    const sidePadding = props.activeSlideAlignment === "center" ? Math.max(0, (sliderWidth - itemWidth) / 2) : 0;
    const endPadding = Math.max(0, sliderWidth - itemWidth - sidePadding);

    const inactiveScale = layoutSpecificStyle.inactiveSlideItem?.scale ?? 1;
    const inactiveOpacity = layoutSpecificStyle.inactiveSlideItem?.opacity ?? 1;

    const onScroll = useMemo(
        () => Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true }),
        [scrollX]
    );

    // Reads the settled scroll position directly, rather than relying on onSnapToItem-style callbacks, so it
    // works the same whether the list stopped on its own (onScrollEndDrag) or after momentum (onMomentumScrollEnd).
    const updateActiveSlide = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const itemCount = props.contentSource.items?.length;
            if (itemWidth <= 0 || !itemCount) {
                return;
            }
            const index = Math.min(
                Math.max(Math.round(event.nativeEvent.contentOffset.x / itemWidth), 0),
                itemCount - 1
            );
            setActiveSlide(previous => (previous === index ? previous : index));
        },
        [itemWidth, props.contentSource.items]
    );

    const renderItem = useCallback(
        ({ item, index }: { item: ObjectItem; index: number }) => {
            // slideItem's own width is a percentage string ("70%"); unlike the library we replaced, nothing
            // else sizes this cell on the scroll axis, so we must set it ourselves, from the pixel value onLayout
            // already resolved that percentage to.
            let viewStyle = layoutSpecificStyle.slideItem;
            if (viewStyle) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { width, ...styleWithoutWidth } = viewStyle;
                viewStyle = { ...styleWithoutWidth, width: itemWidth };
            }

            // Fades and shrinks this card as it moves a full item-width away from the active position in
            // either direction, so the transition tracks the finger instead of jumping on snap.
            const position = index * itemWidth;
            const inputRange = [position - itemWidth, position, position + itemWidth];
            const animatedStyle = {
                opacity: scrollX.interpolate({
                    inputRange,
                    outputRange: [inactiveOpacity, 1, inactiveOpacity],
                    extrapolate: "clamp" as const
                }),
                transform: [
                    {
                        scale: scrollX.interpolate({
                            inputRange,
                            outputRange: [inactiveScale, 1, inactiveScale],
                            extrapolate: "clamp" as const
                        })
                    }
                ]
            };

            return (
                <Animated.View
                    style={[{ ...viewStyle }, animatedStyle]}
                    testID={`${props.name}$content$${index}`}
                    accessible
                >
                    {props.content.get(item)}
                </Animated.View>
            );
        },
        [layoutSpecificStyle.slideItem, itemWidth, scrollX, inactiveOpacity, inactiveScale, props.content, props.name]
    );

    const getItemLayout = useCallback(
        (_data: ArrayLike<ObjectItem> | undefined, index: number) => ({
            length: itemWidth,
            offset: index * itemWidth,
            index
        }),
        [itemWidth]
    );

    const onDotPress = useCallback((index: number) => {
        listRef.current?.scrollToIndex({ index, animated: true });
    }, []);

    const renderPagination = useCallback(() => {
        if (!props.showPagination) {
            return null;
        }

        const contentLength = props.contentSource.items!.length;
        const paginationOverflow = contentLength > 5;
        const { pagination } = layoutSpecificStyle;

        if (paginationOverflow) {
            return (
                <View style={pagination.container} testID={`${props.name}$pagination`}>
                    <Text style={pagination.text}>
                        {activeSlide + 1}/{contentLength}
                    </Text>
                </View>
            );
        }

        const { color: dotColor, ...dotStyles } = pagination.dotStyle || {};
        const {
            color: inActiveDotColor,
            opacity: inActiveDotOpacity,
            scale: inActiveDotScale,
            ...inActiveDotStyles
        } = pagination.inactiveDotStyle || {};

        return (
            <Pagination
                testID={`${props.name}$pagination`}
                dotsLength={contentLength}
                activeDotIndex={activeSlide}
                containerStyle={pagination.container}
                dotContainerStyle={pagination.dotContainerStyle}
                dotColor={dotColor}
                dotStyle={dotStyles}
                inactiveDotStyle={inActiveDotStyles}
                inactiveDotColor={inActiveDotColor}
                inactiveDotOpacity={inActiveDotOpacity}
                inactiveDotScale={inActiveDotScale}
                onDotPress={onDotPress}
                accessibilityLabel={`${props.name}$pagination`}
            />
        );
    }, [activeSlide, onDotPress, props.contentSource, props.showPagination, props.name, layoutSpecificStyle]);

    const onLayout = (event: LayoutChangeEvent) => {
        let viewHeight = event.nativeEvent.layout.height;
        const viewWidth = event.nativeEvent.layout.width;

        let newItemWidth = 0;
        let newItemHeight = 0;

        if (layoutSpecificStyle.slideItem) {
            const { width: slideItemWidth, height: slideItemHeight } = layoutSpecificStyle.slideItem;
            // We calculate the actual number value in order to
            // allow users to set width and height as percentage since lib only accepts numbers

            if (typeof slideItemWidth === "string" && slideItemWidth.includes("%")) {
                const percentage = +slideItemWidth.replace("%", "");
                newItemWidth = (viewWidth * percentage) / 100;
            } else {
                newItemWidth = Number(slideItemWidth);
            }
            if (typeof slideItemHeight === "string" && slideItemHeight.includes("%")) {
                const percentage = +slideItemHeight.replace("%", "");
                newItemHeight = (viewWidth * percentage) / 100;
            } else {
                newItemHeight = Number(slideItemHeight);
            }

            if (styles.container?.height === undefined && newItemHeight > 0) {
                viewHeight = newItemHeight;
            }
        }

        setSliderDimensions({
            slider: { width: viewWidth, height: viewHeight },
            slide: { width: newItemWidth, height: newItemHeight }
        });
    };

    return (
        <View style={styles.container} onLayout={onLayout} testID={props.name}>
            {loading ? (
                <ActivityIndicator color={layoutSpecificStyle.indicator!.color} size="large" />
            ) : (
                // A horizontal FlatList needs an explicit width/height; it won't infer either from its parent.
                sliderDimensions.slide.width > 0 &&
                sliderDimensions.slider.width > 0 &&
                props.contentSource &&
                props.contentSource.items &&
                props.contentSource.items?.length > 0 && (
                    <Fragment>
                        <Animated.FlatList<ObjectItem>
                            ref={listRef}
                            testID={`${props.name}$carousel`}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ width: sliderWidth, height: sliderDimensions.slider.height }}
                            contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: endPadding }}
                            data={props.contentSource.items}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                            getItemLayout={getItemLayout}
                            snapToInterval={itemWidth}
                            decelerationRate={0.9}
                            onScroll={onScroll}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={updateActiveSlide}
                            onScrollEndDrag={updateActiveSlide}
                        />
                        {renderPagination()}
                    </Fragment>
                )
            )}
        </View>
    );
};
