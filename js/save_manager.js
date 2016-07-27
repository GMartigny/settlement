(function() {

    var keys = {
        knownVisitor: "k",
        gameData: "d",
        salt: "s"
    };
    var salt = localStorage.getItem(keys.salt) || Math.random().toString(36).slice(-6);

    function hash(obj) {
        return btoa(JSON.stringify(obj) + salt);
    }

    function unhash(str) {
        return JSON.parse(atob(str));
    }

    window.saveManager = {
        save: function(obj) {
            try {
                return localStorage.setItem(keys.gameData, hash(obj));
            }
            catch (e) {
                return false;
            }
        },
        load: function() {
            try {
                return unhash(localStorage.getItem(keys.gameData));
            }
            catch (e) {
                return false;
            }
        },
        erase: function() {
            localStorage.clear();
        }
    };
})();