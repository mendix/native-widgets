module.exports = {
    presets: ["module:@react-native/babel-preset"],
    plugins: [
        // Reanimated 4 (a Storybook peer, used by its UI) only works with the worklets plugin
        // registered; without it the library fails to initialise and everything that depends on it
        // exports undefined — which surfaces as "Cannot read property 'BottomSheetModalProvider' of
        // undefined" from @gorhom/bottom-sheet inside @storybook/react-native-ui.
        // Must stay last: it has to see the fully-transformed output.
        "react-native-worklets/plugin"
    ]
};
