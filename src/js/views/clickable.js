"use strict";
/* @exported Clickable */

/**
 * A class for a clickable element
 * @param {String} CSSClass - A custom css class to add
 * @param {String} text - Text inside the element
 * @param {Function} [action] - A function to call when clicked
 * @constructor
 * @extends View
 */
function Clickable (CSSClass, text, action) {
    this.text = text;
    this.timeout = null;
    this.super(CSSClass);

    this.setAction(action);
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
     * @param {Function} action - Any function to execute on click
     */
    setAction: function (action) {
        if (Utils.isFunction(action)) {
            this.html.addEventListener("click", action, true);
        }
    },
    /**
     * Tell if this clickable's cooldown is running
     * @return {Boolean}
     */
    isRunning: function () {
        return Boolean(this.timeout);
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
        this.html.tabIndex = enable ? 0 : -1;
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
     * @return {Number}
     */
    getElapsed: function () {
        return TimerManager.getElapsed(this.timeout);
    },
    /**
     * Return remaining time in the cooldown
     * @return {Number}
     */
    getRemaining: function () {
        return TimerManager.getRemaining(this.timeout);
    },
    /**
     * Define this clickable as a drop-down of other clickable
     * @param {Boolean} itIs - True to set it, false to reverse
     */
    setAsDropdown: function (itIs) {
        this.html.classList.toggle("dropdown", itIs);
    }
});
