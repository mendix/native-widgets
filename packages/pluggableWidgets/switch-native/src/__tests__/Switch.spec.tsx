import { actionValue, EditableValueBuilder, dynamicValue } from "@mendix/piw-utils-internal";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Switch, Props } from "../Switch";
import { defaultSwitchStyle } from "../ui/Styles";

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
        style: [{ ...defaultSwitchStyle, ...style }]
    };

    return { ...defaultProps, ...props };
};

describe("Switch", () => {
    let Platform: any;

    beforeEach(() => {
        Platform = require("react-native").Platform;
    });

    it("with editable value renders enabled", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).build()
        });

        render(<Switch {...props} />);
        const switchElement = screen.getByTestId("Switch1");
        expect(switchElement.props.enabled).toBe(true);
    });

    it("with value in readOnly state renders disabled", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).isReadOnly().build()
        });

        render(<Switch {...props} />);
        const switchElement = screen.getByTestId("Switch1");
        expect(switchElement.props.enabled).toBe(false);
    });

    it("with showLabel true renders label", () => {
        const props = createProps({
            showLabel: true
        });

        render(<Switch {...props} />);
        expect(screen.getByTestId(`${name}$label`)).toBeTruthy();
    });

    it("with showLabel true renders label horizontally", () => {
        const props = createProps({
            showLabel: true
        });

        render(<Switch {...props} />);
        const wrapper = screen.getByTestId(`${name}$wrapper`);
        expect(wrapper.props.style).toEqual(expect.arrayContaining([{ flexDirection: "row", alignItems: "center" }]));
    });

    it("with showLabel true and labelOrientation vertical, renders vertical", () => {
        const props = createProps({
            showLabel: true,
            labelOrientation: "vertical"
        });

        render(<Switch {...props} />);
        const wrapper = screen.getByTestId(`${name}$wrapper`);
        expect(wrapper.props.style).toEqual(
            expect.not.arrayContaining([{ flexDirection: "row", alignItems: "center" }])
        );
    });

    it("with error renders validation message", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValidation("error").withValue(false).build()
        });

        render(<Switch {...props} />);
        expect(props.booleanAttribute.validation).toEqual("error");
        expect(screen.getByTestId(`${name}$alert`)).toBeTruthy();
        expect(screen.getByTestId(`${name}$alert`).props.children).toEqual("error");
    });

    it("with android device renders property", () => {
        Platform.OS = "android";
        const props = createProps();

        render(<Switch {...props} />);
        expect(screen.getByTestId("Switch1").props.ios_backgroundColor).toBeUndefined();
    });

    it("renders correct thumbColor when value is true", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(true).build(),
            style: [{ ...defaultSwitchStyle, input: { thumbColorOn: "red" } }]
        });

        render(<Switch {...props} />);
        expect(screen.getByTestId("Switch1").props.thumbTintColor).toEqual("red");
    });

    it("renders correct thumbColor when value is false", () => {
        const props = createProps({
            booleanAttribute: new EditableValueBuilder<boolean>().withValue(false).build(),
            style: [{ ...defaultSwitchStyle, input: { thumbColorOff: "blue" } }]
        });

        render(<Switch {...props} />);
        expect(screen.getByTestId("Switch1").props.thumbTintColor).toEqual("blue");
    });

    describe("interactions", () => {
        it("invokes onValueChange handler", () => {
            const onChange = actionValue();
            const booleanAttribute = new EditableValueBuilder<boolean>().withValue(false).build();
            const props = createProps({
                booleanAttribute,
                onChange
            });
            render(<Switch {...props} />);

            expect(booleanAttribute.value).toBe(false);
            expect(onChange.execute).not.toHaveBeenCalled();

            fireEvent(screen.getByTestId("Switch1"), "valueChange", true);

            expect(booleanAttribute.value).toBe(true);
            expect(onChange.execute).toHaveBeenCalled();
        });

        it("when disabled, do not invoke onValueChange handler", () => {
            const onChange = actionValue();
            const booleanAttribute = new EditableValueBuilder<boolean>().withValue(false).isReadOnly().build();
            const props = createProps({
                booleanAttribute,
                onChange
            });
            render(<Switch {...props} />);

            expect(booleanAttribute.value).toBe(false);
            expect(onChange.execute).not.toHaveBeenCalled();

            fireEvent(screen.getByTestId("Switch1"), "valueChange", true);

            expect(booleanAttribute.value).toBe(false);
            expect(onChange.execute).not.toHaveBeenCalled();
        });
    });
});
