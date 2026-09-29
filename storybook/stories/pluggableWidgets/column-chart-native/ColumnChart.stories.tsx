import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { ValueStatus } from "mendix";
import { Big } from "big.js";
import { ColumnChart } from "../../../../packages/pluggableWidgets/column-chart-native/src/ColumnChart";
import type { ColumnChartStyle } from "../../../../packages/pluggableWidgets/column-chart-native/src/ui/Styles";
import type { ColumnSeriesType } from "../../../../packages/pluggableWidgets/column-chart-native/typings/ColumnChartProps";
import { dynamicValue, listAttributeValue, listValue } from "../../shared/mendixValues";
import type { Row } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * A fixed height for every chart here, and series built once at module scope. Both are load-bearing.
 *
 * The chart measures itself with `onLayout` and renders nothing until it has a size, so in the
 * scrolling story frame — where the available height is unbounded — it measures zero and stays blank.
 * Hence the box.
 *
 * The series arrays matter for a different reason: `useSeries` re-runs on `[series]` *by identity* and
 * ends in `setChartSeries`, so an array built inside a `render` would set state, re-render, build a new
 * array, and loop forever. In an app the props come from the runtime and are stable between renders;
 * here that has to be arranged by hand, which is why nothing below is constructed inline.
 */
const atlas = atlasStyle("com.mendix.widget.native.columnchart.ColumnChart") as ColumnChartStyle[];

const styles = StyleSheet.create({
    box: { height: 260 },
    tall: { height: 320 }
});

/**
 * One series over plain rows.
 *
 * `staticCustomColumnStyle` is a required string rather than an optional one, and `""` is what the
 * runtime passes when a modeller leaves it blank — the widget tests it for truthiness before looking up
 * a custom style, so empty means "take the next colour from the palette".
 */
function series(rows: Row[], name: string, customColumnStyle = "", status?: ValueStatus): ColumnSeriesType {
    const source = listValue(rows, { status });
    return {
        dataSet: "static",
        staticDataSource: source.value,
        staticSeriesName: dynamicValue(name),
        staticXAttribute: listAttributeValue(source, "x"),
        // The Y formatter is called with a `Big`, because that is what the widget wraps a numeric axis
        // tick in before formatting — see `listAttributeValue`. Rounding keeps the axis to whole units
        // instead of "1.6666666666666667".
        staticYAttribute: listAttributeValue(source, "y", (value: Big) => value.round(0).toString()),
        staticCustomColumnStyle: customColumnStyle
    };
}

const quarters = (values: number[]): Row[] => values.map((y, index) => ({ x: `Q${index + 1}`, y: new Big(y) }));

const revenue = quarters([120, 180, 90, 210]);
const costs = quarters([80, 110, 70, 140]);

const twoSeries = [series(revenue, "Revenue"), series(costs, "Costs")];
const revenueOnly = [series(revenue, "Revenue")];
const unnamed = [
    { ...series(revenue, ""), staticSeriesName: undefined },
    { ...series(costs, ""), staticSeriesName: undefined }
];
const keyed = [series(revenue, "Revenue", "revenue"), series(costs, "Costs", "costs")];
const loadingSeries = [series(revenue, "Revenue", "", ValueStatus.Loading)];
const emptySeries = [series([], "Revenue")];
const mismatched = [
    series(revenue, "Categories"),
    series(
        [1, 2, 3, 4].map(index => ({ x: new Big(index), y: new Big(index * 40) })),
        "Numbers"
    )
];

/**
 * Atlas, plus the two things it leaves unset that a chart does not look right without.
 *
 * `grid.backgroundColor` is the surprising one. The widget always passes Victory a background fill,
 * `{ background: { fill: style.grid?.backgroundColor } }`, and Atlas never sets it — so the fill is
 * `undefined`, which overrides Victory's own theme with nothing and leaves the SVG rect at its default
 * black. Every chart on an unmodified Atlas theme looks like this; it is a gap in the theme, not a story
 * artefact, and setting it is what any real app ends up doing.
 *
 * `domain.padding` is the same kind of omission: without it Victory puts the first and last category on
 * the very edge of the grid, so the outer columns are drawn half outside it and read as clipped.
 */
const chartStyle = atlas.concat([
    { domain: { padding: { x: 28 } }, grid: { backgroundColor: variables.background.primary } }
]);

const baseProps = {
    name: "column-chart",
    style: chartStyle,
    presentation: "grouped" as const,
    sortOrder: "ascending" as const,
    showLabels: false,
    showLegend: true,
    columnSeries: twoSeries
};

const meta = {
    title: "Widgets/ColumnChart",
    component: ColumnChart,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ColumnChart>;

export default meta;

/**
 * Two series side by side, coloured from Atlas's brand palette, with a legend under the grid.
 *
 * `args` as well as a `render`, unlike the stories below it: the args feed Storybook's controls panel, and
 * the render is only there to put the chart in a sized box. So this is the story to change a property on
 * and watch, and the rest are fixed comparisons.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps,
    render: args => (
        <View style={styles.box}>
            <ColumnChart {...args} />
        </View>
    )
};

/**
 * Grouped against stacked, which is the one property that changes what the chart means.
 *
 * Grouped puts one column per series next to each other, for comparison; stacked adds them, so the top
 * of a bar is the total and each segment is a share of it. `columnsOffset` in the theme is the gap
 * between grouped columns and does nothing when stacked — these are two different sums of the same
 * numbers, not two layouts.
 */
export const Presentation: StoryObj<typeof ColumnChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="grouped — Revenue and Costs compared per quarter">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} presentation="grouped" />
                </View>
            </StoryRow>
            <StoryRow label="stacked — the same numbers as a total per quarter">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} presentation="stacked" />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `sortOrder`, which reorders the categories rather than sorting within them.
 *
 * This is the property most likely to surprise. For a string X axis the widget sums each category across
 * every series and orders the categories by that total — so the quarters below do not come out in
 * calendar order, they come out cheapest-first or dearest-first, and which quarter lands where depends on
 * *Revenue plus Costs*. There is no "leave it alone" option: `ascending` and `descending` are the only
 * two values, so a chart over months or quarters is always reordered by size.
 *
 * A numeric or date X axis behaves completely differently — it is always sorted ascending regardless of
 * this property, because Victory mis-draws an unsorted continuous axis. So `sortOrder` does nothing at all
 * on a time series.
 */
export const SortOrder: StoryObj<typeof ColumnChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="ascending — Q3 (160) first, Q4 (350) last; not calendar order">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} sortOrder="ascending" />
                </View>
            </StoryRow>
            <StoryRow label="descending — the same four quarters, reversed">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} sortOrder="descending" />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Axis captions and value labels, which are separate things with similar names.
 *
 * `xAxisLabel`/`yAxisLabel` caption the axes and are `DynamicValue`s — so the whole chart returns
 * `null` while either is still loading, which is the last row. `showLabels` writes each column's own
 * value above it and takes no text at all.
 */
export const Labels: StoryObj<typeof ColumnChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="axis captions, positioned by the theme">
                <View style={styles.box}>
                    <ColumnChart
                        {...baseProps}
                        xAxisLabel={dynamicValue("Quarter")}
                        yAxisLabel={dynamicValue("Amount (k)")}
                    />
                </View>
            </StoryRow>
            <StoryRow label="showLabels — the value above each column">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} showLabels columnSeries={revenueOnly} />
                </View>
            </StoryRow>
            <StoryRow label="an axis caption still loading — the whole chart withholds itself">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} xAxisLabel={{ status: "loading", value: undefined } as never} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The legend, which needs series names as well as the flag.
 *
 * It renders only the series that have a name and returns `null` if none do — so a chart with
 * `showLegend` on and unnamed series shows nothing, which reads as the property being broken. Worth its
 * own row because the fix is in the series, not in the flag.
 */
export const LegendVisibility: StoryObj<typeof ColumnChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="showLegend: false">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} showLegend={false} />
                </View>
            </StoryRow>
            <StoryRow label="showLegend: true, but neither series is named — still nothing">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} columnSeries={unnamed} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `customColumnStyles`, the theme's per-series escape hatch.
 *
 * A series carries a styling key — a literal for a static series, an attribute for a dynamic one — and
 * the theme keys colour, width and corner radius off it. Any series the theme has no key for falls back
 * to the next colour in `columnColorPalette`, cycling, which is what every other story here relies on.
 * The rounded caps come from `column.ending`, which is a radius and not a boolean.
 */
export const CustomColumnStyles: StoryObj<typeof ColumnChart> = {
    render: () => (
        <View style={styles.box}>
            <ColumnChart
                {...baseProps}
                showLabels
                columnSeries={keyed}
                style={chartStyle.concat([
                    {
                        columns: {
                            customColumnStyles: {
                                revenue: {
                                    column: { columnColor: variables.brand.success, ending: 6, width: 18 },
                                    label: { fontSize: variables.font.sizeSmall, fontWeight: "bold" }
                                },
                                costs: {
                                    column: { columnColor: variables.brand.danger, ending: 6, width: 18 },
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
 * `grid.padding*` is what makes room for the tick labels — the widget passes it to Victory as the
 * chart's padding, so tightening it crops the labels rather than moving them. `grid.dashArray` is an
 * SVG dash pattern, which is why it is a string.
 */
export const GridAndAxes: StoryObj<typeof ColumnChart> = {
    render: () => (
        <View style={styles.tall}>
            <ColumnChart
                {...baseProps}
                xAxisLabel={dynamicValue("Quarter")}
                yAxisLabel={dynamicValue("Amount (k)")}
                style={chartStyle.concat([
                    {
                        grid: {
                            backgroundColor: variables.background.secondary,
                            dashArray: "4 4",
                            lineColor: variables.contrast.lower,
                            paddingBottom: 48,
                            paddingLeft: 48,
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
                            // Beside the axis rather than above the grid — the only alternative the
                            // widget accepts here. Anything else falls back to "top" and warns.
                            label: { color: variables.brand.primary, relativePositionGrid: "left" }
                        }
                    }
                ])}
            />
        </View>
    )
};

/**
 * The two ways a chart shows nothing, which are not the same thing.
 *
 * A loading data source leaves `useSeries` at `null`, and the widget returns `null` outright — no
 * container, no axes, nothing to hint that a chart is coming. An empty but loaded one gives a series
 * with no data points, so the grid and axes draw and only the columns are missing. The second is what
 * a filter that matched nothing looks like.
 */
export const EmptyAndLoading: StoryObj<typeof ColumnChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="loading — the widget renders nothing at all">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} columnSeries={loadingSeries} />
                </View>
            </StoryRow>
            <StoryRow label="loaded but empty — the grid draws, with no columns on it">
                <View style={styles.box}>
                    <ColumnChart {...baseProps} columnSeries={emptySeries} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Series whose data points disagree about their type, which is the one error the chart reports.
 *
 * The check looks at the first point of each series: mix a string X with a numeric one and the widget
 * replaces the entire chart with "Data types of data points belonging to different series aren't
 * equal", styled by `errorMessage`. In an app this means two series bound to attributes of different
 * types, and it is worth seeing because the message names neither series.
 */
export const TypeMismatchError: StoryObj<typeof ColumnChart> = {
    render: () => (
        <View style={styles.box}>
            <ColumnChart
                {...baseProps}
                columnSeries={mismatched}
                style={chartStyle.concat([{ errorMessage: { color: variables.brand.danger, fontWeight: "bold" } }])}
            />
        </View>
    )
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_columnchart_ColumnChart` is the only entry — it sets the grid padding, the
 * axis fonts, the legend spacing and a `columnColorPalette` built from every non-`Light` brand colour,
 * which is where `Default`'s blue and green come from. `GridAndAxes` and `CustomColumnStyles` cover
 * what a theme can change beyond it.
 */
