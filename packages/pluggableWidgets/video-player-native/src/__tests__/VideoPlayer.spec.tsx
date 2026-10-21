import { dynamicValue } from "@mendix/piw-utils-internal";
import { AccessibilityInfo, Modal, Platform, StatusBar, View } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ReactVideoProps } from "react-native-video";

import { VideoPlayer } from "../VideoPlayer";
import { VideoPlayerProps } from "../../typings/VideoPlayerProps";
import { VideoStyle } from "../ui/Styles";

jest.useFakeTimers();
jest.mock("react-native-video", () => "Video");
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
// The real module resolves the MxNavigation TurboModule at import time, which is unavailable under Jest.
jest.mock("mendix-native", () => ({
    AndroidNavigationBar: { isActive: true, height: 24 }
}));

describe("VideoPlayer", () => {
    let defaultProps: VideoPlayerProps<VideoStyle>;
    beforeEach(() => {
        defaultProps = {
            name: "video-player-test",
            style: [],
            videoUrl: dynamicValue("https://mendix.com/video.mp4"),
            autoStart: false,
            muted: false,
            loop: false,
            showControls: true,
            aspectRatio: false
        };
    });

    it("renders a loading indicator", () => {
        const component = render(<VideoPlayer {...defaultProps} />);

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("passes the right props to the video player", () => {
        const component = render(<VideoPlayer {...defaultProps} />);
        const props = component.getByTestId("video-player-test").props as ReactVideoProps;

        expect(props.source).toEqual({ uri: "https://mendix.com/video.mp4" });
        expect(props.paused).toBe(true);
        expect(props.muted).toBe(false);
        expect(props.repeat).toBe(false);
        expect(props.controls).toBe(true);
        expect(props.style).toEqual({ height: 0 });
    });

    it("hides the loading indicator after load", () => {
        const component = render(<VideoPlayer {...defaultProps} />);

        fireEvent(component.getByTestId("video-player-test"), "load", { naturalSize: { width: 640, height: 360 } });

        expect(component.toJSON()).toMatchSnapshot();
        expect(component.getByTestId("video-player-test").props.style).toEqual({ width: "100%", height: undefined });
    });

    it("shows the loading indicator if the source changes", () => {
        const component = render(<VideoPlayer {...defaultProps} />);

        fireEvent(component.getByTestId("video-player-test"), "load", { naturalSize: { width: 640, height: 360 } });
        fireEvent(component.getByTestId("video-player-test"), "loadStart");

        expect(component.toJSON()).toMatchSnapshot();
        expect(component.getByTestId("video-player-test").props.style).toEqual({ height: 0 });
    });

    it("load a video and calculate the aspect ratio", () => {
        const component = render(<VideoPlayer {...defaultProps} aspectRatio />);

        fireEvent(component.getByTestId("video-player-test"), "load", { naturalSize: { width: 1080, height: 554 } });

        expect(component.toJSON()).toMatchSnapshot();
        expect(component.UNSAFE_getByType(View).props.style).toEqual({
            alignItems: "center",
            aspectRatio: 1.9494584837545126,
            backgroundColor: "black",
            justifyContent: "center"
        });
    });

    it("renders an error", () => {
        const component = render(<VideoPlayer {...defaultProps} />);

        fireEvent(component.getByTestId("video-player-test"), "error");

        expect(component.getByText("The video failed to load")).toBeDefined();
        expect(component.getByText("The video failed to load").props.style).toEqual({ color: "white" });
    });

    describe("VideoPlayerAndroid", () => {
        beforeAll(() => {
            jest.mock("react-native/Libraries/Utilities/Platform", () => {
                const Platform = jest.requireActual("react-native/Libraries/Utilities/Platform");
                Platform.OS = "android";
                Platform.default = { ...Platform.default, OS: "android" };
                return Platform;
            });
        });
        it("render video with controls", () => {
            const component = render(<VideoPlayer {...defaultProps} />);
            expect(component).toMatchSnapshot();
        });
        it("render video without controls if showControls is set to false", () => {
            const component = render(<VideoPlayer {...defaultProps} showControls={false} />);
            expect(component).toMatchSnapshot();
        });

        it("show fullscreen when press fullscreen icon-- android", async () => {
            const component = render(<VideoPlayer {...defaultProps} />);
            const fullScreenBtn = component.getByTestId("btn-fullscreen");

            fireEvent.press(fullScreenBtn);

            await waitFor(() => {
                component.getByTestId("btn-fullscreen-exit");
                const modal = component.UNSAFE_getByType(Modal);
                expect(modal.props.visible).toBe(true);
            });
        });

        describe("fullscreen overlay", () => {
            let setHidden: jest.SpyInstance;
            let setFocus: jest.SpyInstance;

            beforeEach(() => {
                setHidden = jest.spyOn(StatusBar, "setHidden").mockImplementation(() => undefined);
                setFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => undefined);
            });

            afterEach(() => {
                mockFindNodeHandle.mockReset();
                jest.restoreAllMocks();
            });

            const openFullScreen = (): ReturnType<typeof render> => {
                const component = render(<VideoPlayer {...defaultProps} />);
                fireEvent.press(component.getByTestId("btn-fullscreen"));
                return component;
            };

            it("is not rendered until fullscreen is requested", () => {
                const component = render(<VideoPlayer {...defaultProps} />);

                expect(component.UNSAFE_queryByType(Modal)).toBeNull();
                expect(component.queryByTestId("btn-fullscreen-exit")).toBeNull();
            });

            it("opens an opaque modal that draws under the status bar", () => {
                const component = openFullScreen();
                const { props } = component.UNSAFE_getByType(Modal);

                expect(props.transparent).toBe(false);
                expect(props.statusBarTranslucent).toBe(true);
                expect(component.getByTestId("fullscreen-modal")).toBeTruthy();
            });

            it("hides the status bar when entering fullscreen", () => {
                openFullScreen();

                expect(setHidden).toHaveBeenCalledWith(true);
            });

            it("leaves fullscreen and restores the status bar with the exit button", () => {
                const component = openFullScreen();

                fireEvent.press(component.getByTestId("btn-fullscreen-exit"));

                expect(component.UNSAFE_queryByType(Modal)).toBeNull();
                expect(setHidden).toHaveBeenLastCalledWith(false);
            });

            it("leaves fullscreen and restores the status bar with the Android back button", () => {
                const component = openFullScreen();

                act(() => component.UNSAFE_getByType(Modal).props.onRequestClose());

                expect(component.UNSAFE_queryByType(Modal)).toBeNull();
                expect(setHidden).toHaveBeenLastCalledWith(false);
            });

            it("stays in fullscreen when the area around the video is pressed", () => {
                const component = openFullScreen();

                fireEvent.press(component.getByTestId("fullscreen-modal-backdrop", { includeHiddenElements: true }));

                expect(component.UNSAFE_queryByType(Modal)).not.toBeNull();
            });

            it("uses the Android modal semantics for the fullscreen overlay", () => {
                const component = openFullScreen();
                const { props } = component.getByTestId("fullscreen-modal-content");

                expect(props.importantForAccessibility).toBe("yes");
                expect(props.accessibilityViewIsModal).toBeUndefined();
            });

            it("returns accessibility focus to the fullscreen button after leaving fullscreen", () => {
                const tags = new Map<unknown, number>();
                const nodes = new Map<number, { props: { testID?: string } }>();
                mockFindNodeHandle.mockImplementation((node: { props: { testID?: string } } | null) => {
                    if (!node) {
                        return null;
                    }
                    if (!tags.has(node)) {
                        tags.set(node, tags.size + 1);
                        nodes.set(tags.size, node);
                    }
                    return tags.get(node);
                });
                const component = openFullScreen();
                setFocus.mockClear();

                fireEvent.press(component.getByTestId("btn-fullscreen-exit"));

                expect(setFocus).toHaveBeenCalledTimes(1);
                expect(nodes.get(setFocus.mock.calls[0][0])?.props.testID).toBe("btn-fullscreen");
            });
        });

        describe("on iOS", () => {
            const androidOS = Platform.OS;

            afterEach(() => {
                (Platform as { OS: string }).OS = androidOS;
            });

            it("does not render the fullscreen overlay or button", () => {
                (Platform as { OS: string }).OS = "ios";

                const component = render(<VideoPlayer {...defaultProps} />);

                expect(component.UNSAFE_queryByType(Modal)).toBeNull();
                expect(component.queryByTestId("btn-fullscreen")).toBeNull();
            });
        });
    });
});
