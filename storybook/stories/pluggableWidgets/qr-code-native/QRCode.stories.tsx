import type { Meta, StoryObj } from "@storybook/react-native";
import type { ReactElement } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { ViewStyle } from "react-native";
import { useState } from "react";
import { QRCode } from "../../../../packages/pluggableWidgets/qr-code-native/src/QRCode";
import { dynamicValue } from "../../shared/mendixValues";
import { atlasStyle, variables } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

/**
 * The style shape, declared here because the widget does not export it.
 *
 * `QRCode` is typed `QRCodeProps<undefined>` — its `Styles.ts` keeps `QRCodeStyle` private — so its
 * `style` prop is `undefined[]` and nothing meaningful can be assigned to it, even though `flattenStyles`
 * inside the widget merges over exactly these two keys and Atlas supplies exactly them. Both halves are
 * partial in practice: an entry that sets only `qrcode.size` is what the runtime passes too.
 */
interface Style {
    container?: ViewStyle;
    qrcode?: Partial<{ size: number; color: string; backgroundColor: string }>;
}

/**
 * The style array as the prop will accept it — checked as a `Style` on the way through.
 *
 * The cast is the whole reason this exists, and it sits in one place so the stories below can be written
 * against the real shape and still typecheck against the widget's `undefined[]`.
 */
const withStyle = (...entries: Style[]): undefined[] => entries as unknown as undefined[];

const atlas = atlasStyle("com.mendix.widget.native.qrcode.QRCode") as Style[];

const styles = StyleSheet.create({
    input: {
        borderColor: variables.contrast.lower,
        borderRadius: 6,
        borderWidth: 1,
        color: variables.contrast.highest,
        fontFamily: variables.font.family,
        marginBottom: variables.spacing.regular,
        paddingHorizontal: variables.spacing.small,
        paddingVertical: variables.spacing.smaller
    }
});

const baseProps = {
    name: "qr-code",
    style: withStyle(...atlas),
    value: dynamicValue("https://www.mendix.com")
};

const meta = {
    title: "Widgets/QRCode",
    component: QRCode,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof QRCode>;

export default meta;

export const Default: StoryObj<typeof meta> = {
    args: baseProps
};

/**
 * How much a code can hold, and what that does to it.
 *
 * The library picks the QR version from the payload length, so a longer value means a denser grid at
 * the same pixel size. Past a point the modules get too small for a camera to resolve — which is the
 * practical limit these rows are for, not an error the widget reports.
 */
export const ValueLength: StoryObj<typeof QRCode> = {
    render: () => (
        <StoryRows>
            <StoryRow label="short — a few characters, a coarse grid">
                <QRCode {...baseProps} value={dynamicValue("MX")} />
            </StoryRow>
            <StoryRow label="a url — the common case">
                <QRCode {...baseProps} />
            </StoryRow>
            <StoryRow label="~300 characters — dense enough to be hard to scan at 100pt">
                <QRCode
                    {...baseProps}
                    value={dynamicValue(
                        "A QR code's version grows with its payload, so this row is deliberately long: " +
                            "the same 100pt box now holds far more modules, each one a fraction of the size. " +
                            "It still encodes correctly — it is just no longer scannable from across a room, " +
                            "which is a sizing decision rather than a widget one."
                    )}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * No value, which renders an empty container rather than a placeholder.
 *
 * The widget checks `value.value` and renders nothing when it is absent — so a loading attribute, an
 * unavailable one and an empty string all look the same: the container, sized by the theme, with
 * nothing in it. Distinguishing them is the app's job, not the widget's.
 */
export const NoValue: StoryObj<typeof QRCode> = {
    render: () => (
        <StoryRows>
            <StoryRow label="empty string — an empty container">
                <QRCode
                    {...baseProps}
                    value={dynamicValue("")}
                    style={withStyle(...atlas, { container: { borderWidth: 1, borderColor: "#ccc", height: 100 } })}
                />
            </StoryRow>
            <StoryRow label="still loading — indistinguishable from the above">
                <QRCode
                    {...baseProps}
                    value={{ status: "loading", value: undefined } as never}
                    style={withStyle(...atlas, { container: { borderWidth: 1, borderColor: "#ccc", height: 100 } })}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The whole of what a theme controls here: size, colour and background.
 *
 * `qrcode` takes only those three, and they go to the library as props rather than as styles — so
 * there is no border, no radius and no padding on the code itself. Inverting it (light on dark) is
 * allowed by the widget and rejected by most scanners, which is why the last row is captioned that way
 * rather than presented as an option.
 */
export const Styling: StoryObj<typeof QRCode> = {
    render: () => (
        <StoryRows>
            <StoryRow label="size: 60">
                <QRCode {...baseProps} style={withStyle(...atlas, { qrcode: { size: 60 } })} />
            </StoryRow>
            <StoryRow label="size: 180">
                <QRCode {...baseProps} style={withStyle(...atlas, { qrcode: { size: 180 } })} />
            </StoryRow>
            <StoryRow label="color: brand primary, on a padded card">
                <QRCode
                    {...baseProps}
                    style={withStyle(...atlas, {
                        container: {
                            alignSelf: "flex-start",
                            backgroundColor: variables.background.secondary,
                            borderRadius: 8,
                            padding: variables.spacing.regular
                        },
                        qrcode: { color: variables.brand.primary, backgroundColor: variables.background.secondary }
                    })}
                />
            </StoryRow>
            <StoryRow label="inverted — allowed, but most scanners will not read it">
                <QRCode
                    {...baseProps}
                    style={withStyle(...atlas, {
                        qrcode: { color: variables.background.primary, backgroundColor: "#000" }
                    })}
                />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * A code that follows what is typed, which is what the widget is normally bound to.
 *
 * In an app the value is an attribute that changes — a ticket id, a session token — and the code
 * regenerates on every render. Worth having as a story because a static payload hides the one
 * performance characteristic here: the SVG is rebuilt from scratch each keystroke.
 */
export const LiveValue: StoryObj<typeof QRCode> = {
    render: () => {
        const [text, setText] = useState("https://www.mendix.com");
        return (
            <View>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="type to regenerate"
                    placeholderTextColor={variables.contrast.low}
                />
                <QRCode {...baseProps} value={dynamicValue(text)} />
            </View>
        );
    }
};

/**
 * No Atlas variants story: there are no design-property classes for this widget.
 *
 * `com_mendix_widget_native_qrcode_QRCode` sets `qrcode.size` to 100 and takes its colours from
 * `contrast.highest` and `background.primary` — which is what `Default` above shows. `Styling` covers
 * what a theme could change beyond that.
 */
