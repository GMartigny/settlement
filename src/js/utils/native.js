"use strict";

Number.prototype.equals = function equals (number) {
    return Utils.isNumber(number) && MathsUtils.diff(this, number) <= Number.EPSILON;
};

/**
 * Return the last item of the array
 * @return {*}
 */
Array.prototype.last = function last () {
    return this[this.length - 1];
};

/**
 * Get a random item from an array
 * @return {*}
 */
Array.prototype.random = function random () {
    return this[MathsUtils.floor(MathsUtils.random(0, this.length))];
};

/**
 * Remove an item from an array
 * @param {*} item - Any item of the array
 * @return {Number} The array length
 */
Array.prototype.out = function out (item) {
    var index = this.indexOf(item);
    if (index >= 0) {
        this.splice(index, 1);
    }
    return this.length;
};

/**
 * Push an array of items into the array
 * @param {Array} array - An array of item
 * @return {Number} New array length
 */
Array.prototype.insert = function insert (array) {
    return this.push.apply(this, array);
};

/**
 * Try to use the object id as key
 * @param {*} [key] - Can be omitted, will use value.id or generate one
 * @param {*} value - Any value
 * @return {*} The insertion key
 */
Map.prototype.push = function push (key, value) {
    if (Utils.isUndefined(value)) {
        value = key;
        key = value.id || (value instanceof Model && value.getId()) || Utils.pickUniqueID();
    }
    this.set(key, value);
    return key;
};

/**
 * Return all inserted values as an array
 * @return {Array}
 */
Map.prototype.getValues = function getValues () {
    var values = [];
    this.forEach(function (value) {
        values.push(value);
    });
    return values;
};

/**
 * Return all keys as an array
 * @returns {Array}
 */
Map.prototype.getKeys = function getKeys () {
    var keys = [];
    this.forEach(function (value, key) {
        keys.push(key);
    });
    return keys;
};

/**
 * Browse all item in an object
 * @param {Function} action - A function called on each item
 * @param {Object} [thisArg] - A context for the callback
 */
Object.prototype.browse = function browse (action, thisArg) {
    Object.keys(this).forEach(function (key) {
        action.call(thisArg, this[key], key, this);
    }, this);
};

/**
 * Return all value of an object as array
 * @return {Array}
 */
Object.prototype.values = function values () {
    return Object.values(this);
};

/**
 * Turn a deep object into a simple array
 * @return {Array}
 */
Object.prototype.flatten = function () {
    var res = [];
    this.deepBrowse(function (value) {
        res.push(value);
    });
    return res;
};

/**
 * Browse all item in a nested tree
 * @param {Function} action - A function called on each item
 * @param {Object} [thisArg] - A context for the callback
 */
Object.prototype.deepBrowse = function deepBrowse (action, thisArg) {
    if (!["Object", "Array"].includes(this.constructor.name)) {
        action.call(thisArg, this);
    }
    else {
        this.browse(function (value) {
            value.deepBrowse(action, thisArg);
        });
    }
},

/**
 * Swap key to value in an object
 * @returns {Object}
 */
Object.prototype.swap = function swap () {
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
Object.prototype.clone = function clone () {
    var clone;
    if ([Boolean, Number, String].includes(this.constructor)) {
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
 * Set aria-hidden to false (should be handled in CSS)
 */
HTMLElement.prototype.show = function show () {
    this.removeAttribute("aria-hidden");
};

/**
 * Set aria-hidden to true (should be handled in CSS)
 */
HTMLElement.prototype.hide = function hide () {
    this.setAttribute("aria-hidden", "true");
};

/**
 * Make this class extends a parent class. The parent constructor can be called with .super() and overridden parent values can be accessed with a leading "_".
 * @param {Function} parent - A parent to draw prototype from
 * @param {String} name - The constructor's name
 * @param {Object} values - Set of key/values for this class prototype
 */
Function.prototype.extends = function _extends (parent, name, values) {
    if (parent) {
        this.prototype = Object.create(parent.prototype);
        /**
         * Call to parent constructor
         */
        this.prototype.super = parent;
        this.prototype.constructor = this;
        this.prototype.modelName = name;
    }
    if (values) {
        var self = this;
        values.browse(function (value, key) {
            // Save parent inherited function with leading "_"
            if (self.prototype[key]) {
                self.prototype["_" + key] = self.prototype[key];
            }
            self.prototype[key] = value;
        });
    }
};

/**
 * Register some static value to a class. Overridden values can be accessed with a leading "_"
 * @param {Object} values - Set of key/values for this class
 */
Function.prototype.static = function _static (values) { // TODO: factorise with Function.prototype.extends
    var self = this;
    values.browse(function (value, key) {
        if (self[key]) {
            self["_" + key] = self[key];
        }
        self[key] = value;
    });
};

/**
 * Put this function call at the end of the call-stack
 * @param {*} ctx - Context for the call
 * @return {undefined} /!\ Not the result of the function's call
 */
Function.prototype.defer = function defer (ctx) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    setTimeout(function () {
        self.apply(ctx, args);
    }, 0);
};
