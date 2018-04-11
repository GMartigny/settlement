/* exported MessageBus */

/**
 * API to observe and send message across the application
 */
const MessageBus = (function iife () {
    const keyCodeOffset = 1000;
    const observers = [];

    const api = /** @lends MessageBus */ {
        /**
         * Observe an event
         * @param {Number|Array} type - One or more event type to observe
         * @param {Function} action - A function called when event is fired
         * @return {MessageBus} Itself
         */
        observe (type, action) {
            if (!Utils.isArray(type)) {
                type = [type];
            }
            type.forEach((oneType) => {
                if (!observers[oneType]) {
                    observers[oneType] = [];
                }
                observers[oneType].push(action);
            });
            return this;
        },
        /**
         * Fire an event
         * @param {Number} type - Type of event
         * @param {*} [message] - Additional data attached
         * @param {Boolean} [silent=false] - True to not output log
         * @return {MessageBus} Itself
         */
        notify (type, message, silent) {
            if (!silent && IS_DEV) {
                const typeDesc = this.SWAP_MSG_TYPE[type];
                Utils.log("Message ", typeDesc || type, message);
            }
            if (observers[type]) {
                observers[type].forEach(action => action(message, type));
            }
            return this;
        },
        MSG_TYPES: {
            LOGS: LogManager.LOG_TYPES,
            CLICK: 10, // Click an action
            ACTION_END: 12, // Action cool-down ends
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
            LOOSE: 90, // Game over
            WIN: 95, // Congratulation
            KEYS: {
                BACK: 8,
                TAB: 9,
                ENTER: 13,
                ESCAPE: 27,
                SPACE: 32,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                LEFT: 37,
                CTRL: 17,
                SHIFT: 16,
                ONE: 49,
                TWO: 50,
                THREE: 51,
                FOUR: 52,
                FIVE: 53,
                SIX: 54,
                SEVEN: 55,
                EIGHT: 56,
                NINE: 57,
                ZERO: 48,
                F5: 116,
                F8: 119,
                F12: 123,
            },
        },
    };

    api.MSG_TYPES.KEYS.browse((value, key) => api.MSG_TYPES.KEYS[key] = value + keyCodeOffset);

    const letThroughKeys = [
        api.MSG_TYPES.KEYS.F5,
        api.MSG_TYPES.KEYS.F12,
        api.MSG_TYPES.KEYS.TAB,
        api.MSG_TYPES.KEYS.ENTER,
        api.MSG_TYPES.KEYS.SPACE,
    ];

    window.addEventListener("keydown", (event) => {
        const code = keyCodeOffset + event.keyCode;
        if (!letThroughKeys.includes(code)) {
            event.preventDefault();
            event.stopPropagation();
        }
        api.notify(code, "down", true);
    }, true);

    window.addEventListener("keyup", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const code = keyCodeOffset + event.keyCode;
        if (code === api.MSG_TYPES.KEYS.ENTER) {
            event.target.dispatchEvent(new Event("click"));
        }

        api.notify(code, "up");
    }, true);

    if (IS_DEV) {
        api.SWAP_MSG_TYPE = api.MSG_TYPES.swap();
    }

    return api;
})();
