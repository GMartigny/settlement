"use strict";
/* exported Resource */

/**
 * Class for resources
 * @param {ID} id - The resource's id
 * @param {Number} [count=0] - The resource amount
 * @constructor
 * @extends Model
 */
function Resource (id, count) {
    this.count = 0;
    this.warnLack = false;

    this.super(id, count);
}
Resource.extends(Model, "Resource", /** @lends Resource.prototype */ {
    /**
     * Initialise object
     * @param {Number} count - The resource amount
     * @private
     */
    init: function (count) {
        if (count) {
            this.update(+count);
        }
        this.tooltip = new Tooltip(this.html, this.data);
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.counter = Utils.wrap("counter", "1", html);

        Utils.wrap("icon icon-" + this.data.icon, null, html);

        html.style.order = this.data.order;

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Map} [resources] - Game's resources
     */
    refresh: function (resources) {
        this.counter.textContent = this.get();
        if (Utils.isArray(this.data.consume) && resources) {
            this.tooltip.refresh(resources, this.data);
        }
    },
    /**
     * Change resource amount
     * @param {Number} amount - Diff to new value
     */
    update: function (amount) {
        var prevAmount = this.count;
        this.set(this.count + amount);

        if (MathsUtils.floor(prevAmount) !== MathsUtils.floor(this.count)) {
            var node = this.html;
            var toClear = false;
            if (amount > 0 && !node.classList.contains("more")) {
                node.classList.add("more");
                toClear = true;
            }
            else if (amount < 0 && !node.classList.contains("less")) {
                node.classList.add("less");
                toClear = true;
            }
            if (toClear) {
                var animationDuration = 700;
                TimerManager.timeout(node.classList.remove.bind(node.classList, "more", "less"), animationDuration);
            }
        }
    },
    /**
     * Return this resource amount
     * @return {Number}
     */
    get: function () {
        return MathsUtils.floor(this.count);
    },
    /**
     * Define this resource amount
     * @param {Number} value - A new amount
     */
    set: function (value) {
        this.count = value;
        if (this.count < 0) {
            throw new RangeError("Resources count can't be negative");
        }
        this.refresh();
    },
    /**
     * Check if has enough of this resource
     * @param {Number} amount - Amount needed
     * @returns {boolean}
     */
    has: function (amount) {
        return this.count > amount || this.count.equals(amount);
    },
    /**
     * Get this data in plain object
     * @returns {Object}
     */
    toJSON: function () {
        return [this.count, this.getId()];
    },
    /**
     * Format to string
     * @return {String}
     */
    toString: function () {
        return Resource.toString(this.data, this.count);
    }
});
/**
 * Format a resource to string without instantiation
 * @param {ResourceData} data - Data of the resource
 * @param {Number} [count] - The amount, ignored if not defined
 * @return {String}
 */
Resource.toString = function toString (data, count) {
    var str = "";
    if (!Utils.isUndefined(count)) {
        str += count + " ";
    }
    if (data.icon) {
        str += Resource.iconAsString(data.icon) + " ";
    }
    str += Utils.pluralize(data.name, count);
    return str;
};
/**
 * Give the HTML string for an icon name
 * @param {String} iconName - An icon name
 * @return {String}
 */
Resource.iconAsString = function iconAsString (iconName) {
    return Utils.wrap("icon icon-small-" + iconName).outerHTML;
};
Resource.LST_ID = "resourceList";
