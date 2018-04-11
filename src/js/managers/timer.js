/* exported TimerManager */

const TimerManager = (function iife () {
    /**
     * Class for timers
     * @param {Function} action - Callback function after timeout
     * @param {Number} time - Timeout length
     * @constructor
     */
    function Timer (action, time) {
        this.startTime = Utils.getNow();
        this.action = action;
        this.time = time;
        this.isRunning = true;
        this.timeout = this.setTimeout();
    }
    Timer.prototype = {
        /**
         * Define an action to launch after a timer
         * @return {Number} ID of the timeout
         */
        setTimeout () {
            return setTimeout(this.action, this.time);
        },
        /**
         * Return time spend on the timer
         * @return {Number}
         */
        getElapsed () {
            return Utils.getNow() - this.startTime;
        },
        /**
         * Get remaining time on the timer
         * @return {Number}
         */
        getRemaining () {
            return this.time - this.getElapsed();
        },
        /**
         * Stop the timer
         * @return {Boolean|Number} False if was not running, remaining time otherwise
         */
        stop () {
            if (this.isRunning) {
                this.isRunning = false;
                this.time = this.getRemaining();
                clearTimeout(this.timeout);
                return this.time;
            }

            return false;
        },
        /**
         * Restart the timer
         * @param {Number} now - The current timestamp
         * @return {Boolean|Number} False if already running, remaining time otherwise
         */
        restart (now) {
            if (!this.isRunning) {
                this.isRunning = true;
                this.startTime = now;
                this.timeout = this.setTimeout();
            }
            return !this.isRunning && this.time;
        },
    };

    const timers = new Map();

    /**
     * Return a timer matching an ID
     * @param {ID} timerId - Existing ID in the timer list
     * @return {Timer}
     * @throws RangeError
     */
    function getTimer (timerId) {
        const timer = timers.get(timerId);
        if (!timer) {
            throw new RangeError(`Unknown timer ID [${timerId}]`);
        }
        return timer;
    }

    return /** @lends TimerManager */ {
        /**
         * Set a timeout
         * @param {Function} action - A callback function called after timeout
         * @param {Number} time - The timeout length
         * @return {ID} The ID of the timeout
         */
        timeout (action, time) {
            const timerId = timers.push(new Timer(() => {
                action();
                timers.delete(timerId);
            }, time));
            return timerId;
        },
        /**
         * Stop a timer
         * @param {ID} timerId - A timer id
         * @return {*}
         * @throws RangeError
         */
        stop (timerId) {
            return getTimer(timerId).stop();
        },
        /**
         * Stop all known timers
         */
        stopAll () {
            timers.forEach(timer => timer.stop());
        },
        /**
         * Restart a timer
         * @param {ID} timerId - A timer id
         * @return {*}
         * @throws RangeError
         */
        restart (timerId) {
            return getTimer(timerId).restart(Utils.getNow());
        },
        /**
         * Restart all known timers
         */
        restartAll () {
            const now = Utils.getNow();
            timers.forEach(timer => timer.restart(now));
        },
        /**
         * Stop a timer and remove it from the list
         * @param {ID} timerId - A timer id
         * @throws RangeError
         */
        clear (timerId) {
            const timer = getTimer(timerId);
            timers.delete(timerId);
            timer.stop();
        },
        /**
         * Clear all known timers
         */
        clearAll () {
            timers.forEach(timer => timer.clear());
        },
        /**
         * Return elapsed time on a timer
         * @param {ID} timerId - Id of a running timer
         * @return {Number} Elapsed time in ms
         * @throws RangeError
         */
        getElapsed (timerId) {
            return getTimer(timerId).getElapsed();
        },
        /**
         * Return remaining time on a timer
         * @param {String} timerId - Id of a running timer
         * @return {Number} Remaining time in ms
         * @throws RangeError
         */
        getRemaining (timerId) {
            return getTimer(timerId).getRemaining();
        },
    };
})();
