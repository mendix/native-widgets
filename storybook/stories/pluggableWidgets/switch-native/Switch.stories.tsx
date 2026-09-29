import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { Switch } from "../../../../packages/pluggableWidgets/switch-native/src/Switch";
import type { SwitchStyle } from "../../../../packages/pluggableWidgets/switch-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { atlasClasses, atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.switch.Switch") as SwitchStyle[];

const baseProps = {
    name: "switch",
    style: atlas,
    showLabel: true,
    label: dynamicValue("Notifications"),
    labelOrientation: "horizontal" as const,
    labelPosition: "left" as const
};

const meta = {
    title: "Widgets/Switch",
    component: Switch,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Switch>;

export default meta;

/**
 * The switch wired to state, so it can actually be flipped.
 *
 * This is the Default rather than a static `args` story because a switch that cannot move shows
 * almost nothing: the widget writes through `setValue` and waits for the new value to come back as
 * a prop, so without a round trip the thumb snaps back and every tap looks broken.
 */
export const Default: StoryObj<typeof Switch> = {
    render: () => {
        const [on, setOn] = useState(false);
        return <Switch {...baseProps} booleanAttribute={editableValue(on, setOn)} onChange={actionValue("onChange")} />;
    }
};

/** The label stacked above the control instead of beside it, and on the other side. */
export const LabelPlacement: StoryObj<typeof Switch> = {
    render: () => {
        const [on, setOn] = useState(true);
        const attribute = editableValue(on, setOn);
        return (
            <StoryRows>
                <StoryRow label="horizontal / left">
                    <Switch {...baseProps} booleanAttribute={attribute} />
                </StoryRow>
                <StoryRow label="horizontal / right">
                    <Switch {...baseProps} booleanAttribute={attribute} labelPosition="right" />
                </StoryRow>
                <StoryRow label="vertical">
                    <Switch {...baseProps} booleanAttribute={attribute} labelOrientation="vertical" />
                </StoryRow>
                <StoryRow label="no label">
                    <Switch {...baseProps} booleanAttribute={attribute} showLabel={false} />
                </StoryRow>
            </StoryRows>
        );
    }
};

/**
 * A read-only switch.
 *
 * `readOnly` on the attribute is how the runtime expresses this — there is no widget prop for it —
 * and `editableValue` derives it from the absence of an onChange. So this story is what a switch
 * over a non-writable attribute looks like, which is a page state a modeller hits often.
 */
export const ReadOnly: StoryObj<typeof meta> = {
    args: { ...baseProps, booleanAttribute: editableValue<boolean>(true) }
};

/** The Atlas colour variants. */
export const AtlasVariants: StoryObj<typeof Switch> = {
    render: () => {
        const [on, setOn] = useState(true);
        const attribute = editableValue(on, setOn);
        return (
            <StoryRows>
                {(["switchSuccess", "switchWarning", "switchDanger"] as const).map(name => (
                    <StoryRow key={name} label={name}>
                        <Switch
                            {...baseProps}
                            style={atlas.concat(atlasClasses(name) as SwitchStyle[])}
                            booleanAttribute={attribute}
                            label={dynamicValue(name)}
                        />
                    </StoryRow>
                ))}
            </StoryRows>
        );
    }
};
