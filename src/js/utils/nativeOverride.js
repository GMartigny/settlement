// "use strict";

/**
 * Return the last item of the array
 * @return {*}
 */
Array.prototype.last = function () {
    return this[this.length - 1];
};

/**
 * Get a random item from an array
 * @return {*}
 */
Array.prototype.random = function () {
    return this[floor(random(0, this.length))];
};

/**
 * Remove an item from an array
 * @param {*} item - Any item of the array
 * @return {Number} The array length
 */
Array.prototype.out = function (item) {
    this.splice(this.indexOf(item), 1);
    return this.length;
};

/**
 * Try to use the object id as key
 * @param {*} [key] - Can be omitted, will use value.id or generate one
 * @param {*} value - Any value
 * @return {*} The insertion key
 */
Map.prototype.push = function (key, value) {
    if (isUndefined(value)) {
        value = key;
        key = value.id || (this.size + 1).toString(36);
    }
    this.set(key, value);
    return key;
};

/**
 * Return the array of inserted values
 * @return {Array}
 */
Map.prototype.getValues = function () {
    var iterator = this.values();
    var values = [];
    var entry = iterator.next();
    while (!entry.done) {
        values.push(entry.value);
        entry = iterator.next();
    }
    return values;
};

/**
 * Return all value of an object as array
 * @return {Array}
 */
Object.prototype.values = function () {
    var values = [];

    this.browse(function (value) {
        values.push(value);
    });

    return values;
};

/**
 * Browse all item in an object
 * @param {Function} action - A function called on each item
 */
Object.prototype.browse = function (action) {
    var self = this;
    Object.keys(this).forEach(function (key) {
        action(self[key], key, self);
    });
};

/**
 * Browse all item in a nested tree
 * @param {Function} action - A function called on each item
 */
Object.prototype.deepBrowse = function (action) {
    this.browse(function (value, index, list) {
        if (value.name) {
            action(value, index, list);
        }
        else {
            value.deepBrowse(action);
        }
    });
},

/**
 * Swap key to value in an object
 * @returns {Object}
 */
Object.prototype.swap = function () {
    var res = {};
    this.browse(function (value, key) {
        res[value] = key;
    });
    return res;
};

/**
 * Return a new reference of any object
 * @returns {*}
 */
Object.prototype.clone = function () {
    var clone;
    if (this === undefined || this === null || [Boolean, Number, String].includes(this.constructor)) {
        clone = this;
    }
    else if (this instanceof Array) {
        clone = this.slice();
    }
    else if (this instanceof Object) {
        clone = Object.assign({}, this);
    }
    else {
        throw new TypeError("Improbable source type");
    }
    return clone;
};

/**
 * Make this class extends a parent class
 * @param {Function} parent - A parent to draw prototype from
 * @param {String} name - The constructor's name
 * @param {Object} override - A map like object with overrides
 */
Function.prototype.extends = function (parent, name, override) {
    if (parent) {
        this.prototype = Object.create(parent.prototype);
        /**
         * Call to parent constructor
         */
        this.prototype.super = parent;
        this.prototype.constructor = this;
        this.prototype.modelName = name;
    }
    if (override) {
        var self = this;
        override.browse(function (func, funcName) {
            // Save parent inherited function with leading "_"
            if (self.prototype[funcName]) {
                self.prototype["_" + funcName] = self.prototype[funcName];
            }
            self.prototype[funcName] = func;
        });
    }
};
