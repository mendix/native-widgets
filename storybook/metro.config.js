const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");

const projectRoot = __dirname;
// Widget sources live in the repo above this host app, so Metro has to be told to watch there
// too — by default it only follows files under projectRoot.
const repoRoot = path.resolve(projectRoot, "..");

const stubbedPackages = {
    // `mendix` and its submodules are injected by the Mendix client at runtime. The copy in the
    // checkout's node_modules is a build-time stand-in whose index.js throws on require, so it has
    // to be redirected rather than merely shadowed. Only the package root is listed: subpaths are
    // appended, so mendix-stubs/ mirrors the real module's layout (components/native/Icon).
    mendix: path.join(projectRoot, "mendix-stubs"),
    // Workspace packages the widgets import. They are not installed here, so map them to the
    // checkout directly; both ship a built dist/ that postinstall keeps current.
    "@mendix/piw-utils-internal": path.join(repoRoot, "packages/tools/piw-utils-internal"),
    "@mendix/piw-native-utils-internal": path.join(repoRoot, "packages/tools/piw-native-utils-internal")
};

// Any file that is not part of this app — widget sources, and the piw-*-internal dist bundles they
// pull in — has its bare imports resolved from here instead. See resolveRequest below. Files under
// this app, including its own node_modules, keep resolving normally: npm nests, so packages such as
// @storybook/react-native have to walk up through their own directories to find their peers.
const hostAppOrigin = path.join(projectRoot, "index.js");
const isInsideHostApp = originModulePath =>
    typeof originModulePath === "string" && originModulePath.startsWith(projectRoot + path.sep);

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
    projectRoot,
    watchFolders: [repoRoot],
    resolver: {
        // Resolve from this app's node_modules, not the repo's: the repo pins versions for the
        // whole workspace (reanimated 3, safe-area-context 5.7) that conflict with the ones
        // Storybook requires. Hierarchical lookup stays on — Storybook nests its own copy of
        // @storybook/react and needs to walk up to find it — and since the repo uses pnpm there is
        // no hoisted root node_modules for a walk-up to reach by accident.
        nodeModulesPaths: [path.join(projectRoot, "node_modules")],
        extraNodeModules: stubbedPackages,
        // extraNodeModules alone is only a *fallback*, consulted after the normal walk up the
        // directory tree fails. The checkout has a hoisted node_modules/mendix, so the walk-up finds
        // it first and the stub is never reached. Redirect these names before resolution instead.
        resolveRequest: (context, moduleName, platform) => {
            for (const [name, root] of Object.entries(stubbedPackages)) {
                if (moduleName === name || moduleName.startsWith(`${name}/`)) {
                    return context.resolveRequest(context, path.join(root, moduleName.slice(name.length)), platform);
                }
            }

            // Widget source sits above this app, so resolving a bare import from where the file
            // lives walks up into the checkout's hoisted node_modules and hands the widget a second
            // copy of react — which fails at the first hook with "Cannot read property 'useState'
            // of null". Resolve as if the import came from this app instead, so widgets and
            // Storybook share one react, one react-native, one reanimated. The walk-up from here
            // still reaches the checkout, so a package this app does not install is found there.
            const isBare = !moduleName.startsWith(".") && !path.isAbsolute(moduleName);
            if (isBare && !isInsideHostApp(context.originModulePath)) {
                return context.resolveRequest({ ...context, originModulePath: hostAppOrigin }, moduleName, platform);
            }

            return context.resolveRequest(context, moduleName, platform);
        }
    }
};

module.exports = withStorybook(mergeConfig(getDefaultConfig(projectRoot), config), {
    enabled: true,
    configPath: path.join(projectRoot, ".storybook")
});
