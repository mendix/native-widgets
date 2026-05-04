// this file has been copied from https://github.com/djchie/react-native-star-rating here since the original library
// handled both vector icon names and image sources. This widget only uses image sources.
import { Component } from "react";
import {
    GestureResponderEvent,
    Image,
    ImageSourcePropType,
    ImageStyle,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import type { StarRatingProps } from "react-native-star-rating";

declare type Option<T> = T | undefined;

interface Props
    extends Pick<
        StarRatingProps,
        "activeOpacity" | "buttonStyle" | "disabled" | "halfStarEnabled" | "reversed" | "starStyle"
    > {
    starSize: number;
    rating: number;
    onStarButtonPress: (rating: number) => void;
    starIconName: Option<ImageSourcePropType>;
}

const defaultProps = {
    buttonStyle: {},
    starStyle: {}
} as Partial<Props>;

class StarButton extends Component<Props> {
    static defaultProps: Partial<Props>;
    constructor(props: Props) {
        super(props);

        this.onButtonPress = this.onButtonPress.bind(this);
    }

    onButtonPress(event: GestureResponderEvent) {
        const { halfStarEnabled, starSize, rating, onStarButtonPress } = this.props;

        let addition = 0;

        if (halfStarEnabled) {
            const isHalfSelected = event.nativeEvent.locationX < starSize / 2;
            addition = isHalfSelected ? -0.5 : 0;
        }

        onStarButtonPress(rating + addition);
    }

    renderIcon() {
        const { reversed, starIconName, starSize, starStyle } = this.props;
        const newStarStyle = {
            transform: [
                {
                    scaleX: reversed ? -1 : 1
                }
            ],
            ...StyleSheet.flatten(starStyle)
        } as ImageStyle;

        return starIconName ? (
            <Image
                source={starIconName}
                style={[
                    {
                        width: starSize,
                        height: starSize,
                        resizeMode: "contain"
                    } as ImageStyle,
                    newStarStyle
                ]}
            />
        ) : null;
    }

    render() {
        const { activeOpacity, buttonStyle, disabled } = this.props;

        return (
            <View style={buttonStyle}>
                <TouchableOpacity activeOpacity={activeOpacity} disabled={disabled} onPress={this.onButtonPress}>
                    {this.renderIcon()}
                </TouchableOpacity>
            </View>
        );
    }
}

StarButton.defaultProps = defaultProps;

export default StarButton;
