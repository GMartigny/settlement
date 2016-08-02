"use strict";
/**
 * Class for resources
 * @param data
 * @param count
 * @constructor
 */
function Resource (data, count) {
    this._init(data);

    this.count = 0;
    if (count) {
        this.update(+count);
    }
}
Resource.prototype = {
    /**
     * Initialise object
     * @param data
     * @private
     * @returns {Resource} Itself
     */
    _init: function (data) {
        this.data = clone(data);
        this.consolidateData();

        this.html = this.toHTML();
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = tooltip(this.html, this.data);

        return this;
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = wrap("resource get-more");

        this.counter = wrap("counter", 1);
        html.appendChild(this.counter);

        var icon = wrap("icon");
        var pos = "16px 16px";
        if (isArray(this.data.icon)) {
            pos = (-this.data.icon[0] * 16) + "px " + (-this.data.icon[1] * 16) + "px";
        }
        icon.style.backgroundPosition = pos;
        html.appendChild(icon);

        return html;
    },
    /**
     * Define data values
     * @returns {Resource} Itself
     */
    consolidateData: function () {
        var data = this.data;
        if (isFunction(data.consume)) {
            data.consume = data.consume(this);
        }
        return this;
    },
    /**
     * Loop function called every game tick
     * @param resources
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
     * @param amount Diff to new value
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
     * @return {number|*}
     */
    get: function () {
        return this.count | 0;
    },
    /**
     * Define this resource amount
     * @param value
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
     * @param amount Amount needed
     * @returns {boolean}
     */
    has: function (amount) {
        return this.count >= amount;
    }
};
Resource.LST_ID = "resourceList";
