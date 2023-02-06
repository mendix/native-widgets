/**
 * @jest-environment jsdom
 */
import { Big } from "big.js";
import { dynamicValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Rating, Props } from "../Rating";
import { render, fireEvent } from "@testing-library/react-native";
import { defaultRatingStyle } from "../ui/Styles";
import { createElement } from "react";
import { View } from "react-native";
import { ActionValue, EditableValue } from "mendix";
import StarButton from "../lib/StarButton";
import Button from "react-native-button";

jest.mock("react-native-animatable", () => ({ View: (props: any) => <View {...props} bounce={jest.fn()} /> }));
jest.mock("react-native-button", () => jest.requireActual("react-native").TouchableOpacity);

const ratingProps: Props = {
    animation: "bounce",
    editable: "default",
    maximumValue: 5,
    name: "Test",
    ratingAttribute: new EditableValueBuilder<Big>().withValue(new Big(0)).build(),
    style: [defaultRatingStyle],
    icon: dynamicValue({ uri: "" }),
    emptyIcon: dynamicValue({ uri: "" })
};

describe("Rating", () => {
    it("should select the right amount of stars", async () => {
        const actionValue = { canExecute: true, isExecuting: false, execute: jest.fn() } as ActionValue;
        const rating = render(<Rating {...ratingProps} onChange={actionValue} />);

        const starButton = rating.UNSAFE_getAllByType(StarButton)[2];

        fireEvent(starButton.findByType(Button), "press");

        expect(actionValue.execute).toHaveBeenCalledTimes(1);
        const actual = (rating.container.props.ratingAttribute as EditableValue<Big>).value;
        const expected = new Big(3);
        expect(actual).toStrictEqual(expected);
    });
});
