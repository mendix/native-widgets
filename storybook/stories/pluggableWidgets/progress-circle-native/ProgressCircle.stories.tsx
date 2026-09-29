import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useEffect, useState } from "react";
import { Big } from "big.js";
import { ValueStatus } from "mendix";
import { ProgressCircle } from "../../../../packages/pluggableWidgets/progress-circle-native/src/ProgressCircle";
import type { ProgressCircleStyle } from "../../../../packages/pluggableWidgets/progress-circle-native/src/ui/Styles";
import { dynamicValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.progresscircle.ProgressCircle") as ProgressCircleStyle[];

const baseProps = {
    name: "progress-circle",
    style: atlas,
    minimumValue: dynamicValue(new Big(0)),
    maximumValue: dynamicValue(new Big(100)),
    progressValue: dynamicValue(new Big(65)),
    circleText: "percentage" as const
};

const meta = {
    title: "Widgets/ProgressCircle",
    component: ProgressCircle,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ProgressCircle>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The three things the middle of the circle can say.
 *
 * "percentage" is computed from the range, "customText" ignores it entirely, and "none" leaves the
 * ring bare — so the same progress value can read three different ways.
 */
export const CircleText: StoryObj<typeof ProgressCircle> = {
    render: () => (
        <StoryRows>
            <StoryRow label="percentage">
                <ProgressCircle {...baseProps} />
            </StoryRow>
            <StoryRow label="customText">
                <ProgressCircle {...baseProps} circleText="customText" customText={dynamicValue("13 / 20")} />
            </StoryRow>
            <StoryRow label="none">
                <ProgressCircle {...baseProps} circleText="none" />
            </StoryRow>
        </StoryRows>
    )
};

/** The ring filling, so the sweep can be watched rather than inferred from a still. */
export const Animating: StoryObj<typeof ProgressCircle> = {
    render: () => {
        const [percent, setPercent] = useState(0);
        useEffect(() => {
            const timer = setInterval(() => setPercent(p => (p >= 100 ? 0 : p + 10)), 600);
            return () => clearInterval(timer);
        }, []);
        return <ProgressCircle {...baseProps} progressValue={dynamicValue(new Big(percent))} />;
    }
};

/**
 * Values the range does not contain, plus a zero-width range.
 *
 * The percentage in the middle comes out of the same arithmetic as the arc, so a division by zero
 * here shows up as text as well as geometry — which is why the equal-bounds case is worth keeping.
 */
export const OutOfRange: StoryObj<typeof ProgressCircle> = {
    render: () => (
        <StoryRows>
            <StoryRow label="value above maximum">
                <ProgressCircle {...baseProps} progressValue={dynamicValue(new Big(150))} />
            </StoryRow>
            <StoryRow label="value below minimum">
                <ProgressCircle {...baseProps} progressValue={dynamicValue(new Big(-30))} />
            </StoryRow>
            <StoryRow label="minimum equals maximum">
                <ProgressCircle
                    {...baseProps}
                    minimumValue={dynamicValue(new Big(10))}
                    maximumValue={dynamicValue(new Big(10))}
                    progressValue={dynamicValue(new Big(10))}
                />
            </StoryRow>
        </StoryRows>
    )
};

/** The value still on its way. */
export const ValueLoading: StoryObj<typeof meta> = {
    args: { ...baseProps, progressValue: { status: ValueStatus.Loading, value: undefined } as never }
};

/** The Atlas variants — the small size, the gray treatment, and three colours. */
export const AtlasVariants: StoryObj<typeof ProgressCircle> = {
    render: () => (
        <StoryRows>
            {(
                [
                    "progressCircleSmall",
                    "progressCircleGray",
                    "progressCircleSuccess",
                    "progressCircleWarning",
                    "progressCircleDanger"
                ] as const
            ).map(name => (
                <StoryRow key={name} label={name}>
                    <ProgressCircle {...baseProps} style={atlas.concat(atlasClasses(name) as ProgressCircleStyle[])} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};
