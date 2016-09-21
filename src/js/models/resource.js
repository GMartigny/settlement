"use strict";
/**
 * Class for resources
 * @param {Object} data - The resource's data
 * @param {Number} [count=0] - The resource amount
 * @constructor
 */
function Resource (data, count) {
    this.data = {};

    this.html = this.toHTML(data);

    this._init(data);

    this.count = 0;
    if (count) {
        this.update(+count);
    }
}
Resource.prototype = {
    /**
     * Initialise object
     * @param {Object} data - The resource's data
     * @private
     * @returns {Resource} Itself
     */
    _init: function (data) {
        this.data = consolidateData(this, data, ["name", "desc", "consume"]);

        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = tooltip(this.html, this.data);

        return this;
    },
    /**
     * Return HTML for display
     * @param {Object} data - The resource's data
     * @return {HTMLElement}
     */
    toHTML: function (data) {
        var html = wrap("resource get-more");

        this.counter = wrap("counter", 1);
        html.appendChild(this.counter);

        var icon = wrap("icon icon-" + data.icon);
        html.appendChild(icon);

        html.style.order = data.order;

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Array} resources - Game's resources
     * @return {Resource} Itself
     */
    refresh: function (resources) {
        this.counter.textContent = floor(this.count);
        if (resources && isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
        }
        return this;
    },
    /**
     * Change resource amount
     * @param {Number} amount - Diff to new value
     * @return {Resource} Itself
     */
    update: function (amount) {
        this.set(this.count + amount);

        var cb = false;
        if (amount > 0 && !this.html.classList.contains("more")) {
            this.html.classList.add("more");
            cb = function () {
                this.html.classList.remove("more");
            }.bind(this);
        }
        else if (amount < 0 && !this.html.classList.contains("less")) {
            this.html.classList.add("less");
            cb = function () {
                this.html.classList.remove("less");
            }.bind(this);
        }
        if (cb) {
            TimerManager.timeout(cb, 700);
        }
        return this;
    },
    /**
     * Return this resource amount
     * @return {Number}
     */
    get: function () {
        return this.count | 0;
    },
    /**
     * Define this resource amount
     * @param {Number} value - A new amount
     * @return {Resource} Itself
     */
    set: function (value) {
        this.count = value;
        if (this.count < 0) {
            throw "Resources count can't be negative";
        }
        return this.refresh();
    },
    /**
     * Check if has enough of this resource
     * @param {Number} amount - Amount needed
     * @returns {boolean}
     */
    has: function (amount) {
        return this.count >= amount;
    },
    getState: function () {
        return {
            count: this.count,
            data: this.data
        };
    }
};
Resource.LST_ID = "resourceList";