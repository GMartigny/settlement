"use strict";
/* @exported Clickable */

/**
 * @typedef {Object} ClickableData
 * @prop {String} name - Text inside the button
 * @prop {Function|Array<ClickableData>} [action] - Function to call on click or a list
 */

/**
 * A class for a clickable element
 * @param {String} CSSClass - A custom css class to add
 * @param {ClickableData} data - Data of this button
 * @constructor
 * @extends View
 */
function Clickable (CSSClass, data) {
    this.timeout = null;
    this.setData(data);
    this.super(CSSClass);
}
Clickable.extends(View, "Clickable", /** @lends Clickable.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     * @override
     */
    toHTML: function () {
        var html = this._toHTML();

        html.textContent = this.text;
        html.tabIndex = 0;

        return html;
    },
    /**
     * Start a cool-down animation
     * @param {Number} duration - Total duration of the animation
     * @param {Number} consumed - Already consumed time in the animation
     * @param {Function} action - 
     */
    startCoolDown: function (duration, consumed, action) {
        var self = this;
        this.html.style.animationDuration = duration + "ms";
        this.html.style.animationDelay = (-consumed) + "ms";
        this.html.classList.add("cooldown");

        this.timeout = TimerManager.timeout(function clickableTimeout () {
            self.endCoolDown();
            action();
        }, (duration - consumed));
    },
    /**
     * Define the action for the button
     * @param {ClickableData} data - Any function to execute on click or a list
     */
    setData: function (data) {
        this.text = data.name;

        // There's options
        if (Utils.isArray(data.action)) {
            this.html.classList.add("dropdown");
            this.optionsWrapper = Utils.wrap("options");
            this.optionsWrapper.hide();

            this.html.addEventListener("mouseover", this.showOptions, true);
            this.html.addEventListener("mouseout", this.hideOption, true);
        }
        else if (Utils.isFunction(data.action)) {
            this.html.addEventListener("click", data.action, true);
        }
    },
    showOptions: function () {
        this.optionsWrapper.show();
        var position = this.html.getBoundingClientRect();
        this.optionsWrapper.style.top = (position.top + position.height) + "px";
        this.optionsWrapper.style.left = position.left + "px";
    },
    hideOption: function () {
        this.optionsWrapper.hide();
        this.optionsWrapper.style.left = "";
    },
    /**
     *
     * @returns {Boolean}
     */
    isRunning: function () {
        return !!this.timeout;
    },
    /**
     * End the cool-down animation
     */
    endCoolDown: function () {
        if (this.isRunning()) {
            TimerManager.clear(this.timeout);
            this.timeout = null;

            this.html.style.animationDuration = "";
            this.html.style.animationDelay = "";
            this.html.classList.remove("cooldown");
        }
    },
    /**
     * Toggle its disabled state
     * @param {Boolean} enable - Set to true to enable it and false to disable
     */
    toggle: function (enable) {
        this.html.classList.toggle("disabled", !enable);
    },
    /**
     * Change the clickable text
     * @param {String} text - Any string
     */
    setText: function (text) {
        this.text = text;
        this.html.textContent = text;
    },
    /**
     * Return elapsed time of the cooldown
     * @returns {Number}
     */
    getElapsed: function () {
        return TimerManager.getElapsed(this.timeout);
    },
    /**
     * Return remaining time in the cooldown
     * @returns {Number}
     */
    getRemaining: function () {
        return TimerManager.getRemaining(this.timeout);
    }
});
