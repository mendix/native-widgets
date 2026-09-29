/**
 * `@mendix/piw-utils-internal` with the one export that does not survive compilation added back.
 *
 * `FilterType` is declared `export const enum` in the package's source. TypeScript erases a const
 * enum entirely — it inlines each member at its use site and emits nothing — so the name is absent
 * from the package's `dist/`. That is fine inside the workspace, where every consumer is compiled by
 * tsc against the same source and gets the string inlined. It is not fine here: Metro compiles
 * widget source with Babel, which is single-file and has no way to know what `FilterType.STRING`
 * should inline to, so it leaves the member access in place against an import that resolves to
 * `undefined`. The gallery text filter is the widget that hits this — `filterType: FilterType.STRING`
 * throws "Cannot read property 'STRING' of undefined" and the story fails to render.
 *
 * The gallery itself is unaffected because it only uses `FilterType` in a type position
 * (`(key: FilterType) => ...`), which Babel strips along with the rest of the types.
 *
 * Widening the fix to the widget source would mean changing a shared package to suit this host app,
 * so it stays here. The values below are copied from
 * `packages/tools/piw-utils-internal/src/components/utils/FilterProvider.ts` and have to track it —
 * they are the keys `useMultipleFiltering` builds its state under, and a mismatch would silently
 * file a filter under a bucket the gallery never reads.
 *
 * Nothing imports a subpath of this package (`.../components/...` and friends), so re-exporting the
 * barrel is enough; if that changes, Metro's alias appends the subpath to this directory and it will
 * fail to resolve rather than fall through, which is the loud outcome and the one we want.
 */
export * from "../../../packages/tools/piw-utils-internal/dist/index.js";

export const FilterType = {
    STRING: "string",
    NUMBER: "number",
    ENUMERATION: "enum",
    DATE: "date"
};
