import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { Big } from "big.js";
import { PieDoughnutChart } from "../../../../packages/pluggableWidgets/pie-doughnut-chart-native/src/PieDoughnutChart";
import type { ChartStyle } from "../../../../packages/pluggableWidgets/pie-doughnut-chart-native/src/ui/Styles";
import type { SeriesType } from "../../../../packages/pluggableWidgets/pie-doughnut-chart-native/typings/PieDoughnutChartProps";
import { listAttributeValue, listValue } from "../../shared/mendixValues";
import type { Row } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * The chart is always a square, sized from its width alone — so unlike the other three it does not need
 * a height, only something to measure. It still needs the series built once at module scope: `useSeries`
 * re-runs on the array by identity and ends in `setState`, so an array built inside `render` would loop.
 *
 * Slice labels come from the X attribute's `displayValue`, not from a formatter — so what a slice is
 * called is whatever `String(value)` gives, and there is no hook to change it from the theme.
 */
const atlas = atlasStyle("com.mendix.widget.native.piedoughnutchart.PieDoughnutChart") as ChartStyle[];

const styles = StyleSheet.create({
    box: { height: 300 },
    small: { height: 220 }
});

function series(rows: Row[], stylingKey = false): SeriesType {
    const source = listValue(rows);
    return {
        dataSource: source.value,
        XAttribute: listAttributeValue(source, "x"),
        YAttribute: listAttributeValue(source, "y"),
        // The key is a per-row attribute rather than one value for the series, because a pie has no
        // series to speak of — every slice is its own row, so styling has to be addressable per row.
        sliceStylingKey: stylingKey ? listAttributeValue(source, "key") : undefined
    };
}

const budget: Row[] = [
    { x: "Rent", y: new Big(1200), key: "fixed" },
    { x: "Food", y: new Big(450), key: "variable" },
    { x: "Transport", y: new Big(180), key: "variable" },
    { x: "Savings", y: new Big(600), key: "savings" }
];

/** Two slices, to show that "pie" and "doughnut" are not about slice count. */
const halves: Row[] = [
    { x: "Used", y: new Big(72), key: "used" },
    { x: "Free", y: new Big(28), key: "free" }
];

const oneSeries = [series(budget)];
const keyedSeries = [series(budget, true)];
const twoSlices = [series(halves)];

/**
 * Two series in one chart, which the widget flattens rather than nesting.
 *
 * There is no concentric-rings mode: `series` is an array, and the widget `flatMap`s every slice from
 * every entry into one ring. So a second series adds slices, it does not add a ring — which is worth a
 * story because the property being an array suggests otherwise.
 */
const flattened = [series(halves), series(budget)];

const baseProps = {
    name: "pie-chart",
    style: atlas,
    presentation: "pie" as const,
    sortOrder: "descending" as const,
    showLabels: true,
    series: oneSeries
};

const meta = {
    title: "Widgets/PieDoughnutChart",
    component: PieDoughnutChart,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof PieDoughnutChart>;

export default meta;

/**
 * Four slices, labelled, largest first, coloured from Atlas's brand palette.
 *
 * `args` as well as a `render`, unlike the stories below it: the args feed Storybook's controls panel and
 * the render only puts the chart in a sized box, so this is the one to change a property on and watch.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps,
    render: args => (
        <View style={styles.box}>
            <PieDoughnutChart {...args} />
        </View>
    )
};

/**
 * Pie against doughnut, which differ only by an inner radius.
 *
 * `presentation: "doughnut"` uses `slices.innerRadius` if the theme sets one and otherwise a twelfth of
 * the chart's width — which is a thin ring, not the wide one the name suggests. The third row sets it
 * explicitly, which is how an app gets the usual look, and is also the only way to leave room for
 * something in the middle.
 */
export const Presentation: StoryObj<typeof PieDoughnutChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="pie">
                <View style={styles.box}>
                    <PieDoughnutChart {...baseProps} presentation="pie" />
                </View>
            </StoryRow>
            <StoryRow label="doughnut — the default hole is width/12, barely a hole">
                <View style={styles.box}>
                    <PieDoughnutChart {...baseProps} presentation="doughnut" />
                </View>
            </StoryRow>
            <StoryRow label="doughnut with innerRadius: 70 — what the name usually means">
                <View style={styles.box}>
                    <PieDoughnutChart
                        {...baseProps}
                        presentation="doughnut"
                        style={atlas.concat([{ slices: { innerRadius: 70 } }])}
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `sortOrder`, which decides where each slice lands as well as its colour.
 *
 * Slices are drawn in sorted order and take palette colours in draw order, so flipping the sort
 * recolours the chart as well as rearranging it — the same category is a different colour in the two
 * rows below. Anything that needs a stable colour per category needs a styling key, as in
 * `CustomSliceStyles`.
 */
export const SortOrder: StoryObj<typeof PieDoughnutChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="descending — largest slice first">
                <View style={styles.box}>
                    <PieDoughnutChart {...baseProps} sortOrder="descending" />
                </View>
            </StoryRow>
            <StoryRow label="ascending — same data, different colours">
                <View style={styles.box}>
                    <PieDoughnutChart {...baseProps} sortOrder="ascending" />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `showLabels`, and the padding that has to make room for them.
 *
 * Labels are drawn outside the slices, so the chart needs `slices.padding` to fit them — Atlas sets 40,
 * which is why the default chart is noticeably smaller than its box. Turning labels off does not reclaim
 * that space: the padding is a style, and the second row drops it as well, which is how an app gets a
 * full-width chart. There is no legend here at all, so an unlabelled pie is unreadable on its own.
 *
 * 40 is not enough for a long label on a phone: the label for a slice at three o'clock runs off the right
 * edge and is clipped rather than wrapped or shrunk, which "Rent" does in `CustomSliceStyles`. The only
 * fixes are a larger padding or a shorter label, both of which are the app's to make.
 */
export const Labels: StoryObj<typeof PieDoughnutChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="showLabels: true — Atlas's 40pt padding is what fits them">
                <View style={styles.box}>
                    <PieDoughnutChart {...baseProps} showLabels />
                </View>
            </StoryRow>
            <StoryRow label="showLabels: false, padding: 0 — fills the width, and says nothing">
                <View style={styles.box}>
                    <PieDoughnutChart
                        {...baseProps}
                        showLabels={false}
                        style={atlas.concat([{ slices: { padding: 0 } }])}
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `customStyles`, keyed per row rather than per series.
 *
 * The key comes off each row through `sliceStylingKey`, so the theme can colour "Savings" green wherever
 * it lands in the sort — which is the fix for the recolouring in `SortOrder` above. A label's colour
 * defaults to its slice's, so the entries that set only `slice.color` still get matching text.
 */
export const CustomSliceStyles: StoryObj<typeof PieDoughnutChart> = {
    render: () => (
        <View style={styles.box}>
            <PieDoughnutChart
                {...baseProps}
                series={keyedSeries}
                style={atlas.concat([
                    {
                        slices: {
                            customStyles: {
                                fixed: { slice: { color: variables.brand.danger } },
                                variable: { slice: { color: variables.brand.warning } },
                                savings: {
                                    slice: { color: variables.brand.success },
                                    label: { color: variables.brand.success, fontWeight: "bold", fontSize: 14 }
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
 * `colorPalette`, which cycles when it runs short.
 *
 * Slices without a styling key take the next colour in the palette and wrap around at the end — so a
 * two-colour palette over four slices repeats, and two adjacent slices can end up the same colour. Atlas
 * supplies every non-`Light` brand colour, which is enough for most charts and not for all.
 */
export const ColorPalette: StoryObj<typeof PieDoughnutChart> = {
    render: () => (
        <StoryRows>
            <StoryRow label="a two-colour palette over four slices — it wraps">
                <View style={styles.small}>
                    <PieDoughnutChart
                        {...baseProps}
                        style={atlas.concat([
                            {
                                slices: {
                                    colorPalette: `${variables.brand.primary};${variables.contrast.lower}`,
                                    padding: 30
                                }
                            }
                        ])}
                    />
                </View>
            </StoryRow>
            <StoryRow label="two slices, as a usage gauge">
                <View style={styles.small}>
                    <PieDoughnutChart
                        {...baseProps}
                        presentation="doughnut"
                        series={twoSlices}
                        style={atlas.concat([
                            {
                                slices: {
                                    colorPalette: `${variables.brand.danger};${variables.contrast.lower}`,
                                    innerRadius: 55,
                                    padding: 30
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
 * Two series, which become one ring rather than two.
 *
 * The widget flattens every series' slices into a single dataset before drawing, so this chart has six
 * slices from two sources and no way to tell them apart. Worth showing because `series` being an array
 * reads like a concentric-rings feature, and it is not one.
 */
export const MultipleSeries: StoryObj<typeof PieDoughnutChart> = {
    render: () => (
        <View style={styles.box}>
            <PieDoughnutChart {...baseProps} series={flattened} />
        </View>
    )
};

/**
 * No Atlas variants story, and no empty-state story either.
 *
 * There are no design-property classes: `com_mendix_widget_native_piedoughnutchart_PieDoughnutChart` is
 * the only entry, and it sets `padding: 40` plus a `colorPalette` of every non-`Light` brand colour.
 *
 * The states that render nothing are all the same nothing, which is why none of them is a story here: a
 * loading source, an empty one, and a row whose X value is blank each leave `useSeries` at `null`, and
 * the widget returns `null` — no container, no placeholder. The blank-X case additionally logs which item
 * and which series was at fault, and that console message is the only signal an app gets.
 */
