/* exported ColorsUtil Color */

/**
 * Model of a color
 * @param {String} rgb - Hexadecimal rgb representation
 * @constructor
 */
function Color (rgb) {
    rgb = rgb.replace("#", "");
    var split = [];
    var length = rgb.length;
    var precision = length < 6 ? 1 : 2;

    for (var i = 0; i < length; i += precision) {
        split.push(MathsUtils.toDeci(rgb.substr(i, precision)) * (precision === 1 ? 17 : 1));
    }

    this.r = split[0];
    this.g = split[1];
    this.b = split[2];
    this.a = 1;
}
Color.prototype = {
    /**
     * Fade this color to a specified opacity
     * @param {Number} opacity - An opacity number between 0 and 1
     * @returns {Color} Itself
     */
    fade: function (opacity) {
        this.a = MathsUtils.constrain(opacity, 0, 1);
        return this;
    },
    /**
     * Turn this color into its grey value
     * @returns {Color} Itself
     */
    grey: function () {
        this.r = this.g = this.b = MathsUtils.average(this.r, this.g, this.b);
        return this;
    },
    /**
     * Return hexadecimal format
     * @returns {String}
     */
    toHexa: function () {
        var hex = MathsUtils.toHexa;
        var pad = String.prototype.padStart;
        var args = [2, "0"];
        return "#" + pad.apply(hex(this.r), args) + pad.apply(hex(this.g), args) + pad.apply(hex(this.b), args);
    },
    /**
     * Return rgb format
     * @returns {String}
     */
    toRGB: function () {
        return "rgb(" + [this.r, this.g, this.b].join(", ") + ")";
    },
    /**
     * Return rgba format
     * @returns {String}
     */
    toRGBA: function () {
        return "rgba(" + [this.r, this.g, this.b, this.a].join(", ") + ")";
    },
    /**
     * Stringify this color
     * @returns {String}
     */
    toString: function () {
        return this.a < 1 ? this.toRGBA() : this.toHexa();
    }
};

var ColorsUtil = {
    /**
     * Fade a color to an opacity
     * @param {String} rgb - RGB Hexa representation of a color
     * @param {Number} opacity - An opacity number between 0 and 1
     * @returns {String}
     */
    fade: function fade (rgb, opacity) {
        return (new Color(rgb)).fade(opacity).toString();
    },
    /**
     * Turn a color into its grey value
     * @param {String} rgb - RGB Hexa representation of a color
     * @returns {String}
     */
    grey: function (rgb) {
        return (new Color(rgb)).grey().toString();
    }
};
