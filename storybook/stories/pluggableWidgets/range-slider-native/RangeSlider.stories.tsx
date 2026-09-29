import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { Big } from "big.js";
import { RangeSlider } from "../../../../packages/pluggableWidgets/range-slider-native/src/RangeSlider";
import type { RangeSliderStyle } from "../../../../packages/pluggableWidgets/range-slider-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.rangeslider.RangeSlider") as RangeSliderStyle[];

const baseProps = {
    name: "range-slider",
    style: atlas,
    editable: "default" as const,
    minimumValue: dynamicValue(new Big(0)),
    maximumValue: dynamicValue(new Big(1000)),
    stepSize: dynamicValue(new Big(50))
};

const meta = {
    title: "Widgets/RangeSlider",
    component: RangeSlider,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof RangeSlider>;

export default meta;

/**
 * Both thumbs wired to state.
 *
 * The two bounds are separate attributes, and the widget writes whichever one moved — so a story
 * needs two setters, not one, and dragging either thumb should leave the other where it was.
 */
export const Default: StoryObj<typeof RangeSlider> = {
    render: () => {
        const [lower, setLower] = useState(new Big(200));
        const [upper, setUpper] = useState(new Big(700));
        return (
            <RangeSlider
                {...baseProps}
                lowerValueAttribute={editableValue<Big>(lower, setLower)}
                upperValueAttribute={editableValue<Big>(upper, setUpper)}
                onChange={actionValue("onChange")}
            />
        );
    }
};

/** Both thumbs on the same value — the degenerate range, where they overlap and have to separate. */
export const CollapsedRange: StoryObj<typeof RangeSlider> = {
    render: () => {
        const [lower, setLower] = useState(new Big(500));
        const [upper, setUpper] = useState(new Big(500));
        return (
            <RangeSlider
                {...baseProps}
                lowerValueAttribute={editableValue<Big>(lower, setLower)}
                upperValueAttribute={editableValue<Big>(upper, setUpper)}
            />
        );
    }
};

/**
 * Lower above upper, which the widget treats as a validation error rather than swapping them.
 *
 * Nothing on the modeller's side prevents it: they are two independent attributes, so any nanoflow
 * that writes one without checking the other can produce this.
 */
export const LowerAboveUpper: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        lowerValueAttribute: editableValue<Big>(new Big(800)),
        upperValueAttribute: editableValue<Big>(new Big(300))
    }
};

/** `editable: "never"`, plus the Atlas colour variants. */
export const NotEditableAndVariants: StoryObj<typeof RangeSlider> = {
    render: () => {
        const bounds = {
            lowerValueAttribute: editableValue<Big>(new Big(250)),
            upperValueAttribute: editableValue<Big>(new Big(750))
        };
        return (
            <StoryRows>
                <StoryRow label='editable: "never"'>
                    <RangeSlider {...baseProps} {...bounds} editable="never" />
                </StoryRow>
                {(["rangeSliderSuccess", "rangeSliderWarning", "rangeSliderDanger"] as const).map(name => (
                    <StoryRow key={name} label={name}>
                        <RangeSlider
                            {...baseProps}
                            {...bounds}
                            style={atlas.concat(atlasClasses(name) as RangeSliderStyle[])}
                        />
                    </StoryRow>
                ))}
            </StoryRows>
        );
    }
};
