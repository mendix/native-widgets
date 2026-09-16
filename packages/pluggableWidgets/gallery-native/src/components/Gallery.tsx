import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    LayoutChangeEvent,
    Text,
    Pressable,
    View,
    ViewProps,
    Platform,
    TouchableOpacity,
    useWindowDimensions
} from "react-native";
import { ObjectItem, DynamicValue } from "mendix";
import DeviceInfo from "react-native-device-info";
import { GalleryStyle } from "../ui/Styles";
import { PaginationEnum, ScrollDirectionEnum } from "../../typings/GalleryProps";
import { isAvailable } from "@mendix/piw-utils-internal";
import { extractStyles } from "@mendix/pluggable-widgets-tools";
import { FlashList } from "@shopify/flash-list";

const DEFAULT_RIPPLE_COLOR = "rgba(0, 0, 0, 0.2)";

export interface GalleryProps<T extends ObjectItem> {
    emptyPlaceholder?: ReactNode;
    hasMoreItems: boolean;
    itemRenderer: (renderWrapper: (children: ReactNode, onClick?: () => void) => ReactElement, item: T) => ReactElement;
    items: T[] | undefined;
    loadMoreItems: () => void;
    filters?: ReactNode;
    name: string;
    pagination: PaginationEnum;
    loadMoreButtonCaption?: DynamicValue<string>;
    phoneColumns: number;
    pullDown?: () => void;
    pullDownIsExecuting?: boolean;
    scrollDirection: ScrollDirectionEnum;
    style: GalleryStyle;
    tabletColumns: number;
}

export const Gallery = <T extends ObjectItem>(props: GalleryProps<T>): ReactElement => {
    const isScrollDirectionVertical = props.scrollDirection === "vertical";
    const numColumns = DeviceInfo.isTablet() ? props.tabletColumns : props.phoneColumns;
    const firstItemId = props.items?.[0]?.id;
    const lastItemId = props.items?.[props.items.length - 1]?.id;
    const { name, style, itemRenderer } = props;
    const { width } = useWindowDimensions();
    // FlashList requires a non-zero height to render items (it's virtualized and needs viewport dimensions).
    // When the parent provides height (e.g. via flex), we use flex: 1. When it doesn't (e.g. a Container
    // widget with no flex/height), flex: 1 resolves to 0 and nothing renders. In that case, we fall back
    // to minHeight based on FlashList's reported content size. This matches the ListView widget's approach.
    const wrapperRef = useRef<View>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [layoutDecision, setLayoutDecision] = useState<"minHeight" | "flex" | null>(null);

    const onEndReached = (): void => {
        if (props.pagination === "virtualScrolling" && props.hasMoreItems) {
            props.loadMoreItems();
        }
    };

    const renderItem = useCallback(
        (item: { item: T }): ReactElement =>
            itemRenderer((children, onPress) => {
                const itemStyle = isScrollDirectionVertical ? undefined : { width };
                const listItemWrapperProps: ViewProps = {
                    style: itemStyle,
                    testID: `${name}-list-item-${item.item.id}`
                };
                const renderListItemContent = (
                    <View
                        style={[
                            style.listItem,
                            firstItemId === item.item.id && style.firstItem,
                            lastItemId === item.item.id && style.lastItem
                        ]}
                    >
                        {children}
                    </View>
                );
                return onPress ? (
                    <Pressable {...listItemWrapperProps} onPress={onPress}>
                        {renderListItemContent}
                    </Pressable>
                ) : (
                    <View {...listItemWrapperProps}>{renderListItemContent}</View>
                );
            }, item.item),
        [
            itemRenderer,
            isScrollDirectionVertical,
            width,
            name,
            style.listItem,
            style.firstItem,
            style.lastItem,
            firstItemId,
            lastItemId
        ]
    );

    const loadMoreButton = useMemo((): ReactElement | null => {
        const renderButton = (
            <Text style={props.style.loadMoreButtonCaption}>
                {props.loadMoreButtonCaption && isAvailable(props.loadMoreButtonCaption)
                    ? props.loadMoreButtonCaption.value
                    : "Load more"}
            </Text>
        );

        const [pressableRippleProps, loadMoreButtonContainerStyle] = extractStyles(
            props.style.loadMoreButtonPressableContainer,
            ["rippleColor", "borderless", "radius", "foreground"]
        );

        const buttonProps = {
            testID: `${name}-pagination-button`,
            onPress: () => props.hasMoreItems && props.loadMoreItems && props.loadMoreItems(),
            style: loadMoreButtonContainerStyle
        };

        return props.pagination === "buttons" && props.hasMoreItems ? (
            Platform.OS === "android" ? (
                <Pressable
                    {...buttonProps}
                    {...(pressableRippleProps
                        ? {
                              android_ripple: {
                                  ...pressableRippleProps,
                                  color: pressableRippleProps.rippleColor ?? DEFAULT_RIPPLE_COLOR
                              }
                          }
                        : {})}
                >
                    {renderButton}
                </Pressable>
            ) : (
                <TouchableOpacity {...buttonProps}>{renderButton}</TouchableOpacity>
            )
        ) : null;
    }, [
        props.style.loadMoreButtonCaption,
        props.loadMoreButtonCaption,
        props.style.loadMoreButtonPressableContainer,
        name,
        props.pagination,
        props.hasMoreItems,
        props.loadMoreItems
    ]);

    const renderEmptyPlaceholder = useMemo(
        (): ReactElement => <View style={props.style.emptyPlaceholder}>{props.emptyPlaceholder}</View>,
        [props.style.emptyPlaceholder, props.emptyPlaceholder]
    );

    const handleWrapperLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0 && layoutDecision === null) {
                setLayoutDecision("flex");
            }
        },
        [layoutDecision]
    );

    useEffect(() => {
        if (contentHeight > 0 && layoutDecision === null && wrapperRef.current) {
            wrapperRef.current.measure((_x, _y, _width, height) => {
                setLayoutDecision(height > 0 ? "flex" : "minHeight");
            });
        }
    }, [contentHeight, layoutDecision]);

    const containerStyle = isScrollDirectionVertical
        ? layoutDecision === "minHeight"
            ? [{ minHeight: Math.max(contentHeight, 1) }, props.style.container]
            : [{ flex: 1 }, props.style.container]
        : props.style.container;

    const listStyle = isScrollDirectionVertical ? [{ flex: 1 }, props.style.list] : props.style.list;

    return (
        <View
            testID={`${name}`}
            style={containerStyle}
            ref={wrapperRef}
            onLayout={isScrollDirectionVertical ? handleWrapperLayout : undefined}
        >
            {props.filters ? <View>{props.filters}</View> : null}
            <FlashList
                {...(isScrollDirectionVertical && props.pullDown ? { onRefresh: props.pullDown } : {})}
                {...(isScrollDirectionVertical ? { numColumns } : {})}
                ListFooterComponent={loadMoreButton}
                ListFooterComponentStyle={{
                    ...props.style.loadMoreButtonContainer,
                    ...(isScrollDirectionVertical ? { marginTop: 8 } : { marginStart: 8 })
                }}
                refreshing={props.pullDownIsExecuting}
                data={props.items}
                horizontal={!isScrollDirectionVertical}
                keyExtractor={item => item.id}
                ListEmptyComponent={renderEmptyPlaceholder}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.6}
                scrollEventThrottle={50}
                renderItem={renderItem}
                style={listStyle}
                testID={`${name}-list`}
                onContentSizeChange={isScrollDirectionVertical ? (_w, h) => setContentHeight(h) : undefined}
            />
        </View>
    );
};
