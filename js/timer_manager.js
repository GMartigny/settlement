(function () {

    function Timer(action, time) {
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
        stop: function () {
            if(this.isRunning) {
                this.isRunning = false;
                this.time -= (performance.now() - this.startTime);
                clearTimeout(this.timeout);
                return this.time;
            }
            else {
                return false;
            }
        },
        restart: function (now) {
            if(!this.isRunning){
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

    var timers = new Collection();
    window.TimerManager = {
        begin: function (action, time) {
            var func = function () {
                timers.pop(timerId);
                action();
            };
            var timerId = timers.push(new Timer(func, time));
            return timerId;
        },
        stop: function (timerId) {
            return timers.get(timerId).stop();
        },
        restart: function (timerId) {
            return timers.get(timerId).restart(performance.now());
        },
        stopAll: function () {
            timers.forEach(function (timer) {
                timer.stop();
            });
        },
        restartAll: function () {
            var now = performance.now();
            timers.forEach(function (timer) {
                timer.restart(now);
            });
        }
    };
})();