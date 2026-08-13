import { ReactElement, useCallback, useMemo, useState } from "react";
import { VictoryPie } from "victory-native";
import { VictoryStyleObject, CallbackArgs, BlockProps } from "victory-core";

import { ChartStyle, SlicesStyle } from "../ui/Styles";
import { Option } from "mendix";
import { LayoutChangeEvent, View } from "react-native";

const DEFAULT_INNER_RADIUS_RATIO = 12;
const DEFAULT_SLICE_COLOUR = "black";
const LABEL_STYLE_KEYS = ["fill", "fontFamily", "fontSize", "fontStyle", "fontWeight"];

export interface ChartProps {
    name: string;
    series: DataPoints;
    style: ChartStyle;
    presentation: string;
    showLabels: boolean;
}

export type DataPoints = Array<Slice<string, number>>;

export interface Slice<X extends string, Y extends number> {
    x: X;
    y: Y;
    stylingKey: Option<string>;
}

export function PieDoughnutChart({ name, presentation, series, style, showLabels }: ChartProps): ReactElement | null {
    // due to the nature of the chart type, we only reply on the width, as the chart is always a square
    const [chartDimensions, setChartDimensions] = useState<{ width?: number }>();
    // Chart user-styling may be missing for certain slices. A palette is passed, any missing colours
    // fallback to a colour from the palette or the default color.
    const normalizedSliceColors: string[] = useMemo(() => {
        const sliceColorPalette = style.slices?.colorPalette?.split(";");

        const result = series.reduce<{ colors: string[]; paletteIndex: number }>(
            (acc, _series) => {
                const configuredStyle = _series.stylingKey
                    ? style.slices?.customStyles?.[_series.stylingKey]?.slice?.color
                    : null;
                if (typeof configuredStyle !== "string") {
                    const color = sliceColorPalette?.[acc.paletteIndex] || DEFAULT_SLICE_COLOUR;
                    const nextIndex = sliceColorPalette
                        ? (acc.paletteIndex + 1) % sliceColorPalette.length
                        : acc.paletteIndex;

                    return {
                        colors: [...acc.colors, color],
                        paletteIndex: nextIndex
                    };
                }

                return {
                    colors: [...acc.colors, configuredStyle],
                    paletteIndex: acc.paletteIndex
                };
            },
            { colors: [], paletteIndex: 0 }
        );

        return result.colors;
    }, [series, style]);

    const updateChartDimensions = useCallback(
        (event: LayoutChangeEvent) => {
            const { width } = event.nativeEvent.layout;
            setChartDimensions({
                width: width <= 0 ? undefined : width
            });
        },
        [setChartDimensions]
    );

    return (
        <View style={{ ...style.container }} testID={name}>
            <View
                onLayout={updateChartDimensions}
                style={{ justifyContent: "center", alignItems: "center" }}
                testID="innerView"
            >
                {chartDimensions ? (
                    <VictoryPie
                        padding={aggregateGridPadding(style.slices)}
                        data={series.map((_series, index) => {
                            const customLabelStyles = style.slices?.customStyles?.[_series.stylingKey!]?.label;
                            return {
                                ..._series,
                                labelStyle: {
                                    fill: customLabelStyles?.color ?? normalizedSliceColors[index],
                                    ...customLabelStyles
                                }
                            };
                        })}
                        height={chartDimensions.width}
                        width={chartDimensions.width}
                        style={{
                            labels: { ...createLabelStyleGetters(...LABEL_STYLE_KEYS) }
                        }}
                        labels={({ datum }) => (showLabels ? datum.x : undefined)}
                        innerRadius={
                            presentation === "doughnut" && chartDimensions.width && chartDimensions.width > 0
                                ? style.slices?.innerRadius ?? chartDimensions.width / DEFAULT_INNER_RADIUS_RATIO
                                : undefined
                        }
                        colorScale={normalizedSliceColors}
                    />
                ) : null}
            </View>
        </View>
    );
}

function createLabelStyleGetters(...keys: string[]): VictoryStyleObject {
    return keys.reduce(
        (acc, key) => Object.assign(acc, { [key]: ({ datum }: CallbackArgs) => datum.labelStyle[key] }),
        {}
    );
}

function aggregateGridPadding({
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft
}: SlicesStyle = {}): BlockProps {
    return {
        top: paddingTop ?? paddingVertical ?? padding ?? 0,
        right: paddingRight ?? paddingHorizontal ?? padding ?? 0,
        bottom: paddingBottom ?? paddingVertical ?? padding ?? 0,
        left: paddingLeft ?? paddingHorizontal ?? padding ?? 0
    };
}
