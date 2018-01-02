"use strict";
/* exported Incident */

/**
 * Class for events
 * @param {ID} id - The event's id
 * @constructor
 * @extends Model
 */
function Incident (id) {
    this.timer = null;
    this.nameNode = null;
    this.progressBar = null;
    this.tooltip = null;

    this.super(id);
}
Incident.DROP_RATE = 0.01;
Incident.DEFAULT_COLOR = "#164b80";
Incident.extends(Model, "Incident", /** @lends Incident.prototype */ {
    /**
     * Initialize object
     * @private
     */
    init: function () {
        this.tooltip = new Tooltip(this.html, this.data);

        var yes = this.data.yes;
        this.data.yes = {
            name: yes,
            action: this.run.bind(this)
        };
        var no = this.data.no;
        this.data.no = {
            name: no,
            action: this.end.bind(this)
        };
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();
        if (this.data.time) {
            this.nameNode = Utils.wrap("name", Utils.capitalize(this.data.name), html);

            this.progressBar = new Bar("timer animated", (this.data.color || Incident.DEFAULT_COLOR));
            html.appendChild(this.progressBar.html);

            html.hide();
        }
        return html;
    },
    /**
     * The player validate the popup
     * @param {Number} [forceTime=false] - Force a time to the incident
     */
    run: function (forceTime) {
        // Effect
        var effect = {
            incident: this.data
        };

        if (Utils.isArray(this.data.consume)) {
            effect.consume = this.data.consume;
        }

        if (Utils.isFunction(this.data.onStart)) {
            this.data.onStart(this, effect);
        }

        if (Utils.isArray(effect.consume)) {
            MessageBus.notify(MessageBus.MSG_TYPES.USE, effect.consume);
        }

        var duration = 0;
        if (this.data.time) {
            MessageBus.notify(MessageBus.MSG_TYPES.INCIDENT_START, this);
            this.show();

            if (forceTime) {
                duration = forceTime;
            }
            else {
                duration = this.data.time;

                if (this.data.deltaTime) {
                    duration += MathsUtils.random(-this.data.deltaTime, this.data.deltaTime);
                }

                duration *= GameController.tickLength;
            }

            this.progressBar.run(duration);
        }
        this.timer = TimerManager.timeout(this.end.bind(this), duration);

        var rawLog = Utils.isFunction(this.data.log) ? this.data.log(effect, this) : this.data.log || "";
        LogManager.log(LogManager.personify(rawLog, effect), effect.logType);
    },
    /**
     * Start the incident (open popup)
     */
    start: function () {
        if (Utils.isFunction(this.data.effect)) {
            this.data.effect(this);
        }
        new Popup(this.data, "incident");
    },
    /**
     * Cancel a running incident
     */
    cancel: function () {
        if (this.timer) {
            TimerManager.stop(this.timer);
            this.end();
        }
    },
    /**
     * End the incident
     */
    end: function () {
        this.timer = null;
        MessageBus.notify(MessageBus.MSG_TYPES.INCIDENT_END, this);

        var effect = {
            incident: this.data
        };

        if (Utils.isArray(this.data.give)) {
            effect.give = this.data.give;
        }
        else if (this.data.giveList && this.data.giveSpan) {
            effect.give = Utils.randomizeMultiple(this.data.giveList, this.data.giveSpan);
        }

        if (Utils.isFunction(this.data.onEnd)) {
            this.data.onEnd(this, effect);
        }

        if (Utils.isArray(effect.give)) {
            MessageBus.notify(MessageBus.MSG_TYPES.GIVE, {
                initiator: this.nameNode,
                give: effect.give
            });
            effect.give = Utils.formatArray(effect.give);
        }

        if (effect.log) {
            var log = LogManager.personify(effect.log, effect);
            LogManager.log(log, LogManager.LOG_TYPES.EVENT);
        }

        this.remove();
        this.tooltip.remove();
    },
    /**
     * Get this data in plain object
     * @return {Object}
     */
    toJSON: function () {
        var json = this._toJSON();
        if (this.timer) {
            json.rmn = TimerManager.getRemaining(this.timer);
        }
        return json;
    }
});
Incident.LST_ID = "incidentList";
