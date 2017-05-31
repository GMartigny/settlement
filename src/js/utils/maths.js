"use strict";
/* exported floor round ceil constrain random */

/**
 * Floor a number
 * @param {Number} x - Any number
 * @return {Number}
 */
function floor (x) {
    return x << 0;
}

/**
 * Round a number
 * @param {Number} x - Any number
 * @return {Number}
 */
function round (x) {
    return floor(x + 0.5);
}

/**
 * Ceil a number
 * @param {Number} x - Any number
 * @return {Number}
 */
function ceil (x) {
    return floor(x + 1);
}

/**
 * Return value constrained to lower and upper bounds
 * @param {Number} x - Any value
 * @param {Number} min - The lower bound
 * @param {Number} max - The upper bound
 * @return {Number}
 */
function constrain (x, min, max) {
    if (x < min) {
        return min;
    }
    else if (x > max) {
        return max;
    }
    else {
        return x;
    }
}

/**
 * Return a random number between marks
 * @param {Number} [from=0]
 * @param {Number} [to=1]
 * @return {*}
 */
var random = (function () {
    var rand = Math.random;

    return function (from, to) {
        if (isUndefined(to)) {
            if (isUndefined(from)) {
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
})();
