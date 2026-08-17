import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { executeAction } from "@mendix/piw-utils-internal";
import { ValueStatus } from "mendix";
import { Component, JSX, createElement } from "react";
import StarRating from "./lib/StarRating";
import { Big } from "big.js";

import { RatingProps } from "../typings/RatingProps";
import { defaultRatingStyle, IconStyle, RatingStyle } from "./ui/Styles";
import { StarIcon } from "./lib/StarIcon";

interface State {}

export type Props = RatingProps<RatingStyle>;

export class Rating extends Component<Props, State> {
    readonly state: State = {};

    private readonly onChangeHandler = this.onChange.bind(this);
    private readonly styles = flattenStyles(defaultRatingStyle, this.props.style);
    private readonly iconStyle: IconStyle;

    constructor(props: Props) {
        super(props);

        const { iconStyle } = processStyles(this.styles);
        this.iconStyle = iconStyle;
    }

    render(): JSX.Element | null {
        const ratingProps = {
            activeOpacity: 1,
            ...(this.props.animation !== "none" ? { animation: this.props.animation } : {})
        };

        const disabled = this.props.editable === "never" || this.props.ratingAttribute.readOnly;
        const containerStyle = disabled
            ? [this.styles.container, this.styles.containerDisabled]
            : this.styles.container;

        const { color, selectedColor, size } = processStyles(this.styles);

        const fullStarIcon = this.props.icon?.value
            ? (this.props.icon.value as any)
            : createElement(StarIcon, { size, color: selectedColor });
        const emptyStarIcon = this.props.emptyIcon?.value
            ? (this.props.emptyIcon.value as any)
            : createElement(StarIcon, { size, color });

        return (
            <StarRating
                maxStars={this.props.maximumValue}
                rating={Math.round(Number(this.props.ratingAttribute.value))}
                disabled={disabled}
                selectedStar={this.onChangeHandler}
                halfStarEnabled={false}
                containerStyle={containerStyle}
                starStyle={this.iconStyle}
                fullStar={fullStarIcon}
                emptyStar={emptyStarIcon}
                {...ratingProps}
            />
        );
    }

    private onChange(rating: number): void {
        if (this.props.ratingAttribute.status === ValueStatus.Available) {
            this.props.ratingAttribute.setValue(new Big(rating));
            executeAction(this.props.onChange);
        }
    }
}

function processStyles(styles: RatingStyle): any {
    const keys: Array<keyof IconStyle> = ["color", "selectedColor", "size"];
    const { selectedColor, color, size }: IconStyle = styles.icon;

    const iconStyle = {
        ...styles.icon,
        width: size,
        height: size
    };

    keys.forEach(key => delete iconStyle[key]);

    return {
        color,
        selectedColor,
        size,
        iconStyle
    };
}
