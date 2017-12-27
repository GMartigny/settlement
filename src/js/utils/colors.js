/* exported ColorsUtils Color */

/**
 * Model of a color
 * @param {String} rgb - Hexadecimal rgb representation
 * @constructor
 */
function Color (rgb) {
    rgb = rgb.replace("#", "");
    var RGBSplit = 3;
    var precision = MathsUtils.floor(rgb.length / RGBSplit);

    var radix = MathsUtils.RADIX.HEXA;
    var growingRatio = (radix + 1) / ((1 / (radix - 1)) * (MathsUtils.pow(radix, precision) - 1)); // "C" => "CC", "CCC" => "CC"
    var i = 0;
    this.r = MathsUtils.round(MathsUtils.toDeci(rgb.substr((i++) * precision, precision)) * growingRatio);
    this.g = MathsUtils.round(MathsUtils.toDeci(rgb.substr((i++) * precision, precision)) * growingRatio);
    this.b = MathsUtils.round(MathsUtils.toDeci(rgb.substr((i) * precision, precision)) * growingRatio);
    this.a = 1;
}
Color.prototype = {
    /**
     * Fade this color to a specified opacity
     * @param {Number} opacity - An opacity number between 0 and 1
     * @return {Color} Itself
     */
    fade: function (opacity) {
        this.a = MathsUtils.constrain(opacity, 0, 1);
        return this;
    },
    /**
     * Turn this color into its grey value
     * @return {Color} Itself
     */
    grey: function () {
        this.r = this.g = this.b = MathsUtils.average(this.r, this.g, this.b);
        return this;
    },
    /**
     * Return hexadecimal format
     * @return {String}
     */
    toHexa: function () {
        var hex = MathsUtils.toHexa;
        var pad = String.prototype.padStart;
        var args = [2, "0"];
        return "#" + pad.apply(hex(this.r), args) + pad.apply(hex(this.g), args) + pad.apply(hex(this.b), args);
    },
    /**
     * Return rgb format
     * @return {String}
     */
    toRGB: function () {
        return "rgb(" + [this.r, this.g, this.b].join(", ") + ")";
    },
    /**
     * Return rgba format
     * @return {String}
     */
    toRGBA: function () {
        return "rgba(" + [this.r, this.g, this.b, this.a].join(", ") + ")";
    },
    /**
     * Stringify this color
     * @return {String}
     */
    toString: function () {
        return this.a < 1 ? this.toRGBA() : this.toHexa();
    }
};

var ColorsUtils = {
    /**
     * Fade a color to an opacity
     * @param {String} rgb - RGB Hexa representation of a color
     * @param {Number} opacity - An opacity number between 0 and 1
     * @return {String}
     */
    fade: function fade (rgb, opacity) {
        return (new Color(rgb)).fade(opacity).toString();
    },
    /**
     * Turn a color into its grey value
     * @param {String} rgb - RGB Hexa representation of a color
     * @return {String}
     */
    grey: function (rgb) {
        return (new Color(rgb)).grey().toString();
    }
};
