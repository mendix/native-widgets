/**
 * @jest-environment jsdom
 */
import { Big } from "big.js";
import { dynamicValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { Rating, Props } from "../Rating";
import { render, fireEvent } from "@testing-library/react-native";
import { defaultRatingStyle } from "../ui/Styles";
import { TouchableOpacity } from "react-native";
import { ActionValue, EditableValue } from "mendix";
import StarButton from "../lib/StarButton";

jest.mock("react-native-animatable", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { View } = require("react-native");

    return {
        View: React.forwardRef((props: any, ref: any) => {
            // Expose animation methods on the ref
            if (ref) {
                const animationMethods = {
                    bounce: jest.fn(() => Promise.resolve({ finished: true })),
                    flash: jest.fn(() => Promise.resolve({ finished: true })),
                    jello: jest.fn(() => Promise.resolve({ finished: true })),
                    pulse: jest.fn(() => Promise.resolve({ finished: true })),
                    rotate: jest.fn(() => Promise.resolve({ finished: true })),
                    rubberBand: jest.fn(() => Promise.resolve({ finished: true })),
                    shake: jest.fn(() => Promise.resolve({ finished: true })),
                    swing: jest.fn(() => Promise.resolve({ finished: true })),
                    tada: jest.fn(() => Promise.resolve({ finished: true })),
                    wobble: jest.fn(() => Promise.resolve({ finished: true }))
                };

                if (typeof ref === "function") {
                    ref(animationMethods);
                } else if (ref && typeof ref === "object") {
                    Object.assign(ref, animationMethods);
                }
            }
            return <View {...props} />;
        })
    };
});

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

        fireEvent(starButton.findByType(TouchableOpacity), "press");

        expect(actionValue.execute).toHaveBeenCalledTimes(1);
        const actual = (rating.UNSAFE_root.props.ratingAttribute as EditableValue<Big>).value;
        const expected = new Big(3);
        expect(actual).toStrictEqual(expected);
    });
});
