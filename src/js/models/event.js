"use strict";
/**
 * Class for events
 * @param {EventData} data - The event data
 * @constructor
 */
function Event (data) {
    this.timer = null;
    this.nameNode = null;
    this.progressBar = null;
    this.tooltip = null;

    this.super(data);
}
Event.extends(Model, "Event", /** @lends Event.prototype */ {
    /**
     * Initialize object
     * @private
     */
    _init: function () {
        var data = consolidateData(this, this.data, ["time", "consume"]);

        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = new Tooltip(this.html, data);
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.nameNode = wrap("name", capitalize(this.data.name));
        html.appendChild(this.nameNode);
        this.progressBar = wrap("animated bar");
        html.appendChild(this.progressBar);

        return html;
    },
    /**
     * Start the event
     * @param {Function} callback - A function to execute on start
     * @return {boolean} Is event running
     */
    start: function (callback) {
        popup(this.data, function () {
            // Effect
            this.data.effect(true);

            if (this.data.time) {
                MessageBus.notify(MessageBus.MSG_TYPES.EVENT_START, this);
                var duration = this.data.time * GameController.tickLength;

                if (this.data.deltaTime) {
                    duration += random(-this.data.deltaTime, this.data.deltaTime);
                }

                this.progressBar.style.animationDuration = duration + "ms";
                this.html.classList.add("ongoing");

                this.timer = TimerManager.timeout(this.end.bind(this), duration);
            }
            callback && callback(this);
        }.bind(this), "event");
        return !!this.data.time;
    },
    /**
     * End the event
     */
    end: function () {
        this.data.effect(false);
        this.timer = null;
        MessageBus.notify(MessageBus.MSG_TYPES.EVENT_END, this);

        this.html.remove();
    }
});
Event.LST_ID = "eventList";
