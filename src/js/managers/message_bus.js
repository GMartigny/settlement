"use strict";
/**
 * Class for messageBus
 * @constructor
 * @singleton
 */
function MessageBus () {
    if (MessageBus.instance) {
        throw "An instance already exists.";
    }
    this.observers = {};
}
MessageBus.prototype = {
    /**
     * Observe an event
     * @param {Number} type - One or more event type to observe
     * @param {Function} action - A function called when event is fired
     * @return {MessageBus} Itself
     */
    observe: function (type, action) {
        if (!isArray(type)) {
            type = [type];
        }
        for (var i = 0, l = type.length; i < l; ++i) {
            if (!this.observers[type[i]]) {
                this.observers[type[i]] = [];
            }
            this.observers[type[i]].push(action);
        }
        return this;
    },
    /**
     * Fire an event
     * @param {Number} type - Type of event
     * @param {*} message - Additional data attached
     * @return {MessageBus} Itself
     */
    notify: function (type, message) {
        if (this.observers[type]) {
            for (var i = 0, l = this.observers[type].length; i < l; ++i) {
                this.observers[type][i](message, type);
            }
        }
        return this;
    }
};

MessageBus.instance = false;
/**
 * Return the MessageBus singleton
 * @return {MessageBus}
 */
MessageBus.getInstance = function () {
    if (!MessageBus.instance) {
        MessageBus.instance = new MessageBus();
    }
    return MessageBus.instance;
};
MessageBus.MSG_TYPES = {
    LOGS: {
        INFO: 0, // Log information
        WARN: 1, // Log a warning
        FLAVOR: 2, // Log a flavor text
        EVENT: 3 // Log event
    },
    CLICK: 10, // Click an action
    REFRESH: 20, // The game has refreshed
    GIVE: 30, // Give some resources
    FIND_LOCATION: 31, // Find a new location
    COLLECT: 32, // Start to collect a resource
    USE: 35, // Use some resources
    RUNS_OUT: 36, // Runs out of some resources
    LOOSE: 38, // Loose some resources
    LOOSE_SOMEONE: 39, // Loose a person
    UNLOCK: 40, // Unlock an action
    LOCK: 50, // Lock an action
    BUILD: 60, // Build a building
    EVENT_START: 70, // An event start
    EVENT_CANCEL: 71, // Cancel an event
    EVENT_END: 72 // An event end
};