/**
 * A manager for saves
 * @constructor
 */
function SaveManager () {
}

(function () {

    var keys = {
        knownVisitor: "k",
        gameData: "d",
        salt: "s"
    };
    var salt = localStorage.getItem(keys.salt) || random().toString(36).slice(-6);

    /**
     * Hash a string
     * @param {Object} obj - Any Object
     * @return {string}
     */
    function hash (obj) {
        return salt + btoa(JSON.stringify(obj));
    }

    /**
     * Unhash a string
     * @param {String} str - A string coming from the hash function
     */
    function unhash (str) {
        return JSON.parse(atob(str.slice(6)));
    }

    window.saveManager = {
        /**
         * Persist data in localStorage
         * @param {Object} obj
         * @return {boolean}
         */
        save: function (obj) {
            try {
                return localStorage.setItem(keys.gameData, hash(obj));
            }
            catch (e) {
                return false;
            }
        },
        /**
         * Get data from localStorage
         * @return {*}
         */
        load: function () {
            try {
                return unhash(localStorage.getItem(keys.gameData));
            }
            catch (e) {
                return false;
            }
        },
        /**
         * Clear all from localStorage
         */
        erase: function () {
            localStorage.clear();
        }
    };
})();
