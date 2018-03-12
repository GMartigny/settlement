"use strict";
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
Bar.extends(View, "Bar", /** @lends Bar.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this._nodes = [];
        for (var i = 0; i < 2; ++i) {
            this._nodes.push({
                clip: Utils.wrap("clip", null, html),
                bar: Utils.wrap("part", null, clip)
            });
        }

        this.valueNode = Utils.wrap("value", "0%", html);

        return html;
    },
    setColor: function (color) {
        this._nodes.forEach(function (node) {
            node.bar.style.backgroundColor = color;
        });
    },
    /**
     * Set the bar width to a specific value
     * @param {Number} percentage - Any percentage between 0 and 100
     */
    set: function (percentage) {
        if (!percentage.equals(this.value)) {
            this.value = percentage;
            var degree = percentage * (360 / 100);
            this._nodes.forEach(function (node) {
                node.bar.style.transform = "rotate3d(0, 0, 1, " + (degree / 2 - 0.5) + ")";
            });
            this.valueNode.textContent = MathsUtils.floor(percentage) + "%";
            this.html.classList[percentage < this.threshold ? "add" : "remove"]("warning");
        }
    }
});
