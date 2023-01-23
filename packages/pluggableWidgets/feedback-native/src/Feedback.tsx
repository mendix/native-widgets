import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { Image, SvgImageStyle } from "mendix/components/native/Image";
import { Component, createElement, Fragment } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image as RNImage,
    InteractionManager,
    StyleProp,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Dialog from "react-native-dialog";
import { captureScreen } from "react-native-view-shot";
import { FeedbackProps } from "../typings/FeedbackProps";
import {
    activityIndicatorStyle,
    commentIcon,
    defaultFeedbackStyle,
    FeedbackStyle,
    floatingButtonContainer,
    imageStyle,
    processStyles,
    switchContainer
} from "./ui/styles";
import { sendToSprintr } from "./utils/sprintrApi";

type Status = "initial" | "takingScreenshot" | "todo" | "closingDialog" | "inprogress" | "done" | "error";

interface State {
    status: Status;
    nextStatus?: Status;
    sendScreenshot: boolean;
    feedbackMessage: string;
    screenshot: string;
    deviceHeight: number;
}

export class Feedback extends Component<FeedbackProps<FeedbackStyle>, State> {
    readonly state: State = {
        status: "initial",
        sendScreenshot: true,
        feedbackMessage: "",
        screenshot: "",
        deviceHeight: Dimensions.get("screen").height
    };

    private readonly onFeedbackButtonPressHandler = this.onFeedbackButtonPress.bind(this);
    private readonly onChangeTextHandler = this.onChangeText.bind(this);
    private readonly onScreenshotToggleChangeHandler = this.onScreenshotToggleValueChange.bind(this);
    private readonly onCancelHandler = this.onCancel.bind(this);
    private readonly onSendHandler = this.onSend.bind(this);
    private readonly styles = flattenStyles(defaultFeedbackStyle, this.props.style);
    private readonly processedStyles = processStyles(this.styles);
    private readonly dialogContainerProps = {
        contentStyle: this.processedStyles.dialogStyle,
        buttonSeparatorStyle: this.processedStyles.buttonSeparatorIos,
        footerStyle: this.processedStyles.borderIos,
        blurStyle: this.processedStyles.blurStyle,
        supportedOrientations: ["portrait", "landscape"]
    };

    componentDidMount() {
        Dimensions.addEventListener("change", this.updateDeviceHeight);
    }
    componentDidUpdate(_: Readonly<FeedbackProps<FeedbackStyle>>, prevState: Readonly<State>) {
        if (
            ["todo", "inprogress"].includes(prevState.status) &&
            this.state.status === "closingDialog" &&
            this.state.nextStatus
        ) {
            InteractionManager.runAfterInteractions(() =>
                this.setState(({ nextStatus }) => ({ status: nextStatus || "initial", nextStatus: undefined }))
            );
        }
    }

    render(): JSX.Element {
        return (
            <Fragment>
                {this.renderFloatingButton()}
                {this.renderTodoDialog()}
                {this.renderInProgressDialog()}
                {this.renderDoneDialog()}
                {this.renderErrorDialog()}
            </Fragment>
        );
    }

    private renderFloatingButton(): JSX.Element | null {
        return this.state.status === "initial" ? (
            <View
                accessible={this.props.accessible === "yes"}
                accessibilityLabel={this.props.screenReaderCaption?.value}
                accessibilityHint={this.props.screenReaderHint?.value}
                style={floatingButtonContainer(this.state.deviceHeight)}
            >
                <View style={this.styles.floatingButton}>
                    <TouchableOpacity onPress={this.onFeedbackButtonPressHandler} testID={`${this.props.name}$button`}>
                        {this.props.logo && this.props.logo.value ? (
                            <Image style={imageStyle as StyleProp<SvgImageStyle>} source={this.props.logo.value} />
                        ) : null}
                        <RNImage style={imageStyle} source={commentIcon} />
                    </TouchableOpacity>
                </View>
            </View>
        ) : null;
    }

    private renderTodoDialog(): JSX.Element {
        const { button, buttonDisabled, switchInput } = this.styles;
        const trackColor = { true: switchInput.trackColorOn || "", false: switchInput.trackColorOff || "" };
        const thumbColor = this.state.sendScreenshot ? switchInput.thumbColorOn : switchInput.thumbColorOff;
        const disabled = this.state.feedbackMessage.trim().length === 0;
        const sendButtonColor = disabled && buttonDisabled.color ? buttonDisabled.color : button.color;

        return (
            <Dialog.Container
                visible={this.state.status === "todo"}
                {...{
                    testID: `${this.props.name}$popup`
                }}
                {...this.dialogContainerProps}
            >
                <Dialog.Title style={this.styles.title}>Send Feedback</Dialog.Title>
                <TextInput
                    testID={`${this.props.name}$input`}
                    multiline
                    style={this.processedStyles.textAreaInputStyles}
                    value={this.state.feedbackMessage}
                    onChangeText={this.onChangeTextHandler}
                    placeholder="Type your feedback here"
                    {...this.processedStyles.textAreaInputProps}
                />
                {this.props.allowScreenshot && (
                    <View style={switchContainer}>
                        <Text style={this.styles.switchLabel}>Include Screenshot</Text>
                        <Switch
                            testID={`${this.props.name}$switch`}
                            style={this.processedStyles.switchInputStyles}
                            value={this.state.sendScreenshot}
                            onValueChange={this.onScreenshotToggleChangeHandler}
                            trackColor={trackColor}
                            thumbColor={thumbColor}
                        />
                    </View>
                )}
                <Dialog.Button
                    label="Cancel"
                    color={this.styles.button.color}
                    onPress={this.onCancelHandler}
                    testID={`${this.props.name}$cancel`}
                />
                <Dialog.Button
                    label="Send"
                    disabled={disabled}
                    color={sendButtonColor}
                    onPress={this.onSendHandler}
                    testID={`${this.props.name}$send`}
                />
            </Dialog.Container>
        );
    }

    private renderInProgressDialog(): JSX.Element {
        return (
            <Dialog.Container visible={this.state.status === "inprogress"} {...this.dialogContainerProps}>
                <Dialog.Title style={this.styles.title}>Sending...</Dialog.Title>
                <ActivityIndicator
                    color={this.styles.activityIndicator.color}
                    size="large"
                    style={activityIndicatorStyle}
                />
            </Dialog.Container>
        );
    }

    private renderDoneDialog(): JSX.Element {
        return (
            <Dialog.Container visible={this.state.status === "done"} {...this.dialogContainerProps}>
                <Dialog.Title style={this.styles.title}>Result</Dialog.Title>
                <Dialog.Description style={this.processedStyles.descriptionStyle} testID={`${this.props.name}$success`}>
                    Feedback successfully sent
                </Dialog.Description>
                <Dialog.Button
                    label="OK"
                    onPress={this.onCancelHandler}
                    color={this.styles.button.color}
                    testID={`${this.props.name}$success$ok`}
                />
            </Dialog.Container>
        );
    }

    private renderErrorDialog(): JSX.Element {
        return (
            <Dialog.Container visible={this.state.status === "error"} {...this.dialogContainerProps}>
                <Dialog.Title style={this.styles.title}>Result</Dialog.Title>
                <Dialog.Description style={this.processedStyles.descriptionStyle} testID={`${this.props.name}$error`}>
                    Error sending feedback
                </Dialog.Description>
                <Dialog.Button
                    label="OK"
                    onPress={this.onCancelHandler}
                    color={this.styles.button.color}
                    testID={`${this.props.name}$error$ok`}
                />
            </Dialog.Container>
        );
    }

    private onFeedbackButtonPress(): void {
        this.setState({ status: "takingScreenshot" }, async () => {
            const screenshot = await this.getScreenshot();
            this.setState({ status: "todo", screenshot });
        });
    }

    private onChangeText(value: string): void {
        this.setState({ feedbackMessage: value });
    }

    private onScreenshotToggleValueChange(value: boolean): void {
        this.setState({ sendScreenshot: value });
    }

    private onCancel(): void {
        this.setState({ status: "initial", nextStatus: undefined });
    }

    private async onSend(): Promise<void> {
        this.setState({ status: "closingDialog", nextStatus: "inprogress" });

        const success = await sendToSprintr({
            feedbackMsg: this.state.feedbackMessage,
            sprintrAppId: this.props.sprintrapp,
            screenshot: this.state.sendScreenshot ? this.state.screenshot : ""
        });

        this.setState({
            status: "closingDialog",
            nextStatus: success ? "done" : "error",
            feedbackMessage: "",
            screenshot: ""
        });
    }

    private async getScreenshot(): Promise<string> {
        if (!this.props.allowScreenshot) {
            return Promise.resolve("");
        }

        try {
            const uri = await captureScreen({
                format: "jpg",
                result: "base64",
                quality: 0.4
            });
            return uri.replace(/(\r\n|\n|\r)/gm, "");
        } catch {
            return "";
        }
    }

    private updateDeviceHeight = ({ screen: { height } }: { screen: { height: number } }) => {
        this.setState({
            deviceHeight: height
        });
    };
}
