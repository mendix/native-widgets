import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { ActivityIndicator } from "../../../../packages/pluggableWidgets/activity-indicator-native/src/ActivityIndicator";
import type { ActivityIndicatorStyle } from "../../../../packages/pluggableWidgets/activity-indicator-native/src/ui/Styles";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.activityindicator.ActivityIndicator") as ActivityIndicatorStyle[];

// The widget takes no data props at all: `name` and `style` are the whole interface, and everything
// visible about it — size and colour — comes from the theme. So the styled variants below are not a
// nice-to-have here, they are the only thing there is to show.
const baseProps = {
    name: "activity-indicator",
    style: atlas
};

const meta = {
    title: "Widgets/ActivityIndicator",
    component: ActivityIndicator,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame center scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ActivityIndicator>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/** The Atlas colour variants, appended as design-property classes the way the runtime does. */
export const AtlasVariants: StoryObj<typeof ActivityIndicator> = {
    render: () => (
        <StoryRows>
            {(["activityIndicatorSuccess", "activityIndicatorWarning", "activityIndicatorDanger"] as const).map(
                name => (
                    <StoryRow key={name} label={name}>
                        <ActivityIndicator
                            {...baseProps}
                            style={atlas.concat(atlasClasses(name) as ActivityIndicatorStyle[])}
                        />
                    </StoryRow>
                )
            )}
        </StoryRows>
    )
};

/**
 * The small size, which no Atlas class sets.
 *
 * Atlas ships colour variants but leaves `indicator.size` at the widget's own default of "large",
 * so the small spinner is unreachable through the theme — a modeller gets it by writing a custom
 * class. Passing the style directly is the story equivalent of that.
 */
export const SmallSize: StoryObj<typeof meta> = {
    args: { ...baseProps, style: atlas.concat([{ indicator: { size: "small" } } as ActivityIndicatorStyle]) }
};
