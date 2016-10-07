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
            INFO: 0,
            WARN: 1,
            FLAVOR: 2,
            EVENT: 3
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
                self.log("We lost " + person.name + ".", self.LOG_TYPES.WARN);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.LOOSE, function (survivalDuration) {
                self.log("We held up for " + survivalDuration + ", but now all is lost.", self.LOG_TYPES.WARN);
            });

            messageBusInstance.observe(MessageBus.MSG_TYPES.RUNS_OUT, function (resourceName) {
                self.log("We run out of " + resourceName + ", we need to do something.", self.LOG_TYPES.WARN);
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
        }
    };

    return self;
})();
