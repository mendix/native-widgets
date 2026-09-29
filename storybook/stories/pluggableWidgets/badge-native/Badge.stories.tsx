import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
// Imported straight from the widget package's source: Metro watches the repo root, so a story
// exercises the same code the mpk is built from, with no build step in between.
import { Badge } from "../../../../packages/pluggableWidgets/badge-native/src/Badge";
import type { BadgeStyle } from "../../../../packages/pluggableWidgets/badge-native/src/ui/Styles";
import { actionValue, dynamicValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.badge.Badge") as BadgeStyle[];

const baseProps = {
    name: "badge",
    style: atlas,
    caption: dynamicValue("Badge")
};

const meta = {
    title: "Widgets/Badge",
    component: Badge,
    decorators: [
        // A badge is a few pixels tall, so on its own in the canvas it reads as a stray label.
        (Story: () => ReactElement) => (
            <StoryFrame center scroll={false}>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Badge>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The badge with an onClick, which is what makes it touchable at all.
 *
 * Without the action the widget renders a plain View; with it, a Pressable. Worth having as its own
 * story because the two take different paths through the widget and only one of them can show a
 * ripple.
 */
export const Clickable: StoryObj<typeof meta> = {
    args: { ...baseProps, caption: dynamicValue("Tap me"), onClick: actionValue("Badge onClick") }
};

/**
 * The four Atlas colour variants, which are design properties rather than props.
 *
 * A modeller picks these as checkboxes in Studio Pro and the runtime appends the matching class to
 * the style array — so the only way to see them is to append them here too. Nothing about the
 * widget's own props changes between these.
 */
export const AtlasVariants: StoryObj<typeof Badge> = {
    render: () => (
        <StoryRows>
            {(["badgePrimary", "badgeSuccess", "badgeWarning", "badgeDanger"] as const).map(name => (
                <StoryRow key={name} label={name}>
                    <Badge
                        {...baseProps}
                        style={atlas.concat(atlasClasses(name) as BadgeStyle[])}
                        caption={dynamicValue(name.replace("badge", ""))}
                    />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * A caption that has not arrived yet.
 *
 * `caption` is a DynamicValue, and on a cold page open it is Loading with no value — the badge has
 * to decide what to draw with nothing to draw. Included because it is the state a story that always
 * passes an Available value can never show.
 */
export const CaptionLoading: StoryObj<typeof meta> = {
    args: { ...baseProps, caption: { status: "loading", value: undefined } as never }
};
