(function () {

    function Timer (action, time) {
        this.startTime = performance.now();
        this.action = action;
        this.time = time;
        this.isRunning = true;
        this.timeout = this.setTimeout();
    }

    Timer.prototype = {
        setTimeout: function () {
            return setTimeout(this.end.bind(this), this.time);
        },
        getElapsed: function () {
            return performance.now() - this.startTime;
        },
        getRemaining: function () {
            return this.time - this.getElapsed();
        },
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
        restart: function (now) {
            if (!this.isRunning) {
                this.isRunning = true;
                this.startTime = now;
                this.timeout = this.setTimeout();
            }
            else {
                return false;
            }
        },
        end: function () {
            this.action();
            return true;
        }
    };

    var timers = [];
    window.TimerManager = {
        init: function () {
            if (!timers) {
                timers = new Collection();
            }
        },
        timeout: function (action, time) {
            this.init();
            var timerId;
            var func = function () {
                timers.pop(timerId);
                action();
            };
            timerId = timers.push(new Timer(func, time));
            return timerId;
        },
        stop: function (timerId) {
            this.init();
            return timers.get(timerId).stop();
        },
        stopAll: function () {
            timers.forEach(function (timer) {
                timer.stop();
            });
        },
        restart: function (timerId) {
            this.init();
            return timers.get(timerId).restart(performance.now());
        },
        restartAll: function () {
            var now = performance.now();
            timers.forEach(function (timer) {
                timer.restart(now);
            });
        },
        clear: function (timerId) {
            this.init();
            return timers.pop(timerId).stop();
        },
        clearAll: function () {
            timers.forEach(function (timer) {
                timer.clear();
            });
        }
    };
})();