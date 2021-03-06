/* exported SaveManager */

/**
 * Handles mangling and storage of data
 */
const SaveManager = (function iife () {
    const storage = localStorage;

    let key = storage.getItem("k");
    if (!key) {
        key = Utils.randomStr();
        storage.setItem("k", key);
    }
    const salt = Utils.randomStr();

    /**
     * "Compress" a string to non-readable format
     * @param {String} str - Any string
     * @return {String}
     */
    function compress (str) {
        return btoa(salt + btoa(str));
    }

    /**
     * Turn back
     * @param {String} compressed - A string from the "compress" function
     * @return {String}
     */
    function unCompress (compressed) {
        return atob(atob(compressed).substr(salt.length));
    }

    return /** @lends SaveManager */ {
        /**
         * Put data into memory
         * @param {Object} data - Any data to save
         */
        persist (data) {
            storage.setItem(key, compress(JSON.stringify(data)));
        },
        /**
         * Return true if some data are stored
         * @return {boolean}
         */
        hasData () {
            return Object.keys(storage).includes(key);
        },
        /**
         * Read data from memory
         * @return {Object}
         */
        load () {
            return JSON.parse(unCompress(storage.getItem(key)));
        },
        /**
         * Clear whole storage
         */
        clear () {
            storage.removeItem(key);
        },
    };
})();
