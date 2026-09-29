import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Accordion } from "../../../../packages/pluggableWidgets/accordion-native/src/Accordion";
import type { AccordionStyle } from "../../../../packages/pluggableWidgets/accordion-native/src/ui/Styles";
import type { GroupsType } from "../../../../packages/pluggableWidgets/accordion-native/typings/AccordionProps";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { atlasStyle, atlasVariant, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.accordion.Accordion") as AccordionStyle[];

const bodyStyles = StyleSheet.create({
    text: { color: variables.contrast.high, fontFamily: variables.font.family, fontSize: variables.font.size }
});

/** Whatever a modeller dropped inside a group — here just a paragraph, so the framing is what shows. */
const body = (text: string): ReactNode => <Text style={bodyStyles.text}>{text}</Text>;

/**
 * One group, with the properties the widget reads on every render.
 *
 * `visible` is a `DynamicValue<boolean>` rather than a plain flag, and `Accordion` filters on
 * `status === Available && value` — so a group built without it disappears rather than erroring,
 * which is a confusing way to lose a story.
 */
const group = (headerText: string, content: string, overrides: Partial<GroupsType> = {}): GroupsType =>
    ({
        headerRenderMode: "text",
        headerTextRenderMode: "heading5",
        headerText: dynamicValue(headerText),
        content: body(content),
        visible: dynamicValue(true),
        groupCollapsed: "groupStartCollapsed",
        ...overrides
    } as GroupsType);

const threeGroups: GroupsType[] = [
    group("Shipping address", "Delivered to the address on the account unless a different one is chosen here."),
    group("Payment", "Card details are held by the payment provider, never by the app."),
    group("Order summary", "Three items, one of which ships separately.")
];

const baseProps = {
    name: "accordion",
    style: atlas,
    groups: threeGroups,
    collapsible: true,
    collapseBehavior: "singleExpanded" as const,
    icon: "right" as const
};

const meta = {
    title: "Widgets/Accordion",
    component: Accordion,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Accordion>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The two collapse behaviours, which only differ once a second group is opened.
 *
 * `singleExpanded` closes whatever was open; `multipleExpanded` leaves it. Tap two headers in each
 * to tell them apart — a still frame cannot show the difference.
 */
export const CollapseBehavior: StoryObj<typeof Accordion> = {
    render: () => (
        <StoryRows>
            <StoryRow label="singleExpanded — opening one closes the rest">
                <Accordion {...baseProps} collapseBehavior="singleExpanded" />
            </StoryRow>
            <StoryRow label="multipleExpanded — groups open independently">
                <Accordion {...baseProps} collapseBehavior="multipleExpanded" />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The three ways a group decides where it starts.
 *
 * `groupStartExpanded` under `singleExpanded` is the interesting one: the widget's initial reduce
 * keeps only the *last* expanded group, so two groups asking to start open resolve to one. This
 * story has exactly that, which is why both are marked expanded.
 */
export const InitialState: StoryObj<typeof Accordion> = {
    render: () => (
        <StoryRows>
            <StoryRow label="two groups start expanded — singleExpanded keeps the last">
                <Accordion
                    {...baseProps}
                    groups={[
                        group("First", "Asks to start expanded.", { groupCollapsed: "groupStartExpanded" }),
                        group("Second", "Also asks to start expanded.", { groupCollapsed: "groupStartExpanded" }),
                        group("Third", "Starts collapsed.")
                    ]}
                />
            </StoryRow>
            <StoryRow label="groupStartDynamic — an expression decides">
                <Accordion
                    {...baseProps}
                    collapseBehavior="multipleExpanded"
                    groups={[
                        group("Expression says open", "groupCollapsedDynamic resolves to false.", {
                            groupCollapsed: "groupStartDynamic",
                            groupCollapsedDynamic: dynamicValue(false)
                        }),
                        group("Expression says closed", "groupCollapsedDynamic resolves to true.", {
                            groupCollapsed: "groupStartDynamic",
                            groupCollapsedDynamic: dynamicValue(true)
                        })
                    ]}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A group whose open/closed state lives in an attribute the widget writes back to.
 *
 * This is the two-way binding, and it is easy to get subtly wrong: the widget writes `!expanded` to
 * every group's attribute on each header press, and its own effect reads them back and re-applies.
 * With real state behind the attribute those two can fight, so it is worth driving by hand. The
 * caption shows what the attribute currently holds.
 */
export const CollapsedAttribute: StoryObj<typeof Accordion> = {
    render: () => {
        const [firstCollapsed, setFirstCollapsed] = useState(false);
        const [secondCollapsed, setSecondCollapsed] = useState(true);
        return (
            <StoryRow label={`attributes: first=${firstCollapsed}, second=${secondCollapsed}`}>
                <Accordion
                    {...baseProps}
                    collapseBehavior="multipleExpanded"
                    groups={[
                        group("Bound to an attribute", "Its collapsed state is stored, not local.", {
                            groupCollapsedAttribute: editableValue<boolean>(firstCollapsed, setFirstCollapsed),
                            groupOnChange: actionValue("first groupOnChange")
                        }),
                        group("Also bound", "Starts collapsed because the attribute says so.", {
                            groupCollapsedAttribute: editableValue<boolean>(secondCollapsed, setSecondCollapsed),
                            groupOnChange: actionValue("second groupOnChange")
                        })
                    ]}
                />
            </StoryRow>
        );
    }
};

/** Icon on the right, on the left (which flips the header row), and off entirely. */
export const IconPlacement: StoryObj<typeof Accordion> = {
    render: () => (
        <StoryRows>
            {(["right", "left", "no"] as const).map(icon => (
                <StoryRow key={icon} label={`icon: ${icon}`}>
                    <Accordion {...baseProps} icon={icon} groups={[threeGroups[0], threeGroups[1]]} />
                </StoryRow>
            ))}
        </StoryRows>
    )
};

/**
 * `collapsible: false`, where every group is open and no header responds.
 *
 * The widget hands `onPress={null}` to the header and forces every index into the expanded set, so
 * this is a plain stack of sections rather than an accordion — worth seeing, since it is a distinct
 * enough result that it reads as a bug when it turns up unexpectedly.
 */
export const NotCollapsible: StoryObj<typeof meta> = {
    args: { ...baseProps, collapsible: false }
};

/**
 * Custom header content instead of text, and a hidden group.
 *
 * `headerRenderMode: "custom"` drops the heading styling altogether — the widget renders the
 * modeller's widgets in a flexed view — so anything the theme says about headings stops applying.
 */
export const HeaderContentAndVisibility: StoryObj<typeof Accordion> = {
    render: () => (
        <StoryRows>
            <StoryRow label="headerRenderMode: custom">
                <Accordion
                    {...baseProps}
                    groups={[
                        group("unused", "Header above is a custom widget, not the header text.", {
                            headerRenderMode: "custom",
                            headerContent: (
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={bodyStyles.text}>Custom header</Text>
                                </View>
                            )
                        })
                    ]}
                />
            </StoryRow>
            <StoryRow label="middle group not visible — two headers, not three">
                <Accordion
                    {...baseProps}
                    groups={[
                        threeGroups[0],
                        group("Hidden", "Never rendered.", { visible: dynamicValue(false) }),
                        threeGroups[2]
                    ]}
                />
            </StoryRow>
        </StoryRows>
    )
};

/** The heading levels a group header can use, which are the ones Atlas styles. */
export const HeadingLevels: StoryObj<typeof meta> = {
    args: {
        ...baseProps,
        collapsible: false,
        groups: (["heading1", "heading3", "heading5", "heading6"] as const).map(level =>
            group(level, `Rendered with ${level}.`, { headerTextRenderMode: level })
        )
    }
};

/**
 * The Atlas variants — the colour treatments plus the lined, dividerless and compact layouts.
 *
 * These go through `atlasVariant` rather than `.concat(atlasClasses(...))`, because Accordion's style
 * is three levels deep and `flattenStyles` only merges one: appending `accordionCompact` — which sets
 * `group.header.container` and nothing else — would replace `group.header` outright, leaving
 * `group.header.icon` undefined and crashing `GroupIcon`. See the note on `atlasVariant`.
 */
export const AtlasVariants: StoryObj<typeof Accordion> = {
    render: () => (
        <StoryRows>
            {(
                [
                    "accordionPrimary",
                    "accordionSecondary",
                    "accordionSuccess",
                    "accordionWarning",
                    "accordionDanger",
                    "accordionLined",
                    "accordionDividerNone",
                    "accordionCompact"
                ] as const
            ).map(name => (
                <StoryRow key={name} label={name}>
                    <Accordion
                        {...baseProps}
                        style={atlasVariant("com.mendix.widget.native.accordion.Accordion", name) as AccordionStyle[]}
                        groups={[threeGroups[0], threeGroups[1]]}
                    />
                </StoryRow>
            ))}
        </StoryRows>
    )
};
