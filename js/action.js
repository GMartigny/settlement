function Action(owner, data) {
    this.locked = true;
    this.running = false;

    this.owner = owner;
    this.html = this.toHTML();
    this.init(data);
}
Action.prototype = {
    init: function(data) {
        this.data = data;
        this.consolidateData();

        this.html.textContent = this.data.name;
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = tooltip(this.html, data);
    },
    toHTML: function() {
        var html = wrap("action clickable disabled");

        html.addEvent("click", function() {
            if (!this.locked && !this.running && !this.owner.busy) {
                this.click.call(this);
            }
        }.bind(this));

        return html;
    },
    consolidateData: function() {
        var data = this.data;
        if (isFunction(data.time)) {
            data.time = data.time(this);
        }
        if (isFunction(data.name)) {
            data.name = data.name(this);
        }
        if (isFunction(data.desc)) {
            data.desc = data.desc(this);
        }
        if (isFunction(data.consume)) {
            data.consume = data.consume(this);
        }
    },
    refresh: function(resources) {
        this.locked = !this.data.relaxing && this.owner.isTired();

        if (!this.locked && isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
            this.data.consume.forEach(function(r) {
                var res = resources[r[1].id];
                if (!res || !res.has(r[0])) {
                    this.locked = true;
                }
            }.bind(this));
        }

        if (this.locked) {
            this.html.classList.add("disabled");
        }
        else {
            this.html.classList.remove("disabled");
        }
    },
    click: function() {
        if (!this.owner.busy && (!this.owner.isTired() || this.data.relaxing) && !this.locked) {
            // Use
            if (isArray(this.data.consume)) {
                MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.USE, this.data.consume);
            }

            this.owner.setBusy(this.data);
            var duration = (isFunction(this.data.time) ? this.data.time(this) : this.data.time);

            this.html.classList.add("cooldown");
            this.html.style.animationDuration = duration * Game.time.hourToMs + "ms";

            setTimeout(function() {
                log(this.owner.name + " just finish to " + this.data.name);
                this.owner.setBusy(false);
                this.html.classList.remove("cooldown");

                // Give
                if (isFunction(this.data.give)) {
                    MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.GIVE, this.data.give(this));
                }
                // Unlock
                if (isFunction(this.data.unlock)) {
                    var unlock = this.data.unlock(this);
                    this.owner.addAction(unlock);
                    MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.UNLOCK, unlock);
                }
                // Lock
                if (isFunction(this.data.lock)) {
                    var lock = this.data.lock(this);
                    this.owner.lockAction(lock);
                    MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.LOCK, lock);
                }

                this.owner.busy = false;
            }.bind(this), duration * Game.time.hourToMs);
        }
    },
    lock: function() {
        this.html.remove();
        this.tooltip.remove();
        MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.LOCK, this);
    }
};