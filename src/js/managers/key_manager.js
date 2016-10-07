var KeyManager = (function () {

    var _attachedMap = {};

    window.addEventListener("keyup", function (event) {
        log(event.keyCode);
        var action = _attachedMap[event.keyCode];

        if (isFunction(action)) {
            action();
        }
    });

    return {
        KEYS: {
            SPACE: 32,
            ENTER: 13,
            ESCAPE: 27,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            LEFT: 37,
            CTRL: 17,
            SHIFT: 16,
            BACK: 8,
            ONE: 49,
            TWO: 50,
            THREE: 51,
            FOUR: 52,
            FIVE: 53,
            SIX: 54,
            SEVEN: 55,
            EIGHT: 56,
            NINE: 57,
            ZERO: 48
        },
        /**
         * Attach an action to a key code
         * @param {Number} keyCode - The keyboard key code
         * @param {Function} action - A function to execute
         */
        attach: function (keyCode, action) {
            _attachedMap[keyCode] = action;
        },
        /**
         * Remove an action attached to a key code
         * @param {Number} keyCode - The keyboard key code
         */
        detach: function (keyCode) {
            _attachedMap[keyCode] = null;
        }
    };
})();
