(function () {

    /**
     * Class for timers
     * @param action Callback function after timeout
     * @param time Timeout length
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
            return setTimeout(this._end.bind(this), this.time);
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
         * @param now
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
        },
        /**
         * End function of the timer
         * @private
         * @deprecated
         * @return {boolean}
         */
        _end: function () {
            this.action();
            return true;
        }
    };

    var timers = [];
    window.TimerManager = {
        /**
         * Prepare timer collection
         * @private
         */
        _init: function () {
            if (!timers) {
                timers = new Collection();
            }
        },
        /**
         * Set a timeout
         * @param action A callback function called after timeout
         * @param time The timeout length
         * @return {Number} The ID of the timeout
         */
        timeout: function (action, time) {
            this._init();
            var timerId;
            var func = function () {
                timers.pop(timerId);
                action();
            };
            timerId = timers.push(new Timer(func, time));
            return timerId;
        },
        /**
         * Stop a timer
         * @param timerId
         * @return {*}
         */
        stop: function (timerId) {
            this._init();
            return timers.get(timerId).stop();
        },
        /**
         * Stop all known timers
         * @return {TimerManager} Itself
         */
        stopAll: function () {
            timers.forEach(function (timer) {
                timer.stop();
            });
            return this;
        },
        /**
         * Restart a timer
         * @param timerId
         * @return {*}
         */
        restart: function (timerId) {
            this._init();
            return timers.get(timerId).restart(performance.now());
        },
        /**
         * Restart all known timers
         * @return {TimerManager} Itself
         */
        restartAll: function () {
            var now = performance.now();
            timers.forEach(function (timer) {
                timer.restart(now);
            });
            return this;
        },
        /**
         * Stop a timer and remove it from the list
         * @param timerId
         * @return {*}
         */
        clear: function (timerId) {
            this._init();
            return timers.pop(timerId).stop();
        },
        /**
         * Clear all known timers
         * @return {TimerManager} Itself
         */
        clearAll: function () {
            timers.forEach(function (timer) {
                timer.clear();
            });
            return this;
        }
    };
})();
