import { Style } from "@mendix/piw-native-utils-internal";
import { I18nManager, Platform, StyleSheet, TextStyle, ViewStyle } from "react-native";
import absoluteFillObject = StyleSheet.absoluteFillObject;

const isAndroidRTL = I18nManager.isRTL && Platform.OS === "android";

const defaultButtonBetweenContainer: ViewStyle = {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    alignSelf: "stretch"
};

const defaultButtonBelowContainer: ViewStyle = {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12
};

const defaultButtonCaption: TextStyle = {
    backgroundColor: "transparent",
    color: "black",
    fontSize: 18,
    alignSelf: "center"
};

export interface ButtonStyle {
    container: ViewStyle;
    caption: TextStyle;
    icon: {
        color: string;
        size?: number;
    };
}

export interface IntroScreenStyle extends Style {
    fullscreenContainer: ViewStyle;
    popupContainer: ViewStyle;
    paginationContainer: ViewStyle;
    paginationText: TextStyle;
    dotStyle: ViewStyle;
    activeDotStyle: ViewStyle;
    paginationAbove: {
        buttonsContainer: ViewStyle;
        buttonSkip: ButtonStyle;
        buttonDone: ButtonStyle;
        buttonPrevious: ButtonStyle;
        buttonNext: ButtonStyle;
    };
    paginationBetween: {
        buttonSkip: ButtonStyle;
        buttonDone: ButtonStyle;
        buttonPrevious: ButtonStyle;
        buttonNext: ButtonStyle;
    };
}

export const defaultWelcomeScreenStyle: IntroScreenStyle = {
    fullscreenContainer: {
        ...absoluteFillObject
    },
    popupContainer: {
        ...absoluteFillObject,
        paddingHorizontal: 50,
        paddingVertical: 150,
        backgroundColor: "rgba(0, 0, 0, 0.5)"
    },
    paginationContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "space-between",
        alignItems: "center"
    },
    paginationText: {
        fontSize: 12,
        color: "black"
    },
    paginationAbove: {
        buttonsContainer: {
            flex: 1,
            flexDirection: isAndroidRTL ? "row-reverse" : "row",
            justifyContent: "center",
            marginTop: 16
        },
        buttonSkip: {
            container: {
                ...defaultButtonBelowContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        },
        buttonDone: {
            container: {
                ...defaultButtonBelowContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        },
        buttonPrevious: {
            container: {
                ...defaultButtonBelowContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        },
        buttonNext: {
            container: {
                ...defaultButtonBelowContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        }
    },
    paginationBetween: {
        buttonSkip: {
            container: {
                ...defaultButtonBetweenContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        },
        buttonDone: {
            container: {
                ...defaultButtonBetweenContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        },
        buttonPrevious: {
            container: {
                ...defaultButtonBetweenContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        },
        buttonNext: {
            container: {
                ...defaultButtonBetweenContainer
            },
            caption: {
                ...defaultButtonCaption,
                paddingHorizontal: 5
            },
            icon: {
                color: "black"
            }
        }
    },
    dotStyle: {
        backgroundColor: "rgba(0, 0, 0, .2)"
    },
    activeDotStyle: {
        backgroundColor: "rgba(255, 255, 255, .9)"
    }
};
