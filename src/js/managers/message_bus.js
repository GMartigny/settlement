"use strict";

var MessageBus = (function () {
    var _observers = [];

    var api = {
        /**
         * Observe an event
         * @param {Number|Array} type - One or more event type to observe
         * @param {Function} action - A function called when event is fired
         * @return {MessageBus} Itself
         */
        observe: function (type, action) {
            if (!isArray(type)) {
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
         * @return {MessageBus} Itself
         */
        notify: function (type, message) {
            var typeDesc = this.SWAP_MSG_TYPE[type];
            if (typeDesc) {
                log("Message ", typeDesc, message);
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
            BUILD: 60, // Build a building
            UNBUILD: 61, // Remove a building
            UPGRADE: 62, // Upgrade a building
            EVENT_START: 70, // An event start
            EVENT_CANCEL: 71, // Cancel an event
            EVENT_END: 72, // An event end
            LOOSE: 80, // Game over
            WIN: 85 // Congratulation
        }
    };

    api.SWAP_MSG_TYPE = api.MSG_TYPES.swap();

    return api;
})();
