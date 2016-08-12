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
    this.observers = [];
}
MessageBus.prototype = {
    /**
     * Observe an event
     * @param type One or more event type to observe
     * @param action A function called when event is fired
     */
    observe: function (type, action) {
        if (!isArray(type)) {
            type = [type];
        }
        for (var i = 0, l = type.length; i < l; ++i) {
            if (!this.observers[type]) {
                this.observers[type] = [];
            }
            this.observers[type].push(action);
        }
    },
    /**
     * Fire an event
     * @param type Type of event
     * @param message Additionnal data attached
     */
    notify: function (type, message) {
        if (this.observers[type]) {
            for (var i = 0, l = this.observers[type].length; i < l; ++i) {
                this.observers[type][i](message, type);
            }
        }
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
    INFO: 0, // Log infomrations
    WARN: 1, // Log a warning
    FLAVOR: 2, // Log a flavor text
    CLICK: 10, // Click an action
    REFRESH: 20, // The game has refreshed
    GIVE: 30, // Give some resources
    COLLECT: 31, // Start to collect a resource
    USE: 32, // Use some resources
    RUNS_OUT: 33, // Runs out of some resources
    LOOSE: 34, // Loose some resources
    LOOSE_SOMEONE: 36, // Loose a person
    UNLOCK: 40, // Unlock an action
    LOCK: 50, // Lock an action
    BUILD: 60, // Build a building
    EVENT_START: 70, // An event start
    EVENT_CANCEL: 71, // Cancel an event
    EVENT_END: 72 // An event end
};
