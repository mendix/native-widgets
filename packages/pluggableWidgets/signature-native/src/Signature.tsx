import { mergeNativeStyles, extractStyles } from "@mendix/pluggable-widgets-tools";
import { executeAction } from "@mendix/piw-utils-internal";
import { ReactElement, useCallback, useRef } from "react";
import { View, Text } from "react-native";
import SignatureScreen, { SignatureViewRef } from "react-native-signature-canvas";
import { Touchable } from "./components/Touchable";

import { SignatureProps } from "../typings/SignatureProps";
import { SignatureStyle, defaultSignatureStyle, webStyles } from "./ui/Styles";

export type Props = SignatureProps<SignatureStyle>;

async function dataUriToFile(dataUri: string): Promise<File> {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    return new File([blob], `signature_${Date.now()}.png`, { type: "image/png", lastModified: Date.now() });
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
        async (dataUri: string): Promise<void> => {
            try {
                /*
                if (props.imageSource.status !== "available" || props.imageSource.readOnly) {
                 return;
                } This check needs to add once the EditableImageValue<NativeImage> is released from widget tools
                */
                const blob = await dataUriToFile(dataUri);
                (props.imageSource as any)?.setValue(blob); // as any hack needs to remove once the EditableImageValue<NativeImage> is released from widget tools
                props.hasSignatureAttribute?.setValue(true);
                executeAction(props.onSignEndAction);
            } catch (error) {
                console.error("Signature: failed to save image", error);
            }
        },
        [props.imageSource, props.hasSignatureAttribute, props.onSignEndAction]
    );

    return (
        <View style={[{ flex: 1 }, containerStyles]} testID={props.name}>
            <SignatureScreen
                ref={ref}
                autoClear
                onEmpty={() => executeAction(props.onEmpty)}
                onEnd={() => executeAction(props.onEnd)}
                onOK={handleSignature}
                onClear={() => {
                    props.hasSignatureAttribute?.setValue(false);
                    executeAction(props.onClear);
                }}
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
