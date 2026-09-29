import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { VideoPlayer } from "../../../../packages/pluggableWidgets/video-player-native/src/VideoPlayer";
import type { VideoStyle } from "../../../../packages/pluggableWidgets/video-player-native/src/ui/Styles";
import { dynamicValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.videoplayer.VideoPlayer") as VideoStyle[];

/**
 * A partial style entry, as the runtime actually passes them.
 *
 * `VideoStyle` declares all eight keys as required, but `props.style` is an array the widget flattens
 * over its own defaults — so an entry that sets only `container` is correct and normal. TypeScript
 * cannot see that through the array type, hence the cast in one place rather than at each use.
 */
const override = (style: Partial<VideoStyle>): VideoStyle => style as VideoStyle;

/**
 * A public test stream, so these stories need a network.
 *
 * There is no bundled video to fall back on — the widget takes a url and nothing else, and adding a
 * few MB of mp4 to the repo for a story is a poor trade. Without a network every story below shows
 * the widget's own "The video failed to load", which is itself one of the states worth seeing.
 *
 * 854×480, so `aspectRatio` has something to compute from: a 1:1 video would make the aspect-ratio
 * stories indistinguishable.
 *
 * Hosted by the W3C, which is the reason for this one over the better-known
 * `commondatastorage.googleapis.com/gtv-videos-bucket` samples — those now answer 403, and the widget
 * then shows its load error, which reads as a broken widget rather than a dead url.
 */
const videoUrl = dynamicValue("https://media.w3.org/2010/05/sintel/trailer.mp4");

const baseProps = {
    name: "video-player",
    style: atlas,
    videoUrl,
    autoStart: false,
    muted: true,
    loop: false,
    aspectRatio: true,
    showControls: true
};

const meta = {
    title: "Widgets/VideoPlayer",
    component: VideoPlayer,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof VideoPlayer>;

export default meta;

/**
 * Muted and paused, which is what every story here starts as.
 *
 * Deliberate: Storybook keeps the previous story mounted for a moment while switching, so an
 * autostarting unmuted player means two videos talking over each other. `AutoStart` below opts in.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * `aspectRatio`, which decides both the box and how the video fills it.
 *
 * On, the container takes the video's own ratio once it has loaded and the video is `contain`ed. Off,
 * the container keeps whatever the style gives it — `16/9` from the widget's default, unless the theme
 * says otherwise — and the video is *stretched* to fill it. So turning it off does not mean "ignore
 * the ratio", it means "distort to fit", which only shows up on a video whose ratio differs from the
 * box's. The second row forces a square box to make that visible.
 */
export const AspectRatio: StoryObj<typeof VideoPlayer> = {
    render: () => (
        <StoryRows>
            <StoryRow label="aspectRatio: true — box follows the video, letterboxed if it must">
                <VideoPlayer {...baseProps} />
            </StoryRow>
            <StoryRow label="aspectRatio: false, square box — the video is stretched, not fitted">
                <VideoPlayer
                    {...baseProps}
                    aspectRatio={false}
                    style={atlas.concat([
                        override({ container: { aspectRatio: 1 }, video: { width: "100%", height: "100%" } })
                    ])}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * `showControls`, which governs two separate things.
 *
 * It passes `controls` to the native player *and* gates the widget's own full-screen button, which
 * exists on Android only and fades out five seconds after the last tap. With it off there is no way
 * to start the video at all unless `autoStart` is on — so that row is paired with autostart, or it
 * would just be a still frame.
 */
export const Controls: StoryObj<typeof VideoPlayer> = {
    render: () => (
        <StoryRows>
            <StoryRow label="showControls: true — native controls, plus the full-screen button on Android">
                <VideoPlayer {...baseProps} />
            </StoryRow>
            <StoryRow label="showControls: false, autoStart: true — no way to intervene">
                <VideoPlayer {...baseProps} showControls={false} autoStart />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * Autostart, looping and sound.
 *
 * Kept as one story rather than three because they are all playback flags and each needs the video to
 * actually run. Unmuted on purpose here — it is the only story that is, and the only way to check the
 * flag does anything.
 */
export const Playback: StoryObj<typeof VideoPlayer> = {
    render: () => (
        <StoryRows>
            <StoryRow label="autoStart, muted, loop — starts on its own and never stops">
                <VideoPlayer {...baseProps} autoStart loop />
            </StoryRow>
            <StoryRow label="muted: false — the one story with sound">
                <VideoPlayer {...baseProps} muted={false} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A url that cannot load, and one that never arrives.
 *
 * The failed case shows "The video failed to load" over the black container. The loading case is the
 * one worth having separately: the widget's `isAvailable` check leaves the source undefined, so it
 * sits on the spinner rather than erroring — a page waiting on its data looks like this, not like a
 * failure.
 */
export const LoadingAndError: StoryObj<typeof VideoPlayer> = {
    render: () => (
        <StoryRows>
            <StoryRow label="a url that does not resolve — onError, so the message shows">
                <VideoPlayer {...baseProps} videoUrl={dynamicValue("https://nope.invalid/missing.mp4")} />
            </StoryRow>
            <StoryRow label="url still loading — the spinner, indefinitely">
                <VideoPlayer {...baseProps} videoUrl={{ status: "loading", value: undefined } as never} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The parts of the style a theme can reach, which Atlas leaves entirely blank.
 *
 * All eight keys are declared and every one is empty, and there are no design-property classes — so
 * there is no `AtlasVariants` story to write. This stands in for it: the container's background and
 * the spinner's colour restyled through the same array Atlas supplies, plus the full-screen button.
 * `indicator` takes only a colour, which is why it looks unlike the rest.
 */
export const StyledFromTheme: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        style: atlas.concat([
            override({
                container: { backgroundColor: variables.brand.primary, borderRadius: 8, overflow: "hidden" },
                indicator: { color: variables.brand.warning },
                controlBtnContainerStyle: {
                    backgroundColor: variables.brand.warning,
                    borderRadius: 20,
                    padding: variables.spacing.smaller
                }
            })
        ])
    }
};
