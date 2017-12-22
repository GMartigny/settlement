"use strict";
/* exported MathsUtils */

var MathsUtils = {
    /**
     * Convert to a number
     * @param {*} x - Any value to convert
     * @param {Number} [fallback] - A fallback value if the first is NaN
     * @return {Number}
     */
    toNumber: function (x, fallback) {
        return Number(x) || fallback;
    },
    /**
     * Floor a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    floor: function (x) {
        // Bitshifting force number to integer
        return x << 0;
    },

    /**
     * Round a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    round: function (x) {
        return MathsUtils.floor(x + MathsUtils.sign(x) / 2);
    },

    /**
     * Ceil a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    ceil: function ceil (x) {
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
    sign: function (x) {
        return x < 0 ? -1 : 1;
    },

    /**
     * Apply a power to a number
     * @param {Number} x - Any number
     * @param {Number} n - Power to apply
     * @return {Number}
     */
    pow: Math.pow,

    /**
     * Square a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    sq: function (x) {
        return x * x;
    },

    /**
     * Get the square root of a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    sqrt: function (x) {
        return MathsUtils.pow(x, 0.5);
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
    diff: function (a, b) {
        return MathsUtils.abs(a - b);
    },

    /**
     * Return the average number for a set
     * @param {...Number} value - Number to compute
     * @return {Number}
     */
    average: function () {
        var length = arguments.length;
        if (!length) {
            throw new RangeError("Can't get mean from no value");
        }

        var sum = 0;
        for (var i = 0; i < length; ++i) {
            sum += arguments[i];
        }
        return sum / length;
    },

    /**
     * Return value constrained to lower and upper bounds
     * @param {Number} x - Any value
     * @param {Number} min - The lower bound
     * @param {Number} max - The upper bound
     * @return {Number}
     */
    constrain: function (x, min, max) {
        if (x < min) {
            return min;
        }
        else if (x > max) {
            return max;
        }
        else {
            return x;
        }
    },

    /**
     * Return a random number between marks
     * @param {Number} [from=0]
     * @param {Number} [to=1]
     * @return {Number}
     */
    random: (function iife () {
        var rand = Math.random;

        return function random (from, to) {
            if (Utils.isUndefined(to)) {
                if (Utils.isUndefined(from)) {
                    to = 1;
                }
                else {
                    to = MathsUtils.toNumber(from, 1);
                }
                from = 0;
            }
            else {
                from = MathsUtils.toNumber(from, 0);
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
    toHexa: function (number) {
        return MathsUtils.round(number).toString(16).toUpperCase();
    },

    /**
     * Convert from hexadecimal to integer
     * @param {String} hexa - Any valid hexa string
     * @return {Number}
     */
    toDeci: function (hexa) {
        return parseInt(hexa, 16);
    }
};
