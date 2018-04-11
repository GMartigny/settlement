/* exported Gauge */

/**
 * Define a gauge component
 * @param {String} CSSClass - A custom css class to add
 * @param {String} [color] - This bar color (not required, but very advised)
 * @param {Number} [warningThreshold=0] - A threshold to trigger a warning animation
 * @constructor
 * @extends View
 */
function Gauge (CSSClass, color, warningThreshold) {
    this.value = null;
    this.threshold = warningThreshold || 0;
    this.super(CSSClass);
    this.setColor(color);
}
Gauge.extends(View, "Bar", /** @lends Bar.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();

        this._nodes = [];
        for (let i = 0; i < 2; ++i) {
            const clip = Utils.wrap("clip", null, html);
            this._nodes.push({
                clip,
                bar: Utils.wrap("part", null, clip),
            });
        }

        this.valueNode = Utils.wrap("value", "0%", html);

        return html;
    },
    setColor (color) {
        this._nodes.forEach(node => node.bar.style.backgroundColor = color);
    },
    /**
     * Set the bar width to a specific value
     * @param {Number} percentage - Any percentage between 0 and 100
     */
    set (percentage) {
        if (!percentage.equals(this.value)) {
            this.value = percentage;
            const degree = percentage * (360 / 100);
            this._nodes.forEach(node => node.bar.style.transform = `rotate3d(0, 0, 1, ${(degree / 2) - 0.5})`);
            this.valueNode.textContent = `${MathsUtils.floor(percentage)}%`;
            this.html.classList[percentage < this.threshold ? "add" : "remove"]("warning");
        }
    },
});
