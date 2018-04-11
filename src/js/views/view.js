/* exported View */

/**
 * A base model for all widget
 * @param {String} CSSClass - A custom css class to add
 * @param {...*} [params] - More params passed to init function
 * @constructor
 */
function View (CSSClass, ...params) {
    this.html = View.enableHTML ? this.toHTML() : null;
    if (CSSClass) {
        this.html.classList.add(...CSSClass.split(" "));
    }
    this.isShow = true;
    this.init(...params);
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
    toHTML () {
        return Utils.wrap(this.modelName);
    },
    /**
     * Show the widget
     * @param {Function} [afterShow] - Callback to call after show transition's done
     */
    show (afterShow) {
        if (Utils.isFunction(afterShow)) {
            const wrapperAfterShow = () => {
                afterShow.call(this);
                this.html.removeEventListener("transitionend", wrapperAfterShow);
            };
            if (this.html.getStyle("transition")) {
                this.html.addEventListener("transitionend", wrapperAfterShow);
            }
            else {
                wrapperAfterShow.defer();
            }
        }

        this.html.show();
        this.isShow = true;
    },
    /**
     * Hide the widget
     * @param {Function} [afterHide] - Callback to call after hide transition's done
     */
    hide (afterHide) {
        if (Utils.isFunction(afterHide)) {
            const wrapperAfterHide = () => {
                afterHide.call(this);
                this.html.removeEventListener("transitionend", wrapperAfterHide);
            };
            if (this.html.getStyle("transition")) {
                this.html.addEventListener("transitionend", wrapperAfterHide);
            }
            else {
                wrapperAfterHide.defer();
            }
        }

        this.html.hide();
        this.isShow = false;
    },
    /**
     * Remove the view from the DOM
     */
    remove () {
        this.html.remove();
    },
});

View.static({
    /**
     * Does the view bother to create its html element
     */
    enableHTML: true,
});
