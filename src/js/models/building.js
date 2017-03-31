"use strict";
/**
 * Class for buildings
 * @param {Object} data - The building's data
 * @constructor
 */
function Building (data) {
    this._init(data);
}
Building.prototype = {
    /**
     * Initialise object
     * @param {Object} data - The building's data
     * @private
     */
    _init: function (data) {
        this.data = consolidateData(this, data, ["name", "desc", "time", "energy", "consume"]);
    }
};
