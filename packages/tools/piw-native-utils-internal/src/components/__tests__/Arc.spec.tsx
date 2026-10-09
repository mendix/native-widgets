import { JSX } from "react";
import { render } from "@testing-library/react-native";
import { Path, Svg } from "react-native-svg";

import { Arc, makeArcPath } from "../Arc";

describe("makeArcPath", () => {
    it("generates path for quarter circle (90 degrees)", () => {
        const path = makeArcPath(50, 50, 0, Math.PI / 2, 40, "clockwise");
        // With sine/cosine positioning: start at angle 0, end at PI/2
        // Should be arc flag 0 (small arc), clockwise direction flag 1
        expect(path).toContain("A40 40 0 0 1");
    });

    it("generates path for exactly half circle (180 degrees)", () => {
        const path = makeArcPath(50, 50, 0, Math.PI, 40, "clockwise");
        // Large arc flag only triggers when angle is strictly greater than PI,
        // so exactly half a circle still uses the small-arc flag (matches react-native-progress).
        expect(path).toContain("A40 40 0 0 1");
    });

    it("generates special path for full circle", () => {
        const path = makeArcPath(50, 50, 0, Math.PI * 2, 40, "clockwise");
        // Full circle has special handling with two arc commands
        expect(path).toContain(`M${50 + 40} ${50}`);
        expect(path).toContain(`a${40} ${40}`);
    });

    it("handles three-quarter circle", () => {
        const path = makeArcPath(50, 50, 0, (Math.PI * 3) / 2, 40, "clockwise");
        // Angle > PI so should use large arc flag
        expect(path).toContain("A40 40 0 1 1");
    });

    it("supports counter-clockwise direction", () => {
        const path = makeArcPath(50, 50, 0, Math.PI / 2, 40, "counter-clockwise");
        // Counter-clockwise should use reverse flag 0
        expect(path).toContain("A40 40 0 0 0");
    });

    it("handles zero-length arc", () => {
        const path = makeArcPath(50, 50, 0, 0, 40, "clockwise");
        // Start and end at same point; path data spans multiple lines, so match with toContain
        // rather than a "." regex (which doesn't cross the embedded newline).
        expect(path).toContain("A40 40 0 0 1");
    });
});

describe("Arc", () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- inferred from UNSAFE_getByType
    function renderArcPath(children: JSX.Element) {
        const { UNSAFE_getByType } = render(<Svg>{children}</Svg>);
        return UNSAFE_getByType(Path);
    }

    it("renders a Path component", () => {
        const path = renderArcPath(<Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" />);
        expect(path).toBeDefined();
    });

    it("forwards testID to the Path", () => {
        const { getByTestId } = render(
            <Svg>
                <Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" testID="arc" />
            </Svg>
        );
        expect(getByTestId("arc")).toBeDefined();
    });

    it("adjusts radius by strokeWidth/2", () => {
        const path = renderArcPath(<Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={4} stroke="blue" />);
        // Adjusted radius should be 40 - 4/2 = 38
        expect(path.props.d).toContain("A38 38");
    });

    it("adjusts offset by strokeWidth/2", () => {
        const path = renderArcPath(
            <Arc
                radius={40}
                startAngle={0}
                endAngle={Math.PI}
                strokeWidth={4}
                stroke="blue"
                offset={{ top: 10, left: 5 }}
            />
        );
        // Adjusted center: (5 + 4/2, 10 + 4/2) = (7, 12); start point = (7 + 38, 12) = (45, 12)
        expect(path.props.d).toMatch(/^M45 12/);
    });

    it("applies strokeCap prop", () => {
        const path = renderArcPath(
            <Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" strokeCap="round" />
        );
        expect(path.props.strokeLinecap).toBe("round");
    });

    it("defaults to butt strokeCap", () => {
        const path = renderArcPath(<Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" />);
        expect(path.props.strokeLinecap).toBe("butt");
    });

    it("applies fill prop", () => {
        const path = renderArcPath(
            <Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" fill="red" />
        );
        expect(path.props.fill).toBe("red");
    });

    it("defaults to no fill", () => {
        const path = renderArcPath(<Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" />);
        expect(path.props.fill).toBe("none");
    });

    it("defaults to clockwise direction", () => {
        const path = renderArcPath(
            <Arc radius={40} startAngle={0} endAngle={Math.PI / 2} strokeWidth={3} stroke="blue" />
        );
        // Clockwise uses reverse flag 1
        expect(path.props.d).toContain("0 1");
    });

    it("applies strokeWidth to Path", () => {
        const path = renderArcPath(<Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={5} stroke="blue" />);
        expect(path.props.strokeWidth).toBe(5);
    });

    it("passes stroke color through to Path", () => {
        const path = renderArcPath(<Arc radius={40} startAngle={0} endAngle={Math.PI} strokeWidth={3} stroke="blue" />);
        expect(path.props.stroke).toBe("blue");
    });
});
