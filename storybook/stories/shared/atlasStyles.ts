/**
 * Atlas styling for the widget stories.
 *
 * Every native widget takes its look from `props.style`, an array of partial style objects that
 * `flattenStyles(defaultXStyle, props.style)` merges over the widget's own defaults. In a real app
 * that array comes from the theme, so a story that passes `style: []` renders the bare fallback
 * rather than what a user would ever see. Atlas is the theme Mendix ships, and its native theme
 * exports exactly that shape — one object per widget, keyed by the widget's class name with dots
 * turned into underscores (`com.mendix.widget.native.badge.Badge` →
 * `com_mendix_widget_native_badge_Badge`) — so it can be handed straight to the style prop.
 *
 * The import reaches into the package's source tree rather than a built entry point: Atlas has no
 * npm release and no `main`, it is consumed by copying `themesource/` into a Mendix project. Metro
 * compiles the TypeScript on the way in, which is why this works at all. `main.ts` is a barrel that
 * merges ~426 exports, so importing it pulls the whole theme into the bundle once, here.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved by Metro from the git dependency; no type declarations are published.
import * as atlas from "@mendix/atlas/packages/atlas/src/themesource/atlas_core/native/main";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — same as above.
import * as atlasVariables from "@mendix/atlas/packages/atlas/src/themesource/atlas_core/native/variables";

type StyleObject = Record<string, unknown>;

const theme = atlas as unknown as Record<string, StyleObject | undefined>;

/**
 * The Atlas style for a widget, as the array its `style` prop expects.
 *
 * Returns an empty array when Atlas has no entry for the class — five of the widgets in this repo
 * (app-events, barcode-scanner, notifications, repeater, signature) are either invisible or newer
 * than the theme. That is deliberately not an error: a missing entry means "no theme styling", the
 * same thing the runtime does, and throwing would take down every story in the file.
 */
export function atlasStyle(widgetClass: string): StyleObject[] {
    const style = theme[widgetClass.replace(/\./g, "_")];
    return style ? [style] : [];
}

/**
 * Atlas design-property classes, appended after the widget's base style.
 *
 * Design properties are the checkboxes a modeller ticks in Studio Pro — "Danger", "Large",
 * "Rounded" — and each is a separate top-level export (`badgeDanger`, `progressBarLarge`) that the
 * runtime appends to the style array. Order matters: later entries win, so these come last.
 *
 * @example atlasStyle("com.mendix.widget.native.badge.Badge").concat(atlasClasses("badgeDanger"))
 */
export function atlasClasses(...names: string[]): StyleObject[] {
    return names.map(name => theme[name]).filter((style): style is StyleObject => style !== undefined);
}

const isPlainObject = (value: unknown): value is StyleObject =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Recursive merge, later sources winning, used by `atlasVariant` below. */
function mergeDeep(target: StyleObject, source: StyleObject): StyleObject {
    const merged: StyleObject = { ...target };
    for (const key of Object.keys(source)) {
        const next = source[key];
        const previous = merged[key];
        merged[key] = isPlainObject(next) && isPlainObject(previous) ? mergeDeep(previous, next) : next;
    }
    return merged;
}

/**
 * A widget's Atlas style with design-property classes merged *into* it, as a single-entry array.
 *
 * Needed because `flattenStyles` — the helper every native widget flattens `props.style` with — only
 * merges one level below each top-level key: it iterates the default style's own keys and spreads
 * each entry across the array. For a two-level style (`container`, `caption`) that is enough, so
 * `atlasStyle(...).concat(atlasClasses(...))` is fine and most stories here use it.
 *
 * It stops being enough as soon as a style nests deeper. Accordion's is three levels
 * (`group.header.icon`), and `accordionCompact` sets only `group.header.container` — so spreading it
 * over the base replaces `group.header` entirely and `group.header.icon` is gone. The widget then
 * calls `exclude(style.header.icon, [...])`, which does `Object.keys(undefined)` and throws
 * "Cannot convert undefined value to object", taking the story down with it.
 *
 * Merging first sidesteps that: one fully-formed object, nothing for the shallow spread to drop. Use
 * this for widgets whose style has three or more levels; `atlasClasses` is fine for the rest.
 *
 * @example atlasVariant("com.mendix.widget.native.accordion.Accordion", "accordionCompact")
 */
export function atlasVariant(widgetClass: string, ...names: string[]): StyleObject[] {
    return atlasMerge(widgetClass.replace(/\./g, "_"), ...names);
}

/**
 * The same deep merge, over named theme exports rather than a widget class.
 *
 * Needed because one widget's theme entry is not keyed by its class at all: Atlas exports `Image` and
 * `ImageViewer` — the names the pre-9 static and dynamic image widgets used — and never
 * `com_mendix_widget_native_image_Image`, so `atlasStyle` finds nothing for it. Taking the base by
 * export name is the same lookup as any design-property class, so it goes through the same path.
 *
 * @example atlasMerge("Image", "imageCircle", "imageSmall")
 */
export function atlasMerge(...names: string[]): StyleObject[] {
    return [atlasClasses(...names).reduce(mergeDeep, {})];
}

/**
 * Atlas's own design tokens — brand colours, spacing, font sizes.
 *
 * Useful for the frame a story draws around a widget (a background, a gap between two instances) so
 * the surroundings match the widget instead of fighting it.
 */
export const variables = atlasVariables as unknown as Record<string, any>;
