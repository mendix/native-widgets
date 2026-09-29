import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
    // Stories live next to this host app rather than inside the widget packages, so a widget's
    // published mpk stays free of Storybook files. Under ../stories they mirror the repo's own
    // packages/ layout — see stories/README.md. The glob is recursive, so adding a directory needs
    // no change here, but `npm run storybook-generate` has to be re-run to pick up new files.
    stories: ["../stories/**/*.stories.?(ts|tsx|js|jsx)"],
    addons: []
};

export default main;
