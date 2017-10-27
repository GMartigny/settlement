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
Incident.extends(Model, "Incident", /** @lends Incident.prototype */ {
    /**
     * Initialize object
     * @private
     */
    init: function () {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = new Tooltip(this.html, this.data);

        var yes = this.data.yes;
        this.data.yes = {
            name: yes,
            action: this._run.bind(this)
        };
        var no = this.data.no;
        this.data.no = no ? {
            name: no
        } : null;
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
    _run: function () {
        // Effect
        var effect = {
            incident: this.data
        };
        if (Utils.isFunction(this.data.effect)) {
            this.data.effect(true, this, effect);
        }

        if (this.data.time) {
            MessageBus.notify(MessageBus.MSG_TYPES.INCIDENT_START, this.data.id);
            var duration = this.data.time * GameController.tickLength;

            if (this.data.deltaTime) {
                duration += MathUtils.random(-this.data.deltaTime, this.data.deltaTime);
            }

            this.progressBar.run(duration);
            this.timer = TimerManager.timeout(this.end.bind(this), duration);
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
    },
    /**
     * Start the incident
     * @return {boolean} Is incident running
     */
    start: function () {
        new Popup(this.data, "incident");
        return !!this.data.time;
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
        this.data.effect(false, this);
        this.timer = null;
        MessageBus.notify(MessageBus.MSG_TYPES.INCIDENT_END, this);

        this.html.remove();
    },
    /**
     * Get this data in plain object
     * @returns {Object}
     */
    toJSON: function () {
        var straight = this._toJSON();
        straight.remains = TimerManager.getRemaining(this.timer);
        return straight;
    }
});
Incident.LST_ID = "incidentList";
