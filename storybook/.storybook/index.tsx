/**
 * Turns the generated `storybook.requires` registration into a component the app can render.
 *
 * `storybook.requires.ts` is auto-generated and exports a `view`, not a component, so wrapping it
 * here keeps App.tsx free of generated-file details.
 */
import { view } from "./storybook.requires";

const StorybookUIRoot = view.getStorybookUI({});

export default StorybookUIRoot;
