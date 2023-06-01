export type Theme = "dark" | "light";

interface ButtonColors {
    default: string;
    inverse: string;
    primary: string;
    info: string;
    success: string;
    warning: string;
    danger: string;
    icon: string;
}

export interface ColorsType {
    background: {
        topBar: {
            data: string;
            standard: string;
        };
        page: string;
        container: string;
        shade: string;
        button: ButtonColors;
    };
    text: {
        primary: string;
        secondary: string;
        data: string;
        button: {
            dark: string;
            light: string;
        };
    };
    border: {
        widget: string;
        hover: string;
        select: string;
    };
    icon: {
        primary: string;
    };
}

export const ColorsLight: ColorsType = {
    background: {
        topBar: {
            data: "#DCEEFE",
            standard: "#F7F7F7"
        },
        page: "#FFFFFF",
        container: "#FFFFFF",
        shade: "#F2F2F3",
        button: {
            default: "#535965",
            inverse: "#D9DBDD",
            primary: "#0123C6",
            info: "#146FF4",
            success: "#0A7D0A",
            warning: "#DB5F12",
            danger: "#D31E23",
            icon: "#D9DBDD"
        }
    },
    text: {
        primary: "#2F3646",
        secondary: "#6B707B",
        data: "#146FF4",
        button: {
            dark: "#0A1324",
            light: "#FFFFFF"
        }
    },
    border: {
        widget: "#C1C3C8",
        hover: "#6B707B",
        select: "#146FF4"
    },
    icon: {
        primary: "#535965"
    }
};

export const ColorsDark: ColorsType = {
    background: {
        topBar: {
            data: "#333A65E5",
            standard: "#33646464"
        },
        page: "#313131",
        container: "#313131",
        shade: "#3E3E3E",
        button: {
            default: "#646464",
            inverse: "#DEDEDE",
            primary: "#344BCE",
            info: "#579BF9",
            success: "#5BDB5B",
            warning: "#F69558",
            danger: "#F25C5C",
            icon: "#4F4F4F"
        }
    },
    text: {
        primary: "#DEDEDE",
        secondary: "#A4A4A4",
        data: "#579BF9",
        button: {
            dark: "#171717",
            light: "#FFFFFF"
        }
    },
    border: {
        widget: "#646464",
        hover: "#A4A4A4",
        select: "#579BF9"
    },
    icon: {
        primary: "#A4A4A4"
    }
};

export const getColors = (isDarkMode: boolean): ColorsType => (isDarkMode ? ColorsDark : ColorsLight);
