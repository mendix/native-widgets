import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { ToggleButtons } from "../../../../packages/pluggableWidgets/toggle-buttons-native/src/ToggleButtons";
import type { ToggleButtonsStyle } from "../../../../packages/pluggableWidgets/toggle-buttons-native/src/ui/Styles";
import { actionValue, enumValue } from "../../shared/mendixValues";
import { atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.togglebuttons.ToggleButtons") as ToggleButtonsStyle[];

const MEMBERS = ["day", "week", "month"];
const CAPTIONS = { day: "Day", week: "Week", month: "Month" };

const baseProps = {
    name: "toggle-buttons",
    style: atlas,
    editable: "default" as const
};

const meta = {
    title: "Widgets/ToggleButtons",
    component: ToggleButtons,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof ToggleButtons>;

export default meta;

export const Default: StoryObj<typeof ToggleButtons> = {
    render: () => {
        const [choice, setChoice] = useState("week");
        return (
            <ToggleButtons
                {...baseProps}
                enum={enumValue(choice, MEMBERS, setChoice, CAPTIONS)}
                onChange={actionValue("onChange")}
            />
        );
    }
};

/**
 * `editable: "never"`, the widget's own way of locking the control.
 *
 * Unlike most inputs here this is a widget prop rather than a property of the attribute, so it is
 * the one lock that works even over a writable attribute.
 */
export const NotEditable: StoryObj<typeof meta> = {
    args: { ...baseProps, editable: "never", enum: enumValue("week", MEMBERS, () => undefined, CAPTIONS) }
};

/**
 * A value outside the universe, and an empty one.
 *
 * The widget finds the selected tab with `universe.indexOf(value)`, which answers -1 for both. Worth
 * a story because -1 is a real state — a fresh object has no value — and it is easy to render as
 * "first tab selected" by accident.
 */
export const NoMatchingSelection: StoryObj<typeof ToggleButtons> = {
    render: () => (
        <StoryRows>
            <StoryRow label="empty value">
                <ToggleButtons {...baseProps} enum={enumValue("", MEMBERS, () => undefined, CAPTIONS)} />
            </StoryRow>
            <StoryRow label="value not in universe">
                <ToggleButtons {...baseProps} enum={enumValue("year", MEMBERS, () => undefined, CAPTIONS)} />
            </StoryRow>
        </StoryRows>
    )
};

/** More members than fit the width, which is where the segmented control has to compress. */
export const ManyOptions: StoryObj<typeof ToggleButtons> = {
    render: () => {
        const [choice, setChoice] = useState("wed");
        const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        return <ToggleButtons {...baseProps} enum={enumValue(choice, days, setChoice)} />;
    }
};
