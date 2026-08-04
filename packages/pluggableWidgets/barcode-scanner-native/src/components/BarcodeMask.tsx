import { ReactElement, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { barcodeMaskStyles as styles } from "../ui/styles";

const AnimatedLine = Animated.createAnimatedComponent(Line);

export type BarcodeMaskSvgProps = {
    edgeColor?: string;
    width?: number;
    height?: number;
    showAnimatedLine?: boolean;
    backgroundColor?: string;
};

const EDGE_WIDTH = 25;
const EDGE_HEIGHT = 25;
const EDGE_BORDER_WIDTH = 4;
const ANIMATED_LINE_COLOR = "#fff";
const ANIMATED_LINE_THICKNESS = 3;
const LINE_ANIMATION_DURATION = 2000;

export const BarcodeMask = (props: BarcodeMaskSvgProps): ReactElement => {
    const {
        edgeColor = "#fff",
        width = 280,
        height = 260,
        showAnimatedLine = true,
        backgroundColor = "rgba(0, 0, 0, 0.6)"
    } = props;

    const lineY = useRef(new Animated.Value(0)).current;
    const lineStrokeWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        lineY.setValue(0);
        lineStrokeWidth.setValue(0);

        Animated.spring(lineStrokeWidth, {
            toValue: ANIMATED_LINE_THICKNESS,
            damping: 15,
            stiffness: 100,
            mass: 0.5,
            useNativeDriver: false
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(lineY, {
                    toValue: height,
                    duration: LINE_ANIMATION_DURATION,
                    useNativeDriver: false
                }),
                Animated.timing(lineY, {
                    toValue: 0,
                    duration: LINE_ANIMATION_DURATION,
                    useNativeDriver: false
                })
            ])
        ).start();
    }, [height, lineY, lineStrokeWidth]);

    const strokeOffset = EDGE_BORDER_WIDTH / 2;
    const maskLeft = strokeOffset;
    const maskTop = strokeOffset;
    const maskRight = width - strokeOffset;
    const maskBottom = height - strokeOffset;

    return (
        <View style={styles.container} pointerEvents="none">
            <View style={[{ flex: 1, backgroundColor, width: "100%" }]} />
            <View style={styles.maskCenter}>
                <View style={[{ flex: 1, backgroundColor, height }]} />
                <View style={[styles.mask, { height, width }]}>
                    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
                        <Path
                            d={`M ${maskLeft} ${maskTop + EDGE_HEIGHT} L ${maskLeft} ${maskTop} L ${
                                maskLeft + EDGE_WIDTH
                            } ${maskTop}`}
                            stroke={edgeColor}
                            strokeWidth={EDGE_BORDER_WIDTH}
                            fill="none"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                        />

                        <Path
                            d={`M ${maskRight - EDGE_WIDTH} ${maskTop} L ${maskRight} ${maskTop} L ${maskRight} ${
                                maskTop + EDGE_HEIGHT
                            }`}
                            stroke={edgeColor}
                            strokeWidth={EDGE_BORDER_WIDTH}
                            fill="none"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                        />

                        <Path
                            d={`M ${maskRight} ${maskBottom - EDGE_HEIGHT} L ${maskRight} ${maskBottom} L ${
                                maskRight - EDGE_WIDTH
                            } ${maskBottom}`}
                            stroke={edgeColor}
                            strokeWidth={EDGE_BORDER_WIDTH}
                            fill="none"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                        />

                        <Path
                            d={`M ${maskLeft + EDGE_WIDTH} ${maskBottom} L ${maskLeft} ${maskBottom} L ${maskLeft} ${
                                maskBottom - EDGE_HEIGHT
                            }`}
                            stroke={edgeColor}
                            strokeWidth={EDGE_BORDER_WIDTH}
                            fill="none"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                        />

                        {showAnimatedLine && (
                            <AnimatedLine
                                x1={0}
                                x2={width}
                                y1={lineY}
                                y2={lineY}
                                stroke={ANIMATED_LINE_COLOR}
                                strokeWidth={lineStrokeWidth}
                            />
                        )}
                    </Svg>
                </View>
                <View style={[{ flex: 1, backgroundColor, height }]} />
            </View>
            <View style={[{ flex: 1, backgroundColor, width: "100%" }]} />
        </View>
    );
};

export default BarcodeMask;
