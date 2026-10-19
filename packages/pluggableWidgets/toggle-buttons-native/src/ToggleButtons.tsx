import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { Component, JSX } from "react";
import { Text, View } from "react-native";

import { ToggleButtonsProps } from "../typings/ToggleButtonsProps";
import { defaultToggleButtonsStyle, ToggleButtonsStyle } from "./ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";
import { SegmentedControl } from "./components/SegmentedControl";

export type Props = ToggleButtonsProps<ToggleButtonsStyle>;

export class ToggleButtons extends Component<Props> {
    private readonly onChangeHandler = this.onChange.bind(this);
    private readonly styles = flattenStyles(defaultToggleButtonsStyle, this.props.style);

    private get universe(): string[] {
        // As this property can only be an Enum we know that universe is defined
        return this.props.enum.universe!;
    }

    render(): JSX.Element {
        const selectedIndex = this.universe.indexOf(this.props.enum.value!);
        const captions = this.universe.map(name => this.props.enum.formatter.format(name));
        const enabled = this.props.editable !== "never" && !this.props.enum.readOnly;

        return (
            <View style={enabled ? this.styles.container : this.styles.containerDisabled} testID={this.props.name}>
                <SegmentedControl
                    values={captions}
                    selectedIndex={selectedIndex}
                    enabled={enabled}
                    onTabPress={this.onChangeHandler}
                    borderRadius={Number(this.styles.container.borderRadius)}
                    buttonStyle={this.styles.button}
                    textStyle={this.styles.text}
                    activeButtonStyle={this.styles.activeButton}
                    activeTextStyle={this.styles.activeButtonText}
                    testID={this.props.name}
                />
                {this.props.enum.validation && (
                    <Text style={this.styles.validationMessage}>{this.props.enum.validation}</Text>
                )}
            </View>
        );
    }

    private onChange(index: number): void {
        const value = this.universe[index];
        this.props.enum.setValue(value);

        executeAction(this.props.onChange);
    }
}
