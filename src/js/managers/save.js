"use strict";
/* exported SaveManager */

/**
 * Handles mangling and storage of data
 */
var SaveManager = (function iife () {

    var storage = localStorage;

    var key = storage.getItem("k");
    if (!key) {
        key = Utils.randomStr();
        storage.setItem("k", key);
    }
    var salt = Utils.randomStr();

    /**
     * "Compress" a string to non-readable format
     * @param {String} str - Any string
     * @returns {String}
     */
    function compress (str) {
        return btoa(salt + btoa(str));
    }

    /**
     * Turn back
     * @param {String} compressed - A string from the "compress" function
     * @returns {String}
     */
    function unCompress (compressed) {
        return atob(atob(compressed).substr(salt.length));
    }

    return /** @lends SaveManager */ {
        /**
         * Put data into memory
         * @param {Object} data - Any data to save
         */
        persist: function (data) {
            storage.setItem(key, compress(JSON.stringify(data)));
        },
        /**
         * Return true if some data are stored
         * @return {boolean}
         */
        hasData: function () {
            return Object.keys(storage).includes(key);
        },
        /**
         * Read data from memory
         * @return {Object}
         */
        load: function () {
            return JSON.parse(unCompress(storage.getItem(key)));
        },
        /**
         * Clear whole storage
         */
        clear: function () {
            storage.removeItem(key);
        }
    };
})();
