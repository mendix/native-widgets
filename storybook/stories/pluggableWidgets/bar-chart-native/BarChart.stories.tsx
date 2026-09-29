import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { ValueStatus } from "mendix";
import { Big } from "big.js";
import { BarChart } from "../../../../packages/pluggableWidgets/bar-chart-native/src/BarChart";
import type { BarChartStyle } from "../../../../packages/pluggableWidgets/bar-chart-native/src/ui/Styles";
import type { BarSeriesType } from "../../../../packages/pluggableWidgets/bar-chart-native/typings/BarChartProps";
import { dynamicValue, listAttributeValue, listValue } from "../../shared/mendixValues";
import type { Row } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * The bar chart is meant to be the column chart on its side. As of widget version 3.2.1 it does not
 * render that way, and every story below shows the broken output rather than the intended one.
 *
 * Victory has no horizontal bar component, so there are two mechanisms for getting one and this widget
 * applies both. `SeriesLoader.ts` pre-swaps the axes, writing the user's X attribute into each data
 * point's `y` and the Y attribute into `x`; then `BarChart.tsx` also passes `horizontal` to
 * `VictoryBar`, and `victory-bar` responds by swapping the two scales' output ranges itself
 * (`helper-methods.js`: the x scale is given `range.y` and the y scale `range.x`). The flips compound
 * and cancel, which is visible in two ways:
 *
 *  - The chart is transposed. The value scale runs up the *left* edge and the categories sit along the
 *    *bottom*, so a bar's vertical position is its value and its length is only its category's ordinal
 *    position. In `SortOrder` below, West's bar is correctly placed at 210 on the left axis and is also
 *    the longest bar purely because "West" is the fourth category — the length carries no data.
 *  - `showLabels` prints the category. The label callback reads `datum.y`, which after the pre-swap
 *    holds the X attribute, so every bar is captioned "North", "East", … instead of 120, 180, ….
 *    The column chart reads `datum.y` too and gets the value, because it does not pre-swap.
 *
 * Both are the widget's, not the stories': the props here are ordinary, and `staticXAttribute` really is
 * the category and `staticYAttribute` really is the value. Fixing it means dropping one of the two flips,
 * which is outside what these stories are for — they are the reproduction.
 *
 * The fixed heights and the module-scope series are for the same reasons as in the column chart: the
 * chart renders nothing until `onLayout` gives it a size, and `useSeries` re-runs on the series array by
 * identity, so an array built inside `render` would set state and loop.
 */
const atlas = atlasStyle("com.mendix.widget.native.barchart.BarChart") as BarChartStyle[];

const styles = StyleSheet.create({
    box: { height: 260 },
    tall: { height: 320 }
});

function series(rows: Row[], name: string, customBarStyle = "", status?: ValueStatus): BarSeriesType {
    const source = listValue(rows, { status });
    return {
        dataSet: "static",
        staticDataSource: source.value,
        staticSeriesName: dynamicValue(name),
        staticXAttribute: listAttributeValue(source, "x"),
        staticYAttribute: listAttributeValue(source, "y", (value: Big) => value.round(0).toString()),
        staticCustomBarStyle: customBarStyle
    };
}

const byRegion = (values: number[]): Row[] =>
    values.map((y, index) => ({ x: ["North", "East", "South", "West"][index], y: new Big(y) }));

const thisYear = byRegion([120, 180, 90, 210]);
const lastYear = byRegion([80, 110, 70, 140]);

const twoSeries = [series(thisYear, "2024"), series(lastYear, "2023")];
const oneSeries = [series(thisYear, "2024")];
const unnamed = [
    { ...series(thisYear, ""), staticSeriesName: undefined },
    { ...series(lastYear, ""), staticSeriesName: undefined }
];
const keyed = [series(thisYear, "2024", "current"), series(lastYear, "2023", "previous")];
const loadingSeries = [series(thisYear, "2024", "", ValueStatus.Loading)];
const emptySeries = [series([], "2024")];

/**
 * Atlas, plus the two things it leaves unset that a chart does not look right without.
 *
 * The widget always passes Victory a background fill taken from `grid.backgroundColor`, and Atlas never
 * sets it — so the fill is `undefined`, which overrides Victory's own theme with nothing and leaves the
 * grid rect black. Every chart on an unmodified Atlas theme looks like that. `domain.padding.x` is the
 * category spacing; the widget hands it to Victory as the *y* padding, which is correct for the intended
 * horizontal layout and, given the transposition described above, currently spaces the value axis instead.
 */
const chartStyle = atlas.concat([
    { domain: { padding: { x: 28 } }, grid: { backgroundColor: variables.background.primary } }
]);

const baseProps = {
    name: "bar-chart",
    style: chartStyle,
    presentation: "grouped" as const,
    sortOrder: "ascending" as const,
    showLabels: false,
    showLegend: true,
    barSeries: twoSeries
};

const meta = {
    title: "Widgets/BarChart",
    component: BarChart,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof BarChart>;

export default meta;

/**
 * Two series, coloured from Atlas's brand palette, with a legend below — and transposed, per the header.
 *
 * `args` as well as a `render`, unlike the stories below it: the args feed Storybook's controls panel and
 * the render only puts the chart in a sized box, so this is the one to change a property on and watch.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps,
    render: args => (
        <View style={styles.box}>
            <BarChart {...args} />
        </View>
    )
};

/**
 * Grouped against stacked.
 *
 * Grouped draws one bar per series in each category and compares them; stacked lays them end to end, so
 * the length of the bar is the total. `barsOffset` in the theme is the gap between grouped bars and does
 * nothing when stacked.
 */
export const Presentation: StoryObj<typeof BarChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="grouped — one bar per year, per region">
                <View style={styles.box}>
                    <BarChart {...baseProps} presentation="grouped" />
                </View>
            </StoryRow>
            <StoryRow label="stacked — both years end to end, so the bar is the total">
                <View style={styles.box}>
                    <BarChart {...baseProps} presentation="stacked" />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `sortOrder`, which is not the same mechanism as the column chart's despite the identical property.
 *
 * Here it goes straight to Victory as `sortOrder` plus `sortKey: "x"` — and because `SeriesLoader` has
 * written the Y attribute into `x`, that key is the *value*. So the bars are ordered by size rather than
 * by category. The column chart instead sums each category across all series and reorders the categories
 * together, which keeps its series aligned. Same property name, different mechanism.
 *
 * This is also the clearest view of the transposition. In both rows each bar's vertical position on the
 * left axis is its real value — South at 90, North 120, East 180, West 210 — while its length tracks the
 * bottom axis, which is just the categories in sorted order. Flipping the sort reverses the bottom axis,
 * so `descending` gives South the longest bar despite being the smallest number.
 */
export const SortOrder: StoryObj<typeof BarChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="ascending — bottom axis South → West; bar length is that order, not the value">
                <View style={styles.box}>
                    <BarChart {...baseProps} sortOrder="ascending" barSeries={oneSeries} showLabels />
                </View>
            </StoryRow>
            <StoryRow label="descending — the axis reverses, so the smallest value draws the longest bar">
                <View style={styles.box}>
                    <BarChart {...baseProps} sortOrder="descending" barSeries={oneSeries} showLabels />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Axis captions and value labels.
 *
 * `xAxisLabel` is intended for the value axis and Atlas puts it below the grid; `yAxisLabel` is intended
 * for the categories and goes above it. Given the transposition each ends up captioning the other axis.
 * Both are `DynamicValue`s, so the whole chart returns `null` while either is still loading — the last row.
 *
 * `showLabels` is meant to write each bar's value at its end. It reads `datum.y`, which is the value in
 * the column chart but holds the category here after `SeriesLoader`'s pre-swap — so the second row is
 * captioned "North", "East", "South", "West" instead of 120, 180, 90, 210.
 */
export const Labels: StoryObj<typeof BarChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="axis captions, positioned by the theme">
                <View style={styles.box}>
                    <BarChart
                        {...baseProps}
                        xAxisLabel={dynamicValue("Sales (k)")}
                        yAxisLabel={dynamicValue("Region")}
                    />
                </View>
            </StoryRow>
            <StoryRow label="showLabels — meant to be the value, currently the category name">
                <View style={styles.box}>
                    <BarChart {...baseProps} showLabels barSeries={oneSeries} />
                </View>
            </StoryRow>
            <StoryRow label="an axis caption still loading — the whole chart withholds itself">
                <View style={styles.box}>
                    <BarChart {...baseProps} xAxisLabel={{ status: "loading", value: undefined } as never} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The legend, which needs series names as well as the flag — see the column chart for the same trap.
 */
export const LegendVisibility: StoryObj<typeof BarChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="showLegend: false">
                <View style={styles.box}>
                    <BarChart {...baseProps} showLegend={false} />
                </View>
            </StoryRow>
            <StoryRow label="showLegend: true, but neither series is named — still nothing">
                <View style={styles.box}>
                    <BarChart {...baseProps} barSeries={unnamed} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `customBarStyles`, keyed off each series' styling key.
 *
 * `bar.width` is the thickness of the bar — across it, not along it — so on the intended horizontal chart
 * it is a height, and it still is here. `bar.ending` is a corner radius, visible as the rounded caps. Any
 * series the theme has no key for falls back to the next colour in `barColorPalette`.
 *
 * Both keyed entries take effect, so per-series theming works; the transposition is orthogonal to it.
 */
export const CustomBarStyles: StoryObj<typeof BarChart> = {
    render: () => (
        <View style={styles.box}>
            <BarChart
                {...baseProps}
                showLabels
                barSeries={keyed}
                style={chartStyle.concat([
                    {
                        bars: {
                            customBarStyles: {
                                current: {
                                    bar: { barColor: variables.brand.success, ending: 6, width: 16 },
                                    label: { fontSize: variables.font.sizeSmall, fontWeight: "bold" }
                                },
                                previous: {
                                    bar: { barColor: variables.contrast.low, ending: 6, width: 16 },
                                    label: { fontSize: variables.font.sizeSmall }
                                }
                            }
                        }
                    }
                ])}
            />
        </View>
    )
};

/**
 * The grid and the axes, restyled through the same array Atlas fills.
 *
 * `grid.paddingLeft` is doing the most work here: it is what gives the left axis's tick labels room, and
 * too little clips them rather than wrapping. On the intended horizontal chart those would be the category
 * names, which is why 64 rather than the column chart's 48; as rendered they are the value ticks.
 */
export const GridAndAxes: StoryObj<typeof BarChart> = {
    render: () => (
        <View style={styles.tall}>
            <BarChart
                {...baseProps}
                xAxisLabel={dynamicValue("Sales (k)")}
                yAxisLabel={dynamicValue("Region")}
                style={chartStyle.concat([
                    {
                        grid: {
                            backgroundColor: variables.background.secondary,
                            dashArray: "4 4",
                            lineColor: variables.contrast.lower,
                            paddingBottom: 48,
                            paddingLeft: 64,
                            paddingRight: 16,
                            paddingTop: 16,
                            width: 1
                        },
                        xAxis: {
                            color: variables.brand.primary,
                            fontSize: 12,
                            lineColor: variables.contrast.low,
                            label: { color: variables.brand.primary, fontWeight: "bold" }
                        },
                        yAxis: {
                            color: variables.brand.primary,
                            fontSize: 12,
                            lineColor: variables.contrast.low,
                            // Beside the categories instead of above the grid. "left" and "top" are the
                            // only values accepted; anything else falls back to "top" and warns.
                            label: { color: variables.brand.primary, relativePositionGrid: "left" }
                        }
                    }
                ])}
            />
        </View>
    )
};

/**
 * Loading against loaded-but-empty, which look different for a reason worth knowing.
 *
 * Loading leaves `useSeries` at `null` and the widget returns `null` — nothing at all. Empty gives a
 * series with no points, so the axes draw and only the bars are missing.
 */
export const EmptyAndLoading: StoryObj<typeof BarChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="loading — the widget renders nothing at all">
                <View style={styles.box}>
                    <BarChart {...baseProps} barSeries={loadingSeries} />
                </View>
            </StoryRow>
            <StoryRow label="loaded but empty — the grid draws, with no bars on it">
                <View style={styles.box}>
                    <BarChart {...baseProps} barSeries={emptySeries} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_barchart_BarChart` is the only entry, and it is the column chart's twin —
 * grid padding, axis fonts, legend spacing, `barsOffset: 20`, and a `barColorPalette` built from every
 * non-`Light` brand colour. There is no `TypeMismatchError` story here either: the check and the message
 * are identical to the column chart's, and one demonstration of it is enough.
 *
 * Because of the double flip described in the header, the column chart is the one to read for what a
 * correctly-rendered categorical chart looks like on this theme — same series shape, same properties,
 * and it is not affected.
 */
