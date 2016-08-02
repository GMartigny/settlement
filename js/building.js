"use strict";
/**
 * Class for buildings
 * @param data
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
     * @param data
     * @private
     * @return {Building} Itself
     */
    _init: function (data) {
        this.data = clone(data);
        this.consolidateData();

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
        var html = wrap("building", this.data.name);
        html.appendChild(this.counter);
        return html;
    },
    /**
     * Define data values
     * @return {Building} Itself
     */
    consolidateData: function () {
        var data = this.data;
        if (isFunction(data.name)) {
            data.name = data.name(this);
        }
        if (isFunction(data.desc)) {
            data.desc = data.desc(this);
        }
        if (isFunction(data.time)) {
            data.time = data.time(this);
        }
        if (isFunction(data.consume)) {
            data.consume = data.consume(this);
        }
        return this;
    },
    /**
     * Add more of this building
     * @param number An amount to add
     * @return {Building} Itself
     */
    add: function (number) {
        this.number += number;
        this.counter.textContent = this.number;
        return this;
    }
};
Building.LST_ID = "buildingsList";
