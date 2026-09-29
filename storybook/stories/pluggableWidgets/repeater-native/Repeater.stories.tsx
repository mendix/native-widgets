import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ValueStatus } from "mendix";
import { Repeater } from "../../../../packages/pluggableWidgets/repeater-native/src/Repeater";
import type { RepeaterStyle } from "../../../../packages/pluggableWidgets/repeater-native/src/ui/Styles";
import { listValue, listWidgetValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * Atlas has no entry for this widget, so this array is empty.
 *
 * Not an oversight on either side: the repeater renders one `View` around whatever the modeller nested
 * inside it and nothing else, so there is no styling to theme. Left going through `atlasStyle` anyway,
 * so the story matches what the runtime passes if an entry is ever added.
 */
const atlas = atlasStyle("com.mendix.widget.native.repeater.Repeater") as RepeaterStyle[];

const styles = StyleSheet.create({
    row: {
        backgroundColor: variables.background.secondary,
        borderRadius: 6,
        marginBottom: variables.spacing.smaller,
        padding: variables.spacing.small
    },
    name: { color: variables.contrast.highest, fontFamily: variables.font.family, fontWeight: "bold" },
    role: { color: variables.contrast.high, fontFamily: variables.font.family, fontSize: variables.font.sizeSmall },
    // A visible boundary, so an empty repeater can be told apart from a missing one.
    outline: { borderColor: variables.brand.primary, borderStyle: "dashed", borderWidth: 1, minHeight: 40 }
});

const people = [
    { name: "Ada Lovelace", role: "Mathematician" },
    { name: "Grace Hopper", role: "Rear Admiral" },
    { name: "Alan Turing", role: "Cryptanalyst" }
];

const source = listValue(people);

const baseProps = {
    name: "repeater",
    style: atlas,
    datasource: source.value,
    content: listWidgetValue(source, row => (
        <View style={styles.row}>
            <Text style={styles.name}>{String(row.name)}</Text>
            <Text style={styles.role}>{String(row.role)}</Text>
        </View>
    ))
};

const meta = {
    title: "Widgets/Repeater",
    component: Repeater,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Repeater>;

export default meta;

/**
 * Three rows, each the content template filled from one object.
 *
 * This is the whole widget: no virtualisation, no separators, no header. Everything visible below comes
 * from the nested content, not from the repeater — which is what distinguishes it from the gallery.
 */
export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * The three states that all render nothing, and why that is deliberate.
 *
 * Loading, an absent `items`, and an empty array are one branch in the widget — it returns a bare
 * `<View />`, without even the container style. So a repeater over an empty list leaves no trace at all,
 * which is why an app that needs an "no results" message has to put it beside the repeater rather than
 * inside it. The dashed outlines below come from the story, to show where the widget would be.
 */
export const EmptyStates: StoryObj<typeof Repeater> = {
    render: () => (
        <StoryRows>
            <StoryRow label="empty list — nothing, not even the container">
                <View style={styles.outline}>
                    <Repeater {...baseProps} datasource={listValue([]).value} />
                </View>
            </StoryRow>
            <StoryRow label="still loading — the same nothing">
                <View style={styles.outline}>
                    <Repeater {...baseProps} datasource={listValue(people, { status: ValueStatus.Loading }).value} />
                </View>
            </StoryRow>
            <StoryRow label="one row, for comparison">
                <View style={styles.outline}>
                    <Repeater
                        {...baseProps}
                        datasource={listValue([people[0]]).value}
                        content={listWidgetValue(listValue([people[0]]), row => (
                            <View style={styles.row}>
                                <Text style={styles.name}>{String(row.name)}</Text>
                            </View>
                        ))}
                    />
                </View>
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The container style, which is the one thing a theme or a modeller can reach.
 *
 * It is a plain `ViewStyle` on a plain `View`, so laying rows out side by side is a matter of setting
 * `flexDirection` — there is no "orientation" property. Worth showing because a horizontal repeater is
 * a common ask and looks like it needs a different widget.
 */
export const ContainerStyle: StoryObj<typeof Repeater> = {
    render: () => (
        <StoryRows>
            <StoryRow label="row + wrap — a chip list, from flexDirection alone">
                <Repeater
                    {...baseProps}
                    style={atlas.concat([{ container: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }])}
                />
            </StoryRow>
            <StoryRow label="padded card around the whole set">
                <Repeater
                    {...baseProps}
                    style={atlas.concat([
                        {
                            container: {
                                backgroundColor: variables.background.secondary,
                                borderRadius: 8,
                                padding: variables.spacing.regular
                            }
                        }
                    ])}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A long list, which the repeater renders in full.
 *
 * Every item is mounted at once — there is no windowing — so this is the story that shows why the
 * gallery exists. Twenty is fine; a few hundred bound rows is where an app starts to feel it. The
 * scrolling here comes from the story frame, not the widget.
 */
export const LongList: StoryObj<typeof Repeater> = {
    render: () => {
        const many = Array.from({ length: 20 }, (_, index) => ({
            name: `Item ${index + 1}`,
            role: "rendered eagerly"
        }));
        const longSource = listValue(many);
        return (
            <Repeater
                {...baseProps}
                datasource={longSource.value}
                content={listWidgetValue(longSource, row => (
                    <View style={styles.row}>
                        <Text style={styles.name}>{String(row.name)}</Text>
                        <Text style={styles.role}>{String(row.role)}</Text>
                    </View>
                ))}
            />
        );
    }
};
