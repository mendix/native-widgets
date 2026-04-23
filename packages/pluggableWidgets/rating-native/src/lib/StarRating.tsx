// this file has been copied from https://github.com/djchie/react-native-star-rating here since the original library
// supported vector icon names as well as image sources. This widget only uses image sources.
import { ClassicComponentClass, Component, JSX } from "react";
import { ImageSourcePropType, View, StyleSheet, ViewStyle } from "react-native";
import { AnimatableProps, View as AnimatableView } from "react-native-animatable";
import type { StarRatingProps } from "react-native-star-rating";

import StarButton from "./StarButton";

const ANIMATION_TYPES = [
    "bounce",
    "flash",
    "jello",
    "pulse",
    "rotate",
    "rubberBand",
    "shake",
    "swing",
    "tada",
    "wobble"
] as const;

const DEFAULT_RATING = 0;
const DEFAULT_MAX_RATING = 5;
const MILLISECONDS_IN_SECOND = 1000;
const ANIMATION_DELAY_MS = 200;

const defaultProps = {
    activeOpacity: 0.2,
    animation: undefined,
    buttonStyle: {},
    containerStyle: {},
    disabled: false,
    halfStarEnabled: false,
    maxStars: DEFAULT_MAX_RATING,
    rating: DEFAULT_RATING,
    reversed: false,
    starSize: 40,
    starStyle: {},
    selectedStar: undefined
};

interface Props extends Omit<StarRatingProps, "iconSet" | "emptyStar" | "fullStar" | "halfStar"> {
    emptyStar?: ImageSourcePropType;
    fullStar?: ImageSourcePropType;
    halfStar?: ImageSourcePropType;
}
type AnimationFn = (duration: number) => Promise<{ finished: boolean }>;

interface AnimationProps {
    bounce: AnimationFn;
    flash: AnimationFn;
    jello: AnimationFn;
    pulse: AnimationFn;
    rotate: AnimationFn;
    rubberBand: AnimationFn;
    shake: AnimationFn;
    swing: AnimationFn;
    tada: AnimationFn;
    wobble: AnimationFn;
}

class StarRating extends Component<Props> {
    static defaultProps: typeof defaultProps;
    starRef: Array<ClassicComponentClass<AnimatableProps<ViewStyle>> & AnimationProps>;

    constructor(props: Props) {
        super(props);

        this.starRef = [];
        this.onStarButtonPress = this.onStarButtonPress.bind(this);
    }

    onStarButtonPress(rating: number): void {
        this.props.selectedStar?.(rating);
    }

    render(): JSX.Element {
        const {
            activeOpacity,
            animation,
            buttonStyle,
            containerStyle,
            disabled,
            emptyStar,
            fullStar,
            halfStar,
            halfStarEnabled,
            maxStars,
            rating,
            reversed,
            starSize,
            starStyle
        } = this.props;

        const newContainerStyle = {
            flexDirection: reversed ? "row-reverse" : "row",
            justifyContent: "space-between",
            ...StyleSheet.flatten(containerStyle)
        } as ViewStyle;

        let starsLeft = Math.round((rating ?? DEFAULT_RATING) * 2) / 2;
        const starButtons = [];

        for (let i = 0; i < (maxStars ?? DEFAULT_MAX_RATING); i++) {
            let starIconName = emptyStar;

            if (starsLeft >= 1) {
                starIconName = fullStar;
            } else if (starsLeft === 0.5) {
                starIconName = halfStar;
            }

            const starButtonElement = (
                <AnimatableView
                    key={i}
                    ref={node => {
                        if (node) {
                            this.starRef[i] = node as unknown as ClassicComponentClass<AnimatableProps<ViewStyle>> &
                                AnimationProps;
                        }
                    }}
                >
                    <StarButton
                        activeOpacity={activeOpacity}
                        buttonStyle={buttonStyle}
                        disabled={disabled}
                        halfStarEnabled={halfStarEnabled}
                        onStarButtonPress={(rating: number) => {
                            if (animation && ANIMATION_TYPES.includes(animation)) {
                                for (let s = 0; s <= i; s++) {
                                    const component = this.starRef[s];

                                    component?.[animation as keyof AnimationProps](
                                        MILLISECONDS_IN_SECOND + s * ANIMATION_DELAY_MS
                                    );
                                }
                            }
                            this.onStarButtonPress(rating);
                        }}
                        rating={i + 1}
                        reversed={reversed}
                        starIconName={starIconName}
                        starSize={starSize}
                        starStyle={starStyle}
                    />
                </AnimatableView>
            );

            starButtons.push(starButtonElement);
            starsLeft -= 1;
        }

        return (
            <View style={newContainerStyle} pointerEvents={disabled ? "none" : "auto"}>
                {starButtons}
            </View>
        );
    }
}

StarRating.defaultProps = defaultProps;

export default StarRating;
