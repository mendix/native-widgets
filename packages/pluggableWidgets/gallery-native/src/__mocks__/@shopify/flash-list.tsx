import React from "react";
import { View } from "react-native";

// Mock FlashList - render items directly without using FlatList
export const FlashList = React.forwardRef((props: any) => {
    const {
        data = [],
        renderItem,
        ListEmptyComponent,
        ListFooterComponent,
        ListHeaderComponent,
        onRefresh,
        ...rest
    } = props;

    // simulate the refreshControl structure returned by real FlashList
    const refreshControl = onRefresh ? { props: { onRefresh } } : undefined;

    const renderItems = (): any => {
        if (!data || data.length === 0) {
            return ListEmptyComponent;
        }

        return data.map((item: any, index: number) => (
            <View key={item.id || index}>{renderItem?.({ item, index })}</View>
        ));
    };

    return (
        <View {...rest} refreshControl={refreshControl}>
            {ListHeaderComponent}
            {renderItems()}
            {ListFooterComponent}
        </View>
    );
});

FlashList.displayName = "FlashList";
