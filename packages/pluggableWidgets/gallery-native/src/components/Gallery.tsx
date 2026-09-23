import { ReactElement, ReactNode, useCallback, useMemo, useState } from "react";
import { Text, Pressable, View, ViewProps, Platform, TouchableOpacity, useWindowDimensions } from "react-native";
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
    const { width, height: windowHeight } = useWindowDimensions();
    // FlashList is virtualized and only renders items that fit within its own height, so it needs a
    // non-zero height. The list area is sized from FlashList's reported content height instead of flex.
    const [contentHeight, setContentHeight] = useState(0);

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

    const onContentSizeChange = useCallback((_width: number, height: number): void => {
        if (height > 0) {
            setContentHeight(height);
        }
    }, []);

    const hasItems = props.items && props.items.length > 0;

    // Shrink to the available space when the content is larger, so widgets below the gallery stay visible.
    const containerStyle =
        isScrollDirectionVertical && hasItems ? [{ flexShrink: 1 }, props.style.container] : props.style.container;

    // The list area is sized by its content, capped at the window height; beyond that FlashList scrolls
    // internally. Starting at 1 lets FlashList render its first items and report their content size.
    const listAreaStyle = isScrollDirectionVertical
        ? { height: Math.min(Math.max(contentHeight, 1), windowHeight), flexShrink: 1 }
        : undefined;

    const listStyle = isScrollDirectionVertical ? [{ flex: 1 }, props.style.list] : props.style.list;

    return (
        <View testID={`${name}`} style={containerStyle}>
            {props.filters ? <View>{props.filters}</View> : null}
            {!hasItems && renderEmptyPlaceholder}
            {hasItems ? (
                <View style={listAreaStyle}>
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
                        onEndReached={onEndReached}
                        onEndReachedThreshold={0.6}
                        scrollEventThrottle={50}
                        renderItem={renderItem}
                        style={listStyle}
                        nestedScrollEnabled
                        testID={`${name}-list`}
                        onContentSizeChange={isScrollDirectionVertical ? onContentSizeChange : undefined}
                    />
                </View>
            ) : null}
        </View>
    );
};
