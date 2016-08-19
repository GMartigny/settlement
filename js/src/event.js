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

        this.nameNode.textContent = this.data.name;
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
        var html = wrap("event");

        this.nameNode = wrap("name");
        html.appendChild(this.nameNode);
        this.progressBar = wrap("animated bar");
        html.appendChild(this.progressBar);

        return html;
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

                this.progressBar.style.animationDuration = duration + "ms";
                this.html.classList.add("ongoing");

                TimerManager.timeout(this.end.bind(this), duration);
            }
            callback(this);
        }.bind(this), "event");
        return !!this.data.time;
    },
    /**
     * End the event
     */
    end: function () {
        this.data.effect(false);
        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.EVENT_END, this);

        this.html.remove();
    }
};
Event.LST_ID = "eventList";
