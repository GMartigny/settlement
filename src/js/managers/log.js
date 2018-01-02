"use strict";
/* exported LogManager */

/**
 * Manager of the logs
 */
var LogManager = (function iife () {

    var logTypes = {
        0: "info",
        1: "warning",
        2: "quote",
        3: "event"
    };
    var wrapper = null;

    var self = /** @lends LogManager */ {
        LOG_TYPES: {
            INFO: 0, // Result from an user action
            WARN: 1, // Something's wrong
            QUOTE: 2, // Blab without effect
            EVENT: 3 // Something happening without user action
        },
        maxLog: 30,
        /**
         * Start the manager
         * @param {HTMLElement} logWrapper - An element where to put logs
         */
        start: function (logWrapper) {
            wrapper = logWrapper;

            // Log informations

            MessageBus.observe(MessageBus.MSG_TYPES.ACTION_END, function (log) {
                self.log(log);
            })

            .observe(MessageBus.MSG_TYPES.ARRIVAL, function (person) {
                var log = "A new person arrive. @nominative present @reflexive as @name.";
                self.log(self.personify(log, person), MessageBus.MSG_TYPES.LOGS.EVENT);
            })

            .observe(MessageBus.MSG_TYPES.LOOSE, function (survivalDuration) {
                sendEvent("Death", "survival duration", survivalDuration);
                var message = "After holding up for " + Utils.formatTime(survivalDuration) +
                    ", everyone die and the camp is left to rot under the sun.";
                self.log(message, self.LOG_TYPES.EVENT);
            })

            .observe(MessageBus.MSG_TYPES.RUNS_OUT, function (resourceId) {
                var message = "There's no more " + Resource.toString(DataManager.get(resourceId)) + " available, " +
                    "something needs to be done quickly.";
                self.log(message, self.LOG_TYPES.WARN);
            })

            .observe(MessageBus.MSG_TYPES.GAIN_PERK, function (people) {
                var message = people.name + " is now known as the \"" + Utils.capitalize(people.perk.data.name) + "\".";
                self.log(message, self.LOG_TYPES.EVENT);
            });
        },
        /**
         * Add some log
         * @param {String} message - Any HTML valid message
         * @param {Number} [type=LogManager.LOG_TYPES.INFO] - A log type in LogManager.LOG_TYPES
         */
        log: function (message, type) {
            if (message.length) {
                type = type || self.LOG_TYPES.INFO;
                var html = Utils.wrap("log " + logTypes[type], message);
                html.hide();
                wrapper.insertBefore(html, wrapper.firstChild);
                var logs = Array.prototype.slice.call(wrapper.children);
                if (logs.length > LogManager.maxLog) {
                    logs.last().remove();
                }
                html.show.defer(html);
            }
        },
        /**
         * Replace generic key with data from an object
         * @param {String} string - A string to use
         * @param {Object} data - Data to put into the string
         * @example personify("@people.name is waiting", {people: {name: "Someone"}});
         * @return {String}
         */
        personify: function (string, data) {
            return Utils.capitalize(string.replace(/@([\w.]+)\b/gi, function (match, capture) {
                var replace = data;
                capture.split(".").forEach(function (part) {
                    replace = replace[part];
                });
                return replace || "";
            }));
        }
    };

    return self;
})();
