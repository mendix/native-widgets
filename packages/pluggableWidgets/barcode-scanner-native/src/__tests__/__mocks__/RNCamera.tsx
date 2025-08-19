import { Component, createElement } from "react";
import { View, ViewProps } from "react-native";
import { CameraProps } from "react-native-vision-camera";

export class RNCamera extends Component<CameraProps & ViewProps> {
    static constants = {
        Aspect: {},
        BarCodeType: {},
        Type: {},
        CaptureMode: {},
        CaptureTarget: {},
        CaptureQuality: {},
        Orientation: {},
        FlashMode: {},
        TorchMode: {}
    };

    render(): JSX.Element {
        return <View style={this.props.style} />;
    }
}
