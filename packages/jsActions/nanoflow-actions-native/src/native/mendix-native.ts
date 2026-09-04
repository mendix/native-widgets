// Single entry point for `mendix-native`.
//
// The package is provided at runtime by native-template (native code) and the AppDev client (JS),
// and is listed in `nativeExternal` in configs/jsactions/rollup.config.mjs so it is never bundled
// into the MPK. Nanoflow Commons actions also run on web, where the module does not resolve at all,
// so actions must reach it through the dynamic import below instead of a static one. Rollup inlines
// this module into each action bundle and leaves the `import()` untouched.
export type MendixNative = typeof import("mendix-native");

export const loadMendixNative = async (): Promise<MendixNative> => import("mendix-native");
