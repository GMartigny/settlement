"use strict";
/* exported Resource */

/**
 * Class for resources
 * @param {ResourceData} data - The resource's data
 * @param {Number} [count=0] - The resource amount
 * @constructor
 */
function Resource (data, count) {
    this.count = 0;
    this.warnLack = false;

    this.super(data, count);
}
Resource.extends(Model, "Resource", /** @lends Resource.prototype */ {
    /**
     * Initialise object
     * @param {Number} count - The resource amount
     * @private
     */
    _init: function (count) {
        if (count) {
            this.update(+count);
        }
        var data = consolidateData(this, this.data, ["consume"]);
        this.tooltip = new Tooltip(this.html, data);
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.counter = wrap("counter", "1");
        html.appendChild(this.counter);

        var icon = wrap("icon icon-" + this.data.icon);
        html.appendChild(icon);

        html.style.order = this.data.order;

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Collection} [resources] - Game's resources
     */
    refresh: function (resources) {
        this.counter.textContent = floor(this.count);
        if (resources && isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
        }
    },
    /**
     * Change resource amount
     * @param {Number} amount - Diff to new value
     */
    update: function (amount) {
        var prevAmount = this.count;
        this.set(this.count + amount);

        if (floor(prevAmount) !== floor(this.count)) {
            var cb;
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
            if (isFunction(cb)) {
                TimerManager.timeout(cb, 700);
            }
        }
    },
    /**
     * Return this resource amount
     * @return {Number}
     */
    get: function () {
        return round(this.count);
    },
    /**
     * Define this resource amount
     * @param {Number} value - A new amount
     * @return {Resource} Itself
     */
    set: function (value) {
        this.count = value;
        if (this.count < 0) {
            throw new RangeError("Resources count can't be negative");
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
    /**
     * Format to string
     * @return {string}
     */
    toString: function () {
        var str = this.count + " " + pluralize(this.data.name, this.count);
        if (this.data.icon) {
            str += " " + Resource.iconAsString(this.data.icon);
        }
        return str;
    }
});
/**
 * Give the HTML string for an icon name
 * @param {String} iconName - An icon name
 * @return {String}
 */
Resource.iconAsString = function (iconName) {
    return wrap("icon icon-small-" + iconName).outerHTML;
};
Resource.LST_ID = "resourceList";
