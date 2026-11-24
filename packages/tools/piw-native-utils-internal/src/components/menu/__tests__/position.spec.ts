import { computeMenuPosition, MenuPositionInput, toStyleLeft } from "../position";

const window = { width: 400, height: 800 };
const menu = { width: 150, height: 200 };

const position = (overrides: Partial<MenuPositionInput>): { x: number; y: number } =>
    computeMenuPosition({
        anchor: { x: 100, y: 300, width: 80, height: 40 },
        menu,
        window,
        ...overrides
    });

describe("computeMenuPosition", () => {
    describe("left to right", () => {
        it("puts the menu on the trigger when there is room", () => {
            expect(position({})).toEqual({ x: 100, y: 300 });
        });

        it("aligns with the trigger's right edge when the menu would run off the right of the screen", () => {
            // trigger spans 300..380, a 150 wide menu from 300 would end at 450
            expect(position({ anchor: { x: 300, y: 300, width: 80, height: 40 } })).toEqual({ x: 230, y: 300 });
        });

        it("keeps the indent when the trigger itself touches the right edge", () => {
            expect(position({ anchor: { x: 360, y: 300, width: 40, height: 40 } }).x).toBe(242);
        });

        it("keeps the indent from the left edge", () => {
            expect(position({ anchor: { x: 2, y: 300, width: 80, height: 40 } }).x).toBe(8);
        });
    });

    describe("right to left", () => {
        it("aligns with the trigger's right edge", () => {
            expect(position({ rtl: true })).toEqual({ x: 30, y: 300 });
        });

        it("falls back to the trigger's left edge when the menu would run off the left of the screen", () => {
            expect(position({ rtl: true, anchor: { x: 20, y: 300, width: 80, height: 40 } }).x).toBe(20);
        });

        it("still keeps the indent from the right edge", () => {
            expect(position({ rtl: true, anchor: { x: 330, y: 300, width: 70, height: 40 } }).x).toBe(242);
        });
    });

    describe("vertical", () => {
        it("moves up to keep the indent from the bottom of the screen", () => {
            expect(position({ anchor: { x: 100, y: 700, width: 80, height: 40 } }).y).toBe(592);
        });

        it("keeps the indent from the top of the screen", () => {
            expect(position({ anchor: { x: 100, y: 2, width: 80, height: 40 } }).y).toBe(8);
        });

        it("never goes above the indent when the menu is taller than the screen", () => {
            expect(position({ menu: { width: 150, height: 900 } }).y).toBe(8);
        });
    });

    describe("placement below", () => {
        it("puts the menu right under the trigger", () => {
            expect(position({ placement: "below" })).toEqual({ x: 100, y: 340 });
        });

        it("still stays inside the screen", () => {
            expect(position({ placement: "below", anchor: { x: 100, y: 700, width: 80, height: 40 } }).y).toBe(592);
        });
    });

    it("uses a custom indent", () => {
        expect(position({ indent: 20, anchor: { x: 2, y: 2, width: 80, height: 40 } })).toEqual({ x: 20, y: 20 });
    });
});

describe("toStyleLeft", () => {
    it("keeps x where left and right are not swapped", () => {
        expect(toStyleLeft(30, 150, 400, false)).toBe(30);
    });

    it("turns x into the distance from the right edge where they are swapped", () => {
        expect(toStyleLeft(30, 150, 400, true)).toBe(220);
    });
});
