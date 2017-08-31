"use strict";
/* exported Model */

/**
 * A base model for all
 * @param {ID} id - The object's id
 * @constructor
 */
function Model (id) {
    this.data = DataManager.get(id);
    this.html = this.toHTML();
    this.init.apply(this, Array.prototype.splice.call(arguments, 1));
}
Model.prototype = {
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
    getStraight: function () {
        return {
            id: this.data.id
        };
    }
};
