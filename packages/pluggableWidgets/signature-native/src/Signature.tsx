import { mergeNativeStyles, extractStyles } from "@mendix/pluggable-widgets-tools";
import { executeAction } from "@mendix/piw-utils-internal";
import { ReactElement, useCallback, useRef } from "react";
import RNBlobUtil from "react-native-blob-util";
import { View, Text } from "react-native";
import SignatureScreen, { SignatureViewRef } from "react-native-signature-canvas";
import { Touchable } from "./components/Touchable";

import { SignatureProps } from "../typings/SignatureProps";
import { SignatureStyle, defaultSignatureStyle, webStyles } from "./ui/Styles";

export type Props = SignatureProps<SignatureStyle>;

function getCleanBase64(signature: string): string {
    return signature.includes(",") ? signature.split(",")[1].replace(/\s/g, "") : signature.replace(/\s/g, "");
}

async function base64ToBlob(signature: string): Promise<Blob> {
    const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/temp_signature_${Date.now()}.png`;

    try {
        await RNBlobUtil.fs.writeFile(tempPath, getCleanBase64(signature), "base64");

        const response = await fetch(`file://${tempPath}`);
        const blob = await response.blob();

        return blob;
    } catch (error) {
        console.error("Error uploading signature:", error);
        return Promise.reject(error);
    }
}

export function Signature(props: Props): ReactElement {
    const ref = useRef<SignatureViewRef>(null);
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

    const handleSignature = useCallback(
        async (base64signature: string): Promise<void> => {
            if (props.saveMode === "directImage") {
                try {
                    const blob = await base64ToBlob(base64signature);
                    (props.imageSource as any)?.setValue(blob);
                    executeAction(props.onSave);
                } catch (error) {
                    console.error("Failed to upload signature image:", error);
                }
                return;
            }

            props.imageAttribute?.setValue(base64signature);
            executeAction(props.onSave);
        },
        [props.imageAttribute, props.imageSource, props.onSave, props.saveMode]
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
