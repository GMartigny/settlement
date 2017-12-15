"use strict";
/* exported View */

/**
 * A base model for all widget
 * @param {String} CSSClass - A custom css class to add
 * @constructor
 */
function View (CSSClass) {
    this.html = View.enableHTML ? this.toHTML() : null;
    if (CSSClass) {
        this.html.classList.add.apply(this.html.classList, CSSClass.split(" "));
    }
    this.init.apply(this, Array.prototype.slice.call(arguments, 1));
}

View.extends(null, "View", /** @lends View.prototype */ {
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
    },
    /**
     * Show the widget
     */
    show: function () {
        this.html.show();
    },
    /**
     * Hide the widget
     */
    hide: function () {
        this.html.hide();
    },
    remove: function () {
        this.html.remove();
    }
});

View.static({
    /**
     * Does the view bother to create its html element
     */
    enableHTML: true,
});
