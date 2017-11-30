describe("Test all color helpers", function colorsDescribe () {

    it ("fade", function colorsFade () {

        var color = "#0AF";
        expect(ColorsUtil.fade(color, 0.5)).toEqual("rgba(0, 170, 255, 0.5)");
        expect(ColorsUtil.fade(color, 1)).toEqual("#00AAFF");

        color = "#E5421F";
        expect(ColorsUtil.fade(color, 0.5)).toEqual("rgba(229, 66, 31, 0.5)");
        expect(ColorsUtil.fade(color, 1)).toEqual("#E5421F");

    });

    it("grey", function colorsGrey () {

        expect(ColorsUtil.grey("#0AF")).toEqual("#8E8E8E");
        expect(ColorsUtil.grey("#E5421F")).toEqual("#6D6D6D");
        expect(ColorsUtil.grey("#000")).toEqual("#000000");

    });

});
