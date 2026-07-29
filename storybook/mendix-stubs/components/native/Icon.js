/**
 * Stub for `mendix/components/native/Icon`.
 *
 * Mirrors the shape the widgets rely on: an `Icon` taking `{ icon, color, size }`. The real
 * component resolves glyph/image icons through the Mendix client; here a glyph renders as its
 * name so a story still shows which icon a widget asked for, and an image icon renders the image.
 */
const { createElement } = require("react");
const { Image, Text } = require("react-native");

function Icon({ icon, color, size }) {
    if (!icon) {
        return null;
    }
    if (icon.type === "image" && (icon.imageUrl || icon.iconUrl)) {
        return createElement(Image, {
            source: { uri: icon.imageUrl || icon.iconUrl },
            style: { width: size || 16, height: size || 16, tintColor: color }
        });
    }
    // Glyph icons arrive as e.g. "glyphicon-chevron-right"; show the distinctive part only.
    const label = (icon.iconClass || "").replace(/^glyphicon-/, "");
    return createElement(Text, { style: { color, fontSize: size || 16 } }, label);
}

module.exports = { Icon };
