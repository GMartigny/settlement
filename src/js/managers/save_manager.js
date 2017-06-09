"use strict";
/* exported SaveManager */

var SaveManager = (function () {

    var storage = localStorage;

    var key = storage.getItem("k");
    if (!key) {
        key = pickID();
        storage.setItem("k", key);
    }

    return {
        /**
         * Put data into memory
         * @param {Object} data - Any data to save
         */
        persist: function (data) {
            var str = btoa(JSON.stringify(data));
            storage.setItem(key, str);
        },
        /**
         * Read data from memory
         * @return {Object}
         */
        load: function () {
            return JSON.parse(atob(storage.getItem(key)));
        },
        /**
         * Clear whole storage
         */
        clear: function () {
            storage.removeItem(key);
        }
    };
})();
