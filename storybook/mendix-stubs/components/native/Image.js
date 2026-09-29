/**
 * Stub for `mendix/components/native/Image`.
 *
 * The real component accepts a `NativeImage` — a require()'d asset number, a plain url string, or
 * an `ImageURISource` object — and renders SVG sources through react-native-svg so that `fill` and
 * `stroke` on the style take effect. Widgets pass a `DynamicValue<NativeImage>`'s `.value`
 * straight through, so the stub only has to normalise those three shapes into an RN `source`;
 * svg-specific style keys are dropped rather than honoured, which keeps the stub free of a
 * react-native-svg dependency it would otherwise need at module scope.
 */
const { createElement } = require("react");
const { Image } = require("react-native");

const toSource = source => {
    if (source == null) {
        return undefined;
    }
    // Numbers are the handles require("./x.png") returns; strings are urls.
    return typeof source === "string" ? { uri: source } : source;
};

function MendixImage({ source, style, testID, accessible, screenReaderCaption }) {
    const resolved = toSource(source);
    if (!resolved) {
        return null;
    }
    return createElement(Image, {
        source: resolved,
        style,
        testID,
        accessible,
        accessibilityLabel: screenReaderCaption && screenReaderCaption.value
    });
}

module.exports = { Image: MendixImage };
