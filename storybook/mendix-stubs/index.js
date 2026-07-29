/**
 * Stub for the `mendix` module.
 *
 * The real module is injected by the Mendix client at runtime and is not published to npm, so
 * anything a widget imports from it has to be supplied here. Almost all of it is types, which
 * TypeScript erases — `ValueStatus` is the only value the widgets actually read at runtime.
 */
const ValueStatus = {
    Available: "available",
    Unavailable: "unavailable",
    Loading: "loading"
};

module.exports = { ValueStatus };
