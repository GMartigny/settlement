/* global performance */

var TimerManager = (function () {
    /**
     * Class for timers
     * @param {Function} action - Callback function after timeout
     * @param {Number} time - Timeout length
     * @constructor
     */
    function Timer (action, time) {
        this.startTime = performance.now();
        this.action = action;
        this.time = time;
        this.isRunning = true;
        this.timeout = this.setTimeout();
    }
    Timer.prototype = {
        /**
         * Define an action to launch after a timer
         * @return {number} ID of the timeout
         */
        setTimeout: function () {
            return setTimeout(this.action, this.time);
        },
        /**
         * Return time spend on the timer
         * @return {number}
         */
        getElapsed: function () {
            return performance.now() - this.startTime;
        },
        /**
         * Get remaining time on the timer
         * @return {number}
         */
        getRemaining: function () {
            return this.time - this.getElapsed();
        },
        /**
         * Stop the timer
         * @return {*} False if was not running, remaining time otherwise
         */
        stop: function () {
            if (this.isRunning) {
                this.isRunning = false;
                this.time = this.getRemaining();
                clearTimeout(this.timeout);
                return this.time;
            }
            else {
                return false;
            }
        },
        /**
         * Restart the timer
         * @param {Number} now - The current timestamp
         * @return {*} False if already running, remaining time otherwise
         */
        restart: function (now) {
            if (!this.isRunning) {
                this.isRunning = true;
                this.startTime = now;
                this.timeout = this.setTimeout();
                return this.time;
            }
            else {
                return false;
            }
        }
    };

    var _timers = null;

    return {
        /**
         * Initialize the manager
         */
        start: function () {
            _timers = new Collection();
        },
        /**
         * Set a timeout
         * @param {Function} action - A callback function called after timeout
         * @param {Number} time - The timeout length
         * @return {Number} The ID of the timeout
         */
        timeout: function (action, time) {
            var timerId;
            /**
             * Wrapper for calling action and popping from collection
             */
            var func = function () {
                _timers.pop(timerId);
                action();
            };
            timerId = _timers.push(new Timer(func, time));
            return timerId;
        },
        /**
         * Stop a timer
         * @param {Number} timerId
         * @return {*}
         */
        stop: function (timerId) {
            return _timers.get(timerId).stop();
        },
        /**
         * Stop all known timers
         * @return {TimerManager} Itself
         */
        stopAll: function () {
            _timers.forEach(function (timer) {
                timer.stop();
            });
            return this;
        },
        /**
         * Restart a timer
         * @param {Number} timerId
         * @return {*}
         */
        restart: function (timerId) {
            return _timers.get(timerId).restart(performance.now());
        },
        /**
         * Restart all known timers
         * @return {TimerManager} Itself
         */
        restartAll: function () {
            var now = performance.now();
            _timers.forEach(function (timer) {
                timer.restart(now);
            });
            return this;
        },
        /**
         * Stop a timer and remove it from the list
         * @param {Number} timerId
         * @return {*}
         */
        clear: function (timerId) {
            return _timers.pop(timerId).stop();
        },
        /**
         * Clear all known timers
         * @return {TimerManager} Itself
         */
        clearAll: function () {
            _timers.forEach(function (timer) {
                timer.clear();
            });
            return this;
        },
        /**
         * Return remaining time on a timer
         * @param {Number} timerId - Id of a running timer
         * @return {Number} Remaining time in ms
         * @throws RangeError
         */
        getRemaining: function (timerId) {
            return _timers.get(timerId).getRemaining();
        }
    };
})();
