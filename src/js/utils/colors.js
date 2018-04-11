/* exported ColorsUtils Color */

/**
 * Model of a color
 * @param {String} rgb - Hexadecimal rgb representation
 * @constructor
 */
function Color (rgb) {
    rgb = rgb.replace("#", "");
    const RGBSplit = 3;
    const precision = MathsUtils.floor(rgb.length / RGBSplit);

    const radix = MathsUtils.RADIX.HEXA;
    const growingRatio = (radix + 1) / ((1 / (radix - 1)) * ((radix ** precision) - 1)); // "C" => "CC", "CCC" => "CC"
    let i = 0;
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
    fade (opacity) {
        this.a = MathsUtils.constrain(opacity, 0, 1);
        return this;
    },
    /**
     * Turn this color into its grey value
     * @return {Color} Itself
     */
    grey () {
        const average = MathsUtils.average(this.r, this.g, this.b);
        this.r = average;
        this.g = average;
        this.b = average;
        return this;
    },
    /**
     * Return hexadecimal format
     * @return {String}
     */
    toHexa () {
        const hex = MathsUtils.toHexa;
        return `#${hex(this.r).padStart(2, "0")}${hex(this.g).padStart(2, "0")}${hex(this.b).padStart(2, "0")}`;
    },
    /**
     * Return rgb format
     * @return {String}
     */
    toRGB () {
        return `rgb(${[this.r, this.g, this.b].join(", ")})`;
    },
    /**
     * Return rgba format
     * @return {String}
     */
    toRGBA () {
        return `rgba(${[this.r, this.g, this.b, this.a].join(", ")})`;
    },
    /**
     * Stringify this color
     * @return {String}
     */
    toString () {
        return this.a < 1 ? this.toRGBA() : this.toHexa();
    },
};

const ColorsUtils = {
    /**
     * Fade a color to an opacity
     * @param {String} rgb - RGB Hexa representation of a color
     * @param {Number} opacity - An opacity number between 0 and 1
     * @return {String}
     */
    fade (rgb, opacity) {
        return (new Color(rgb)).fade(opacity).toString();
    },
    /**
     * Turn a color into its grey value
     * @param {String} rgb - RGB Hexa representation of a color
     * @return {String}
     */
    grey (rgb) {
        return (new Color(rgb)).grey().toString();
    },
};
