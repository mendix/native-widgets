import { JSX } from "react";
import { ColorValue } from "react-native";
import { Path } from "react-native-svg";

export interface ArcProps {
    radius: number;
    startAngle: number;
    endAngle: number;
    strokeWidth: number;
    stroke: ColorValue;
    strokeCap?: "butt" | "round" | "square";
    fill?: ColorValue;
    offset?: { top: number; left: number };
    direction?: "clockwise" | "counter-clockwise";
    testID?: string;
}

const CIRCLE = Math.PI * 2;

/**
 * Calculates SVG path data for an arc.
 * Matches react-native-progress Arc.js implementation exactly.
 *
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param startAngleArg - Start angle in radians
 * @param endAngleArg - End angle in radians
 * @param radius - Arc radius
 * @param direction - Direction of arc drawing
 * @returns SVG path string
 */
export function makeArcPath(
    x: number,
    y: number,
    startAngleArg: number,
    endAngleArg: number,
    radius: number,
    direction: "clockwise" | "counter-clockwise" = "clockwise"
): string {
    let startAngle = startAngleArg;
    let endAngle = endAngleArg;

    // Normalize angles to be within 0-2π
    if (endAngle - startAngle >= CIRCLE) {
        endAngle = CIRCLE + (endAngle % CIRCLE);
    } else {
        endAngle = endAngle % CIRCLE;
    }
    startAngle = startAngle % CIRCLE;

    const angle = startAngle > endAngle ? CIRCLE - startAngle + endAngle : endAngle - startAngle;

    // Special case for full circle
    if (angle >= CIRCLE) {
        return `M${x + radius} ${y}
            a${radius} ${radius} 0 0 1 0 ${radius * 2}
            a${radius} ${radius} 0 0 1 0 ${radius * -2}`;
    }

    const directionFactor = direction === "counter-clockwise" ? -1 : 1;
    endAngle *= directionFactor;
    startAngle *= directionFactor;

    const startSine = Math.sin(startAngle);
    const startCosine = Math.cos(startAngle);
    const endSine = Math.sin(endAngle);
    const endCosine = Math.cos(endAngle);

    const arcFlag = angle > Math.PI ? 1 : 0;
    const reverseFlag = direction === "counter-clockwise" ? 0 : 1;

    return `M${x + radius * (1 + startSine)} ${y + radius - radius * startCosine}
          A${radius} ${radius} 0 ${arcFlag} ${reverseFlag} ${x + radius * (1 + endSine)} ${
        y + radius - radius * endCosine
    }`;
}

export function Arc(props: ArcProps): JSX.Element {
    const {
        radius,
        startAngle,
        endAngle,
        strokeWidth,
        stroke,
        strokeCap = "butt",
        fill = "none",
        offset = { top: 0, left: 0 },
        direction = "clockwise",
        testID
    } = props;

    // Match react-native-progress behavior: adjust offset and radius by strokeWidth
    const adjustedX = (offset.left || 0) + strokeWidth / 2;
    const adjustedY = (offset.top || 0) + strokeWidth / 2;
    const adjustedRadius = radius - strokeWidth / 2;

    // Generate the arc path
    const pathData = makeArcPath(adjustedX, adjustedY, startAngle, endAngle, adjustedRadius, direction);

    return (
        <Path
            d={pathData}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap={strokeCap}
            fill={fill}
            testID={testID}
        />
    );
}
