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
     * @param {Function} [afterShow] - Callback to call after show transition's done
     */
    show: function (afterShow) {
        if (afterShow) {
            var self = this;
            var wrapperAfterShow = function () {
                afterShow.call(self);
                self.html.removeEventListener("transitionend", wrapperAfterShow);
            };
            if (this.html.getStyle("transition")) {
                this.html.addEventListener("transitionend", wrapperAfterShow);
            }
            else {
                wrapperAfterShow.defer();
            }
        }

        this.html.show();
    },
    /**
     * Hide the widget
     * @param {Function} [afterHide] - Callback to call after hide transition's done
     */
    hide: function (afterHide) {
        if (afterHide) {
            var self = this;
            var wrapperAfterHide = function () {
                afterHide.call(self);
                self.html.removeEventListener("transitionend", wrapperAfterHide);
            };
            if (this.html.getStyle("transition")) {
                this.html.addEventListener("transitionend", wrapperAfterHide);
            }
            else {
                wrapperAfterHide.defer();
            }
        }

        this.html.hide();
    },
    /**
     * Remove the view from the DOM
     */
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
