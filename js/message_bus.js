"use strict";
function MessageBus() {
    this.observers = [];
}
MessageBus.prototype = {
    observe: function(type, action) {
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
    notifyAll: function(type, message) {
        if (this.observers[type]) {
            for (var i = 0, l = this.observers[type].length; i < l; ++i) {
                this.observers[type][i](message, type);
            }
        }
    }
};

MessageBus.instance = false;
MessageBus.getInstance = function() {
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