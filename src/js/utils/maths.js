/* exported MathsUtils */

const MathsUtils = {
    RADIX: {
        BINARY: 2,
        DECIMAL: 10,
        HEXA: 16,
        ALPHA: 36,
    },
    /**
     * Convert to a number
     * @param {*} value - Any value to convert
     * @return {Number}
     */
    toNumber (value) {
        return Number(value);
    },
    /**
     * Floor a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    floor (x) {
        // Bitshifting force number to integer
        // eslint-disable-next-line no-bitwise
        return x << 0;
    },

    /**
     * Round a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    round (x) {
        return MathsUtils.floor(x + (MathsUtils.sign(x) / 2));
    },

    /**
     * Ceil a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    ceil (x) {
        return MathsUtils.floor(x + MathsUtils.sign(x));
    },

    /**
     * Get the absolute value of a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    abs: Math.abs,

    /**
     * Get the sign of a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    sign (x) {
        return x < 0 ? -1 : 1;
    },

    /**
     * Get the square root of a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    sqrt (x) {
        return x ** 0.5;
    },

    /**
     * 2 times PI (full trigo rotation)
     * @constant
     */
    PI2: Math.PI * 2,

    cos: Math.cos,
    sin: Math.sin,

    /**
     * Return the absolute difference between two number
     * @param {Number} a - Any number
     * @param {Number} b - Any number
     * @return {Number}
     */
    diff (a, b) {
        return MathsUtils.abs(a - b);
    },

    /**
     * Return the average number for a set
     * @param {...Number} values - Number to compute
     * @return {Number}
     */
    average (...values) {
        if (!values.length) {
            throw new RangeError("Can't get average from no value");
        }

        return values.reduce((acc, value) => acc + value, 0) / values.length;
    },

    /**
     * Return value constrained to lower and upper bounds
     * @param {Number} x - Any value
     * @param {Number} min - The lower bound
     * @param {Number} max - The upper bound
     * @return {Number}
     */
    constrain (x, min, max) {
        if (x < min) {
            return min;
        }
        else if (x > max) {
            return max;
        }

        return x;
    },

    /**
     * Return a random number between marks
     * @type {Function}
     * @param {Number} [from=0] - Lowest point for the random range, default to 0.
     * @param {Number} [to=1] - Highest point for the random range, default to 1.
     * @example
     * MathsUtils.random(5, 10); // Random float between 5 and 10
     * MathsUtils.random(10); // Random float between 0 and 10
     * MathsUtils.random(); // Random float between 0 and 1
     * @return {Number}
     */
    random: (function iife () {
        var rand = Math.random;

        return function random (from, to) {
            if (Utils.isUndefined(to)) {
                if (!from || Utils.isUndefined(from)) {
                    to = 1;
                }
                else {
                    to = MathsUtils.toNumber(from, 1);
                }
                from = 0;
            }
            else {
                from = MathsUtils.toNumber(from);
                to = MathsUtils.toNumber(to, 1);
            }
            return rand() * (to - from) + from;
        };
    })(),

    /**
     * Convert a number to hexadecimal
     * @param {Number} number - Any number
     * @return {String}
     */
    toHexa (number) {
        return MathsUtils.round(number).toString(MathsUtils.RADIX.HEXA).toUpperCase();
    },

    /**
     * Convert from hexadecimal to integer
     * @param {String} hexa - Any valid hexa string
     * @return {Number}
     */
    toDeci (hexa) {
        return parseInt(hexa, MathsUtils.RADIX.HEXA);
    },
};
