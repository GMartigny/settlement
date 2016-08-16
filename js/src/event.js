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
        return wrap("event, animated");
    },
    /**
     * Start the event
     * @return {boolean} Is event running
     */
    start: function (callback) {
        log("The " + this.data.name + " has started.");

        popup(this.data, function () {
            // Effect
            this.data.effect(true);

            if (this.data.time) {
                MessageBus.getInstance().notify(MessageBus.MSG_TYPES.EVENT_START, this);
                var duration = this.data.time * Game.hourToMs;

                this.html.style.animationDuration = duration + "ms";
                this.html.classList.add("ongoing");

                TimerManager.timeout(function () {
                    this.data.effect(false);
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.EVENT_END, this);

                    this.html.remove();
                }.bind(this), duration);
                callback(this);
            }
        }.bind(this), "event");
        return !!this.data.time;
    }
};
Event.LST_ID = "eventList";
