import { colorWithOpacity, getDimensions } from "../StylingPropertyUtils";

describe("getDimensions", () => {
    describe("width", () => {
        it("works with percentage", () => {
            const style = getDimensions({
                width: 100,
                widthUnit: "percentage",
                height: null,
                heightUnit: "pixels"
            });

            expect(style).toEqual(
                expect.objectContaining({
                    width: "100%"
                })
            );
        });

        it("works with pixels", () => {
            const style = getDimensions({
                width: 200,
                widthUnit: "pixels",
                height: null,
                heightUnit: "pixels"
            });

            expect(style).toEqual(
                expect.objectContaining({
                    width: "200px"
                })
            );
        });
    });

    describe("height", () => {
        it("works with pixels", () => {
            const style = getDimensions({
                width: 123,
                widthUnit: "pixels",
                height: 50,
                heightUnit: "pixels"
            });

            expect(style).toEqual(
                expect.objectContaining({
                    height: "50px"
                })
            );
        });

        it("works with percentage of parent", () => {
            const style = getDimensions({
                width: 123,
                widthUnit: "pixels",
                height: 50,
                heightUnit: "percentageOfParent"
            });

            expect(style).toEqual(
                expect.objectContaining({
                    height: "50%"
                })
            );
        });

        it("works with percentage of width with px width", () => {
            const style = getDimensions({
                width: 200,
                widthUnit: "pixels",
                height: 50,
                heightUnit: "percentageOfWidth"
            });

            expect(style).toEqual(
                expect.objectContaining({
                    height: "100px"
                })
            );
        });

        it("works with percentage of width with percentage width", () => {
            const style = getDimensions({
                width: 80,
                widthUnit: "percentage",
                height: 50,
                heightUnit: "percentageOfWidth"
            });

            expect(style).toEqual(
                expect.objectContaining({
                    height: "auto",
                    paddingBottom: "40%"
                })
            );
        });
    });
});


describe("colorWithOpacity", () => {
    it("color:#3A65E5 with opacity:0", () => {
        const color = "#3A65E5";
        const opacity = 0;
        expect(colorWithOpacity(color, opacity)).toEqual("#3A65E500")
    })
    it("color:#3A65E5 with opacity:20", () => {
        const color = "#3A65E5";
        const opacity = 20;
        expect(colorWithOpacity(color, opacity)).toEqual("#3A65E533")
    })
    it("color:#3A65E5 with opacity:50", () => {
        const color = "#3A65E5";
        const opacity = 50;
        expect(colorWithOpacity(color, opacity)).toEqual("#3A65E580")
    })
    it("color:#3A65E5 with opacity:75", () => {
        const color = "#3A65E5";
        const opacity = 75;
        expect(colorWithOpacity(color, opacity)).toEqual("#3A65E5BF")
    })
    it("color:#3A65E5 with opacity:90", () => {
        const color = "#3A65E5";
        const opacity = 90;
        expect(colorWithOpacity(color, opacity)).toEqual("#3A65E5E6")
    })
    it("color:#3A65E5 with opacity:90", () => {
        const color = "#3A65E5";
        const opacity = 100;
        expect(colorWithOpacity(color, opacity)).toEqual("#3A65E5FF")
    })
})