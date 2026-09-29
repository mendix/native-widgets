import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { Big } from "big.js";
import { ValueStatus } from "mendix";
import { Slider } from "../../../../packages/pluggableWidgets/slider-native/src/Slider";
import type { SliderStyle } from "../../../../packages/pluggableWidgets/slider-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.slider.Slider") as SliderStyle[];

const baseProps = {
    name: "slider",
    style: atlas,
    editable: "default" as const,
    minimumValue: dynamicValue(new Big(0)),
    maximumValue: dynamicValue(new Big(100)),
    stepSize: dynamicValue(new Big(1))
};

const meta = {
    title: "Widgets/Slider",
    component: Slider,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Slider>;

export default meta;

export const Default: StoryObj<typeof Slider> = {
    render: () => {
        const [value, setValue] = useState(new Big(40));
        return (
            <Slider
                {...baseProps}
                valueAttribute={editableValue<Big>(value, setValue)}
                onChange={actionValue("onChange")}
            />
        );
    }
};

/** A coarse step size, where the thumb snaps rather than sliding freely. */
export const SteppedRange: StoryObj<typeof Slider> = {
    render: () => {
        const [value, setValue] = useState(new Big(50));
        return (
            <Slider
                {...baseProps}
                stepSize={dynamicValue(new Big(25))}
                valueAttribute={editableValue<Big>(value, setValue)}
            />
        );
    }
};

/**
 * The bounds and step still loading.
 *
 * All three are DynamicValues, so on a cold page open the slider is asked to lay itself out with no
 * range at all. The widget has a validation path for this; a story that always passes Available
 * values never reaches it.
 */
export const BoundsLoading: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        minimumValue: { status: ValueStatus.Loading, value: undefined } as never,
        maximumValue: { status: ValueStatus.Loading, value: undefined } as never,
        valueAttribute: editableValue<Big>(new Big(40))
    }
};

/**
 * A value outside the min/max, and a min above the max.
 *
 * Both are reachable from the modeller's side — the bounds are expressions, so nothing stops them
 * contradicting the stored value — and the widget answers with a validation message rather than a
 * mis-positioned thumb.
 */
export const InvalidRange: StoryObj<typeof Slider> = {
    render: () => (
        <StoryRows>
            <StoryRow label="value above maximum">
                <Slider {...baseProps} valueAttribute={editableValue<Big>(new Big(140))} />
            </StoryRow>
            <StoryRow label="minimum above maximum">
                <Slider
                    {...baseProps}
                    minimumValue={dynamicValue(new Big(80))}
                    maximumValue={dynamicValue(new Big(20))}
                    valueAttribute={editableValue<Big>(new Big(40))}
                />
            </StoryRow>
        </StoryRows>
    )
};

/** `editable: "never"`, plus the Atlas colour variants. */
export const NotEditableAndVariants: StoryObj<typeof Slider> = {
    render: () => (
        <StoryRows>
            <StoryRow label='editable: "never"'>
                <Slider {...baseProps} editable="never" valueAttribute={editableValue<Big>(new Big(60))} />
            </StoryRow>
            {(["sliderSuccess", "sliderWarning", "sliderDanger"] as const).map(name => (
                <StoryRow key={name} label={name}>
                    <Slider
                        {...baseProps}
                        style={atlas.concat(atlasClasses(name) as SliderStyle[])}
                        valueAttribute={editableValue<Big>(new Big(60))}
                    />
                </StoryRow>
            ))}
        </StoryRows>
    )
};
