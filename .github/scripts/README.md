# GitHub Actions Scripts

This directory contains helper scripts used by the CI/CD pipeline.

## determine-widget-scope.sh

Determines which widgets and JS actions should be built and tested based on changed files or manual input.

### Usage

```bash
./determine-widget-scope.sh <event_name> <input_workspace> <before_commit> <current_commit>
```

### Outputs

| Output               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `scope`              | pnpm filter scope for building                       |
| `widgets`            | JSON array of widgets to BUILD                       |
| `widgets_to_test`    | JSON array of widgets to TEST (used for test matrix) |
| `js_actions_changed` | Boolean flag indicating if JS actions changed        |

### Pipeline Behavior

| Scenario               | Widgets Built   | Widgets Tested  | JS Actions Built | JS Actions Tested |
| ---------------------- | --------------- | --------------- | ---------------- | ----------------- |
| Only JS actions change | All             | None            | Yes              | Yes               |
| Only widgets change    | Changed only    | Changed only    | No               | No                |
| Both change            | Changed widgets | Changed widgets | Yes              | Yes               |
| Full run (`*-native`)  | All             | All             | Yes              | Yes               |
| Manual: `js-actions`   | All             | None            | Yes              | Yes               |

### Why build all widgets when only JS actions change?

The JS action tests run against a full test project that requires all widgets to be present. Without building all widgets, the test project would be incomplete and tests would fail.

## Other Scripts

-   **determine-nt-version.py** - Determines the Native Template version based on Mendix version
-   **mxbuild.Dockerfile** - Docker image for mxbuild
-   **setup-runtime.sh** - Sets up the Mendix runtime
-   **start-runtime-with-verification.sh** - Starts the runtime with health verification
