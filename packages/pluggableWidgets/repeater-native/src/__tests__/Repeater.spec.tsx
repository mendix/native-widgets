import { render } from "@testing-library/react-native";
import { Repeater } from "../Repeater";
import { buildWidgetValue, ListValueBuilder } from "@mendix/piw-utils-internal";
import { createElement } from "react";
import { Text } from "react-native";

describe("Repeater", () => {
    it("renders correctly", () => {
        const component = render(
            <Repeater
                name="test-repeater"
                accessible="yes"
                style={[{ container: {} }]}
                datasource={ListValueBuilder().withAmountOfItems(5)}
                content={buildWidgetValue(<Text>Item</Text>)}
            />
        );

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders correctly with empty list", () => {
        const component = render(
            <Repeater
                name="test-repeater"
                accessible="yes"
                style={[{ container: {} }]}
                datasource={ListValueBuilder().withAmountOfItems(0)}
                content={buildWidgetValue(<Text>Item</Text>)}
            />
        );

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders correctly with custom styles", () => {
        const component = render(
            <Repeater
                name="test-repeater"
                accessible="yes"
                style={[{ container: { backgroundColor: "red" } }]}
                datasource={ListValueBuilder().withAmountOfItems(5)}
                content={buildWidgetValue(<Text>Item</Text>)}
            />
        );

        expect(component.toJSON()).toMatchSnapshot();
    });
});
