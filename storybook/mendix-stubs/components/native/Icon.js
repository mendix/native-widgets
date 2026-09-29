/**
 * Stub for `mendix/components/native/Icon`.
 *
 * Mirrors the shape the widgets rely on: an `Icon` taking `{ icon, color, size }`, where `icon` is
 * either `{ type: "glyph", iconClass }` or `{ type: "image", imageUrl | iconUrl }`.
 *
 * Glyph icons are the awkward part. Widgets ask for Bootstrap glyphicon names —
 * `glyphicon-chevron-down`, `glyphicon-star` — and the real component resolves those against
 * `glyphicons-halflings-regular.ttf`, which the Mendix app bundles and this repo does not have.
 * Rendering the name as text is honest but unreadable: an Accordion header ends up saying
 * "chevron-down" where an arrow belongs, which makes the layout stories hard to judge.
 *
 * So glyph names are mapped onto Material Icons, whose font *is* in this app's binary already
 * (`@react-native-vector-icons/material-icons` is a widget dependency, and autolinking puts
 * `MaterialIcons.ttf` in the APK). The shapes are close enough for the handful of glyphs widgets
 * actually request at runtime, and anything unmapped falls back to the old text behaviour rather
 * than drawing a wrong icon — a visible name is a better failure than a plausible-looking lie.
 */
const { createElement } = require("react");
const { Image, Text } = require("react-native");
const { MaterialIcons } = require("@react-native-vector-icons/material-icons");

/**
 * Bootstrap glyphicon → Material Icons.
 *
 * Only the glyphs widgets hard-code are listed; everything a modeller might type is out of scope,
 * since a story chooses its own icons. Grepping `glyphicon-` across the widget sources turns up
 * these plus long tables in the editor-preview configs, which never render on a device.
 */
const GLYPH_TO_MATERIAL = {
    // Accordion's GroupIcon — the collapsed/expanded chevrons.
    "chevron-down": "expand-more",
    "chevron-up": "expand-less",
    "chevron-right": "chevron-right",
    "chevron-left": "chevron-left",
    // Rating's default stars.
    star: "star",
    "star-empty": "star-border",
    // FloatingActionButton's default idle and active icons.
    plus: "add",
    remove: "close",
    // Common enough elsewhere to be worth having.
    ok: "check",
    search: "search",
    trash: "delete",
    filter: "filter-list",
    menu: "menu",
    "menu-hamburger": "menu",
    refresh: "refresh",
    "zoom-in": "zoom-in",
    "zoom-out": "zoom-out",
    "volume-up": "volume-up",
    "volume-off": "volume-off",
    play: "play-arrow",
    pause: "pause",
    "map-marker": "place",
    qrcode: "qr-code",
    camera: "photo-camera"
};

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

    // Glyph icons arrive as e.g. "glyphicon-chevron-right"; the distinctive part is what maps.
    const name = (icon.iconClass || "").replace(/^glyphicon-/, "");
    const material = GLYPH_TO_MATERIAL[name];

    return material
        ? createElement(MaterialIcons, { name: material, size: size || 16, color })
        : // Unmapped: show what was asked for, so the gap is obvious rather than silently wrong.
          createElement(Text, { style: { color, fontSize: size || 16 } }, name);
}

module.exports = { Icon };
