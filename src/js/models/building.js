"use strict";
/**
 * Class for buildings
 * @param {Object} data - The building's data
 * @constructor
 */
function Building (data) {
    this.number = 0;

    this._init(data);

    this.add(1);
}
Building.prototype = {
    /**
     * Initialise object
     * @param {Object} data - The building's data
     * @private
     * @return {Building} Itself
     */
    _init: function (data) {
        this.data = consolidateData(this, data, ["name", "desc", "time", "consume"]);

        this.html = this.toHTML();
        if (this.tooltip) {
            this.tooltip.remove();
        }
        tooltip(this.html, this.data);

        return this;
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        this.counter = wrap("counter");
        var html = wrap("building", capitalize(this.data.name));
        html.appendChild(this.counter);
        return html;
    },
    /**
     * Add more of this building
     * @param {Number} number - An amount to add
     * @return {Building} Itself
     */
    add: function (number) {
        this.number += number;
        this.counter.textContent = this.number;
        return this;
    }
};
Building.LST_ID = "buildingsList";
