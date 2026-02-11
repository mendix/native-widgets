import { createElement, ReactElement, ReactNode, useCallback, useMemo, useState } from "react";
import { Text, Pressable, View, ViewProps, Platform, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ObjectItem, DynamicValue } from "mendix";
import DeviceInfo from "react-native-device-info";
import { GalleryStyle } from "../ui/Styles";
import { PaginationEnum, ScrollDirectionEnum } from "../../typings/GalleryProps";
import { isAvailable } from "@mendix/piw-utils-internal";
import { extractStyles } from "@mendix/pluggable-widgets-tools";

const DEFAULT_RIPPLE_COLOR = "rgba(0, 0, 0, 0.2)";
const DEFAULT_ITEM_SIZE = 150;

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
    const [measuredItemSize, setMeasuredItemSize] = useState<number>(DEFAULT_ITEM_SIZE);

    const onItemLayout = useCallback(
        (event: any) => {
            const { height, width } = event.nativeEvent.layout;
            const itemSize = isScrollDirectionVertical ? height : width;
            if (itemSize > 0 && measuredItemSize === DEFAULT_ITEM_SIZE) {
                setMeasuredItemSize(itemSize);
            }
        },
        [isScrollDirectionVertical, measuredItemSize]
    );

    const onEndReached = (): void => {
        if (props.pagination === "virtualScrolling" && props.hasMoreItems) {
            props.loadMoreItems();
        }
    };

    const renderItem = useCallback(
        (item: { item: T }): ReactElement =>
            itemRenderer((children, onPress) => {
                const listItemWrapperProps: ViewProps = {
                    style: isScrollDirectionVertical && { width: `${100 / numColumns}%` },
                    testID: `${name}-list-item-${item.item.id}`
                };
                const isFirstItem = firstItemId === item.item.id;
                const renderListItemContent = (
                    <View
                        onLayout={isFirstItem ? onItemLayout : undefined}
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
            isScrollDirectionVertical,
            numColumns,
            itemRenderer,
            name,
            style.listItem,
            style.firstItem,
            style.lastItem,
            firstItemId,
            lastItemId,
            onItemLayout
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.pagination,
        props.hasMoreItems,
        props.loadMoreButtonCaption,
        props.style.loadMoreButtonPressableContainer,
        props.style.loadMoreButtonContainer,
        name,
        props.loadMoreItems
    ]);

    const renderEmptyPlaceholder = (): ReactElement => (
        <View style={props.style.emptyPlaceholder}>{props.emptyPlaceholder}</View>
    );

    return (
        <View
            testID={`${name}`}
            style={[props.style.container, !isScrollDirectionVertical && { flexDirection: "row" }]}
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
                style={props.style.list}
                testID={`${name}-list`}
                estimatedItemSize={measuredItemSize}
            />
        </View>
    );
};
