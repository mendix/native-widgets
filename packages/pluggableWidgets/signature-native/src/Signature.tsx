import { mergeNativeStyles, extractStyles } from "@mendix/pluggable-widgets-tools";
import { executeAction } from "@mendix/piw-utils-internal";
import { ReactElement, useCallback, useEffect, useRef } from "react";
import { View, Text, NativeModules } from "react-native";
import SignatureScreen, { SignatureViewRef } from "react-native-signature-canvas";
import { Touchable } from "./components/Touchable";
import RNBlobUtil from "react-native-blob-util";

import { SignatureProps } from "../typings/SignatureProps";
import { SignatureStyle, defaultSignatureStyle, webStyles } from "./ui/Styles";

export type Props = SignatureProps<SignatureStyle>;

async function dataUriToBlob(base64: string): Promise<{ blob: File; tempPath: string }> {
    // Remove data URI prefix if present (e.g., "data:image/png;base64,")
    let cleanBase64 = base64;
    if (base64.includes(",")) {
        cleanBase64 = base64.split(",")[1];
    }

    // Remove any whitespace/newlines
    cleanBase64 = cleanBase64.replace(/\s/g, "");

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error("Invalid base64 format");
    }

    // Create a temporary file path
    const fileName = `image_${Date.now()}.png`;
    const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;

    // Write Base64 data to a temporary file
    await RNBlobUtil.fs.writeFile(tempPath, cleanBase64, "base64");

    // Read the file into the native blob store so offline mode works:
    // NativeFileBackend.storeFile calls NativeFileSystem.save(blob.data, path)
    // and blob.close() — a plain object has no .data getter or .close(), which
    // crashes iOS via [NSInvocation invokeWithTarget:].
    const nativeBlob = await NativeModules.MxFileSystem.read(tempPath.replace("file://", ""));
    // Normalize: MxFileSystem.read may return 'length' instead of 'size'.
    const blobData = { ...(nativeBlob as any) };
    if (blobData.size === undefined && blobData.length !== undefined) {
        blobData.size = blobData.length;
    }
    const blob = new Blob();
    Object.assign(blob, {
        data: blobData,
        name: fileName,
        lastModified: Date.now()
    });
    // Set nativePayload so the patched FormData.prototype.append in NativeFileBackend
    // replaces the blob value with { uri, name, type } for online uploads. The patch
    // reads the third append() argument (fileName) and writes it onto nativePayload.name,
    // which FormData.getParts() uses as the Content-Disposition filename.
    (blob as any).nativePayload = { uri: `file://${tempPath}`, name: fileName, type: "image/png" };
    const fileBlob = blob as unknown as File;
    return { blob: fileBlob, tempPath };
}

export function Signature(props: Props): ReactElement {
    const ref = useRef<SignatureViewRef>(null);
    const pendingTempPathsRef = useRef<string[]>([]);
    const wasExecutingRef = useRef<boolean>(false);
    const styles = mergeNativeStyles(defaultSignatureStyle, props.style);
    const [signatureProps, containerStyles] = extractStyles(styles.container, ["penColor", "backgroundColor"]);
    const [buttonClearContainerProps, buttonClearContainerStyles] = extractStyles(styles.buttonClearContainer, [
        "rippleColor",
        "activeOpacity",
        "underlayColor"
    ]);
    const [buttonSaveContainerProps, buttonSaveContainerStyles] = extractStyles(styles.buttonSaveContainer, [
        "rippleColor",
        "activeOpacity",
        "underlayColor"
    ]);
    const buttonCaptionClear = props.buttonCaptionClear?.value ?? "Clear";
    const buttonCaptionSave = props.buttonCaptionSave?.value ?? "Save";

    // Clean up temp files after onSignEndAction completes. We cannot await action.execute() (it returns void),
    // so we observe the isExecuting transition (true → false) as the signal that the action — including the
    // file upload triggered by publish("submit") inside callNanoflow/callMicroflow/saveChanges — has finished.
    useEffect(() => {
        const isExecuting = props.onSignEndAction?.isExecuting ?? false;
        if (wasExecutingRef.current && !isExecuting && pendingTempPathsRef.current.length > 0) {
            const paths = pendingTempPathsRef.current.splice(0);
            paths.forEach(tempPath =>
                RNBlobUtil.fs.unlink(tempPath).catch(e => console.info("Temp file cleanup failed:", e))
            );
        }
        wasExecutingRef.current = isExecuting;
    }, [props.onSignEndAction?.isExecuting]);

    const handleSignature = useCallback(
        async (dataUri: string): Promise<void> => {
            let tempPath: string | undefined;
            try {
                if (props.imageSource.readOnly) {
                    return;
                }
                const result = await dataUriToBlob(dataUri);
                tempPath = result.tempPath;
                pendingTempPathsRef.current.push(tempPath);
                props.imageSource.setValue(result.blob);
                executeAction(props.onSignEndAction);
            } catch (error) {
                if (tempPath) {
                    const idx = pendingTempPathsRef.current.indexOf(tempPath);
                    if (idx !== -1) {
                        pendingTempPathsRef.current.splice(idx, 1);
                    }
                    RNBlobUtil.fs.unlink(tempPath).catch(e => console.info("Temp file cleanup failed:", e));
                }
                console.error("Signature: failed to save image", error);
            }
        },
        [props.imageSource, props.onSignEndAction]
    );

    return (
        <View style={[{ flex: 1 }, containerStyles]} testID={props.name}>
            <SignatureScreen
                ref={ref}
                autoClear
                onEmpty={() => executeAction(props.onEmpty)}
                onEnd={() => executeAction(props.onEnd)}
                onOK={handleSignature}
                onClear={() => executeAction(props.onClear)}
                webStyle={webStyles}
                {...signatureProps}
            />
            <View style={styles.buttonWrapper}>
                <Touchable
                    testID={`${props.name}$ClearButton$Touchable`}
                    onPress={() => ref.current?.clearSignature()}
                    accessible={false}
                    style={buttonClearContainerStyles}
                    {...buttonClearContainerProps}
                >
                    <Text testID={`${props.name}$ClearButton$caption`} style={styles.buttonClearCaption}>
                        {buttonCaptionClear}
                    </Text>
                </Touchable>
                <Touchable
                    testID={`${props.name}$SaveButton$Touchable`}
                    onPress={() => ref.current?.readSignature()}
                    accessible={false}
                    style={buttonSaveContainerStyles}
                    {...buttonSaveContainerProps}
                >
                    <Text testID={`${props.name}$SaveButton$caption`} style={styles.buttonSaveCaption}>
                        {buttonCaptionSave}
                    </Text>
                </Touchable>
            </View>
        </View>
    );
}
