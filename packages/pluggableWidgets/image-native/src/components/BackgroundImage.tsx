import { ReactNode, FunctionComponent, useState, useCallback, useRef, useEffect } from "react";
import { ImageStyle, LayoutChangeEvent, View } from "react-native";
import { extractStyles } from "@mendix/pluggable-widgets-tools";
import { ResizeModeEnum } from "../../typings/ImageProps";
import { CustomImageObjectProps, onLayoutSetDimensions } from "../utils/imageUtils";
import { DimensionsType, ImageIconSVG } from "./ImageIconSVG";
import { DefaultImageStyle } from "../ui/Styles.js";
import { DynamicValue } from "mendix";

export interface BackgroundImageProps {
    name?: string;
    source: CustomImageObjectProps;
    initialDimensions?: DimensionsType;
    children: ReactNode;
    resizeMode: ResizeModeEnum;
    opacity: number;
    styles: DefaultImageStyle;
    accessible: boolean;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export const BackgroundImage: FunctionComponent<BackgroundImageProps> = props => {
    const [dimensions, setDimensions] = useState<DimensionsType>();
    const { source, initialDimensions, children, opacity, styles, name } = props;
    const [svgProps] = extractStyles(styles.image as ImageStyle, ["width", "height"]);
    const dimensionsResolved = !!((dimensions?.width || svgProps?.width) && (dimensions?.height || svgProps?.height));
    const containerLayoutRef = useRef<{ width: number; height: number } | null>(null);

    const onLayoutSetDimensionsCallback = useCallback(
        ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
            containerLayoutRef.current = { width: layout.width, height: layout.height };
            onLayoutSetDimensions(layout.width, layout.height, setDimensions, initialDimensions);
        },
        [initialDimensions]
    );

    // Re-compute dimensions when initialDimensions arrives after onLayout already fired (static images only)
    useEffect(() => {
        if (!dimensionsResolved && initialDimensions && containerLayoutRef.current) {
            onLayoutSetDimensions(
                containerLayoutRef.current.width,
                containerLayoutRef.current.height,
                setDimensions,
                initialDimensions
            );
        }
    }, [initialDimensions, dimensionsResolved]);

    return (
        <View
            testID={`${name}$ImageBackgroundView`}
            onLayout={
                (!dimensions?.width && !svgProps?.width) || (!dimensions?.height && !svgProps?.height)
                    ? onLayoutSetDimensionsCallback
                    : undefined
            }
            style={[
                {
                    width: svgProps?.width ?? dimensions?.width ?? "100%",
                    height: svgProps?.height ?? dimensions?.height ?? "100%"
                },
                dimensionsResolved ? styles.container : { opacity: 0 }
            ]}
        >
            <View
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    opacity: opacity ? opacity / 100 : 1
                }}
            >
                <ImageIconSVG
                    {...source}
                    name={name}
                    width={(svgProps?.width ?? dimensions?.width) as number}
                    height={(svgProps?.height ?? dimensions?.height) as number}
                    initialDimensions={initialDimensions}
                    resizeMode={props.resizeMode}
                    styles={styles.image}
                />
            </View>
            {children}
        </View>
    );
};
