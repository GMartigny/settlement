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

        this.counter = Utils.wrap("counter", "1");
        html.appendChild(this.counter);

        var icon = Utils.wrap("icon icon-" + this.data.icon);
        html.appendChild(icon);

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

        if (MathUtils.floor(prevAmount) !== MathUtils.floor(this.count)) {
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
        return MathUtils.floor(this.count);
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
        return this.count > amount || this.count.equals(amount);
    },
    /**
     * Get this data in plain object
     * @returns {Object}
     */
    toJSON: function () {
        return [this.count, this.data.id];
    },
    /**
     * Format to string
     * @param {Boolean} [withoutCount=false] -
     * @return {string}
     */
    toString: function (withoutCount) {
        var str = "";
        if (!withoutCount) {
            str += this.count + " ";
        }
        if (this.data.icon) {
            str += Resource.iconAsString(this.data.icon) + " ";
        }
        str += Utils.pluralize(this.data.name, this.count);
        return str;
    }
});
/**
 * Give the HTML string for an icon name
 * @param {String} iconName - An icon name
 * @return {String}
 */
Resource.iconAsString = function (iconName) {
    return Utils.wrap("icon icon-small-" + iconName).outerHTML;
};
Resource.LST_ID = "resourceList";
