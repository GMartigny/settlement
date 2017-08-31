"use strict";
/* exported Event */

/**
 * Class for events
 * @param {ID} id - The event's id
 * @constructor
 */
function Event (id) {
    this.timer = null;
    this.nameNode = null;
    this.progressBar = null;
    this.tooltip = null;

    this.super(id);
}
Event.extends(Model, "Event", /** @lends Event.prototype */ {
    /**
     * Initialize object
     * @private
     */
    init: function () {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = new Tooltip(this.html, this.data);
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.nameNode = Utils.wrap("name", Utils.capitalize(this.data.name));
        html.appendChild(this.nameNode);

        this.progressBar = new Bar("timer animated");
        html.appendChild(this.progressBar.html);

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
            var effect = {
                event: this.data
            };
            this.data.effect(true, this, effect);

            if (this.data.time) {
                MessageBus.notify(MessageBus.MSG_TYPES.EVENT_START, this);
                var duration = this.data.time * GameController.tickLength;

                if (this.data.deltaTime) {
                    duration += MathUtils.random(-this.data.deltaTime, this.data.deltaTime);
                }

                this.progressBar.run(duration);
                this.timer = TimerManager.timeout(this.end.bind(this), duration);
            }
            if (callback) {
                callback(this);
            }

            var rawLog;
            if (Utils.isFunction(this.data.log)) {
                rawLog = this.data.log(effect, this);
            }
            else {
                rawLog = this.data.log || "";
            }
            var log = LogManager.personify(rawLog, effect);
            MessageBus.notify(effect.logType || MessageBus.MSG_TYPES.LOGS.EVENT, Utils.capitalize(log));
        }.bind(this), "event");
        return !!this.data.time;
    },
    /**
     * Cancel a running event
     */
    cancel: function () {
        if (this.timer) {
            TimerManager.stop(this.timer);
            this.end();
        }
    },
    /**
     * End the event
     */
    end: function () {
        this.data.effect(false, this);
        this.timer = null;
        MessageBus.notify(MessageBus.MSG_TYPES.EVENT_END, this);

        this.html.remove();
    },
    getStraight: function () {
        var straight = this._getStraight();
        straight.remains = TimerManager.getRemaining(this.timer);
        return straight;
    }
});
Event.LST_ID = "eventList";
