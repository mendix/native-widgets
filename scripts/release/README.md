# How to release widgets & modules to the Marketplace (`./marketplaceRelease.js`)

-   Native _modules_ published to Marketplace include Native Mobile Resources (named `mobile-resources-native` in code) and Nanoflow Commons (named `nanoflow-actions-native` in code). `nanoflow-actions-hybrid` is deprecated since MX9.

-   All Native pluggable widgets and some JavaScript actions are released to the Marketplace with Native Mobile Resources module. The module contains all widget `.mpk`s.

-   JS actions in `nanoflow-actions-native` are included in and released with Nanoflow Commons.

1. Make sure each changed widget has an appropriate change to it's `package.json` & `package.xml` (version bump) and changelog update before releasing.
2. In `CHANGELOG.md`, try to avoid using special characters like backtick[`] around the text while updating the changelog because it won't be able to parse the text; instead you can use square brackets[].
3. Each widget (e.g. `bar-chart-native`) or module's (e.g. `mobile-resources-native`) `minimumMXVersion` in `package.json` should match the `NativeComponentsTestProject` Mendix project Studio Pro version. You can pull the [repo](https://github.com/mendix/Native-Mobile-Resources) into Windows and double-click the `.mpr` in the root. You should have at least one Studio Pro installation for this to work.
4. On `master`, once all to-be-released changes are merged, add a tag to the commit you want to create a release from. The tag should
   be formatted like ${PackageName}-v${Major}.${Minor}.${Patch}. e.g. `mobile-resources-native-v3.0.0`.

The automation script uses the version part to bump the module's `package.json` version. Push this tag to GitHub, this will trigger a GitHub action.

1. That's it!
    - The content should now be released in GitHub.
    - The content should now be released in the MX Marketplace. Double check to verify.
    - Handle created PR updating module version and changelogs.

Note: regarding JS actions and widgets, the automation will delete existing JS action and widgets from the test project before copying over that which comes from the widget resources repository. This is useful to avoid retaining stale files/dependencies, for example, as the codebase changes and thus sourcecode files/dependencies change.
