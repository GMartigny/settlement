describe("Test all math helper", function mathsUtilsDescribe () {

    it("toNumber", function mathsUtilsToNumber () {

        expect(MathsUtils.toNumber("1")).toBe(1);
        expect(MathsUtils.toNumber("1.5")).toBe(1.5);
        expect(MathsUtils.toNumber("1e5")).toBe(100000);
        expect(MathsUtils.toNumber("0xFF")).toBe(255);

        expect(MathsUtils.toNumber("a")).toBe(0);
        expect(MathsUtils.toNumber("a", 5)).toBe(5);

    });

    it("floor", function mathsUtilsFloor () {

        expect(MathsUtils.floor(5.4)).toBe(5);
        expect(MathsUtils.floor(5.6)).toBe(5);

        expect(MathsUtils.floor(-5.4)).toBe(-5);
        expect(MathsUtils.floor(-5.6)).toBe(-5);

    });

    it("round", function mathsUtilsRound () {

        expect(MathsUtils.round(5.4)).toBe(5);
        expect(MathsUtils.round(5.6)).toBe(6);

        expect(MathsUtils.round(-5.4)).toBe(-5);
        expect(MathsUtils.round(-5.6)).toBe(-6);

    });

    it("ceil", function mathsUtilsCeil () {

        expect(MathsUtils.ceil(5.4)).toBe(6);
        expect(MathsUtils.ceil(5.6)).toBe(6);

        expect(MathsUtils.ceil(-5.4)).toBe(-6);
        expect(MathsUtils.ceil(-5.6)).toBe(-6);

    });

    it("abs", function mathsUtilsAbs () {

        expect(MathsUtils.abs(0)).toBe(0);
        expect(MathsUtils.abs(5)).toBe(5);
        expect(MathsUtils.abs(-5)).toBe(5);

    });

    it("sign", function mathsUtilsSign () {

        expect(MathsUtils.sign(5)).toBe(1);
        expect(MathsUtils.sign(0)).toBe(1);
        expect(MathsUtils.sign(-5)).toBe(-1);

    });

    it("sqrt", function mathsUtilsSqrt () {

        expect(MathsUtils.sqrt(25)).toBe(5);
        expect(MathsUtils.sqrt(1)).toBe(1);
        expect(MathsUtils.sqrt(0)).toBe(0);

    });

    it("diff", function mathsUtilsDiff () {

        expect(MathsUtils.diff(3, 3)).toBe(0);
        expect(MathsUtils.diff(-2, 5)).toBe(7);
        expect(MathsUtils.diff(2, 1)).toBe(1);

    });

    it("average", function mathsUtilsAverage () {

        expect(MathsUtils.average(3)).toBe(3);
        expect(MathsUtils.average(1, 2, 3)).toBe(2);
        expect(MathsUtils.average(-5, 5, -5, 5)).toBe(0);
        expect(MathsUtils.average).toThrow();

    });

    it("constrain", function mathsUtilsConstrain () {

        expect(MathsUtils.constrain(10, 5, 15)).toBe(10);
        expect(MathsUtils.constrain(2, 5, 15)).toBe(5);
        expect(MathsUtils.constrain(20, 5, 15)).toBe(15);

    });

    it("random", function mathsUtilsRandom () {

        /**
         * Run 666 random and return results
         * @param {Number} [min] - The first param for random
         * @param {Number} [max] - The second param for random
         * @return {{min: {Number}, max: {Number}}} - The min and max value attained by random
         */
        function runRandom (min, max) {
            var res = {
                min: Infinity,
                max: 0
            };

            for (var i = 0; i < 666; ++i) {
                var x = MathsUtils.random(min, max);
                if (x < res.min) {
                    res.min = x;
                }
                if (x > res.max) {
                    res.max = x;
                }
            }

            return res;
        }

        var without = runRandom();
        expect(without.min).toBeGreaterThan(0);
        expect(without.max).toBeLessThan(1);

        var withNull = runRandom(0);
        expect(withNull.min).toBeGreaterThan(0);
        expect(withNull.max).toBeLessThan(1);

        var withMax = runRandom(10);
        expect(withMax.min).toBeGreaterThan(0);
        expect(withMax.max).toBeLessThan(10);

        var withMinAndMax = runRandom(5, 15);
        expect(withMinAndMax.min).toBeGreaterThan(5);
        expect(withMinAndMax.max).toBeLessThan(15);

    });

    it("toHexa", function mathsUtilsToHexa () {

        expect(MathsUtils.toHexa(0)).toBe("0");
        expect(MathsUtils.toHexa(10)).toBe("A");
        expect(MathsUtils.toHexa(255)).toBe("FF");

    });

    it("toDeci", function mathsUtilsToDeci () {

        expect(MathsUtils.toDeci("0")).toBe(0);
        expect(MathsUtils.toDeci("A")).toBe(10);
        expect(MathsUtils.toDeci("FF")).toBe(255);

    });

});
