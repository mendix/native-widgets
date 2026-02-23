/**
 * @jest-environment jsdom
 */
import { actionValue, EditableValueBuilder, dynamicValue } from "@mendix/piw-utils-internal";
import { mount, ReactWrapper } from "enzyme";
import { createElement } from "react";

import { Switch, Props } from "../Switch";
import { defaultSwitchStyle } from "../ui/Styles";

declare type RWrapper = ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

const name = "Switch1";
const createProps = (props?: Partial<Props>): Props => {
    const style = props?.style ?? {};
    const defaultProps: Props = {
        name,
        label: dynamicValue<string>("Label", false),
        labelOrientation: "horizontal",
        showLabel: false,
        booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).build(),
        onChange: undefined,
        style: [{ ...defaultSwitchStyle, ...style }],
        labelPosition: "left"
    };

    return { ...defaultProps, ...props };
};

describe("Switch", () => {
    const switchIndex = 0;
    let Platform: any;
    let switchWrapper: RWrapper;

    function getSwitchComponent() {
        return switchWrapper.find({ testID: "Switch1" }).at(switchIndex);
    }

    beforeEach(() => {
        Platform = require("react-native").Platform;
    });

    afterEach(() => {
        switchWrapper.unmount();
    });

    it("with editable value renders enabled", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).build()
        });

        switchWrapper = mount(<Switch {...props} />);
        expect(getSwitchComponent().prop("disabled")).toBe(false);
    });

    it("with value in readOnly state renders disabled", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).isReadOnly().build()
        });

        switchWrapper = mount(<Switch {...props} />);
        expect(getSwitchComponent().prop("disabled")).toBe(true);
    });

    it("with showLabel true renders label", () => {
        const props = createProps({
            showLabel: true
        });

        switchWrapper = mount(<Switch {...props} />);
        expect(switchWrapper.exists({ testID: `${name}$label` })).toEqual(true);
    });

    it("with showLabel true and horizontal orientation, renders label and switch in a row", () => {
        const props = createProps({
            showLabel: true,
            labelOrientation: "horizontal",
            label: dynamicValue<string>("Test Label", false)
        });

        render(<Switch {...props} />);

        const horizontalContainer = screen.getByTestId(`${name}$horizontalContainer`);

        expect(horizontalContainer.props.style).toEqual(
            expect.objectContaining({ flexDirection: "row", alignItems: "center" })
        );

        expect(horizontalContainer).toContainElement(screen.getByTestId(`${name}$label`));
        expect(horizontalContainer).toContainElement(screen.getByTestId(name));
    });

    it("with showLabel true and labelOrientation vertical, renders vertical", () => {
        const props = createProps({
            showLabel: true,
            labelOrientation: "vertical"
        });

        render(<Switch {...props} />);
        const wrapper = screen.getByTestId(`${name}$wrapper`);
        expect(wrapper.props.style).toEqual(
            expect.arrayContaining([{ flexDirection: "column", alignItems: "flex-start" }])
        );
        expect(screen.queryByTestId(`${name}$horizontalContainer`)).toBeNull();
    });

    it("with error renders validation message", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValidation("error").withValue(false).build()
        });

        switchWrapper = mount(<Switch {...props} />);
        expect(switchWrapper.prop("booleanAttribute").validation).toEqual("error");

        expect(switchWrapper.exists({ testID: `${name}$alert` })).toEqual(true);
        expect(
            switchWrapper
                .find({ testID: `${name}$alert` })
                .at(1)
                .text()
        ).toEqual("error");
    });

    it("with iOS device renders correct property", () => {
        Platform.OS = "ios";
        const props = createProps();

        switchWrapper = mount(<Switch {...props} />);
        expect(getSwitchComponent().props()).toEqual(expect.objectContaining({ ios_backgroundColor: undefined }));
    });

    it("with android device renders property", () => {
        Platform.OS = "android";
        const props = createProps();

        switchWrapper = mount(<Switch {...props} />);
        expect(getSwitchComponent().prop("ios_backgroundColor")).toBeUndefined();
    });

    it("renders correct thumbColor when value is true", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(true).build(),
            style: [{ ...defaultSwitchStyle, input: { thumbColorOn: "red" } }]
        });

        switchWrapper = mount(<Switch {...props} />);
        expect(getSwitchComponent().prop("thumbColor")).toEqual("red");
    });

    it("renders correct thumbColor when value is false", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).build(),
            style: [{ ...defaultSwitchStyle, input: { thumbColorOff: "blue" } }]
        });

        switchWrapper = mount(<Switch {...props} />);
        expect(getSwitchComponent().prop("thumbColor")).toEqual("blue");
    });

    describe("interactions", () => {
        it("invokes onValueChange handler", () => {
            const props = createProps({
                booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).build(),
                onChange: actionValue()
            });
            switchWrapper = mount(<Switch {...props} />);

            expect(switchWrapper.prop("booleanAttribute").value).toBe(false);
            expect(switchWrapper.prop("onChange").execute).not.toHaveBeenCalled();

            getSwitchComponent().simulate("change");

            expect(switchWrapper.prop("booleanAttribute").value).toBe(true);
            expect(switchWrapper.prop("onChange").execute).toHaveBeenCalled();
        });

        it("when disabled, do not invoke onValueChange handler", () => {
            const props = createProps({
                booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).isReadOnly().build(),
                onChange: actionValue()
            });
            switchWrapper = mount(<Switch {...props} />);

            expect(switchWrapper.prop("booleanAttribute").value).toBe(false);
            expect(switchWrapper.prop("onChange").execute).not.toHaveBeenCalled();

            getSwitchComponent().simulate("change");

            expect(switchWrapper.prop("booleanAttribute").value).toBe(false);
            expect(switchWrapper.prop("onChange").execute).not.toHaveBeenCalled();
        });
    });
});
