import { createIconSet } from "@react-native-vector-icons/common";
import { ensure } from "@mendix/pluggable-widgets-tools";
import { glyphMap } from "./Halflings";

export const GlyphIcon = createIconSet(glyphMap, "GLYPHICONS Halflings", "glyphicons-halflings-regular.ttf");
export type GlyphIconName = keyof typeof glyphMap;

interface Icon {
    uri: string;
    scale: number;
}

interface ImageSourcesCache {
    [iconClassName: string]: Icon;
}

function isGlyphIconName(iconName: string): iconName is GlyphIconName {
    return iconName in glyphMap;
}

export const getIcon = async (iconName: string): Promise<Icon> => {
    if (!isGlyphIconName(iconName)) {
        throw new Error(`Unknown glyphicon requested: ${iconName}`);
    }

    return ensure(await GlyphIcon.getImageSource(iconName, 20, "black"));
};

export const preloadIcons = (iconNames: string[]): Promise<ImageSourcesCache> =>
    Promise.all(iconNames.map(iconName => getIcon(iconName))).then(imageSources =>
        iconNames.reduce(buildImageCache(imageSources), {})
    );

const buildImageCache =
    (imageSources: Icon[]) => (imageSourcesCache: ImageSourcesCache, iconName: string, index: number) => {
        imageSourcesCache[iconName] = ensure(imageSources[index]);
        return imageSourcesCache;
    };
