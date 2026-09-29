import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useEffect, useState } from "react";
import { Big } from "big.js";
import { ValueStatus } from "mendix";
import { ProgressBar } from "../../../../packages/pluggableWidgets/progress-bar-native/src/ProgressBar";
import type { ProgressBarStyle } from "../../../../packages/pluggableWidgets/progress-bar-native/src/ui/Styles";
import { dynamicValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.progressbar.ProgressBar") as ProgressBarStyle[];

const baseProps = {
    name: "progress-bar",
    style: atlas,
    minimumValue: dynamicValue(new Big(0)),
    maximumValue: dynamicValue(new Big(100)),
    progressValue: dynamicValue(new Big(60))
};

const meta = {
    title: "Widgets/ProgressBar",
    component: ProgressBar,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ProgressBar>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/** The ends of the range and the midpoint, which is where a rounding error would be visible. */
export const Progression: StoryObj<typeof ProgressBar> = {
    render: () => (
        <StoryRows>
            {[0, 25, 50, 75, 100].map(percent => (
                <StoryRow key={percent} label={`${percent}%`}>
                    <ProgressBar {...baseProps} progressValue={dynamicValue(new Big(percent))} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * A value the bar is actually moving through, rather than a still.
 *
 * The widget animates between values, and a static story shows the end state only — so a broken
 * interpolation looks fine. This drives it on a timer instead.
 */
export const Animating: StoryObj<typeof ProgressBar> = {
    render: () => {
        const [percent, setPercent] = useState(0);
        useEffect(() => {
            const timer = setInterval(() => setPercent(p => (p >= 100 ? 0 : p + 10)), 600);
            return () => clearInterval(timer);
        }, []);
        return <ProgressBar {...baseProps} progressValue={dynamicValue(new Big(percent))} />;
    }
};

/**
 * A range that is not 0–100, and values that fall outside it.
 *
 * All three bounds are expressions, so none of these are guarded on the modeller's side: a progress
 * value below the minimum or above the maximum is a state the widget has to clamp rather than draw
 * off the end of the track.
 */
export const OutOfRange: StoryObj<typeof ProgressBar> = {
    render: () => (
        <StoryRows>
            <StoryRow label="range 200–400, value 300">
                <ProgressBar
                    {...baseProps}
                    minimumValue={dynamicValue(new Big(200))}
                    maximumValue={dynamicValue(new Big(400))}
                    progressValue={dynamicValue(new Big(300))}
                />
            </StoryRow>
            <StoryRow label="value below minimum">
                <ProgressBar {...baseProps} progressValue={dynamicValue(new Big(-20))} />
            </StoryRow>
            <StoryRow label="value above maximum">
                <ProgressBar {...baseProps} progressValue={dynamicValue(new Big(160))} />
            </StoryRow>
            <StoryRow label="minimum equals maximum — zero-width range">
                <ProgressBar
                    {...baseProps}
                    minimumValue={dynamicValue(new Big(50))}
                    maximumValue={dynamicValue(new Big(50))}
                    progressValue={dynamicValue(new Big(50))}
                />
            </StoryRow>
        </StoryRows>
    )
};

/** The value still loading, which is what a bar over a freshly-opened page shows. */
export const ValueLoading: StoryObj<typeof meta> = {
    args: { ...baseProps, progressValue: { status: ValueStatus.Loading, value: undefined } as never }
};

/** The Atlas variants — two sizes and three colours. */
export const AtlasVariants: StoryObj<typeof ProgressBar> = {
    render: () => (
        <StoryRows>
            {(
                [
                    "progressBarSmall",
                    "progressBarLarge",
                    "progressBarSuccess",
                    "progressBarWarning",
                    "progressBarDanger"
                ] as const
            ).map(name => (
                <StoryRow key={name} label={name}>
                    <ProgressBar {...baseProps} style={atlas.concat(atlasClasses(name) as ProgressBarStyle[])} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};
