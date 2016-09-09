/**
 *
 * @type {{store, load, erase}}
 */
var SaveManager = (function () {
    var storage = localStorage;
    var saveKey = "_s";
    var localSave = storage.getItem(saveKey);
    var saltLength = 6;
    var salt;

    if (localSave) {
        salt = localSave.slice(-saltLength);
    }
    else {
        salt = random().toString(36).slice(-saltLength);
    }

    /**
     * Encrypt (kind of) a string with a key
     * @param {String} str - Any string
     * @param {String} key - A key for encryption
     * @return {string}
     */
    function encrypt (str, key) {
        return btoa(str + key) + key;
    }

    /**
     * Decrypt
     * @param {String} str -
     * @param {String} key -
     * @return {string}
     */
    function decrypt (str, key) {
        return atob(str.slice(0, -key.length)).slice(0, -key.length);
    }

    return {
        /**
         * Persist some data
         * @param {*} data - Any valid json stringify data
         * @return {boolean} Success
         */
        store: function (data) {
            try {
                var text = encrypt(JSON.stringify(data), salt);
                localSave = text;
                storage.setItem(saveKey, text);
                return true;
            }
            catch (e) {
                console.warn(e);
                return false;
            }
        },
        /**
         * Return previously persisted data
         * @return {*} The data or false on fail
         */
        load: function () {
            try {
                return JSON.parse(decrypt(localSave, salt));
            }
            catch (e) {
                console.warn(e);
                return false;
            }
        },
        /**
         * Clear saved data
         */
        erase: function () {
            storage.removeItem(saveKey);
        }
    };
})();
