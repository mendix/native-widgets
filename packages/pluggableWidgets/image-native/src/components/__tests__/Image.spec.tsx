import { AccessibilityInfo, Modal, Platform, Text } from "react-native";
import { fireEvent, render, act, RenderAPI } from "@testing-library/react-native";
import { NativeIcon, NativeImage } from "mendix";
import { Style } from "@mendix/piw-native-utils-internal";
import { Image } from "../../Image";
import { actionValue, dynamicValue } from "@mendix/piw-utils-internal";
import { ImageProps } from "../../../typings/ImageProps";
import { parse, SvgAst } from "react-native-svg";
import svgXml from "./svgXml";
import { GlyphIcon } from "../fonts/font";

function flushMicrotasksQueue(): Promise<unknown> {
    return act(() => new Promise(resolve => setTimeout(resolve, 0)));
}

function getImageTestId(name: string, suffix: string): string {
    return `${name}$${suffix}`;
}

async function findByImageTestId(
    image: RenderAPI,
    name: string,
    suffix: string
): Promise<ReturnType<RenderAPI["getByTestId"]>> {
    return image.findByTestId(getImageTestId(name, suffix));
}

async function fireLayout(image: RenderAPI, name: string, suffix: string): Promise<void> {
    fireEvent(await findByImageTestId(image, name, suffix), "layout", onLayoutEventData);
}

const mockFindNodeHandle = jest.fn();
jest.mock("react-native/Libraries/ReactNative/RendererProxy", () => {
    const actual = jest.requireActual("react-native/Libraries/ReactNative/RendererProxy");
    return {
        ...actual,
        // Only intercepted while a test installs an implementation, so other tests keep the real behaviour
        findNodeHandle: (node: unknown) =>
            mockFindNodeHandle.getMockImplementation() ? mockFindNodeHandle(node) : actual.findNodeHandle(node)
    };
});

jest.mock("../../utils/imageUtils", () => {
    const actual = jest.requireActual("../../utils/imageUtils") as typeof import("../../utils/imageUtils");

    return {
        ...actual,
        getImageDimensions: jest.fn(async source => {
            if (source?.type === "staticImage" || source?.type === "dynamicImage") {
                return { width: 2222, height: 1111 };
            }

            return actual.getImageDimensions(source);
        })
    };
});

jest.mock("react-native-svg/lib/commonjs/xml", () => {
    const original = jest.requireActual("react-native-svg/lib/commonjs/xml");
    return {
        ...original,
        SvgXml: jest.fn(props => {
            return <SvgAst ast={parse(svgXml)} override={props} />;
        }),
        SvgUri: jest.fn(props => {
            return <SvgAst ast={parse(svgXml)} override={props} />;
        })
    };
});
jest.mock("react-native/Libraries/Image/Image", () => {
    const original = jest.requireActual("react-native/Libraries/Image/Image");
    return {
        ...original,
        getSize: jest.fn((_uri, fn, _reject) => fn(2222, 1111)),
        resolveAssetSource: jest.fn((_param: number) => ({ width: 2222, height: 1111 }))
    };
});

jest.mock("@d11/react-native-fast-image", () => {
    const React = jest.requireActual("react") as typeof import("react");

    const { resolveAssetSource } = require("react-native/Libraries/Image/Image");
    const FastImage = ({
        testID,
        style,
        source: originalSource,
        resizeMode
    }: {
        testID: string;
        style: any;
        source: any;
        resizeMode: string;
    }): any => {
        let source = originalSource;
        try {
            if (typeof originalSource === "number") {
                const asset = resolveAssetSource(originalSource);
                source = asset ? { height: asset.height, width: asset.width } : { height: 0, width: 0 };
            } else if (originalSource?.uri) {
                // Dynamic image: use fixed dimensions to match stored snapshots
                source = { height: 1111, width: 2222 };
            }
        } catch {
            source = { height: 0, width: 0 };
        }
        return React.createElement(
            "View",
            { style: [{ overflow: "hidden" }, Array.isArray(style) ? style : [style]] },
            React.createElement("FastImageView", {
                testID,
                style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
                source,
                resizeMode
            })
        );
    };
    return { __esModule: true, default: FastImage };
});

const onLayoutEventData = {
    nativeEvent: {
        layout: {
            width: 9999,
            height: 9999
        }
    }
};

describe("Widget", () => {
    let imageProps: ImageProps<Style>;
    beforeEach(() => {
        imageProps = {
            name: "Image1",
            accessible: "yes",
            style: [],
            datasource: "image",
            imageObject: dynamicValue<number>(1),
            defaultImageDynamic: undefined,
            imageUrl: undefined,
            imageIcon: undefined,
            isBackgroundImage: false,
            children: null,
            resizeMode: "contain",
            opacity: 1,
            widthUnit: "auto",
            customWidth: 100,
            heightUnit: "auto",
            customHeight: 100,
            iconSize: 16,
            onClickType: "action",
            onClick: actionValue()
        };
    });

    describe("Static Image", () => {
        it("renders the structure", async () => {
            const ImageComponent = <Image {...imageProps} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom height", async () => {
            const ImageComponent = <Image {...imageProps} heightUnit={"points"} customHeight={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom width", async () => {
            const ImageComponent = <Image {...imageProps} widthUnit={"points"} customWidth={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure inside a modal", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"enlarge"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            await fireLayout(image, imageProps.name, "ImageEnlargedPressable");
            expect(image.toJSON()).toMatchSnapshot();
        }, 10000);

        it("triggers the onclick action", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"action"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            expect(imageProps.onClick?.execute).toHaveBeenCalledTimes(1);
        });

        it("renders the structure as a background image", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with a different resizeMode", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage resizeMode={"cover"}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with 50% opacity", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage opacity={50}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });
    });

    describe("Static Image SVG", () => {
        beforeEach(() => {
            imageProps.imageObject = dynamicValue<string>(svgXml);
        });

        it("renders the structure", async () => {
            const ImageComponent = <Image {...imageProps} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom height", async () => {
            const ImageComponent = <Image {...imageProps} heightUnit={"points"} customHeight={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom width", async () => {
            const ImageComponent = <Image {...imageProps} widthUnit={"points"} customWidth={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure inside a modal", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"enlarge"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            await fireLayout(image, imageProps.name, "ImageEnlargedPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("triggers the onclick action", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"action"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            expect(imageProps.onClick?.execute).toHaveBeenCalledTimes(1);
        });

        it("renders the structure as a background image", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with a different resizeMode", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage resizeMode={"cover"}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with 50% opacity", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage opacity={50}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });
    });

    describe("Dynamic Image", () => {
        beforeEach(() => {
            imageProps.imageObject = dynamicValue<NativeImage>({
                name: "image.png",
                uri: require("./image.png")
            });
        });

        it("renders the structure", async () => {
            const ImageComponent = <Image {...imageProps} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom height", async () => {
            const ImageComponent = <Image {...imageProps} heightUnit={"points"} customHeight={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom width", async () => {
            const ImageComponent = <Image {...imageProps} widthUnit={"points"} customWidth={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure inside a modal", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"enlarge"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            await fireLayout(image, imageProps.name, "ImageEnlargedPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("triggers the onclick action", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"action"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            fireEvent.press(await findByImageTestId(image, imageProps.name, "Image"));
            expect(imageProps.onClick?.execute).toHaveBeenCalledTimes(1);
        });

        it("renders the structure as a background image", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with a different resizeMode", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage resizeMode={"cover"}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with 50% opacity", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage opacity={50}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });
    });

    describe("Dynamic Image SVG", () => {
        beforeEach(() => {
            imageProps.imageObject = dynamicValue({ name: "dynamicSVG.svg", uri: "this/is/a/fake/path.svg" });
        });

        it("renders the structure", async () => {
            const ImageComponent = <Image {...imageProps} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "SvgUriTemporary");
            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom height", async () => {
            const ImageComponent = <Image {...imageProps} heightUnit={"points"} customHeight={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "SvgUriTemporary");
            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure with custom width", async () => {
            const ImageComponent = <Image {...imageProps} widthUnit={"points"} customWidth={100} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "SvgUriTemporary");
            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure inside a modal", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"enlarge"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "SvgUriTemporary");
            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            await fireLayout(image, imageProps.name, "ImageEnlargedPressable");

            expect(image.toJSON()).toMatchSnapshot();
        });

        it("triggers the onclick action", async () => {
            const ImageComponent = <Image {...imageProps} onClickType={"action"} />;
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "SvgUriTemporary");
            await fireLayout(image, imageProps.name, "ImageSmallPressable");
            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            expect(imageProps.onClick?.execute).toHaveBeenCalledTimes(1);
        });

        it("renders the structure as a background image", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with a different resizeMode", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage resizeMode={"cover"}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });

        it("renders the structure as a background image with 50% opacity", async () => {
            const ImageComponent = (
                <Image {...imageProps} isBackgroundImage opacity={50}>
                    <Text>Background Image</Text>
                </Image>
            );
            const image = render(ImageComponent);

            await flushMicrotasksQueue();

            await fireLayout(image, imageProps.name, "ImageBackgroundView");
            expect(image.toJSON()).toMatchSnapshot();
        });
    });

    describe("Icon", () => {
        describe("type: icon/glyph", () => {
            beforeEach(() => {
                imageProps.datasource = "icon";
                imageProps.imageIcon = dynamicValue<NativeIcon>({ type: "glyph", iconClass: "glyphicon-plus" });
            });

            it("renders the structure with an icon and default color", async () => {
                const image = render(<Image {...imageProps} />);

                await flushMicrotasksQueue();

                expect(image.toJSON()).toMatchSnapshot();
            });

            it("uses color if set", async () => {
                const color = "red";
                const image = render(<Image {...imageProps} style={[{ image: { color } }]} />);

                await flushMicrotasksQueue();

                expect(image.getByTestId(`${imageProps.name}$Icon`).findByType(GlyphIcon).props.color).toEqual(color);
            });

            it("prefers size from styles", async () => {
                const size = 12;
                const image = render(<Image {...imageProps} style={[{ image: { size } }]} />);

                await flushMicrotasksQueue();

                expect(image.getByTestId(`${imageProps.name}$Icon`).findByType(GlyphIcon).props.size).toEqual(size);
            });

            it("prefers size from iconSize prop", async () => {
                const iconSize = 18;
                const image = render(<Image {...imageProps} iconSize={iconSize} />);

                await flushMicrotasksQueue();

                expect(image.getByTestId(`${imageProps.name}$Icon`).findByType(GlyphIcon).props.size).toEqual(iconSize);
            });

            it("triggers the onclick action", async () => {
                const image = render(<Image {...imageProps} />);

                await flushMicrotasksQueue();

                fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
                expect(imageProps.onClick?.execute).toHaveBeenCalledTimes(1);
            });
        });

        describe("type: image/staticImage", () => {
            beforeEach(() => {
                imageProps.datasource = "image";
                imageProps.imageIcon = dynamicValue<NativeIcon>({
                    type: "image",
                    iconUrl: { uri: require("./image.png") }
                });
            });

            it("renders the structure", async () => {
                const image = render(<Image {...imageProps} />);

                await flushMicrotasksQueue();

                await fireLayout(image, imageProps.name, "ImageSmallPressable");
                expect(image.toJSON()).toMatchSnapshot();
            });

            it("sets the correct styles", async () => {
                const style = [
                    {
                        image: {
                            color: "black",
                            size: 14,
                            fill: "blue",
                            fillOpacity: 1,
                            fillRule: "unused",
                            stroke: "black",
                            strokeWidth: 2,
                            strokeOpacity: 1,
                            strokeDasharray: "unused",
                            strokeDashoffset: "unused",
                            strokeLinecap: "unused",
                            strokeLinejoin: "unused",
                            strokeMiterlimit: "unused",
                            clipRule: "unused",
                            clipPath: "unused",
                            vectorEffect: "unused",
                            left: 1
                        }
                    }
                ] as Style[];
                const image = render(<Image {...imageProps} style={style} />);

                await flushMicrotasksQueue();

                await fireLayout(image, imageProps.name, "ImageSmallPressable");
                expect(image.toJSON()).toMatchSnapshot();
            });

            it("renders the structure inside a modal", async () => {
                const image = render(<Image {...imageProps} onClickType={"enlarge"} />);

                await flushMicrotasksQueue();

                await fireLayout(image, imageProps.name, "ImageSmallPressable");
                fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
                await fireLayout(image, imageProps.name, "ImageEnlargedPressable");
                expect(image.toJSON()).toMatchSnapshot();
            });

            it("triggers the onclick action", async () => {
                const image = render(<Image {...imageProps} />);

                await flushMicrotasksQueue();

                await fireLayout(image, imageProps.name, "ImageSmallPressable");
                fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
                expect(imageProps.onClick?.execute).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("Enlarged overlay", () => {
        const originalOS = Platform.OS;
        let setFocus: jest.SpyInstance;
        let nodeOf: (tag: number) => { props: { testID?: string } };

        const openEnlarged = async (props: Partial<ImageProps<Style>> = {}): Promise<RenderAPI> => {
            const image = render(<Image {...imageProps} onClickType={"enlarge"} {...props} />);
            await flushMicrotasksQueue();
            fireEvent.press(await findByImageTestId(image, imageProps.name, "ImageSmallPressable"));
            await findByImageTestId(image, imageProps.name, "ImageEnlargedPressable");
            return image;
        };

        // Closing plays the exit animation, so fake timers are switched on right before closing to run it to the end
        const closeWithFakeTimers = (close: () => void): void => {
            jest.useFakeTimers();
            act(() => close());
            act(() => {
                jest.advanceTimersByTime(500);
            });
        };

        beforeEach(() => {
            setFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => undefined);
            // Numeric tags (as on a device) that can be mapped back, to see which element got focus
            const tags = new Map<unknown, number>();
            const nodes = new Map<number, { props: { testID?: string } }>();
            mockFindNodeHandle.mockReset().mockImplementation((node: { props: { testID?: string } } | null) => {
                if (!node) {
                    return null;
                }
                if (!tags.has(node)) {
                    tags.set(node, tags.size + 1);
                    nodes.set(tags.size, node);
                }
                return tags.get(node);
            });
            nodeOf = tag => nodes.get(tag)!;
        });

        afterEach(() => {
            jest.useRealTimers();
            (Platform as { OS: string }).OS = originalOS;
            mockFindNodeHandle.mockReset();
            jest.restoreAllMocks();
        });

        it("is not shown before the image is pressed", async () => {
            const image = render(<Image {...imageProps} onClickType={"enlarge"} />);
            await flushMicrotasksQueue();

            expect(image.UNSAFE_queryByType(Modal)).toBeNull();
        });

        it("shows a transparent modal that keeps every orientation", async () => {
            const image = await openEnlarged();
            const { props } = image.UNSAFE_getByType(Modal);

            expect(props.transparent).toBe(true);
            expect(props.statusBarTranslucent).toBe(false);
            expect(props.supportedOrientations).toEqual([
                "portrait",
                "portrait-upside-down",
                "landscape",
                "landscape-left",
                "landscape-right"
            ]);
        });

        it("closes when the enlarged image is pressed", async () => {
            const image = await openEnlarged();
            const enlarged = await findByImageTestId(image, imageProps.name, "ImageEnlargedPressable");

            closeWithFakeTimers(() => fireEvent.press(enlarged));

            expect(image.UNSAFE_queryByType(Modal)).toBeNull();
        });

        it("closes on the Android back button", async () => {
            const image = await openEnlarged();

            closeWithFakeTimers(() => image.UNSAFE_getByType(Modal).props.onRequestClose());

            expect(image.UNSAFE_queryByType(Modal)).toBeNull();
        });

        it("exposes the screen reader caption, hint and role on the enlarged image", async () => {
            const image = await openEnlarged({
                screenReaderCaption: dynamicValue("A caption"),
                screenReaderHint: dynamicValue("A hint")
            });
            const { props } = await findByImageTestId(image, imageProps.name, "ImageEnlargedPressable");

            expect(props.accessibilityLabel).toBe("A caption");
            expect(props.accessibilityHint).toBe("A hint");
            expect(props.accessibilityRole).toBe("image");
        });

        it("marks the overlay as modal on iOS", async () => {
            (Platform as { OS: string }).OS = "ios";
            const image = await openEnlarged();
            const { props } = await findByImageTestId(image, imageProps.name, "ImageEnlargedOverlay-content");

            expect(props.accessibilityViewIsModal).toBe(true);
            expect(props.importantForAccessibility).toBeUndefined();
        });

        it("marks the overlay as important for accessibility on Android", async () => {
            (Platform as { OS: string }).OS = "android";
            const image = await openEnlarged();
            const { props } = await findByImageTestId(image, imageProps.name, "ImageEnlargedOverlay-content");

            expect(props.importantForAccessibility).toBe("yes");
            expect(props.accessibilityViewIsModal).toBeUndefined();
        });

        it("moves accessibility focus to the enlarged image when it opens", async () => {
            const image = await openEnlarged();

            fireEvent(
                await findByImageTestId(image, imageProps.name, "ImageEnlargedOverlay-content"),
                "layout",
                onLayoutEventData
            );

            expect(setFocus).toHaveBeenCalledTimes(1);
            expect(nodeOf(setFocus.mock.calls[0][0]).props.testID).toBe(`${imageProps.name}$ImageEnlargedPressable`);
        });

        it("returns accessibility focus to the small image once it has closed", async () => {
            const image = await openEnlarged();
            const enlarged = await findByImageTestId(image, imageProps.name, "ImageEnlargedPressable");
            setFocus.mockClear();

            closeWithFakeTimers(() => fireEvent.press(enlarged));

            expect(image.UNSAFE_queryByType(Modal)).toBeNull();
            expect(setFocus).toHaveBeenCalledTimes(1);
            expect(nodeOf(setFocus.mock.calls[0][0]).props.testID).toBe(`${imageProps.name}$ImageSmallPressable`);
        });
    });
});
