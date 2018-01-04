describe("Test all color helpers", function colorsUtilsDescribe () {

    var separator = ", ";
    var blue = {
        hexa: "#0AF",
        hexaLong: "#00AAFF",
        rgb: [0x0, 0xAA, 0xFF].join(separator),
        grey: "#8E8E8E"
    };
    var red = {
        hexa: "#E5421F",
        rgb: [0xE5, 0x42, 0x1F].join(separator),
        grey: "#6D6D6D"
    };

    it ("fade", function colorsFade () {

        var color = blue.hexa;
        expect(ColorsUtils.fade(color, 0.5)).toEqual("rgba(" + blue.rgb + ", 0.5)");
        expect(ColorsUtils.fade(color, 1)).toEqual(blue.hexaLong);

        color = red.hexa;
        expect(ColorsUtils.fade(color, 0.5)).toEqual("rgba(" + red.rgb + ", 0.5)");
        expect(ColorsUtils.fade(color, 1)).toEqual(red.hexa);

    });

    it("grey", function colorsGrey () {

        expect(ColorsUtils.grey(blue.hexa)).toEqual(blue.grey);
        expect(ColorsUtils.grey(red.hexa)).toEqual(red.grey);

    });

    describe("Test the Color object", function colorDescribe () {

        it("fade", function () {

            var color = new Color(blue.hexa);
            expect(color.fade(0.5).toString()).toEqual(`rgba(${blue.rgb}, 0.5)`);
            expect(color.fade(0).toString()).toEqual(`rgba(${blue.rgb}, 0)`);

            expect(color.fade(1).toString()).toEqual(blue.hexaLong);

        });

        it("grey", function () {

            var color = new Color(blue.hexa);
            expect(color.grey().toString()).toEqual(blue.grey);

            color = new Color(red.hexa);
            expect(color.grey().toString()).toEqual(red.grey);

        });

        it("toHexa", function () {

            var color = new Color(blue.hexa);
            expect(color.toHexa()).toEqual(blue.hexaLong);

            color = new Color(red.hexa);
            expect(color.fade(0.3).toHexa()).toEqual(red.hexa);

        });

        it("toRGB", function () {

            var color = new Color(blue.hexa);
            expect(color.toRGB()).toEqual(`rgb(${blue.rgb})`);

            color = new Color(red.hexa);
            expect(color.fade(0.3).toRGB()).toEqual(`rgb(${red.rgb})`);

        });

        it("toRGBA", function () {

            var color = new Color(blue.hexa);
            expect(color.toRGBA()).toEqual(`rgba(${blue.rgb}, 1)`);

            color = new Color(red.hexa);
            expect(color.fade(0.3).toRGBA()).toEqual(`rgba(${red.rgb}, 0.3)`);

        });

        it("toString", function () {

            var color = new Color(blue.hexa);
            expect("color " + color).toEqual(`color ${blue.hexaLong}`); // Magic coercion with concatenation

        });

    });

});
