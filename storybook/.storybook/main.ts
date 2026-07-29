import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
    // Stories live next to this host app rather than inside the widget packages, so a widget's
    // published mpk stays free of Storybook files.
    stories: ["../stories/**/*.stories.?(ts|tsx|js|jsx)"],
    addons: []
};

export default main;
