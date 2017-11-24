/* exported MessageBus */

/**
 * API to observe and send message across the application
 */
var MessageBus = (function iife () {
    "use strict";

    var _observers = [];

    var api = /** @lends MessageBus */ {
        /**
         * Observe an event
         * @param {Number|Array} type - One or more event type to observe
         * @param {Function} action - A function called when event is fired
         * @return {MessageBus} Itself
         */
        observe: function (type, action) {
            if (!Utils.isArray(type)) {
                type = [type];
            }
            type.forEach(function (oneType) {
                if (!_observers[oneType]) {
                    _observers[oneType] = [];
                }
                _observers[oneType].push(action);
            });
            return this;
        },
        /**
         * Fire an event
         * @param {Number} type - Type of event
         * @param {*} [message] - Additional data attached
         * @param {Boolean} [silent=false] - True to output log
         * @return {MessageBus} Itself
         */
        notify: function (type, message, silent) {
            var typeDesc = this.SWAP_MSG_TYPE[type];
            if (!silent) {
                Utils.log("Message ", typeDesc || type, message);
            }
            if (_observers[type]) {
                _observers[type].forEach(function (action) {
                    action(message, type);
                });
            }
            return this;
        },
        MSG_TYPES: {
            LOGS: LogManager.LOG_TYPES,
            CLICK: 10, // Click an action
            REFRESH: 20, // The game has refreshed
            GIVE: 30, // Give some resources
            FIND_LOCATION: 31, // Find a new location
            ARRIVAL: 33, // Someone arrive
            USE: 35, // Use some resources
            RUNS_OUT: 36, // Runs out of some resources
            LOOSE_RESOURCE: 38, // Loose some resources
            LOOSE_SOMEONE: 39, // Loose a person
            UNLOCK: 40, // Unlock an action
            GAIN_PERK: 45, // People gain a perk
            LOCK: 50, // Lock an action
            START_BUILD: 59, // Someone started to build
            BUILD: 60, // Build a building
            UNBUILD: 61, // Remove a building
            INCIDENT_START: 70, // An incident start
            INCIDENT_END: 72, // An incident end
            SAVE: 80, // Game saved
            LOOSE: 90, // Game over
            WIN: 95, // Congratulation
            KEYS: {
                TAB: 1009,
                SPACE: 1032,
                ENTER: 1013,
                ESCAPE: 1027,
                UP: 1038,
                RIGHT: 1039,
                DOWN: 1040,
                LEFT: 1037,
                CTRL: 1017,
                SHIFT: 1016,
                BACK: 1008,
                ONE: 1049,
                TWO: 1050,
                THREE: 1051,
                FOUR: 1052,
                FIVE: 1053,
                SIX: 1054,
                SEVEN: 1055,
                EIGHT: 1056,
                NINE: 1057,
                ZERO: 1048,
                F5: 1116,
                F8: 1119,
                F12: 1123
            }
        }
    };

    var letThroughtKeys = [
        api.MSG_TYPES.KEYS.F5,
        api.MSG_TYPES.KEYS.F12,
        api.MSG_TYPES.KEYS.TAB,
        api.MSG_TYPES.KEYS.ENTER,
        api.MSG_TYPES.KEYS.SPACE
    ];

    window.addEventListener("keydown", function keyDownListener (event) {
        var code = 1000 + event.keyCode;
        if (!letThroughtKeys.includes(code)) {
            event.preventDefault();
            event.stopPropagation();
        }
        api.notify(code, "down", true);
    }, true);

    window.addEventListener("keyup", function keyUpListener (event) {
        event.preventDefault();
        event.stopPropagation();

        var code = 1000 + event.keyCode;
        if (code === api.MSG_TYPES.KEYS.ENTER) {
            event.target.dispatchEvent(new Event("click"));
        }

        api.notify(code, "up");
    }, true);

    api.SWAP_MSG_TYPE = api.MSG_TYPES.swap();

    return api;
})();
