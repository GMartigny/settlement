describe("Test all math helper", function mathUtilsDescribe () {

    it("floor", function mathUtilsFloor () {

        expect(MathUtils.floor(5.4)).toBe(5);
        expect(MathUtils.floor(5.5)).toBe(5);
        expect(MathUtils.floor(5.6)).toBe(5);

    });

    it("round", function mathUtilsRound () {

        expect(MathUtils.round(5.4)).toBe(5);
        expect(MathUtils.round(5.5)).toBe(6);
        expect(MathUtils.round(5.6)).toBe(6);

    });

    it("ceil", function mathUtilsCeil () {

        expect(MathUtils.ceil(5.4)).toBe(6);
        expect(MathUtils.ceil(5.5)).toBe(6);
        expect(MathUtils.ceil(5.6)).toBe(6);

    });

    it("abs", function mathUtilsAbs () {

        expect(MathUtils.abs(0)).toBe(0);
        expect(MathUtils.abs(5)).toBe(5);
        expect(MathUtils.abs(-5)).toBe(5);

    });

    it("diff", function mathUtilsDiff () {

        expect(MathUtils.diff(3, 3)).toBe(0);
        expect(MathUtils.diff(-2, 5)).toBe(7);
        expect(MathUtils.diff(2, 1)).toBe(1);

    });

    it("constrain", function mathUtilsConstrain () {

        expect(MathUtils.constrain(10, 5, 15)).toBe(10);
        expect(MathUtils.constrain(2, 5, 15)).toBe(5);
        expect(MathUtils.constrain(20, 5, 15)).toBe(15);

    });

    it("random", function mathUtilsRandom () {

        /**
         * Run 999 random and return results
         * @param {Number} [min] - The first param for random
         * @param {Number} [max] - The second param for random
         * @returns {{min: {Number}, max: {Number}}} - The min and max value attained by random
         */
        function runRandom (min, max) {
            var res = {
                min: MathUtils.random(min, max),
                max: MathUtils.random(min, max)
            };

            for (var i = 0; i < 999; ++i) {
                var x = MathUtils.random(min, max);
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

        var withMax = runRandom(10);
        expect(withMax.min).toBeGreaterThan(0);
        expect(withMax.max).toBeLessThan(10);

        var withMinAndMax = runRandom(5, 15);
        expect(withMinAndMax.min).toBeGreaterThan(5);
        expect(withMinAndMax.max).toBeLessThan(15);

    });
});
