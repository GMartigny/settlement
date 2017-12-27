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

        it("fade", function () {

            var color = new Color("#0AF");
            expect(color.fade(0.5).toString()).toEqual("rgba(0, 170, 255, 0.5)");
            expect(color.fade(0).toString()).toEqual("rgba(0, 170, 255, 0)");

            expect(color.fade(1).toString()).toEqual("#00AAFF");

        });

        it("grey", function () {

            var color = new Color("#0AF");
            expect(color.grey().toString()).toEqual("#8E8E8E");

            color = new Color("#E5421F");
            expect(color.grey().toString()).toEqual("#6D6D6D");

        });

        it("toHexa", function () {

            var color = new Color("#0AF");
            expect(color.toHexa()).toEqual("#00AAFF");

            color = new Color("#E5421F");
            expect(color.fade(0.3).toHexa()).toEqual("#E5421F");

        });

        it("toRGB", function () {

            var color = new Color("#0AF");
            expect(color.toRGB()).toEqual("rgb(0, 170, 255)");

            color = new Color("#E5421F");
            expect(color.fade(0.3).toRGB()).toEqual("rgb(229, 66, 31)");

        });

        it("toRGBA", function () {

            var color = new Color("#0AF");
            expect(color.toRGBA()).toEqual("rgba(0, 170, 255, 1)");

            color = new Color("#E5421F");
            expect(color.fade(0.3).toRGBA()).toEqual("rgba(229, 66, 31, 0.3)");

        });

        it("toString", function () {

            var color = new Color("#0AF");
            expect("color " + color).toEqual("color #00AAFF"); // Magic coercion

        });

    });

});
