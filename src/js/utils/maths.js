"use strict";
/* exported MathUtils */

var MathUtils = {
    /**
     * Floor a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    floor: function (x) {
        return x << 0;
    },

    /**
     * Round a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    round: function (x) {
        return MathUtils.floor(x + 0.5);
    },

    /**
     * Ceil a number
     * @param {Number} x - Any number
     * @return {Number}
     */
    ceil: function ceil (x) {
        return MathUtils.floor(x + 1);
    },

    abs: Math.abs,

    /**
     * Return the absolute difference between two number
     * @param {Number} a - Any number
     * @param {Number} b - Any number
     * @returns {Number}
     */
    diff: function (a, b) {
        return MathUtils.abs(a - b);
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
     * @return {*}
     */
    random: (function iife () {
        var rand = Math.random;

        return function random (from, to) {
            if (Utils.isUndefined(to)) {
                if (Utils.isUndefined(from)) {
                    to = 1;
                }
                else {
                    to = +from || 1;
                }
                from = 0;
            }
            else {
                from = +from || 0;
                to = +to || 1;
            }
            return rand() * (to - from) + from;
        };
    })()
};
