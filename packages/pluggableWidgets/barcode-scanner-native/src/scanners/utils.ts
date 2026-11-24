import { DetectedCode, ViewBounds } from "./types";

/**
 * Generic helper to build DetectedCode array from platform-specific scanner results.
 * Filters out items without values and applies the provided view bounds getter.
 */
export function buildDetectedCodes<T>(
    items: T[],
    getValue: (item: T) => string | null | undefined,
    getViewBounds: (item: T) => () => ViewBounds | undefined
): DetectedCode[] {
    const codes: DetectedCode[] = [];
    for (const item of items) {
        const value = getValue(item);
        if (!value) {
            continue;
        }
        codes.push({
            value,
            getViewBounds: getViewBounds(item)
        });
    }
    return codes;
}
