import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { RadioButtons } from "../../../../packages/pluggableWidgets/radio-buttons-native/src/RadioButtons";
import type { RadioButtonsStyle } from "../../../../packages/pluggableWidgets/radio-buttons-native/src/ui/Styles";
import { actionValue, dynamicValue, enumValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.radiobuttons.RadioButtons") as RadioButtonsStyle[];

// The widget renders one button per enumeration member, read off the attribute's `universe`, and
// labels them through its formatter — so the options are part of the attribute, not a widget prop.
const MEMBERS = ["standard", "express", "pickup"];
const CAPTIONS = { standard: "Standard (3–5 days)", express: "Express (next day)", pickup: "Collect in store" };

const baseProps = {
    name: "radio-buttons",
    style: atlas,
    orientation: "vertical" as const,
    showLabel: true,
    label: dynamicValue("Delivery")
};

const meta = {
    title: "Widgets/RadioButtons",
    component: RadioButtons,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof RadioButtons>;

export default meta;

export const Default: StoryObj<typeof RadioButtons> = {
    render: () => {
        const [choice, setChoice] = useState(MEMBERS[0]);
        return (
            <RadioButtons
                {...baseProps}
                enum={enumValue(choice, MEMBERS, setChoice, CAPTIONS)}
                onChange={actionValue("onChange")}
            />
        );
    }
};

/** Buttons laid out in a row. Worth its own story: long captions wrap differently here. */
export const Horizontal: StoryObj<typeof RadioButtons> = {
    render: () => {
        const [choice, setChoice] = useState("express");
        return (
            <RadioButtons
                {...baseProps}
                orientation="horizontal"
                enum={enumValue(choice, ["s", "m", "l", "xl"], setChoice)}
                label={dynamicValue("Size")}
            />
        );
    }
};

/** No selection yet — an enumeration attribute with an empty value, as a fresh object has. */
export const NothingSelected: StoryObj<typeof meta> = {
    args: { ...baseProps, enum: enumValue("", MEMBERS, () => undefined, CAPTIONS) }
};

/** Read-only: no onChange, so the attribute reports itself as not writable. */
export const ReadOnly: StoryObj<typeof meta> = {
    args: { ...baseProps, enum: enumValue("express", MEMBERS, undefined, CAPTIONS) }
};

/**
 * The Atlas colour variants.
 *
 * Atlas splits these in two — `radioButtonsX` colours the control, `radioButtonsLabelX` the label —
 * so both are appended together, which is what the runtime does when a modeller ticks both boxes.
 */
export const AtlasVariants: StoryObj<typeof RadioButtons> = {
    render: () => {
        const [choice, setChoice] = useState("standard");
        return (
            <StoryRows>
                {(["Primary", "Success", "Warning", "Danger", "Info"] as const).map(variant => (
                    <StoryRow key={variant} label={`radioButtons${variant}`}>
                        <RadioButtons
                            {...baseProps}
                            style={atlas.concat(
                                atlasClasses(
                                    `radioButtons${variant}`,
                                    `radioButtonsLabel${variant}`
                                ) as RadioButtonsStyle[]
                            )}
                            enum={enumValue(choice, MEMBERS, setChoice, CAPTIONS)}
                            label={dynamicValue(variant)}
                        />
                    </StoryRow>
                ))}
            </StoryRows>
        );
    }
};
