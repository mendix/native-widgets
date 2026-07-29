/**
 * Story-side stand-ins for the Mendix prop values a widget receives.
 *
 * The repo already has builders for these in `@mendix/piw-utils-internal`, but they are written
 * for Jest: `EditableValueBuilder` alone calls `jest.fn()` eight times, and `jest` does not exist
 * outside a test run. These are the same shapes with plain functions, plus the one behaviour a
 * story needs that a test does not — a `setValue` that actually re-renders, so the widget can be
 * driven interactively.
 */
import { ValueStatus } from "mendix";
import type { ActionValue, DynamicValue, EditableValue } from "mendix";
import { Big } from "big.js";

/** A read-only value that is already loaded — the common case for captions and icons. */
export function dynamicValue<T>(value: T): DynamicValue<T> {
    return { status: ValueStatus.Available, value } as DynamicValue<T>;
}

/**
 * An attribute the widget can both read and write.
 *
 * `onChange` is what makes a story interactive: the real runtime writes the value, sends it back
 * to the client, and re-renders. Passing a state setter here reproduces that round trip.
 */
export function editableValue<T extends string | boolean | Date | Big>(
    value: T,
    onChange?: (next: T) => void,
    // The runtime does not hand an attribute over already loaded. On a fresh page it arrives
    // Loading, with no value, and the real one follows a render or more later — so a story that
    // is always Available cannot exercise what the widget does while it waits.
    status: ValueStatus = ValueStatus.Available
): EditableValue<T> {
    return {
        isList: false,
        status,
        value: status === ValueStatus.Available ? value : undefined,
        displayValue: String(value),
        readOnly: !onChange,
        validation: undefined,
        formatter: {
            format: (v: T) => String(v),
            parse: (v: string) => ({ valid: true, value: v }),
            withConfig: () => undefined,
            getFormatPlaceholder: () => undefined,
            type: "number",
            config: {}
        },
        setValidator: () => undefined,
        setValue: (next: T) => onChange?.(next),
        setTextValue: () => undefined,
        setFormatter: () => undefined
    } as unknown as EditableValue<T>;
}

/** An action that reports it can run and logs when it does, so story buttons are observable. */
export function actionValue(label: string, onRun?: () => void): ActionValue {
    return {
        canExecute: true,
        isExecuting: false,
        execute: () => {
            // eslint-disable-next-line no-console
            console.log(`[story] action fired: ${label}`);
            onRun?.();
        }
    } as ActionValue;
}
