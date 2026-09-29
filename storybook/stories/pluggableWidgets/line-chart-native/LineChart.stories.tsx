import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { ValueStatus } from "mendix";
import { Big } from "big.js";
import { LineChart } from "../../../../packages/pluggableWidgets/line-chart-native/src/LineChart";
import type { LineChartStyle } from "../../../../packages/pluggableWidgets/line-chart-native/src/ui/Styles";
import type { LinesType } from "../../../../packages/pluggableWidgets/line-chart-native/typings/LineChartProps";
import { dynamicValue, listAttributeValue, listExpressionValue, listValue } from "../../shared/mendixValues";
import type { Row } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Fixed heights and module-scope series, for the same two reasons as the bar and column charts: the
 * chart renders nothing until `onLayout` has given it a size, and `useSeries` re-runs on the series
 * array by identity and ends in `setState`, so an array built inside `render` would loop.
 *
 * Unlike those two, this chart's X attribute is typed `Date | Big` — there is no string case, so a line
 * chart cannot plot categories. Every X below is a number or a date, and which one it is decides the
 * scale: the widget passes `linear` for numbers and `time` for dates, and nothing else.
 */
const atlas = atlasStyle("com.mendix.widget.native.linechart.LineChart") as LineChartStyle[];

const styles = StyleSheet.create({
    box: { height: 260 },
    tall: { height: 320 }
});

/** A numeric series — the plain case, where X is just a position on a linear axis. */
function series(
    rows: Row[],
    name: string,
    options: {
        lineStyle?: LinesType["staticLineStyle"];
        customLineStyle?: string;
        interpolation?: LinesType["interpolation"];
        status?: ValueStatus;
    } = {}
): LinesType {
    const { lineStyle = "line", customLineStyle = "", interpolation = "linear", status } = options;
    const source = listValue(rows, { status });
    return {
        dataSet: "static",
        staticDataSource: source.value,
        staticName: dynamicValue(name),
        staticXAttribute: listAttributeValue(source, "x", (value: Big) => value.round(0).toString()),
        staticYAttribute: listAttributeValue(source, "y", (value: Big) => value.round(0).toString()),
        interpolation,
        staticLineStyle: lineStyle,
        // Required by the typings even on a static series, and ignored — the widget reads whichever of
        // the two matches `dataSet`. The runtime passes both for the same reason.
        dynamicLineStyle: "line",
        staticCustomLineStyle: customLineStyle
    };
}

/**
 * A series over dates, which is the only way to get a time axis.
 *
 * The tick formatter has to handle a `Date` here rather than a `Big`: Victory picks the ticks off a time
 * scale and hands them over as dates. Formatting them short keeps six months' worth of labels from
 * overlapping, which is what the raw `toString()` would do.
 */
function dateSeries(rows: Row[], name: string): LinesType {
    const source = listValue(rows);
    return {
        ...series(rows, name),
        staticDataSource: source.value,
        staticXAttribute: listAttributeValue(source, "x", (value: Date) =>
            value.toLocaleDateString("en-GB", { month: "short" })
        ),
        staticYAttribute: listAttributeValue(source, "y", (value: Big) => value.round(0).toString())
    };
}

const points = (values: number[], startAt = 1): Row[] =>
    values.map((y, index) => ({ x: new Big(index + startAt), y: new Big(y) }));

const rising = points([10, 40, 30, 70, 60, 95]);
const falling = points([90, 65, 72, 40, 45, 20]);

const months: Row[] = [10, 45, 30, 80, 55, 95].map((y, index) => ({
    // Fixed dates rather than anything derived from today, so the axis is the same on every run.
    x: new Date(2024, index, 1),
    y: new Big(y)
}));

const twoSeries = [series(rising, "Sessions"), series(falling, "Errors")];
const oneSeries = [series(rising, "Sessions")];
const withMarkers = [
    series(rising, "Sessions", { lineStyle: "lineWithMarkers" }),
    series(falling, "Errors", { lineStyle: "lineWithMarkers" })
];
const interpolations = [
    series(rising, "linear", { lineStyle: "lineWithMarkers", interpolation: "linear" }),
    series(falling, "catmullRom", { lineStyle: "lineWithMarkers", interpolation: "catmullRom" })
];
const customStyled = [
    series(rising, "Actual", { lineStyle: "custom", customLineStyle: "actual" }),
    series(falling, "Forecast", { lineStyle: "custom", customLineStyle: "forecast" })
];
const timeSeries = [dateSeries(months, "Sessions")];
const unnamed = [{ ...series(rising, ""), staticName: undefined }];
const loadingSeries = [series(rising, "Sessions", { status: ValueStatus.Loading })];

/**
 * One dynamic series, which splits into as many lines as the group-by attribute has distinct values.
 *
 * This is the other half of the widget and it is easy to miss: a static series is one line from one data
 * source, whereas a dynamic one is a single flat list that the widget partitions itself — so three
 * regions in one list become three lines, and adding a fourth region needs no change to the page. The
 * name comes from an expression per row rather than a literal, which is why `dynamicName` is a
 * `ListExpressionValue` where `staticName` is a `DynamicValue`.
 */
const dynamicSeries: LinesType[] = (() => {
    const rows: Row[] = ["North", "East", "South"].flatMap(region =>
        [1, 2, 3, 4, 5, 6].map(index => ({
            region,
            x: new Big(index),
            y: new Big(20 + index * (region === "North" ? 12 : region === "East" ? 7 : 3))
        }))
    );
    const source = listValue(rows);
    return [
        {
            dataSet: "dynamic",
            dynamicDataSource: source.value,
            groupByAttribute: listAttributeValue(source, "region"),
            dynamicName: listExpressionValue(source, row => String(row.region)),
            dynamicXAttribute: listAttributeValue(source, "x", (value: Big) => value.round(0).toString()),
            dynamicYAttribute: listAttributeValue(source, "y", (value: Big) => value.round(0).toString()),
            interpolation: "linear",
            staticLineStyle: "line",
            dynamicLineStyle: "lineWithMarkers",
            staticCustomLineStyle: ""
        }
    ];
})();

/**
 * Atlas, plus the grid background it leaves unset.
 *
 * The widget always passes Victory a background fill taken from `grid.backgroundColor`, and Atlas never
 * sets it — so the fill is `undefined`, which overrides Victory's own theme with nothing and leaves the
 * grid rect at the SVG default of black. Every chart on an unmodified Atlas theme looks like that, which
 * is a gap in the theme rather than something these stories introduce.
 */
const chartStyle = atlas.concat([{ grid: { backgroundColor: variables.background.primary } }]);

const baseProps = {
    name: "line-chart",
    style: chartStyle,
    showLegend: true,
    lines: twoSeries
};

const meta = {
    title: "Widgets/LineChart",
    component: LineChart,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof LineChart>;

export default meta;

/**
 * Two lines on a linear scale, coloured from Atlas's brand palette, with a legend below the grid.
 *
 * `args` as well as a `render`, unlike the stories below it: the args feed Storybook's controls panel and
 * the render only puts the chart in a sized box, so this is the one to change a property on and watch.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps,
    render: args => (
        <View style={styles.box}>
            <LineChart {...args} />
        </View>
    )
};

/**
 * The three line styles, which are one property with an unequal split.
 *
 * `line` and `lineWithMarkers` are complete on their own. `custom` is not: it defers to
 * `customLineStyles[key]` in the theme, and shows markers only if that entry sets
 * `markers.display` to something other than `"false"` — a string, not a boolean, and the widget warns
 * on the console for any other value. So a series set to `custom` with no matching theme entry is just
 * a plain line, silently.
 */
export const LineStyles: StoryObj<typeof LineChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="line — no markers">
                <View style={styles.box}>
                    <LineChart {...baseProps} lines={twoSeries} />
                </View>
            </StoryRow>
            <StoryRow label="lineWithMarkers — a point at every datum">
                <View style={styles.box}>
                    <LineChart {...baseProps} lines={withMarkers} />
                </View>
            </StoryRow>
            <StoryRow label="custom — dashes, thickness and markers all from the theme">
                <View style={styles.box}>
                    <LineChart
                        {...baseProps}
                        lines={customStyled}
                        style={chartStyle.concat([
                            {
                                lines: {
                                    customLineStyles: {
                                        actual: {
                                            line: {
                                                ending: "round",
                                                lineColor: variables.brand.primary,
                                                lineWidth: 3
                                            },
                                            markers: {
                                                backgroundColor: variables.background.primary,
                                                borderColor: variables.brand.primary,
                                                borderWidth: 2,
                                                display: "onTop",
                                                size: 5,
                                                symbol: "circle"
                                            }
                                        },
                                        forecast: {
                                            line: {
                                                dashArray: "6 4",
                                                lineColor: variables.contrast.low,
                                                lineWidth: 2
                                            },
                                            markers: { display: "false" }
                                        }
                                    }
                                }
                            }
                        ])}
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `interpolation`, which is per series rather than per chart.
 *
 * `linear` joins the points with straight segments and shows exactly the data. `catmullRom` fits a curve
 * through them, which reads better and can imply values between points that were never measured —
 * including overshooting past a local maximum. Both lines here are over the same numbers.
 */
export const Interpolation: StoryObj<typeof LineChart> = {
    render: () => (
        <View style={styles.box}>
            <LineChart {...baseProps} lines={interpolations} />
        </View>
    )
};

/**
 * Dates on the X axis, which switch the scale from linear to time.
 *
 * The widget decides this from the data type of the first point, not from a property — so a chart is a
 * time series purely because its X attribute is a date. Tick labels come from the attribute's formatter,
 * which is why they read as months here rather than as full timestamps.
 */
export const TimeAxis: StoryObj<typeof LineChart> = {
    render: () => (
        <View style={styles.box}>
            <LineChart
                {...baseProps}
                lines={timeSeries}
                xAxisLabel={dynamicValue("2024")}
                yAxisLabel={dynamicValue("Sessions")}
            />
        </View>
    )
};

/**
 * One dynamic series becoming three lines.
 *
 * Everything visible here comes from a single flat list and a group-by attribute — the widget does the
 * partitioning, names each line from an expression, and takes its colours from the palette in series
 * order. A fourth region in the data would add a fourth line with no change to the page.
 */
export const DynamicSeries: StoryObj<typeof LineChart> = {
    render: () => (
        <View style={styles.box}>
            <LineChart {...baseProps} lines={dynamicSeries} />
        </View>
    )
};

/**
 * Axis captions, and where the theme puts them.
 *
 * `relativePositionGrid` is the property — `"bottom"` or `"right"` for X, `"top"` or `"left"` for Y — and
 * it is a style rather than a widget property, so it lives in the theme. Atlas sets bottom and top. Note
 * that an unset caption renders nothing at all here: unlike the bar and column charts, this widget
 * checks the string before building the `Text`, so the space is not reserved.
 */
export const AxisLabels: StoryObj<typeof LineChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="Atlas defaults — X below the grid, Y above it">
                <View style={styles.box}>
                    <LineChart
                        {...baseProps}
                        lines={oneSeries}
                        xAxisLabel={dynamicValue("Day")}
                        yAxisLabel={dynamicValue("Sessions")}
                    />
                </View>
            </StoryRow>
            <StoryRow label="Y beside the axis, X to the right of the grid">
                <View style={styles.tall}>
                    <LineChart
                        {...baseProps}
                        lines={oneSeries}
                        xAxisLabel={dynamicValue("Day")}
                        yAxisLabel={dynamicValue("Sessions")}
                        style={chartStyle.concat([
                            {
                                xAxis: { label: { relativePositionGrid: "right" } },
                                yAxis: { label: { relativePositionGrid: "left" } }
                            }
                        ])}
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The grid, restyled through the same array Atlas fills.
 *
 * `grid.lineWidth` is the one to watch: it is what draws the grid lines at all, and Atlas leaves it
 * unset — so the default chart has a `lineColor` and no visible grid. Setting it is what makes the
 * dashes below appear.
 */
export const Grid: StoryObj<typeof LineChart> = {
    render: () => (
        <View style={styles.tall}>
            <LineChart
                {...baseProps}
                lines={withMarkers}
                xAxisLabel={dynamicValue("Day")}
                yAxisLabel={dynamicValue("Sessions")}
                style={chartStyle.concat([
                    {
                        grid: {
                            backgroundColor: variables.background.secondary,
                            dashArray: "4 4",
                            lineColor: variables.contrast.lower,
                            lineWidth: 1,
                            paddingBottom: 48,
                            paddingLeft: 48,
                            paddingRight: 16,
                            paddingTop: 16
                        },
                        xAxis: { color: variables.brand.primary, fontSize: 12, lineColor: variables.contrast.low },
                        yAxis: { color: variables.brand.primary, fontSize: 12, lineColor: variables.contrast.low }
                    }
                ])}
            />
        </View>
    )
};

/**
 * The legend, which needs series names as well as the flag.
 *
 * Unnamed series render no legend at all even with `showLegend` on, which reads as the property being
 * broken — the same trap as in the bar and column charts, and the fix is in the series.
 */
export const LegendVisibility: StoryObj<typeof LineChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="showLegend: false">
                <View style={styles.box}>
                    <LineChart {...baseProps} showLegend={false} />
                </View>
            </StoryRow>
            <StoryRow label="showLegend: true, and the series has no name — still nothing">
                <View style={styles.box}>
                    <LineChart {...baseProps} lines={unnamed} />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A loading data source, which renders nothing at all.
 *
 * `useSeries` stays `null` and the widget returns `null` — no container, no axes, nothing to say a chart
 * is coming. There is no loaded-but-empty story to pair with it, as there is for the column chart: this
 * widget reads `firstSeries.yFormatter` without guarding, so a chart whose only series has no data points
 * throws rather than drawing empty axes. That is worth knowing and not worth demonstrating — a story
 * that throws at module scope would take the whole Storybook down.
 */
export const Loading: StoryObj<typeof LineChart> = {
    render: () => (
        <View style={styles.box}>
            <LineChart {...baseProps} lines={loadingSeries} />
        </View>
    )
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_linechart_LineChart` is the only entry — grid padding, axis fonts and
 * positions, legend spacing, and a `lineColorPalette` built from every non-`Light` brand colour, which
 * is where the blue and green above come from. `LineStyles` and `Grid` cover what a theme can change
 * beyond it.
 */
