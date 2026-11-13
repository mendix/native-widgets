import {
    Dispatch,
    SetStateAction,
    FunctionComponent,
    RefObject,
    useState,
    Fragment,
    useCallback,
    useMemo,
    useRef
} from "react";
import { Pressable, LayoutChangeEvent, View, ImageStyle, useWindowDimensions } from "react-native";
import { SvgUri } from "react-native-svg";
import { extractStyles } from "@mendix/pluggable-widgets-tools";
import { OnClickTypeEnum } from "../../typings/ImageProps";
import { CustomImageObjectProps, onLayoutSetDimensions, getScaledDimensions } from "../utils/imageUtils";
import { DimensionsType, ImageIconSVG } from "./ImageIconSVG";
import { DefaultImageStyle } from "../ui/Styles.js";
import { DynamicValue } from "mendix";
import { MxOverlay } from "@mendix/piw-native-utils-internal";

// The themed backdrop style is applied on the pressable inside the overlay, so the overlay backdrop stays transparent
const transparentBackdrop = { backgroundColor: "transparent" };

interface AccessibilityProps {
    accessible: boolean;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

interface ImageViewerBaseProps extends AccessibilityProps {
    name?: string;
    source: CustomImageObjectProps;
    customWidth?: number;
    customHeight?: number;
    iconSize?: number;
    initialDimensions: DimensionsType | undefined;
}

export interface ImageViewerProps extends ImageViewerBaseProps {
    onClick: () => void;
    onClickType: OnClickTypeEnum;
    setInitialDimensions?: Dispatch<SetStateAction<DimensionsType | undefined>>;
    styles: DefaultImageStyle;
}
interface ImageSmallProps extends ImageViewerBaseProps {
    onClick: () => Dispatch<SetStateAction<boolean>> | void;
    pressableRef?: RefObject<View | null>;
    styles: DefaultImageStyle;
}
interface ImageEnlargedProps extends ImageViewerBaseProps {
    visible: boolean;
    setEnlarged: Dispatch<SetStateAction<boolean>>;
    returnFocusRef?: RefObject<View | null>;
    styles: DefaultImageStyle;
}
interface GetImageDimensionsComponentProps extends ImageViewerBaseProps {
    setInitialDimensions: Dispatch<SetStateAction<DimensionsType | undefined>> | undefined;
}

export const ImageViewer: FunctionComponent<ImageViewerProps> = props => {
    const [enlarged, setEnlarged] = useState(false);
    const triggerRef = useRef<View>(null);
    const {
        accessible,
        screenReaderCaption,
        screenReaderHint,
        source,
        initialDimensions,
        setInitialDimensions,
        customWidth,
        customHeight,
        iconSize,
        onClick,
        onClickType,
        styles,
        name
    } = props;

    return (
        <Fragment>
            <ImageSmall
                name={name}
                accessible={accessible}
                screenReaderCaption={screenReaderCaption}
                screenReaderHint={screenReaderHint}
                source={source}
                customWidth={customWidth}
                customHeight={customHeight}
                iconSize={iconSize}
                initialDimensions={initialDimensions}
                onClick={onClickType === "enlarge" ? () => setEnlarged(true) : onClick}
                pressableRef={triggerRef}
                styles={styles}
            />
            <GetImageDimensionsComponent
                name={name}
                accessible={accessible}
                screenReaderCaption={screenReaderCaption}
                screenReaderHint={screenReaderHint}
                source={source}
                initialDimensions={initialDimensions}
                setInitialDimensions={setInitialDimensions}
            />
            <ImageEnlarged
                name={name}
                accessible={accessible}
                screenReaderCaption={screenReaderCaption}
                screenReaderHint={screenReaderHint}
                visible={enlarged}
                setEnlarged={setEnlarged}
                returnFocusRef={triggerRef}
                source={source}
                initialDimensions={initialDimensions}
                styles={styles}
            />
        </Fragment>
    );
};

export const GetImageDimensionsComponent: FunctionComponent<GetImageDimensionsComponentProps> = props => {
    const { source, initialDimensions, setInitialDimensions, name, accessible, screenReaderCaption, screenReaderHint } =
        props;

    const onLayoutSetInitialDimensions = useCallback(
        ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
            const { width, height } = layout;
            setInitialDimensions?.({
                width,
                height,
                aspectRatio: width && height ? width / height : undefined
            });
        },
        [setInitialDimensions]
    );

    /* Render dynamicSVG once to get initial dimensions */
    return source?.image &&
        source.type === "dynamicSVG" &&
        (!initialDimensions?.width || !initialDimensions?.height) ? (
        <View
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0
            }}
            // pointerEvents: "none" sets the component to disabled in component tests. Which in turn disables the execution of events (onLayout)
            // Source: https://callstack.github.io/react-native-testing-library/docs/api#fireevent
            pointerEvents={source.image === "this/is/a/fake/path.svg" ? "auto" : "none"}
        >
            <SvgUri
                accessible={accessible}
                accessibilityLabel={screenReaderCaption?.value}
                accessibilityHint={screenReaderHint?.value}
                accessibilityRole="image"
                testID={`${name}$SvgUriTemporary`}
                uri={source.image as string}
                onLayout={onLayoutSetInitialDimensions}
                style={{
                    opacity: 0
                }}
            />
        </View>
    ) : null;
};

export const ImageSmall: FunctionComponent<ImageSmallProps> = props => {
    const {
        source,
        initialDimensions,
        customWidth,
        customHeight,
        iconSize,
        onClick,
        pressableRef,
        styles,
        name,
        accessible,
        screenReaderCaption,
        screenReaderHint
    } = props;
    const [dimensions, setDimensions] = useState<DimensionsType>();
    const [svgProps] = extractStyles(styles.image as ImageStyle, ["width", "height"]);
    const dimensionsNotSet =
        source.type !== "icon" &&
        ((!dimensions?.width && !svgProps?.width) || (!dimensions?.height && !svgProps?.height));
    const onLayoutSetDimensionsCallback = useCallback(
        ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
            onLayoutSetDimensions(
                customWidth ?? layout.width,
                customHeight ?? layout.height,
                setDimensions,
                initialDimensions
            );
        },
        [initialDimensions, customWidth, customHeight]
    );

    return source.type === "icon" || (initialDimensions?.width && initialDimensions?.height) ? (
        <Pressable
            ref={pressableRef}
            accessible={accessible}
            accessibilityLabel={screenReaderCaption?.value}
            accessibilityHint={screenReaderHint?.value}
            accessibilityRole="image"
            testID={`${name}$ImageSmallPressable`}
            onPress={onClick}
            onLayout={dimensionsNotSet ? onLayoutSetDimensionsCallback : undefined}
            style={[
                dimensionsNotSet
                    ? { position: "absolute", opacity: 0, width: "100%", aspectRatio: initialDimensions?.aspectRatio }
                    : {},
                styles.container
            ]}
        >
            <ImageIconSVG
                {...source}
                name={name}
                iconSize={iconSize}
                width={(svgProps?.width ?? dimensions?.width) as number}
                height={(svgProps?.height ?? dimensions?.height) as number}
                initialDimensions={initialDimensions}
                styles={styles.image}
            />
        </Pressable>
    ) : null;
};

export const ImageEnlarged: FunctionComponent<ImageEnlargedProps> = props => {
    const {
        visible,
        setEnlarged,
        source,
        initialDimensions,
        styles,
        name,
        accessible,
        screenReaderCaption,
        screenReaderHint,
        returnFocusRef
    } = props;
    const contentRef = useRef<View>(null);
    const [svgProps] = extractStyles(styles.image as ImageStyle, ["width", "height"]);

    const { width, height } = useWindowDimensions();
    const dimensions = useMemo(() => {
        return getScaledDimensions(width, height, initialDimensions);
    }, [width, height, initialDimensions]);

    return initialDimensions?.width && initialDimensions?.height ? (
        <MxOverlay
            visible={visible}
            onRequestClose={() => setEnlarged(false)}
            placement="fullscreen"
            testID={`${name}$ImageEnlargedOverlay`}
            backdropStyle={transparentBackdrop}
            respectSafeArea={false}
            statusBarTranslucent={false}
            initialFocusRef={contentRef}
            returnFocusRef={returnFocusRef}
            supportedOrientations={[
                "portrait",
                "portrait-upside-down",
                "landscape",
                "landscape-left",
                "landscape-right"
            ]}
        >
            <Pressable
                ref={contentRef}
                accessible={accessible}
                accessibilityLabel={screenReaderCaption?.value}
                accessibilityHint={screenReaderHint?.value}
                accessibilityRole="image"
                testID={`${name}$ImageEnlargedPressable`}
                onPress={() => setEnlarged(false)}
                style={styles.backdrop}
            >
                <View
                    pointerEvents="none"
                    style={{
                        width: (svgProps?.width ?? dimensions?.width) as number,
                        height: (svgProps?.height ?? dimensions?.height) as number
                    }}
                >
                    <ImageIconSVG
                        {...source}
                        name={name}
                        width={(svgProps?.width ?? dimensions?.width) as number}
                        height={(svgProps?.height ?? dimensions?.height) as number}
                        initialDimensions={initialDimensions}
                        styles={styles.image}
                    />
                </View>
            </Pressable>
        </MxOverlay>
    ) : null;
};
