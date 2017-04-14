/**
 * A base model for all
 * @param {Data} data
 * @constructor
 */
function Model (data) {
    this.data = data;
    this.html = this.toHTML();
    this._init();
}
Model.prototype = {
    /**
     * Initialise the object (fill missing data and prepare properties)
     */
    _init: function () {
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        return wrap(this.constructor.name);
    }
};