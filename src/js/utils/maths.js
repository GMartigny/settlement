/**
 * Floor a number
 * @param {Number} x
 * @return {Number}
 */
function floor (x) {
    return x << 0;
}

/**
 * Round a number
 * @param {Number} x
 * @return {Number}
 */
function round (x) {
    return floor(x + 0.5);
}

/**
 * Ceil a number
 * @param {Number} x
 * @return {Number}
 */
function ceil (x) {
    return floor(x + 1);
}

/**
 * Return a random number between marks
 * @param {Number} [from=0]
 * @param {Number} [to=1]
 * @return {*}
 */
var random = (function () {
    var RAND = Math.random;

    return function (from, to) {
        from = +from || 0;
        if (to === undefined) {
            if (from === 0) {
                to = 1;
            }
            else {
                to = from;
            }
            from = 0;
        }
        else {
            to = +to;
        }
        return RAND() * (to - from) + from;
    };
})();
