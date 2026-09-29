/**
 * Stories for the `geolocation` nanoflow actions.
 *
 * `GetStraightLineDistance` is pure arithmetic and works anywhere. The rest need native modules, all
 * of which this host app links:
 *
 *   - GetCurrentLocation / GetCurrentLocationMinimumAccuracy → @react-native-community/geolocation
 *   - RequestLocationPermission                              → react-native-permissions
 *   - Geocode / ReverseGeocode                                → react-native-geocoder
 *
 * react-native-geocoder needs the patch in ./patches to build: it is unmaintained and its
 * build.gradle uses the `compile` configuration that Gradle 7 removed. The patch is the same one
 * mendix/make-it-native carries, applied by scripts/apply-patches.js on postinstall.
 *
 * Actions are required inside the case thunks rather than imported at the top of the file. Storybook
 * evaluates every story module at app startup, so a module-scope import of anything whose native
 * side is missing would take the whole Storybook down instead of failing one row — react-native-
 * permissions in particular calls TurboModuleRegistry.getEnforcing while being imported, which is
 * exactly what happened before these packages were linked.
 */
import type { StoryObj } from "@storybook/react-native";
import { Big } from "big.js";
import { ActionRunner } from "../../shared/ActionRunner";

const meta = { title: "Nanoflow Commons/Geolocation" };
export default meta;

const ACTIONS = "../../../../packages/jsActions/nanoflow-actions-native/src";

// Amsterdam and Rotterdam: about 57.6 km apart, a distance that is easy to sanity-check.
const AMSTERDAM = { lat: new Big("52.3676"), long: new Big("4.9041") };
const ROTTERDAM = { lat: new Big("51.9244"), long: new Big("4.4777") };

export const StraightLineDistance: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "The one action in this group with no device dependency: a haversine distance between " +
                "two points, in the requested unit. Amsterdam → Rotterdam is roughly 57.6 km, so the " +
                "three unit cases should read about 57.6, 35.8 and 31.1. The identical-points case is " +
                "the one worth watching — it must be exactly 0 rather than a rounding artefact."
            }
            cases={[
                {
                    label: "GetStraightLineDistance — km",
                    note: "Default unit; expect ≈57.6.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetStraightLineDistance`).GetStraightLineDistance(
                            AMSTERDAM.lat,
                            AMSTERDAM.long,
                            ROTTERDAM.lat,
                            ROTTERDAM.long
                        )
                },
                {
                    label: "GetStraightLineDistance — statute miles",
                    note: "≈35.8.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetStraightLineDistance`).GetStraightLineDistance(
                            AMSTERDAM.lat,
                            AMSTERDAM.long,
                            ROTTERDAM.lat,
                            ROTTERDAM.long,
                            "STATUTE_MILE"
                        )
                },
                {
                    label: "GetStraightLineDistance — nautical miles",
                    note: "≈31.1.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetStraightLineDistance`).GetStraightLineDistance(
                            AMSTERDAM.lat,
                            AMSTERDAM.long,
                            ROTTERDAM.lat,
                            ROTTERDAM.long,
                            "NAUTICAL_MILE"
                        )
                },
                {
                    label: "GetStraightLineDistance — same point",
                    note: "Expect exactly 0.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetStraightLineDistance`).GetStraightLineDistance(
                            AMSTERDAM.lat,
                            AMSTERDAM.long,
                            AMSTERDAM.lat,
                            AMSTERDAM.long
                        )
                },
                {
                    label: "GetStraightLineDistance — antipodes",
                    note: "Half the earth's circumference, ≈20015 km — the upper bound of the formula.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetStraightLineDistance`).GetStraightLineDistance(
                            new Big("0"),
                            new Big("0"),
                            new Big("0"),
                            new Big("180")
                        )
                },
                {
                    label: "GetStraightLineDistance — unknown unit",
                    expectReject: true,
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetStraightLineDistance`).GetStraightLineDistance(
                            AMSTERDAM.lat,
                            AMSTERDAM.long,
                            ROTTERDAM.lat,
                            ROTTERDAM.long,
                            "FURLONG" as never
                        )
                }
            ]}
        />
    )
};

/**
 * The device-dependent actions.
 *
 * These run against real native modules, so the outcome depends on the device: whether location
 * permission is granted, and whether the emulator has a fix. Tap RequestLocationPermission first —
 * the two GetCurrentLocation cases reject with "Location permission was not granted" until it
 * returns true, which is the action's own guard doing its job rather than a broken story.
 *
 * Only the guard cases are marked `expectReject`, because only they have a single correct answer.
 * The rest are left unmarked: a location that resolves and a permission that is refused are both
 * legitimate, and marking either as expected would hide the other.
 */
export const DeviceLocation: StoryObj = {
    render: () => (
        <ActionRunner
            description={
                "Live actions against the device, so what you see depends on the device. Tap " +
                "RequestLocationPermission first: on Android it checks, then asks, and resolves false " +
                "if you decline — false is a result, not a failure. GetCurrentLocation then needs an " +
                "actual fix, so on an emulator set a location in Extended controls (or run " +
                "`adb emu geo fix <long> <lat>`) or it will time out. Geocode and ReverseGeocode call " +
                "Google's geocoding backend through the native module, so they need Play Services and " +
                "network: on a bare emulator they reject with DEADLINE_EXCEEDED, which means the " +
                "module was reached and the lookup did not come back."
            }
            cases={[
                {
                    label: "RequestLocationPermission",
                    note: "Resolves true if granted, false if declined. Shows the OS prompt on first tap.",
                    run: () => require(`${ACTIONS}/geolocation/RequestLocationPermission`).RequestLocationPermission()
                },
                {
                    label: "GetCurrentLocation",
                    note: "Needs permission plus a fix; 10s timeout, high accuracy.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetCurrentLocation`).GetCurrentLocation(
                            new Big(10000),
                            new Big(0),
                            true
                        )
                },
                {
                    label: "GetCurrentLocationMinimumAccuracy",
                    note: "Watches until accuracy is within 50m, then falls back to the last reading on timeout.",
                    run: () =>
                        require(`${ACTIONS}/geolocation/GetCurrentLocationMinimumAccuracy`).GetCurrentLocationMinimumAccuracy(
                            new Big(10000),
                            new Big(0),
                            true,
                            50
                        )
                },
                {
                    label: "Geocode — address to coordinates",
                    note: "Needs Play Services and network; DEADLINE_EXCEEDED on a bare emulator.",
                    run: () => require(`${ACTIONS}/geolocation/Geocode`).Geocode("Gustav Mahlerplein 2, Amsterdam")
                },
                {
                    label: "ReverseGeocode — coordinates to address",
                    note: "Same module, the other direction.",
                    run: () => require(`${ACTIONS}/geolocation/ReverseGeocode`).ReverseGeocode("52.3376", "4.8916")
                },
                {
                    label: "Geocode — missing address",
                    note: "Rejects on its own guard, before touching any module.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/geolocation/Geocode`).Geocode(undefined)
                },
                {
                    label: "ReverseGeocode — missing longitude",
                    note: "Also guard-only: rejects before reaching the native module.",
                    expectReject: true,
                    run: () => require(`${ACTIONS}/geolocation/ReverseGeocode`).ReverseGeocode("52.3376", undefined)
                }
            ]}
        />
    )
};
