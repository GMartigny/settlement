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
        maxLog: 50,
        /**
         * Start the manager
         * @param {HTMLElement} logWrapper - An element where to put logs
         */
        start: function (logWrapper) {
            wrapper = logWrapper;

            // Log informations
            MessageBus.observe(self.LOG_TYPES.values(), function (message, type) {
                self.log(message, type);
            })

            .observe(MessageBus.MSG_TYPES.ARRIVAL, function (person) {
                self.log(person.name + " has arrived.", MessageBus.MSG_TYPES.LOGS.EVENT);
            })

            .observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function (person) {
                var message = "We lost " + person.name + ".";
                self.log(message, self.LOG_TYPES.WARN);
            })

            .observe(MessageBus.MSG_TYPES.LOOSE, function (survivalDuration) {
                sendEvent("Death", "survival duration", survivalDuration);
                var message = "We held up for " + Utils.formatTime(survivalDuration) + ", but all is lost now.";
                self.log(message, self.LOG_TYPES.EVENT);
            })

            .observe(MessageBus.MSG_TYPES.RUNS_OUT, function (resourceId) {
                var data = DataManager.get(resourceId);
                var message = "We run out of " + Resource.toString(data) + ", we need to do something.";
                self.log(message, self.LOG_TYPES.WARN);
            })

            .observe(MessageBus.MSG_TYPES.GAIN_PERK, function (people) {
                var message = people.name + " is now known as the \"" + Utils.capitalize(people.perk.data.name) + "\".";
                self.log(message, self.LOG_TYPES.EVENT);
            })

            .observe(MessageBus.MSG_TYPES.WIN, function (survivalDuration) {
                var message = "It took " + Utils.formatTime(survivalDuration) + " to escape.";
                self.log(message, self.LOG_TYPES.EVENT);
            });
        },
        /**
         * Add some log
         * @param {String} message - Any HTML valid message
         * @param {Number} type - A log type in LogManager.LOG_TYPES
         */
        log: function (message, type) {
            if (message.length) {
                type = type || 0;
                wrapper.insertBefore(Utils.wrap("log " + logTypes[type], message), wrapper.firstChild);
                var logs = Array.prototype.slice.call(wrapper.children);
                if (logs.length > LogManager.maxLog) {
                    logs.last().remove();
                }
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
            return string.replace(/@([\w.]+)\b/gi, function (match, capture) {
                var replace = data;
                capture.split(".").forEach(function (part) {
                    replace = replace[part];
                });
                return replace || "";
            });
        }
    };

    return self;
})();
