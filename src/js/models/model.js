"use strict";
/* exported Model */

/**
 * A base model for all
 * @param {ID} id - The object's id
 * @constructor
 * @extends View
 */
function Model (id) {
    this.data = DataManager.get(id);
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(null); // No special CSS class
    Model.prototype.super.apply(this, args);
}
Model.extends(View, "Model", /** @lends Model.prototype */ {
    toJSON: function () {
        return {
            id: this.data.id
        };
    }
});
