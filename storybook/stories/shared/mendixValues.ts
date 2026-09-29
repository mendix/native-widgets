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
import type {
    ActionValue,
    DynamicValue,
    EditableValue,
    ListActionValue,
    ListAttributeValue,
    ListExpressionValue,
    ListValue,
    ListWidgetValue,
    ObjectItem
} from "mendix";
import type { FilterCondition } from "mendix/filters";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
        // Not every widget writes through `setValue`. Anything backed by a text input — and the web
        // view, which pushes a `postMessage` payload into an attribute — calls `setTextValue`
        // instead, so leaving this a no-op makes those stories look broken in a way that points at
        // the widget rather than at the stub. Parsing is the formatter's job in the real runtime; the
        // one above is a pass-through, which is correct for the string attributes this path is for.
        setTextValue: (next: string) => onChange?.(next as unknown as T),
        setFormatter: () => undefined
    } as unknown as EditableValue<T>;
}

/**
 * An enumeration attribute, for the widgets that render one option per member.
 *
 * The members live on the attribute as `universe`, and their labels come from `formatter.format` —
 * `editableValue` leaves both out because a plain string or number attribute has no universe. The
 * radio buttons and toggle buttons read them unguarded (`this.props.enum.universe!`), so passing a
 * plain editableValue to either renders nothing at all.
 */
export function enumValue(
    value: string,
    universe: string[],
    onChange?: (next: string) => void,
    // Captions, keyed by member. The runtime's formatter returns the caption a modeller typed in the
    // domain model, which is rarely the member name itself.
    captions: Record<string, string> = {}
): EditableValue<string> {
    return {
        ...editableValue(value, onChange),
        universe,
        formatter: { format: (v: string) => captions[v] ?? v }
    } as unknown as EditableValue<string>;
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

// == Data-source values
//
// A widget over a data source gets the rows in one prop (`ListValue`) and each column in another
// (`ListAttributeValue`, `ListExpressionValue`, `ListWidgetValue`, `ListActionValue`). The row prop
// carries only opaque `ObjectItem`s — an id and nothing else — and every column prop is a `get(item)`
// the widget calls per row. So the data itself lives nowhere in the props: the runtime closes over
// it, and a story has to do the same. `listValue` below builds the items and hands back the lookup
// the column builders need.

/** A row plus the fields a story wants to show for it, before it becomes an opaque ObjectItem. */
export type Row = Record<string, unknown>;

export interface ListSource {
    /** The prop itself, for `datasource` and friends. */
    value: ListValue;
    /** The original row behind an item, for the column builders below. */
    rowOf: (item: ObjectItem) => Row;
}

/**
 * A loaded data source over the given rows.
 *
 * The paging and sorting setters are no-ops rather than throwing: a widget may call `setLimit` on
 * mount (the gallery does, to size its first page), and there is no second render coming to honour
 * it, but failing the call outright would break a story that is otherwise fine. `hasMoreItems` is
 * a parameter because the load-more affordances key off it, not off the item count.
 */
export function listValue(rows: Row[], options: { status?: ValueStatus; hasMoreItems?: boolean } = {}): ListSource {
    const { status = ValueStatus.Available, hasMoreItems = false } = options;
    const items: ObjectItem[] = rows.map((_, index) => ({ id: `story-item-${index}` } as unknown as ObjectItem));
    const byId = new Map(items.map((item, index) => [item.id, rows[index]]));

    const value = {
        status,
        // A Loading list has no items at all — not an empty array — and widgets branch on that.
        items: status === ValueStatus.Available ? items : undefined,
        totalCount: rows.length,
        hasMoreItems,
        offset: 0,
        limit: Number.POSITIVE_INFINITY,
        sortOrder: [],
        filter: undefined,
        setOffset: () => undefined,
        setLimit: () => undefined,
        setSortOrder: () => undefined,
        setFilter: () => undefined,
        requestTotalCount: () => undefined,
        reload: () => undefined
    } as unknown as ListValue;

    return { value, rowOf: item => byId.get(item.id) ?? {} };
}

/**
 * A data source that honours `setLimit` and `setFilter` instead of ignoring them.
 *
 * `listValue` above is a snapshot: its setters are no-ops, which is right for a widget that only
 * reads its rows. The gallery is not that widget — it pages (`setLimit`) and filters (`setFilter`)
 * by writing to the source and waiting for the runtime to hand back a new one. With no-op setters a
 * Load more button does nothing and a text filter filters nothing, so the story would be showing the
 * stub's limits rather than the widget's behaviour.
 *
 * A hook rather than a function because the state has to survive a re-render: the widget re-reads
 * `props.datasource` every time, so the source object it gets must carry the limit and filter that
 * were set on the previous one.
 *
 * `limit` starts at `POSITIVE_INFINITY` deliberately. That is what the runtime hands over, and the
 * gallery's first effect keys off it (`if (limit === POSITIVE_INFINITY) setLimit(pageSize)`) — so
 * starting at `pageSize` would skip the widget's own paging setup rather than exercise it.
 */
export function useListValue(
    rows: Row[],
    options: { pageSize?: number; status?: ValueStatus } = {}
): ListSource & { visible: Row[] } {
    const { pageSize, status = ValueStatus.Available } = options;

    // Built once per row array so a row keeps its id across filtering and paging — the gallery keys
    // its list on `item.id`, and regenerating ids would remount every visible row on each keystroke.
    const items = useMemo(
        () => rows.map((_, index) => ({ id: `story-item-${index}` } as unknown as ObjectItem)),
        [rows]
    );
    const byId = useMemo(() => new Map(items.map((item, index) => [item.id, rows[index]])), [items, rows]);

    const [limit, setLimitState] = useState(Number.POSITIVE_INFINITY);
    const [filter, setFilterState] = useState<FilterCondition | undefined>(undefined);

    // The gallery calls `setFilter` from its render body, not from an effect, so applying it
    // synchronously would be a state update on this component while another one renders. Deferring
    // to a microtask turns it into an ordinary update; the key comparison is what stops the
    // render → set → render loop that would otherwise follow, since the call repeats every render.
    const appliedFilter = useRef<string | undefined>(undefined);
    const setFilter = useCallback((next?: FilterCondition) => {
        const key = next ? JSON.stringify(next) : undefined;
        if (key === appliedFilter.current) {
            return;
        }
        appliedFilter.current = key;
        void Promise.resolve().then(() => setFilterState(next));
    }, []);

    const setLimit = useCallback((next: number) => setLimitState(current => (current === next ? current : next)), []);

    const matching = useMemo(
        () => (filter ? items.filter(item => matchesCondition(filter, byId.get(item.id) ?? {})) : items),
        [filter, items, byId]
    );

    const value = useMemo(() => {
        const shown = matching.slice(0, limit);
        return {
            status,
            items: status === ValueStatus.Available ? shown : undefined,
            totalCount: matching.length,
            hasMoreItems: shown.length < matching.length,
            offset: 0,
            limit,
            sortOrder: [],
            filter,
            setOffset: () => undefined,
            setLimit,
            setSortOrder: () => undefined,
            setFilter,
            requestTotalCount: () => undefined,
            reload: () => undefined
        } as unknown as ListValue;
    }, [matching, limit, status, filter, setLimit, setFilter]);

    return {
        value,
        rowOf: item => byId.get(item.id) ?? {},
        // What is on screen, so a story can print "3 of 12" beside the widget.
        visible: (((value as unknown as { items?: ObjectItem[] }).items ?? []) as ObjectItem[]).map(
            item => byId.get(item.id) ?? {}
        )
    };
}

/**
 * Evaluates a `FilterCondition` against one row — the part the Mendix server does.
 *
 * A filter widget builds a condition and hands it to the data source; the runtime turns it into a
 * query and sends back matching rows. There is no server here, so the condition has to be
 * interpreted client-side. The attribute is found by reversing `listAttributeValue`'s id, which is
 * why that prefix is fixed.
 *
 * Unsupported condition types return `true` rather than `false`: a story that builds a condition
 * this cannot read should show all its rows, not silently show none.
 */
function matchesCondition(condition: FilterCondition, row: Row): boolean {
    const node = condition as any;
    if (node.type !== "function") {
        return true;
    }
    switch (node.name) {
        case "and":
            return (node.args as FilterCondition[]).every(arg => matchesCondition(arg, row));
        case "or":
            return (node.args as FilterCondition[]).some(arg => matchesCondition(arg, row));
        case "not":
            return !matchesCondition(node.arg as FilterCondition, row);
        default:
            break;
    }

    const field =
        node.arg1?.type === "attribute" ? String(node.arg1.attributeId).replace(/^story-attribute-/, "") : undefined;
    if (field === undefined) {
        return true;
    }

    const left = row[field];
    const right = node.arg2?.type === "literal" ? node.arg2.value : undefined;
    // `empty`/`notEmpty` come through as `=`/`!=` against an undefined literal, which is how the
    // gallery text filter spells them.
    const text = left === undefined || left === null ? "" : String(left).toLowerCase();
    const term = right === undefined || right === null ? "" : String(right).toLowerCase();
    const primitive = (value: unknown): any => (value instanceof Date ? value.getTime() : normaliseBig(value));

    switch (node.name) {
        case "contains":
            return text.includes(term);
        case "starts-with":
            return text.startsWith(term);
        case "ends-with":
            return text.endsWith(term);
        case "=":
            return right === undefined ? left === undefined || left === "" : primitive(left) === primitive(right);
        case "!=":
            return right === undefined ? !(left === undefined || left === "") : primitive(left) !== primitive(right);
        case ">":
            return primitive(left) > primitive(right);
        case ">=":
            return primitive(left) >= primitive(right);
        case "<":
            return primitive(left) < primitive(right);
        case "<=":
            return primitive(left) <= primitive(right);
        default:
            return true;
    }
}

/** `Big` compares by reference, so numeric literals have to come out as numbers. */
function normaliseBig(value: unknown): unknown {
    return value instanceof Big ? Number(value.toString()) : value;
}

/**
 * A column read off each row as an editable attribute — the shape a sortable/filterable field has.
 *
 * `format` overrides how the value renders. Most widgets never look at an attribute's formatter, but
 * the charts do: they take `x.formatter.format` off the first data point and hand it to Victory as the
 * axis `tickFormat`. The default here is `String(value)`, which turns a Date tick into
 * "Mon Jul 01 2024 00:00:00 GMT+0200 (Central European Summer Time)" — so a time-scale chart is
 * unreadable without this, and that is a property of the stub rather than of the widget.
 *
 * Typed `any` rather than `T` on purpose: what arrives is an axis tick, not the attribute's own value.
 * Victory picks the ticks itself, and the widget wraps a numeric one in `Big` before calling — so a
 * column of plain numbers gets `Big`s, and a column of category strings on a linear scale gets `Big`s
 * too, for positions no row ever held. A formatter written against `T` would typecheck and then break
 * on those.
 */
export function listAttributeValue<T extends string | boolean | Date | Big>(
    source: ListSource,
    field: string,
    format?: (value: any) => string
): ListAttributeValue<T> {
    return {
        // `id` is what the filter builders compare against, so it has to be stable per column.
        id: `story-attribute-${field}`,
        isList: false,
        type: "String",
        filterable: true,
        sortable: true,
        universe: undefined,
        formatter: undefined,
        get: (item: ObjectItem) => {
            const value = editableValue(source.rowOf(item)[field] as T);
            return format ? { ...value, formatter: { ...value.formatter, format } } : value;
        }
    } as unknown as ListAttributeValue<T>;
}

/** A column computed per row — a caption template, a colour, an icon name. */
export function listExpressionValue<T>(source: ListSource, compute: (row: Row) => T): ListExpressionValue<any> {
    return {
        get: (item: ObjectItem) => dynamicValue(compute(source.rowOf(item)))
    } as unknown as ListExpressionValue<any>;
}

/** The `content` prop of a repeating widget: whatever should be rendered inside each row. */
export function listWidgetValue(source: ListSource, render: (row: Row) => ReactNode): ListWidgetValue {
    return { get: (item: ObjectItem) => render(source.rowOf(item)) };
}

/** A per-row action, e.g. onClick on a gallery item. Logs which row was hit. */
export function listActionValue(source: ListSource, label: string, describe: (row: Row) => string): ListActionValue {
    return {
        get: (item: ObjectItem) => actionValue(`${label} (${describe(source.rowOf(item))})`)
    } as unknown as ListActionValue;
}
