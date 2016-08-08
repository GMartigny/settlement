"use strict";
/**
 * Class for events
 * @param data
 * @constructor
 */
function Event (data) {
    this.data = {};

    this.html = this.toHTML();

    this._init(data);
}
Event.prototype = {
    /**
     * Initialize object
     * @param data
     * @private
     * @return {Event} Itself
     */
    _init: function (data) {
        this.data = consolidateData(this, data, ["name", "desc", "time", "consume"]);

        this.html.textContent = this.data.name;
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
        return wrap("event");
    },
    /**
     * Start the event
     */
    start: function () {
        log("The " + this.data.name + " has started.");
        this.data.effect(true);

        if (this.data.time) {
            TimerManager.timeout(function () {
                this.data.effect(false);

                this.html.remove();
            }.bind(this), this.data.time * Game.hourToMs);
        }
    }
};
Event.LST_ID = "eventList";
