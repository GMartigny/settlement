describe("Test all color helpers", function colorsUtilsDescribe () {

    it ("fade", function colorsFade () {

        var color = "#0AF";
        expect(ColorsUtils.fade(color, 0.5)).toEqual("rgba(0, 170, 255, 0.5)");
        expect(ColorsUtils.fade(color, 1)).toEqual("#00AAFF");

        color = "#E5421F";
        expect(ColorsUtils.fade(color, 0.5)).toEqual("rgba(229, 66, 31, 0.5)");
        expect(ColorsUtils.fade(color, 1)).toEqual("#E5421F");

    });

    it("grey", function colorsGrey () {

        expect(ColorsUtils.grey("#0AF")).toEqual("#8E8E8E");
        expect(ColorsUtils.grey("#E5421F")).toEqual("#6D6D6D");
        expect(ColorsUtils.grey("#000")).toEqual("#000000");

    });

    describe("Test the Color object", function colorDescribe () {

        xit("fade", function () {
            // covered by colorsFade
        });

        xit("grey", function () {
            // covered by colorsGrey
        });

        it("toHexa", function () {

            var color = new Color("#0AF");
            expect(color.toHexa()).toEqual("#00AAFF");

            color = new Color("#E5421F");
            expect(color.toHexa()).toEqual("#E5421F");

        });

        it("toRGB", function () {

            var color = new Color("#0AF");
            expect(color.toRGB()).toEqual("rgb(0, 170, 255)");

            color = new Color("#E5421F");
            expect(color.toRGB()).toEqual("rgb(229, 66, 31)");

        });

        it("toRGBA", function () {

            var color = new Color("#0AF");
            expect(color.toRGBA()).toEqual("rgba(0, 170, 255, 1)");

            color = new Color("#E5421F");
            color.fade(0.3);
            expect(color.toRGBA()).toEqual("rgba(229, 66, 31, 0.3)");

        });

        xit("toString", function () {
            // covered by colorsFade and colorsGrey
        });

    });

});
