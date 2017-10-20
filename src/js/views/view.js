"use strict";
/* exported View */

/**
 * A base model for all
 * @param {String} CSSClass - A custom css class to add
 * @constructor
 */
function View (CSSClass) {
    this.html = this.toHTML();
    if (CSSClass) {
        this.html.classList.add.apply(this.html.classList, CSSClass.split(" "));
    }
    this.init.apply(this, Array.prototype.slice.call(arguments, 1));
}
View.extends(Object, "View", {
    /**
     * Initialise the object (fill missing data and prepare properties)
     */
    init: Utils.noop,
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        return Utils.wrap(this.modelName);
    }
});
