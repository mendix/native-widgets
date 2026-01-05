import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { ValueStatus } from "mendix";
import { useIsFocused } from "@react-navigation/native";
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from "react-native";
import { Camera, useCodeScanner, Code, useCameraDevice, CodeScannerFrame } from "react-native-vision-camera";
import BarcodeMask from "react-native-barcode-mask";
import Icon from "react-native-vector-icons/MaterialIcons";

import { BarcodeScannerProps } from "../typings/BarcodeScannerProps";
import { BarcodeScannerStyle, defaultBarcodeScannerStyle } from "./ui/styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = BarcodeScannerProps<BarcodeScannerStyle>;

export function BarcodeScanner(props: Props): ReactElement {
    const device = useCameraDevice("back");
    const isFocused = useIsFocused();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [viewSize, setViewSize] = useState<{ width: number; height: number } | null>(null);
    const [torchEnabled, setTorchEnabled] = useState(false);

    const styles = useMemo(() => flattenStyles(defaultBarcodeScannerStyle, props.style), [props.style]);

    // Ref to track the lock state
    const isLockedRef = useRef(false);

    const maskSize = useMemo(() => {
        const fallback = styles.mask.width ?? styles.mask.height ?? 200;
        if (!viewSize) {
            return fallback;
        }
        return Math.min(fallback, viewSize.width, viewSize.height);
    }, [styles.mask.width, styles.mask.height, viewSize]);

    const onCodeScanned = useCallback(
        (codes: Code[], frame: CodeScannerFrame) => {
            // Block if still in cooldown
            if (isLockedRef.current) {
                return;
            }

            let visibleCodes = codes;
            if (props.showMask && viewSize && frame?.width && frame?.height) {
                const roiViewX = Math.max(0, (viewSize.width - maskSize) / 2);
                const roiViewY = Math.max(0, (viewSize.height - maskSize) / 2);
                const scale = Math.max(viewSize.width / frame.width, viewSize.height / frame.height);
                const offsetX = (frame.width * scale - viewSize.width) / 2;
                const offsetY = (frame.height * scale - viewSize.height) / 2;

                visibleCodes = codes.filter(code => {
                    if (!code.corners || code.corners.length === 0) {
                        return false;
                    }
                    return code.corners.every(corner => {
                        const viewX = corner.x * scale - offsetX;
                        const viewY = corner.y * scale - offsetY;
                        return (
                            viewX >= roiViewX &&
                            viewX <= roiViewX + maskSize &&
                            viewY >= roiViewY &&
                            viewY <= roiViewY + maskSize
                        );
                    });
                });
            }

            if (
                props.barcode.status !== ValueStatus.Available ||
                visibleCodes.length === 0 ||
                visibleCodes.length > 1 ||
                !visibleCodes[0].value
            ) {
                return;
            }

            const { value } = visibleCodes[0];
            if (value !== props.barcode.value) {
                props.barcode.setValue(value);
            }

            executeAction(props.onDetect);

            // Lock further scans for 2 seconds
            isLockedRef.current = true;
            setTimeout(() => {
                isLockedRef.current = false;
            }, 2000);
        },
        [maskSize, props.barcode, props.onDetect, props.showMask, viewSize]
    );

    const codeScanner = useCodeScanner({
        codeTypes: [
            "qr",
            "aztec",
            "codabar",
            "code-39",
            "code-93",
            "code-128",
            "data-matrix",
            "ean-13",
            "ean-8",
            "upc-a",
            "upc-e"
        ],
        onCodeScanned
    });

    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextState => setAppState(nextState));
        return () => subscription.remove();
    }, []);

    const isActive = isFocused && appState === "active";
    const flashTop = useMemo(() => {
        if (!viewSize) {
            return 16;
        }
        const centerY = viewSize.height / 2;
        const preferred = centerY + maskSize / 2 + 16;
        return Math.min(preferred, viewSize.height - 60);
    }, [maskSize, viewSize]);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setViewSize({ width, height });
    }, []);

    return (
        <View style={styles.container} onLayout={onLayout}>
            {device && (
                <View style={defaultBarcodeScannerStyle.cameraWrapper}>
                    <Camera
                        testID={props.name}
                        style={defaultBarcodeScannerStyle.camera}
                        audio={false}
                        isActive={isActive}
                        resizeMode={"cover"}
                        torch={torchEnabled ? "on" : "off"}
                        device={device}
                        codeScanner={codeScanner}
                    />
                    {props.showFlashToggle && (
                        <TouchableOpacity
                            style={[defaultBarcodeScannerStyle.flashToggle, { top: flashTop }]}
                            onPress={() => setTorchEnabled(enabled => !enabled)}
                            accessibilityLabel="Toggle flash"
                            testID={`${props.name}-flash-toggle`}
                        >
                            <Icon name={torchEnabled ? "flash-on" : "flash-off"} color="#FFFFFF" size={22} />
                        </TouchableOpacity>
                    )}
                    {props.showMask && (
                        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            <BarcodeMask
                                edgeColor={styles.mask.color}
                                width={maskSize}
                                height={maskSize}
                                backgroundColor={styles.mask.backgroundColor}
                                showAnimatedLine={props.showAnimatedLine}
                            />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
