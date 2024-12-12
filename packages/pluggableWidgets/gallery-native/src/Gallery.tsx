import { all } from "deepmerge";
import { createElement, ReactElement, useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
    executeAction,
    FilterType,
    useFilterContext,
    useMultipleFiltering,
    FilterFunction
} from "@mendix/piw-utils-internal";
import { and } from "mendix/filters/builders";
import { defaultGalleryStyle, GalleryStyle } from "./ui/Styles";
import { extractFilters } from "./utils/filters";
import { FilterCondition } from "mendix/filters";
import { Gallery as GalleryComponent, GalleryProps as GalleryComponentProps } from "./components/Gallery";
import { GalleryProps } from "../typings/GalleryProps";
import { ObjectItem, ValueStatus } from "mendix";

export const Gallery = (props: GalleryProps<GalleryStyle>): ReactElement => {
    const viewStateFilters = useRef<FilterCondition | undefined>(undefined);
    const [filtered, setFiltered] = useState(false);
    const customFiltersState = useMultipleFiltering();
    const { FilterContext } = useFilterContext();
    const styles = all<GalleryStyle>([defaultGalleryStyle, ...props.style]);
    const currentPage = props.datasource.limit / props.pageSize;

    useEffect(() => {
        if (props.datasource.limit === Number.POSITIVE_INFINITY) {
            props.datasource.setLimit(props.pageSize);
        }
    }, [props.datasource, props.pageSize]);

    useEffect(() => {
        if (props.datasource.status === ValueStatus.Available) {
            props.datasource.reload();
        }
    }, [props.datasource.items, props.datasource.status]);

    useEffect(() => {
        if (props.datasource.filter && !filtered && !viewStateFilters.current) {
            viewStateFilters.current = props.datasource.filter;
        }
    }, [props.datasource, filtered]);

    const filterList = useMemo(
        () => props.filterList.reduce((filters, { filter }) => ({ ...filters, [filter.id]: filter }), {}),
        [props.filterList]
    );

    const initialFilters = useMemo(
        () =>
            props.filterList.reduce(
                (filters, { filter }) => ({
                    ...filters,
                    [filter.id]: extractFilters(filter, viewStateFilters.current)
                }),
                {}
            ),
        [props.filterList, viewStateFilters.current]
    );

    const filters = Object.keys(customFiltersState)
        .map((key: FilterType) => customFiltersState[key][0]?.getFilterCondition())
        .filter((filter): filter is FilterCondition => filter !== undefined);

    if (filters.length > 0) {
        props.datasource.setFilter(filters.length > 1 ? and(...filters) : filters[0]);
    } else if (filtered) {
        props.datasource.setFilter(undefined);
    } else {
        props.datasource.setFilter(viewStateFilters.current);
    }

    const loadMoreItems = useCallback(() => {
        props.datasource.setLimit((currentPage + 1) * props.pageSize);
    }, [currentPage, props.datasource, props.pageSize]);

    const itemRenderer: GalleryComponentProps<ObjectItem>["itemRenderer"] = useCallback(
        (renderWrapper, item) =>
            renderWrapper(
                props.content?.get(item),
                props.onClick ? () => executeAction(props.onClick?.get(item)) : undefined
            ),
        [props.content, props.onClick]
    );

    const pullDown = useCallback(() => props.pullDown && executeAction(props.pullDown), [props.pullDown]);

    const isFilterable = props.filterList.length > 0;
    const filterContextProvider = useMemo(
        () =>
            isFilterable ? (
                <FilterContext.Provider
                    value={{
                        filterDispatcher: (prev: FilterFunction) => {
                            if (prev.filterType) {
                                const [, filterDispatcher] = customFiltersState[prev.filterType];
                                filterDispatcher(prev);
                                setFiltered(true);
                            }
                            return prev;
                        },
                        multipleAttributes: filterList,
                        multipleInitialFilters: initialFilters
                    }}
                >
                    {props.filtersPlaceholder}
                </FilterContext.Provider>
            ) : null,
        [FilterContext, customFiltersState, filterList, initialFilters, isFilterable, props.filtersPlaceholder]
    );

    return (
        <GalleryComponent
            emptyPlaceholder={props.emptyPlaceholder}
            hasMoreItems={props.datasource.hasMoreItems ?? false}
            itemRenderer={itemRenderer}
            items={props.datasource.items ?? []}
            filters={filterContextProvider}
            loadMoreItems={loadMoreItems}
            name={props.name}
            pagination={props.pagination}
            loadMoreButtonCaption={props.loadMoreButtonCaption}
            phoneColumns={props.phoneColumns}
            pullDown={props.pullDown && pullDown}
            pullDownIsExecuting={props.pullDown?.isExecuting ?? false}
            scrollDirection={props.scrollDirection}
            style={styles}
            tabletColumns={props.tabletColumns}
        />
    );
};
