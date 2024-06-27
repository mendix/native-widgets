import { createElement, Fragment, ReactElement, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, LayoutChangeEvent, Platform, Text, View } from "react-native";
import { CarouselProps } from "../typings/CarouselProps";
import { CarouselStyle, defaultCarouselStyle, LayoutStyle } from "./ui/styles";
import { default as NativeCarousel, Pagination } from "react-native-snap-carousel";
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

    const [carouselRef, setCarouselRef] = useState(undefined);

    const [activeSlide, setActiveSlide] = useState(0);

    const [firstItem, setFirstItem] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (props.contentSource?.status === ValueStatus.Available && loading) {
            // Set initial index of the first item to show the associated active selection.
            const index =
                (props.activeSelection?.value
                    ? props.contentSource?.items?.findIndex(i => i.id === props.activeSelection?.value?.id)
                    : 0) ?? 0;
            setFirstItem(index);
            setActiveSlide(index);
            setLoading(false);
        }
    }, [loading, props.activeSelection, props.contentSource]);

    useEffect(() => {
        if (
            carouselRef &&
            props.contentSource.status === "available" &&
            props.activeSelection?.status === "available"
        ) {
            let index = props.contentSource.items?.findIndex(i => i.id === props.activeSelection?.value?.id) ?? 0;
            // Removed item that is active selection can not be found
            index = index >= 0 ? index : 0;
            // Should check carouselRef.currentIndex though this is not fast enough for update.
            if (index !== activeSlide) {
                // Update carousel when associated item is changed
                setActiveSlide(index);
                const animate = props.animateExpression?.value ?? true;
                // Async snap to index, use case add item is added before current selected
                setTimeout(() => {
                    (carouselRef as NativeCarousel<ObjectItem>).snapToItem(index, animate);
                }, 1);
            }
        }
    }, [activeSlide, carouselRef, props.activeSelection, props.animateExpression, props.contentSource]);

    useEffect(() => {
        if (props.contentSource.status === "available" && props.activeSelection?.status === "available") {
            // Check if selected item is still available, reset to index 0 or null
            let item = props.contentSource.items?.find(i => i.id === props.activeSelection?.value?.id);
            if (item == null) {
                item = props.contentSource.items?.[0];
            }
            if (props.activeSelection.value?.id !== item?.id) {
                // Set association when empty to first slide
                props.activeSelection.setValue(item);
            }
        }
    }, [props.activeSelection, props.contentSource]);

    const onSnap = useCallback(
        (index: number) => {
            setActiveSlide(index);
            if (props.activeSelection) {
                const item = props.contentSource?.items?.[index];
                if (item?.id !== props.activeSelection.value?.id) {
                    props.activeSelection.setValue(item);
                }
            }
        },
        [props.activeSelection, props.contentSource]
    );

    const renderItem = useCallback(({ item, index }: { item: ObjectItem; index: number }) => {
        const viewStyle = layoutSpecificStyle.slideItem;
        if (viewStyle) {
            // We don't want to pass the already processed height to the item container
            delete viewStyle.width;
        }

        return (
            <View key={index} style={{ ...viewStyle }} testID={`${props.name}$content$${index}`} accessible>
                {props.content.get(item)}
            </View>
        );
    }, []);

    const renderPagination = useCallback(() => {
        if (!props.showPagination || carouselRef === undefined) {
            return null;
        }

        const contentLength = props.contentSource.items!.length;
        const paginationOverflow = contentLength > 5;
        const { pagination } = layoutSpecificStyle;

        const a11yProps = { accessibilityLabel: `${props.name}$pagination` };

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
                carouselRef={carouselRef}
                tappableDots
                {...a11yProps}
            />
        );
    }, [activeSlide, carouselRef, props.contentSource, props.showPagination]);

    const onLayout = (event: LayoutChangeEvent): void => {
        let viewHeight = event.nativeEvent.layout.height;
        const viewWidth = event.nativeEvent.layout.width;

        let itemWidth = 0;
        let itemHeight = 0;

        if (layoutSpecificStyle.slideItem) {
            const { width: slideItemWidth, height: slideItemHeight } = layoutSpecificStyle.slideItem;
            // We calculate the actual number value in order to
            // allow users to set width and height as percentage since lib only accepts numbers

            if (typeof slideItemWidth === "string" && slideItemWidth.includes("%")) {
                const percentage = +slideItemWidth.replace("%", "");
                itemWidth = (viewWidth * percentage) / 100;
            } else {
                itemWidth = Number(slideItemWidth);
            }
            if (typeof slideItemHeight === "string" && slideItemHeight.includes("%")) {
                const percentage = +slideItemHeight.replace("%", "");
                itemHeight = (viewWidth * percentage) / 100;
            } else {
                itemHeight = Number(slideItemHeight);
            }

            if (styles.container?.height === undefined && itemHeight > 0) {
                viewHeight = itemHeight;
            }
        }

        setSliderDimensions({
            slider: { width: viewWidth, height: viewHeight },
            slide: { width: itemWidth, height: itemHeight }
        });
    };

    return (
        <View style={styles.container} onLayout={onLayout} testID={props.name}>
            {loading ? (
                <ActivityIndicator color={layoutSpecificStyle.indicator!.color} size="large" />
            ) : (
                /* library ignores width/height if its vertical/horizontal */
                sliderDimensions.slide.width > 0 &&
                sliderDimensions.slider.width > 0 &&
                props.contentSource &&
                props.contentSource.items &&
                props.contentSource.items?.length > 0 && (
                    <Fragment>
                        <NativeCarousel
                            testID={`${props.name}$carousel`}
                            activeSlideAlignment={props.activeSlideAlignment}
                            layout="default"
                            firstItem={firstItem}
                            useScrollView
                            enableSnap
                            data={props.contentSource.items}
                            renderItem={renderItem}
                            sliderWidth={sliderDimensions.slider.width}
                            sliderHeight={sliderDimensions.slider.height}
                            itemWidth={sliderDimensions.slide.width}
                            itemHeight={sliderDimensions.slide.height}
                            inactiveSlideScale={layoutSpecificStyle.inactiveSlideItem?.scale}
                            inactiveSlideOpacity={layoutSpecificStyle.inactiveSlideItem?.opacity}
                            onSnapToItem={onSnap}
                            ref={(r: any) => setCarouselRef(r)}
                            enableMomentum={Platform.OS === "android"}
                            decelerationRate={0.9}
                        />
                        {renderPagination()}
                    </Fragment>
                )
            )}
        </View>
    );
};
