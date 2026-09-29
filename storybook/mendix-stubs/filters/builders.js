/**
 * Stub for `mendix/filters/builders`.
 *
 * Filter builders are pure constructors: each returns a plain object describing a condition, which
 * the Mendix client later translates into a data-source query. The gallery widgets both build
 * conditions with these and read them back apart again (see gallery-native's utils/filters.ts), so
 * the shapes here follow the published typings exactly — `{ type: "function", name, arg1, arg2 }`
 * for binary conditions, `{ type: "function", name, args }` for and/or, `{ type: "literal", value,
 * valueType }` for literals. Nothing is validated: the real builders throw on a bad argument, but a
 * story that passes one would be a broken story either way, and throwing here would take the whole
 * Storybook down at startup.
 */
const binary = name => (arg1, arg2) => ({ type: "function", name, arg1, arg2 });
const multiary =
    name =>
    (...args) => ({ type: "function", name, args });

const literalType = value => {
    if (value === undefined) {
        return "undefined";
    }
    if (value instanceof Date) {
        return "DateTime";
    }
    switch (typeof value) {
        case "string":
            return "string";
        case "boolean":
            return "boolean";
        default:
            // big.js instances and ObjectItem/GUIDs both land here; Numeric is the common case.
            return Array.isArray(value) ? "ReferenceSet" : "Numeric";
    }
};

module.exports = {
    attribute: attributeId => ({ type: "attribute", attributeId }),
    association: associationId => ({ type: "association", associationId }),
    literal: value => ({ type: "literal", value, valueType: literalType(value) }),
    empty: () => ({ type: "literal", value: undefined, valueType: "undefined" }),

    and: multiary("and"),
    or: multiary("or"),
    not: arg => ({ type: "function", name: "not", arg }),

    equals: binary("="),
    notEqual: binary("!="),
    greaterThan: binary(">"),
    greaterThanOrEqual: binary(">="),
    lessThan: binary("<"),
    lessThanOrEqual: binary("<="),
    contains: binary("contains"),
    startsWith: binary("starts-with"),
    endsWith: binary("ends-with"),

    dayEquals: binary("day:="),
    dayNotEqual: binary("day:!="),
    dayGreaterThan: binary("day:>"),
    dayGreaterThanOrEqual: binary("day:>="),
    dayLessThan: binary("day:<"),
    dayLessThanOrEqual: binary("day:<=")
};
