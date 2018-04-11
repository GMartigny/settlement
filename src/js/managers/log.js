/* exported LogManager */

/**
 * Manager of the logs
 */
const LogManager = (function iife () {
    const logTypes = {
        0: "info",
        1: "warning",
        2: "quote",
        3: "event",
    };
    let wrapper = null;

    const self = /** @lends LogManager */ {
        LOG_TYPES: {
            INFO: 0, // Result from an user action
            WARN: 1, // Something's wrong
            QUOTE: 2, // Blab without effect
            EVENT: 3, // Something happening without user action
        },
        maxLog: 30,
        /**
         * Start the manager
         * @param {HTMLElement} logWrapper - An element where to put logs
         */
        start (logWrapper) {
            wrapper = logWrapper;

            // Log informations
            MessageBus
                .observe(MessageBus.MSG_TYPES.ACTION_END, log => self.log(log))
                .observe(MessageBus.MSG_TYPES.ARRIVAL, (person) => {
                    const log = "A new person arrive. @nominative present @reflexive as @name.";
                    self.log(self.personify(log, person), MessageBus.MSG_TYPES.LOGS.EVENT);
                })
                .observe(MessageBus.MSG_TYPES.LOOSE, (survivalDuration) => {
                    sendEvent("Death", "survival duration", survivalDuration);
                    const message = `After holding up for ${Utils.formatTime(survivalDuration)},
                        everyone die and the camp is left to rot under the sun.`;
                    self.log(message, self.LOG_TYPES.EVENT);
                })
                .observe(MessageBus.MSG_TYPES.RUNS_OUT, (resourceId) => {
                    const message = `There's no more ${Resource.toString(DataManager.get(resourceId))} available,
                        something needs to be done quickly.`;
                    self.log(message, self.LOG_TYPES.WARN);
                })
                .observe(MessageBus.MSG_TYPES.GAIN_PERK, (people) => {
                    const message = `${people.name} is now known as the "${Utils.capitalize(people.perk.data.name)}".`;
                    self.log(message, self.LOG_TYPES.EVENT);
                });
        },
        /**
         * Add some log
         * @param {String} message - Any HTML valid message
         * @param {Number} [type=LogManager.LOG_TYPES.INFO] - A log type in LogManager.LOG_TYPES
         */
        log (message, type = self.LOG_TYPES.INFO) {
            if (message.length) {
                const html = Utils.wrap(`log ${logTypes[type]}`, message);
                html.hide();
                wrapper.insertBefore(html, wrapper.firstChild);
                const logs = Array.prototype.slice.call(wrapper.children);
                if (logs.length > LogManager.maxLog) {
                    logs.last().remove();
                }
                html.show.defer(html);
            }
        },
        /**
         * Replace generic key with data from an object and capitalize
         * @param {String} string - A string to use
         * @param {Object} data - Data to put into the string
         * @example personify("@people.name is waiting", {people: {name: "someone"}}); // => "Someone is waiting"
         * @return {String}
         */
        personify (string, data) {
            return Utils.capitalize(string.replace(/@([\w.]+)\b/gi, (match, capture) => {
                let replace = data;
                capture.split(".").forEach(part => replace = replace[part]);
                return replace || "";
            }));
        },
    };

    return self;
})();
