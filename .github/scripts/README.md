# GitHub Actions Scripts

This directory contains helper scripts used by the CI/CD pipeline.

## determine-widget-scope.sh

Determines which widgets and JS actions should be built and tested, based on the
files changed in a PR or on manual `workflow_dispatch` input.

### Usage

```bash
./determine-widget-scope.sh <event_name> <input_workspace> <base_commit> <current_commit>
```

For a `pull_request`, `<base_commit>` is the PR base SHA
(`github.event.pull_request.base.sha`). The script diffs against the **merge-base** of
that and `<current_commit>`, so every commit in the PR is considered (not just the
latest). This needs full git history — the `scope` job checks out with `fetch-depth: 0`.
On `workflow_dispatch`, `<input_workspace>` drives the scope and the commit args are
ignored.

### Outputs

| Output               | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| `scope`              | pnpm filter scope (used by the unit-test step)                                   |
| `widgets`            | JSON array of widgets to BUILD                                                   |
| `widgets_to_test`    | JSON array of widgets to TEST (the test matrix)                                  |
| `js_actions_changed` | Boolean — whether JS actions changed                                             |
| `full_build`         | Boolean — true when every widget is (re)built; gates the dist cache restore/save |

### Build vs. test scope

`widgets_to_test` and `widgets` are deliberately **separate**:

-   A change anywhere under a widget folder marks it for **testing**.
-   Only a **build-affecting** change (anything outside the widget's `e2e/` folder, e.g.
    `src/**` or `package.json`) marks it for **building**. A change confined to `e2e/`
    (Maestro flows / screenshots) changes only the test, so the widget is tested against
    the test project's baseline `.mpk` instead of being rebuilt.

So `widgets` can be a strict subset of `widgets_to_test` (or empty while
`widgets_to_test` is non-empty, for an e2e-only PR).

### Pipeline Behavior

| Scenario                        | Widgets Built          | Widgets Tested  | JS Actions Built | JS Actions Tested |
| ------------------------------- | ---------------------- | --------------- | ---------------- | ----------------- |
| Only JS actions change          | All                    | None            | Yes              | Yes               |
| Only widget `src`/deps change   | Changed only           | Changed only    | No               | No                |
| Only widget `e2e/` changes      | None (use baseline)    | Changed only    | No               | No                |
| Both widgets and JS actions     | Build-affected widgets | Changed widgets | Yes              | Yes               |
| Full run (`*-native` / default) | All                    | All             | Yes              | Yes               |
| Manual: `js-actions`            | All                    | None            | Yes              | Yes               |

### Why build all widgets when only JS actions change?

The JS action tests run against a full test project that requires all widgets to be
present. Without building all widgets, the test project would be incomplete and tests
would fail.

## Other Scripts

-   **determine-nt-version.mjs** — resolves the Native Template release/branch from the
    Mendix version. Node ESM, no external deps (uses global `fetch` + a small version
    comparator); run with the runner's preinstalled `node`. Replaced the former
    `determine-nt-version.py` (the Python toolchain — `setup-python` / `pip install` —
    was dropped). Fails loudly rather than silently pinning `master`.
-   **mxbuild.Dockerfile** — Docker image for mxbuild.

> The Mendix runtime for the test jobs is produced as a **portable app package**
> (`mxbuild --target=portable-app-package`) in the `project` job and started by the
> `start-mendix-runtime` composite action, which waits for a real readiness probe.
> This replaced the old `setup-runtime.sh` / `start-runtime-with-verification.sh`
> scripts and the `m2ee-native.yml` config (which cloned m2ee-tools and downloaded
> the runtime from the CDN).
