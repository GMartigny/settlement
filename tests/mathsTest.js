describe("Test all math helper", function mathUtilsDescribe () {

    it("floor", function mathUtilsFloor () {

        expect(MathsUtils.floor(5.4)).toBe(5);
        expect(MathsUtils.floor(5.5)).toBe(5);
        expect(MathsUtils.floor(5.6)).toBe(5);

    });

    it("round", function mathUtilsRound () {

        expect(MathsUtils.round(5.4)).toBe(5);
        expect(MathsUtils.round(5.5)).toBe(6);
        expect(MathsUtils.round(5.6)).toBe(6);

    });

    it("ceil", function mathUtilsCeil () {

        expect(MathsUtils.ceil(5.4)).toBe(6);
        expect(MathsUtils.ceil(5.5)).toBe(6);
        expect(MathsUtils.ceil(5.6)).toBe(6);

    });

    it("abs", function mathUtilsAbs () {

        expect(MathsUtils.abs(0)).toBe(0);
        expect(MathsUtils.abs(5)).toBe(5);
        expect(MathsUtils.abs(-5)).toBe(5);

    });

    it("pow", function mathUtilsPow () {

        expect(MathsUtils.pow(5, 2)).toBe(25);
        expect(MathsUtils.pow(0, 19)).toBe(0);
        expect(MathsUtils.pow(42, 0)).toBe(1);

    });

    it("sq", function mathUtilsSq () {

        expect(MathsUtils.sq(5)).toBe(25);
        expect(MathsUtils.sq(0)).toBe(0);
        expect(MathsUtils.sq(1)).toBe(1);

    });

    it("diff", function mathUtilsDiff () {

        expect(MathsUtils.diff(3, 3)).toBe(0);
        expect(MathsUtils.diff(-2, 5)).toBe(7);
        expect(MathsUtils.diff(2, 1)).toBe(1);

    });

    it("average", function mathUtilsAverage () {

        expect(MathsUtils.average(3)).toBe(3);
        expect(MathsUtils.average(1, 2, 3)).toBe(2);
        expect(MathsUtils.average(-5, 5, -5, 5)).toBe(0);
        expect(MathsUtils.average).toThrow();

    });

    it("constrain", function mathUtilsConstrain () {

        expect(MathsUtils.constrain(10, 5, 15)).toBe(10);
        expect(MathsUtils.constrain(2, 5, 15)).toBe(5);
        expect(MathsUtils.constrain(20, 5, 15)).toBe(15);

    });

    it("random", function mathUtilsRandom () {

        /**
         * Run 666 random and return results
         * @param {Number} [min] - The first param for random
         * @param {Number} [max] - The second param for random
         * @returns {{min: {Number}, max: {Number}}} - The min and max value attained by random
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

        var withNull = runRandom(null);
        expect(withNull.min).toBeGreaterThan(0);
        expect(withNull.max).toBeLessThan(1);

        var withMax = runRandom(10);
        expect(withMax.min).toBeGreaterThan(0);
        expect(withMax.max).toBeLessThan(10);

        var withMinAndMax = runRandom(5, 15);
        expect(withMinAndMax.min).toBeGreaterThan(5);
        expect(withMinAndMax.max).toBeLessThan(15);

    });

    it("toHexa", function mathUtilsToHexa () {

        expect(MathsUtils.toHexa(0)).toBe("0");
        expect(MathsUtils.toHexa(10)).toBe("A");
        expect(MathsUtils.toHexa(255)).toBe("FF");

    });

    it("toDeci", function mathUtilsToDeci () {

        expect(MathsUtils.toDeci("0")).toBe(0);
        expect(MathsUtils.toDeci("A")).toBe(10);
        expect(MathsUtils.toDeci("FF")).toBe(255);

    });

});
