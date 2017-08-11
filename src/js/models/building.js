"use strict";
/* exported Building */

/**
 * Class for buildings
 * @param {BuildingData} data - The building's data
 * @constructor
 */
function Building (data) {
    this.super(data);
}
Building.extends(Model, "Building", /** @lends Building.prototype */ {
    toHTML: noop
});
