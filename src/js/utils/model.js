"use strict";
/* exported Model */

/**
 * A base model for all
 * @param {UniqueData} data - The object's data
 * @constructor
 */
function Model (data) {
    this.data = data;
    this.html = this.toHTML();
    this.init.apply(this, Array.prototype.splice.call(arguments, 1));
}
Model.prototype = {
    /**
     * Initialise the object (fill missing data and prepare properties)
     */
    init: noop,
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        return wrap(this.modelName);
    },
    getStraight: function () {
        return {
            data: this.data
        };
    }
};
