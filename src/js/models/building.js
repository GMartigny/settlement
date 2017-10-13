"use strict";
/* exported Building */

/**
 * Class for buildings
 * @param {ID} id - The building's id
 * @constructor
 */
function Building (id) {
    this.super(id);
}
Building.extends(Model, "Building", /** @lends Building.prototype */ {
    toHTML: Utils.noop,
    /**
     * Initialize object
     * @private
     */
    init: function () {
        if (this.data.lock) {
            MessageBus.notify(MessageBus.MSG_TYPES.LOCK, this.data.lock);
        }
        if (this.data.unlock) {
            MessageBus.notify(MessageBus.MSG_TYPES.UNLOCK, this.data.unlock);
        }
    }
});
