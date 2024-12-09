import { createElement, ReactElement, ReactNode } from "react";
import { Text, FlatList, Pressable, View, ViewProps, Platform, TouchableOpacity } from "react-native";
import { ObjectItem, DynamicValue } from "mendix";
import DeviceInfo from "react-native-device-info";
import { GalleryStyle } from "../ui/Styles";
import { PaginationEnum, ScrollDirectionEnum } from "../../typings/GalleryProps";
import { isAvailable } from "@mendix/piw-utils-internal";
import { extractStyles } from "@mendix/pluggable-widgets-tools";

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
    showScrollIndicator: boolean;
    style: GalleryStyle;
    tabletColumns: number;
}

export const Gallery = <T extends ObjectItem>(props: GalleryProps<T>): ReactElement => {
    const isScrollDirectionVertical = props.scrollDirection === "vertical";
    const numColumns = DeviceInfo.isTablet() ? props.tabletColumns : props.phoneColumns;
    const firstItemId = props.items?.[0]?.id;
    const lastItemId = props.items?.[props.items.length - 1]?.id;

    const onEndReached = (): void => {
        if (props.pagination === "virtualScrolling" && props.hasMoreItems) {
            props.loadMoreItems();
        }
    };

    const renderItem = (item: { item: T }): ReactElement =>
        props.itemRenderer((children, onPress) => {
            const listItemWrapperProps: ViewProps = {
                style: isScrollDirectionVertical && { width: `${100 / numColumns}%` },
                testID: `${props.name}-list-item-${item.item.id}`
            };
            const renderListItemContent = (
                <View
                    style={[
                        props.style.listItem,
                        firstItemId === item.item.id && props.style.firstItem,
                        lastItemId === item.item.id && props.style.lastItem
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
        }, item.item);

    const loadMoreButton = (): ReactElement | null => {
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
            testID: `${props.name}-pagination-button`,
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
    };

    const renderEmptyPlaceholder = (): ReactElement => (
        <View style={props.style.emptyPlaceholder}>{props.emptyPlaceholder}</View>
    );

    return (
        <View testID={`${props.name}`} style={props.style.container}>
            {props.filters ? <View>{props.filters}</View> : null}
            <FlatList
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
                scrollEventThrottle={50}
                renderItem={renderItem}
                style={props.style.list}
                testID={`${props.name}-list`}
                showsHorizontalScrollIndicator={!isScrollDirectionVertical && props.showScrollIndicator}
                showsVerticalScrollIndicator={isScrollDirectionVertical && props.showScrollIndicator}
            />
        </View>
    );
};
