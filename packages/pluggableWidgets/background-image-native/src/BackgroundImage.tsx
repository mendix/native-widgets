import { createElement } from "react";
import { View, StyleSheet, StyleProp } from "react-native";
import { ValueStatus } from "mendix";
import { Image, SvgImageStyle } from "mendix/components/native/Image";
import { flattenStyles } from "@mendix/piw-native-utils-internal";

import { BackgroundImageStyle, defaultBackgroundImageStyle } from "./ui/Styles";
import { BackgroundImageProps } from "../typings/BackgroundImageProps";

export function BackgroundImage(props: BackgroundImageProps<BackgroundImageStyle>): JSX.Element | null {
    const styles = flattenStyles(defaultBackgroundImageStyle, props.style);
    const { image, defaultImage, name, resizeMode } = props;
    let opacity = Number(props.opacity.toFixed());

    if (opacity < 0) {
        opacity = 0;
    } else if (opacity > 1) {
        opacity = 1;
    }

    const renderImage = (image.status === ValueStatus.Available && image.value) || !defaultImage ? image : defaultImage;

    if (renderImage.status !== ValueStatus.Available || !renderImage.value) {
        return null;
    }

    const imageStyle = [
        StyleSheet.absoluteFill,
        typeof renderImage.value === "number"
            ? { width: undefined, height: undefined }
            : typeof renderImage.value === "string"
            ? { width: "100%", height: "100%" }
            : undefined,
        styles.image,
        { opacity, resizeMode }
    ] as StyleProp<SvgImageStyle>;

    return (
        <View style={styles.container} testID={name}>
            <Image
                source={renderImage.value}
                style={imageStyle}
                color={styles.image.svgColor}
                testID={`${name}$image`}
            />
            {props.content}
        </View>
    );
}
