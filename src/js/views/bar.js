/* exported Bar */

/**
 * Define a bar component
 * @param {String} CSSClass - A custom css class to add
 * @param {String} [color] - This bar color (not required, but very advised)
 * @param {Number} [warningThreshold=0] - A threshold to trigger a warning animation
 * @constructor
 * @extends View
 */
function Bar (CSSClass, color, warningThreshold = 0) {
    this.value = null;
    this.threshold = warningThreshold;
    this.super(CSSClass);
    this.setColor(color);
}
Bar.extends(View, "Bar", /** @lends Bar.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();

        this.valueBar = Utils.wrap("value", null, html);

        return html;
    },
    setColor (color) {
        const backgroundOpacity = 0.2;
        this.html.style.backgroundColor = ColorsUtils.fade(color, backgroundOpacity);
        this.valueBar.style.backgroundColor = color;
    },
    /**
     * Set the bar width to a specific value
     * @param {Number} percentage - Any percentage between 0 and 100
     */
    set (percentage) {
        if (!percentage.equals(this.value)) {
            this.value = percentage;
            this.valueBar.style.width = `${percentage}%`;
            this.html.classList[percentage < this.threshold ? "add" : "remove"]("warning");
        }
    },
    /**
     * Animate the bar from fill to empty
     * @param {Number} [time=0] - Animation duration (ms)
     */
    run (time = 0) {
        this.valueBar.style.animationDuration = `${MathsUtils.toNumber(time)}ms`;
        this.html.classList.add("ongoing");
    },
});
