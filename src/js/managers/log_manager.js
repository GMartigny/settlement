var LogManager = (function () {

    var logTypes = {
        0: "info",
        1: "warning",
        2: "flavor",
        3: "event"
    };
    var wrapper = null;

    var self = {
        LOG_TYPES: {
            INFO: 0, // Result from an user action
            WARN: 1, // Something's wrong
            FLAVOR: 2, // Anything without in-game effect
            EVENT: 3 // Something happening without user action
        },
        maxLog: 50,
        /**
         * Start the manager
         */
        start: function (logWrapper) {
            wrapper = logWrapper;

            var messageBusInstance = MessageBus.getInstance();

            // Log informations
            messageBusInstance.observe(self.LOG_TYPES.values(), function (message, type) {
                self.log(message, type);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.ARRIVAL, function (name) {
                self.log(name + " has arrived.", MessageBus.MSG_TYPES.LOGS.EVENT);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function (person) {
                var message = "We lost " + person.name + ".";
                self.log(message, self.LOG_TYPES.WARN);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.LOOSE, function (survivalDuration) {
                var message = "We held up for " + survivalDuration + ", but all is lost now.";
                self.log(message, self.LOG_TYPES.FLAVOR);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.RUNS_OUT, function (resourceName) {
                var message = "We run out of " + resourceName + ", we need to do something.";
                self.log(message, self.LOG_TYPES.WARN);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.GAIN_PERK, function (people) {
                var message = people.name + " is now known as the \"" + capitalize(people.perk.name) + "\".";
                self.log(message, self.LOG_TYPES.EVENT);
            });
        },
        /**
         * Add some log
         * @param {String} message
         * @param {Number} type
         */
        log: function (message, type) {
            if (message.length) {
                type = type || 0;
                wrapper.insertBefore(wrap("log " + logTypes[type], message), wrapper.firstChild);
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
            return string.replace(/@([\w\.]+)\b/gi, function (match, capture) {
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
