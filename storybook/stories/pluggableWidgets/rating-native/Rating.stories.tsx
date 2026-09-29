import type { Meta, StoryObj } from "@storybook/react-native";
import { type ReactElement, useState } from "react";
import { Big } from "big.js";
import { Rating } from "../../../../packages/pluggableWidgets/rating-native/src/Rating";
import type { RatingStyle } from "../../../../packages/pluggableWidgets/rating-native/src/ui/Styles";
import { actionValue, dynamicValue, editableValue } from "../../shared/mendixValues";
import { atlasStyle } from "../../shared/atlasStyles";
import { StoryFrame, StoryRow, StoryRows } from "../../shared/StoryFrame";

const atlas = atlasStyle("com.mendix.widget.native.rating.Rating") as RatingStyle[];

/**
 * Custom star icons, which every story here passes.
 *
 * Left to itself the widget draws glyphicons, rendering them to images through
 * `@react-native-vector-icons/common` — and that needs `glyphicons-halflings-regular.ttf`, which the
 * Mendix app bundles and this host app does not. Without the font `preloadIcons` rejects, the cache
 * never arrives, and `render` returns null forever: a blank story with no error to explain it.
 * Supplying `icon` and `emptyIcon` sets the widget's `usesGlyphicons` to false, so it skips the font
 * path entirely. That also happens to be the configuration most apps ship.
 */
const filled = dynamicValue(require("../../shared/assets/star-filled.png"));
const empty = dynamicValue(require("../../shared/assets/star-empty.png"));

const baseProps = {
    name: "rating",
    style: atlas,
    icon: filled,
    emptyIcon: empty,
    maximumValue: 5,
    animation: "none" as const,
    editable: "default" as const
};

const meta = {
    title: "Widgets/Rating",
    component: Rating,
    decorators: [
        (Story: () => ReactElement) => (
            <StoryFrame>
                <Story />
            </StoryFrame>
        )
    ]
} satisfies Meta<typeof Rating>;

export default meta;

export const Default: StoryObj<typeof Rating> = {
    render: () => {
        const [rating, setRating] = useState(new Big(3));
        return (
            <Rating
                {...baseProps}
                ratingAttribute={editableValue<Big>(rating, setRating)}
                onChange={actionValue("onChange")}
            />
        );
    }
};

/**
 * The animation played on the star that was tapped.
 *
 * `animation: "none"` is a distinct code path — the widget omits the prop altogether rather than
 * passing "none" through — so both need showing. Tap a star to see it.
 */
export const Animated: StoryObj<typeof Rating> = {
    render: () => {
        const [rating, setRating] = useState(new Big(2));
        return (
            <StoryRows>
                {(["pulse", "bounce", "tada", "rubberBand"] as const).map(animation => (
                    <StoryRow key={animation} label={animation}>
                        <Rating
                            {...baseProps}
                            animation={animation}
                            ratingAttribute={editableValue<Big>(rating, setRating)}
                        />
                    </StoryRow>
                ))}
            </StoryRows>
        );
    }
};

/** A longer scale, and a fractional value that falls between two stars. */
export const ScaleAndPartialValue: StoryObj<typeof Rating> = {
    render: () => (
        <StoryRows>
            <StoryRow label="maximumValue: 10">
                <Rating {...baseProps} maximumValue={10} ratingAttribute={editableValue<Big>(new Big(7))} />
            </StoryRow>
            <StoryRow label="value 3.5 — between stars">
                <Rating {...baseProps} ratingAttribute={editableValue<Big>(new Big(3.5))} />
            </StoryRow>
            <StoryRow label="value 0 — nothing rated yet">
                <Rating {...baseProps} ratingAttribute={editableValue<Big>(new Big(0))} />
            </StoryRow>
        </StoryRows>
    )
};

/**
 * The two ways of locking it, which look the same but arrive differently.
 *
 * `editable: "never"` is the widget's prop; `readOnly` is the attribute's own. The widget dims the
 * container for either, so this story is mostly a check that both routes reach the same place.
 */
export const Disabled: StoryObj<typeof Rating> = {
    render: () => (
        <StoryRows>
            <StoryRow label='editable: "never"'>
                <Rating {...baseProps} editable="never" ratingAttribute={editableValue<Big>(new Big(4))} />
            </StoryRow>
            <StoryRow label="read-only attribute">
                <Rating {...baseProps} ratingAttribute={editableValue<Big>(new Big(4))} />
            </StoryRow>
        </StoryRows>
    )
};
