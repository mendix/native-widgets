import { createElement, ReactElement, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    AccessibilityActionEvent,
    Animated,
    GestureResponderEvent,
    I18nManager,
    LayoutChangeEvent,
    PanResponder,
    PanResponderGestureState,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from "react-native";

const TRACK_SIZE = 4;
const THUMB_SIZE = 20;
// Minimum touch target on both platforms (Android 48dp, iOS 44pt)
const MIN_TOUCH_SIZE = 48;
// Both platforms truncate accessibilityValue min/max/now to integers, and iOS reads it as now / (max - min),
// so the value is always reported on a 0-100 scale to be announced correctly for any range.
const ACCESSIBILITY_SCALE = 100;

interface Size {
    width: number;
    height: number;
}

interface SliderBaseProps {
    minimumValue?: number;
    maximumValue?: number;
    /** Step between values; 0 means continuous. */
    step?: number;
    disabled?: boolean;
    /** When true, pressing the track moves the closest thumb to the pressed position and continues as a drag. */
    trackClickable?: boolean;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    style?: StyleProp<ViewStyle>;
    trackStyle?: StyleProp<ViewStyle>;
    /** Style of the highlighted part of the track: up to the thumb, or between the thumbs of a range. */
    minimumTrackStyle?: StyleProp<ViewStyle>;
    maximumTrackStyle?: StyleProp<ViewStyle>;
    thumbStyle?: StyleProp<ViewStyle>;
    /** Touchable area around each thumb; never smaller than 48x48. */
    thumbTouchSize?: Size;
    /** Amount a screen reader increment/decrement changes a value. Defaults to a tenth of the range. */
    accessibilityIncrement?: number;
    testID?: string;
}

export interface SliderProps extends SliderBaseProps {
    value: number;
    onValueChange?: (value: number) => void;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    accessibilityLabel?: string;
}

export type RangeSliderValue = [number, number];

export interface RangeSliderProps extends SliderBaseProps {
    /** Lower and upper value. The thumbs can meet but not pass each other. */
    value: RangeSliderValue;
    /** Called with both values and the index of the thumb that changed. */
    onValueChange?: (value: RangeSliderValue, thumbIndex: number) => void;
    onSlidingStart?: (value: RangeSliderValue, thumbIndex: number) => void;
    onSlidingComplete?: (value: RangeSliderValue, thumbIndex: number) => void;
    /** Screen reader labels of the lower and upper thumb. */
    accessibilityLabels?: [string | undefined, string | undefined];
}

export function Slider(props: SliderProps): ReactElement {
    const { value, onValueChange, onSlidingStart, onSlidingComplete } = props;
    return (
        <MultiSlider
            {...props}
            values={[value]}
            onValueChange={onValueChange && (values => onValueChange(values[0]))}
            onSlidingStart={onSlidingStart && (values => onSlidingStart(values[0]))}
            onSlidingComplete={onSlidingComplete && (values => onSlidingComplete(values[0]))}
            accessibilityLabels={[props.accessibilityLabel]}
        />
    );
}

export function RangeSlider(props: RangeSliderProps): ReactElement {
    const { value, onValueChange, onSlidingStart, onSlidingComplete } = props;
    const toRange = (values: number[]): RangeSliderValue => [values[0], values[1]];
    return (
        <MultiSlider
            {...props}
            values={value}
            onValueChange={onValueChange && ((values, index) => onValueChange(toRange(values), index))}
            onSlidingStart={onSlidingStart && ((values, index) => onSlidingStart(toRange(values), index))}
            onSlidingComplete={onSlidingComplete && ((values, index) => onSlidingComplete(toRange(values), index))}
        />
    );
}

type SlidingEvent = "onValueChange" | "onSlidingStart" | "onSlidingComplete";

interface MultiSliderProps extends SliderBaseProps, Partial<Record<SlidingEvent, SlidingCallback>> {
    /** One value per thumb; the number of thumbs must not change between renders. */
    values: number[];
    accessibilityLabels?: Array<string | undefined>;
}

type SlidingCallback = (values: number[], thumbIndex: number) => void;

interface Layout {
    container: Size;
    thumb: Size;
    measured: boolean;
}

const emptySize: Size = { width: 0, height: 0 };

function MultiSlider(props: MultiSliderProps): ReactElement {
    const {
        minimumValue = 0,
        maximumValue = 1,
        disabled = false,
        minimumTrackTintColor = "#3f3f3f",
        maximumTrackTintColor = "#b3b3b3",
        thumbTintColor = "#343434",
        accessibilityLabels = [],
        testID
    } = props;
    const values = normalizeValues(props.values, props);
    const single = values.length === 1;

    const [animatedValues] = useState(() => values.map(value => new Animated.Value(value)));
    const [layout, setLayout] = useState<Layout>({ container: emptySize, thumb: emptySize, measured: false });

    // PanResponder handlers are created once, so they read everything through this ref
    const latest = useRef({
        props,
        layout,
        propValues: values,
        currentValues: values,
        activeIndex: 0,
        // Thumbs sharing the pressed position; the first move decides which one is dragged
        tiedIndexes: [] as number[],
        previousLeft: 0,
        grantedOnThumb: true
    });

    const setCurrentValue = (index: number, next: number): void => {
        const currentValues = [...latest.current.currentValues];
        currentValues[index] = next;
        latest.current.currentValues = currentValues;
        animatedValues[index].setValue(next);
    };

    useLayoutEffect(() => {
        latest.current.props = props;
        latest.current.layout = layout;
        // Only follow the props when they change, so a re-render during a drag doesn't reset the thumb
        if (values.some((value, index) => value !== latest.current.propValues[index])) {
            latest.current.propValues = values;
            values.forEach((value, index) => setCurrentValue(index, value));
        }
    });

    const panResponder = useMemo(() => {
        const fire = (event: SlidingEvent): void => {
            latest.current.props[event]?.(latest.current.currentValues, latest.current.activeIndex);
        };

        const setActiveValueForLeft = (left: number): void => {
            const { props: current, layout: currentLayout, currentValues, activeIndex } = latest.current;
            const value = clampToNeighbours(getValueForLeft(left, currentLayout, current), activeIndex, currentValues);
            setCurrentValue(activeIndex, value);
        };

        // eslint-disable-next-line react-hooks/refs -- the ref is only read inside gesture handlers, never during render
        return PanResponder.create({
            onStartShouldSetPanResponder: (event: GestureResponderEvent) => {
                const { props: current, layout: currentLayout, currentValues } = latest.current;
                if (current.disabled) {
                    return false;
                }
                // Testing libraries call this without an event to check whether the responder is enabled
                if (!event?.nativeEvent) {
                    return true;
                }
                const hit = getThumbAt(event, currentLayout, currentValues, current);
                if (!hit.onThumb && !current.trackClickable) {
                    return false;
                }
                latest.current.grantedOnThumb = hit.onThumb;
                latest.current.activeIndex = hit.tiedIndexes[0];
                latest.current.tiedIndexes = hit.tiedIndexes;
                return true;
            },
            onMoveShouldSetPanResponder: () => false,
            onPanResponderGrant: (event: GestureResponderEvent) => {
                const { props: current, layout: currentLayout, currentValues } = latest.current;
                if (!latest.current.grantedOnThumb) {
                    const overflow = getTouchOverflowSize(currentLayout, current);
                    const touchX = event.nativeEvent.locationX - overflow.width / 2;
                    const left = toLogicalLeft(touchX - currentLayout.thumb.width / 2, currentLayout);
                    const thumbLeft = getThumbLeft(currentValues[latest.current.activeIndex], currentLayout, current);
                    resolveTie(left - thumbLeft);
                    setActiveValueForLeft(left);
                }
                latest.current.previousLeft = getThumbLeft(
                    latest.current.currentValues[latest.current.activeIndex],
                    currentLayout,
                    current
                );
                fire("onSlidingStart");
                if (!latest.current.grantedOnThumb) {
                    fire("onValueChange");
                }
            },
            onPanResponderMove: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                if (latest.current.props.disabled) {
                    return;
                }
                const dx = toLogicalDx(gestureState.dx);
                resolveTie(dx);
                setActiveValueForLeft(latest.current.previousLeft + dx);
                fire("onValueChange");
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) =>
                end(gestureState),
            onPanResponderTerminate: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) =>
                end(gestureState)
        });

        // Moving up takes the highest of the tied thumbs, moving down the lowest, so they can always be separated
        function resolveTie(direction: number): void {
            const { tiedIndexes } = latest.current;
            if (tiedIndexes.length > 1 && direction !== 0) {
                latest.current.activeIndex = direction > 0 ? tiedIndexes[tiedIndexes.length - 1] : tiedIndexes[0];
                latest.current.tiedIndexes = [latest.current.activeIndex];
            }
        }

        function end(gestureState: PanResponderGestureState): void {
            latest.current.grantedOnThumb = true;
            latest.current.tiedIndexes = [];
            if (latest.current.props.disabled) {
                return;
            }
            setActiveValueForLeft(latest.current.previousLeft + toLogicalDx(gestureState.dx));
            fire("onSlidingComplete");
        }
    }, []);

    const onAccessibilityAction = (index: number, event: AccessibilityActionEvent): void => {
        const direction =
            event.nativeEvent.actionName === "increment" ? 1 : event.nativeEvent.actionName === "decrement" ? -1 : 0;
        if (disabled || direction === 0) {
            return;
        }
        const { currentValues } = latest.current;
        const current = currentValues[index];
        const next = clampToNeighbours(
            snapToStep(current + direction * getAccessibilityIncrement(props), props),
            index,
            currentValues
        );
        if (next === current) {
            return;
        }
        latest.current.activeIndex = index;
        props.onSlidingStart?.(currentValues, index);
        setCurrentValue(index, next);
        props.onValueChange?.(latest.current.currentValues, index);
        props.onSlidingComplete?.(latest.current.currentValues, index);
    };

    const accessibilityProps = values.map((value, index) => ({
        accessible: true,
        accessibilityRole: "adjustable" as const,
        accessibilityLabel: accessibilityLabels[index],
        accessibilityState: { disabled },
        accessibilityValue: {
            min: 0,
            max: ACCESSIBILITY_SCALE,
            now: Math.round(getRatio(value, props) * ACCESSIBILITY_SCALE)
        },
        accessibilityActions: [{ name: "increment" }, { name: "decrement" }]
    }));

    const measure =
        (name: "container" | "thumb") =>
        (event: LayoutChangeEvent): void => {
            const { width, height } = event.nativeEvent.layout;
            setLayout(previous => {
                if (previous[name].width === width && previous[name].height === height) {
                    return previous;
                }
                const next = { ...previous, [name]: { width, height } };
                return { ...next, measured: next.container.width > 0 && next.thumb.width > 0 };
            });
        };

    const length = layout.container.width - layout.thumb.width;
    const inputRange = [minimumValue, maximumValue > minimumValue ? maximumValue : minimumValue + 1];
    const trackLefts = animatedValues.map(value =>
        value.interpolate({ inputRange, outputRange: [0, length], extrapolate: "clamp" })
    );
    const visibility = layout.measured ? undefined : styles.hidden;
    const overflow = getTouchOverflowSize(layout, props);
    const halfThumb = layout.thumb.width / 2;

    return (
        <View
            style={[styles.container, props.style]}
            onLayout={measure("container")}
            testID={testID}
            {...(single ? accessibilityProps[0] : undefined)}
            onAccessibilityAction={
                single ? (event: AccessibilityActionEvent) => onAccessibilityAction(0, event) : undefined
            }
        >
            <View
                style={[
                    { backgroundColor: maximumTrackTintColor },
                    styles.track,
                    props.trackStyle,
                    props.maximumTrackStyle
                ]}
                renderToHardwareTextureAndroid
            />
            <Animated.View
                renderToHardwareTextureAndroid
                style={[
                    styles.track,
                    props.trackStyle,
                    { backgroundColor: minimumTrackTintColor },
                    props.minimumTrackStyle,
                    single
                        ? { position: "absolute", width: Animated.add(trackLefts[0], halfThumb) }
                        : {
                              position: "absolute",
                              start: Animated.add(trackLefts[0], halfThumb),
                              width: Animated.subtract(trackLefts[trackLefts.length - 1], trackLefts[0])
                          },
                    visibility
                ]}
            />
            {trackLefts.map((left, index) => (
                <Animated.View
                    key={index}
                    onLayout={index === 0 ? measure("thumb") : undefined}
                    renderToHardwareTextureAndroid
                    testID={single || !testID ? undefined : `${testID}$thumb${index}`}
                    {...(single ? undefined : accessibilityProps[index])}
                    onAccessibilityAction={
                        single ? undefined : (event: AccessibilityActionEvent) => onAccessibilityAction(index, event)
                    }
                    style={[
                        { backgroundColor: thumbTintColor },
                        styles.thumb,
                        props.thumbStyle,
                        {
                            transform: [
                                { translateX: I18nManager.isRTL ? Animated.multiply(left, -1) : left },
                                { translateY: 0 }
                            ]
                        },
                        visibility
                    ]}
                />
            ))}
            <View
                renderToHardwareTextureAndroid
                style={[
                    styles.touchArea,
                    layout.measured && {
                        marginTop: -overflow.height / 2,
                        marginBottom: -overflow.height / 2,
                        marginLeft: -overflow.width / 2,
                        marginRight: -overflow.width / 2
                    }
                ]}
                {...panResponder.panHandlers}
            />
        </View>
    );
}

function normalizeValues(values: number[], { minimumValue = 0, maximumValue = 1 }: SliderBaseProps): number[] {
    return values.map(value => Math.max(minimumValue, Math.min(maximumValue, value))).sort((a, b) => a - b);
}

function getRatio(value: number, { minimumValue = 0, maximumValue = 1 }: SliderBaseProps): number {
    const range = maximumValue - minimumValue;
    return range > 0 ? Math.max(0, Math.min(1, (value - minimumValue) / range)) : 0;
}

function getTrackLength(layout: Layout): number {
    return layout.container.width - layout.thumb.width;
}

/** Distance of the thumb from the start of the track, which is the right edge in right-to-left layouts. */
function getThumbLeft(value: number, layout: Layout, props: SliderBaseProps): number {
    return getRatio(value, props) * getTrackLength(layout);
}

/** Converts between a distance from the left edge, as touches report it, and from the start of the track. */
function toLogicalLeft(left: number, layout: Layout): number {
    return I18nManager.isRTL ? getTrackLength(layout) - left : left;
}

function toLogicalDx(dx: number): number {
    return I18nManager.isRTL ? -dx : dx;
}

function getValueForLeft(left: number, layout: Layout, props: SliderBaseProps): number {
    const { minimumValue = 0, maximumValue = 1 } = props;
    const length = getTrackLength(layout);
    if (length <= 0) {
        return snapToStep(minimumValue, props);
    }
    return snapToStep((left / length) * (maximumValue - minimumValue) + minimumValue, props);
}

function clampToNeighbours(value: number, index: number, values: number[]): number {
    const lower = index > 0 ? values[index - 1] : -Infinity;
    const upper = index < values.length - 1 ? values[index + 1] : Infinity;
    return Math.max(lower, Math.min(upper, value));
}

function snapToStep(value: number, { minimumValue = 0, maximumValue = 1, step = 0 }: SliderBaseProps): number {
    const snapped =
        step > 0
            ? // Round to the precision of the step to avoid floating point noise such as 0.35000000000000003
              Number(
                  (minimumValue + Math.round((value - minimumValue) / step) * step).toFixed(
                      Math.max(decimalPlaces(step), decimalPlaces(minimumValue))
                  )
              )
            : value;
    return Math.max(minimumValue, Math.min(maximumValue, snapped));
}

function decimalPlaces(value: number): number {
    return (String(value).split(".")[1] ?? "").length;
}

function getAccessibilityIncrement(props: SliderBaseProps): number {
    const { minimumValue = 0, maximumValue = 1, step = 0, accessibilityIncrement } = props;
    const increment = accessibilityIncrement ?? (maximumValue - minimumValue) / 10;
    return step > 0 ? Math.max(step, Math.round(increment / step) * step) : increment;
}

function getThumbTouchSize({ thumbTouchSize }: SliderBaseProps): Size {
    return {
        width: Math.max(MIN_TOUCH_SIZE, thumbTouchSize?.width ?? 0),
        height: Math.max(MIN_TOUCH_SIZE, thumbTouchSize?.height ?? 0)
    };
}

function getTouchOverflowSize(layout: Layout, props: SliderBaseProps): Size {
    const touchSize = getThumbTouchSize(props);
    return {
        width: Math.max(0, touchSize.width - layout.thumb.width),
        height: Math.max(0, touchSize.height - layout.container.height)
    };
}

/**
 * Finds the thumb closest to a touch and whether the touch is within its touch area. Returns every thumb at that
 * position, so thumbs on top of each other can be told apart once the drag direction is known.
 */
function getThumbAt(
    event: GestureResponderEvent,
    layout: Layout,
    values: number[],
    props: SliderBaseProps
): { onThumb: boolean; tiedIndexes: number[] } {
    const touchSize = getThumbTouchSize(props);
    const overflow = getTouchOverflowSize(layout, props);
    const { locationX, locationY } = event.nativeEvent;
    const centres = values.map(
        value => overflow.width / 2 + toLogicalLeft(getThumbLeft(value, layout, props), layout) + layout.thumb.width / 2
    );
    const distances = centres.map(centre => Math.abs(locationX - centre));
    const closest = distances.indexOf(Math.min(...distances));
    const top = overflow.height / 2 + (layout.container.height - touchSize.height) / 2;
    const onThumb =
        distances[closest] <= touchSize.width / 2 && locationY >= top && locationY <= top + touchSize.height;
    return {
        onThumb,
        tiedIndexes: values.map((_, index) => index).filter(index => values[index] === values[closest])
    };
}

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: "center"
    },
    track: {
        height: TRACK_SIZE,
        borderRadius: TRACK_SIZE / 2
    },
    thumb: {
        position: "absolute",
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2
    },
    touchArea: {
        position: "absolute",
        backgroundColor: "transparent",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    hidden: {
        opacity: 0
    }
});
