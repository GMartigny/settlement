"use strict";
/* exported Bar */

/**
 * Define a bar component
 * @param {String} CSSClass - A custom css class to add
 * @param {Number} [warningThreshold=0] - A threshold to trigger a warning animation
 * @constructor
 */
function Bar (CSSClass, warningThreshold) {
    this.value = null;
    this.threshold = warningThreshold || 0;
    this.super();
    this.html.classList.add.apply(this.html.classList, CSSClass.split(" "));
}
Bar.extends(Model, "Bar", /** @lends Bar.prototype */{
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.valueBar = Utils.wrap("value");
        html.appendChild(this.valueBar);

        return html;
    },
    /**
     * Set the bar width to a specific value
     * @param {Number} percentage - Any percentage between 0 and 100
     */
    set: function (percentage) {
        if (!percentage.equals(this.value)) {
            this.value = percentage;
            this.valueBar.style.width = percentage + "%";
            this.html.classList[percentage < this.threshold ? "add" : "remove"]("warning");
        }
    },
    /**
     * Animate the bar from fill to empty
     * @param {Number} time - Animation duration (ms)
     */
    run: function (time) {
        time = +time || 0;
        this.valueBar.style.animationDuration = time + "ms";
        this.html.classList.add("ongoing");
    }
});
