import { act, renderHook } from "@testing-library/react-native";
import { View } from "react-native";
import { MxMenuControl, useMxMenu } from "../useMxMenu";

type Measure = (callback: (x: number, y: number, width: number, height: number) => void) => void;

/** A trigger that reports being at (10, 20) and 30 x 40 big */
const attachAnchor = (control: MxMenuControl, measureInWindow: Measure): void => {
    (control.anchorRef as { current: unknown }).current = { measureInWindow } as unknown as View;
};

const instantMeasure: Measure = callback => callback(10, 20, 30, 40);

describe("useMxMenu", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const frame = (): void => {
        act(() => {
            jest.advanceTimersByTime(20);
        });
    };

    it("starts closed", () => {
        const { result } = renderHook(() => useMxMenu());

        expect(result.current.visible).toBe(false);
        expect(result.current.expanded).toBe(false);
        expect(result.current.anchor).toBeNull();
    });

    it("measures the trigger when it opens, and shows the menu a frame later", () => {
        const { result } = renderHook(() => useMxMenu());
        attachAnchor(result.current, instantMeasure);

        act(() => result.current.open());

        expect(result.current.anchor).toEqual({ x: 10, y: 20, width: 30, height: 40 });
        expect(result.current.visible).toBe(false);

        frame();

        expect(result.current.visible).toBe(true);
        expect(result.current.expanded).toBe(true);
    });

    it("closes", () => {
        const { result } = renderHook(() => useMxMenu());
        attachAnchor(result.current, instantMeasure);
        act(() => result.current.open());
        frame();

        act(() => result.current.close());

        expect(result.current.visible).toBe(false);
        expect(result.current.expanded).toBe(false);
    });

    it("measures again for every opening, so a trigger that moved is found", () => {
        const { result } = renderHook(() => useMxMenu());
        const measure = jest.fn<void, Parameters<Measure>>(callback => callback(10, 20, 30, 40));
        attachAnchor(result.current, measure);
        act(() => result.current.open());
        frame();
        act(() => result.current.close());

        attachAnchor(result.current, callback => callback(50, 60, 70, 80));
        act(() => result.current.open());
        frame();

        expect(measure).toHaveBeenCalledTimes(1);
        expect(result.current.anchor).toEqual({ x: 50, y: 60, width: 70, height: 80 });
    });

    it("does nothing when nothing is attached", () => {
        const { result } = renderHook(() => useMxMenu());

        act(() => result.current.open());
        frame();

        expect(result.current.visible).toBe(false);
    });

    it("keeps its functions the same between renders", () => {
        const { result, rerender } = renderHook(() => useMxMenu());
        const { open, close } = result.current;

        rerender({});

        expect(result.current.open).toBe(open);
        expect(result.current.close).toBe(close);
    });

    it("does not show the menu when it was unmounted while measuring", () => {
        const { result, unmount } = renderHook(() => useMxMenu());
        let finishMeasuring: () => void = () => undefined;
        attachAnchor(result.current, callback => {
            finishMeasuring = () => callback(10, 20, 30, 40);
        });
        const errors = jest.spyOn(console, "error").mockImplementation(() => undefined);

        act(() => result.current.open());
        unmount();
        finishMeasuring();
        frame();

        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});
