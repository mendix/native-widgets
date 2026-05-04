import { createIconSet } from "@react-native-vector-icons/common";
import { glyphMap } from "./Halflings";

export const GlyphIcon = createIconSet(glyphMap, "GLYPHICONS Halflings", "glyphicons-halflings-regular.ttf");
type GlyphIconName = keyof typeof glyphMap;

export interface Icon {
    uri: string;
    scale: number;
}

export interface ImageSourcesCache {
    [iconClassName: string]: Icon;
}

function isGlyphIconName(iconName: string): iconName is GlyphIconName {
    return iconName in glyphMap;
}

export const getIcon = async (iconName: string, size: number, color: string): Promise<Icon> => {
    if (!isGlyphIconName(iconName)) {
        throw new Error(`Unknown glyphicon requested: ${iconName}`);
    }

    const source = await GlyphIcon.getImageSource(iconName, size, color);

    if (!source) {
        throw new Error(`Failed to generate image source for glyphicon: ${iconName}`);
    }

    return source;
};

export interface IconConfiguration {
    name: string;
    size: number;
    color: string;
}

export const preloadIcons = async (icons: IconConfiguration[]): Promise<ImageSourcesCache> =>
    Promise.all(icons.map(icon => getIcon(icon.name, icon.size, icon.color))).then(imageSources =>
        icons.reduce(buildImageCache(imageSources), {})
    );

const buildImageCache =
    (imageSources: Icon[]) =>
    (imageSourcesCache: ImageSourcesCache, iconConfiguration: IconConfiguration, index: number): ImageSourcesCache => {
        imageSourcesCache[iconConfiguration.name] = imageSources[index];
        return imageSourcesCache;
    };
