// Firebase pods need static frameworks on iOS, which React Native's own pods don't build under.
// Only the Notifications story uses it, so it is left out of the iOS app.
module.exports = {
    dependencies: {
        "@react-native-firebase/app": { platforms: { ios: null } },
        "@react-native-firebase/messaging": { platforms: { ios: null } }
    }
};
