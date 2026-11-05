import { Platform } from "react-native";

/**
 * Makes the Platform module behave as iOS for the spec that imports this first. The default test platform is
 * Android, and Platform.select of the Android implementation ignores OS, so select has to be replaced as well.
 */
const platform = Platform as unknown as { OS: string; select: (spec: Record<string, unknown>) => unknown };

platform.OS = "ios";
platform.select = spec => ("ios" in spec ? spec.ios : "native" in spec ? spec.native : spec.default);
