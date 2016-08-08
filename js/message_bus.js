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
    INFO: 0,
    WARN: 1,
    FLAVOR: 2,
    CLICK: 10,
    REFRESH: 20,
    GIVE: 30,
    USE: 32,
    RUNS_OUT: 33,
    LOOSE: 34,
    LOOSE_SOMEONE: 36,
    UNLOCK: 40,
    LOCK: 50,
    BUILD: 60
};
