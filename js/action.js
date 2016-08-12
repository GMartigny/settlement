"use strict";
/**
 * Class for actions
 * @param owner
 * @param data
 * @constructor
 */
function Action (owner, data) {
    this.locked = true;
    this.running = false;

    this.owner = owner;
    this.data = {};

    this.html = this.toHTML();

    this._init(data);
}
Action.prototype = {
    /**
     * Initialise object
     * @param data
     * @private
     * @return {Action} Itself
     */
    _init: function (data) {
        this.data = consolidateData(this, data, ["name", "desc", "time", "consume"]);

        this.html.textContent = this.data.name;
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = tooltip(this.html, this.data);

        return this;
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = wrap("action clickable disabled");

        html.addEvent("click", function () {
            if (!this.locked && !this.running && !this.owner.busy) {
                this.click.call(this);
            }
        }.bind(this));

        return html;
    },
    /**
     * Loop function called every game tick
     * @param resources Game resources
     * @param flags Game flags
     * @return {Action} Itself
     */
    refresh: function (resources, flags) {
        this.locked = (this.data.relaxing !== 1 && this.owner.isTired()) ||
                (this.data.isOut && flags.cantGoOut);

        // check consummation
        if (isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
            if (!this.locked) {
                this.data.consume.forEach(function (r) {
                    var res = resources[r[1].id];
                    if (!res || !res.has(r[0])) {
                        this.locked = true;
                    }
                }.bind(this));
            }
        }

        if (this.locked) {
            this.html.classList.add("disabled");
        }
        else {
            this.html.classList.remove("disabled");
        }
        return this;
    },
    /**
     * Player click on action
     * @return {boolean} Is launched
     */
    click: function () {
        if (!this.owner.busy && (!this.owner.isTired() || this.data.relaxing > 0) && !this.locked) {
            // Use
            if (isArray(this.data.consume)) {
                MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, this.data.consume);
            }

            this.owner.setBusy(this.data);
            var duration = (this.data.time || 0) * Game.hourToMs;

            this.html.style.animationDuration = duration + "ms";
            this.html.classList.add("cooldown");

            this.timeout = TimerManager.timeout(function () {
                log(this.owner.name + " just finish to " + this.data.name);
                this.timeout = 0;
                this.owner.setBusy(false);
                this.html.classList.remove("cooldown");

                // Give
                if (isFunction(this.data.give)) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GIVE, this.data.give(this));
                }
                // Start collect
                if (isFunction(this.data.collect)) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.COLLECT, this.data.collect(this));
                }
                // Unlock
                if (isFunction(this.data.unlock)) {
                    this.owner.addAction(this.data.unlock(this));
                }
                // Lock
                if (isFunction(this.data.lock)) {
                    this.owner.lockAction(this.data.lock(this));
                }
                // Build
                if (isFunction(this.data.build)) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.BUILD, this.data.build(this));
                }
            }.bind(this), duration);
            return true;
        }
        else {
            return false;
        }
    },
    /**
     * Lock this action
     * @return {Action} Itself
     */
    lock: function () {
        this.cancel();
        this.html.remove();
        this.tooltip.remove();
        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOCK, this);
        return this;
    },
    /**
     * Cancel this action
     * @return {Action} Itself
     */
    cancel: function () {
        if (this.timeout) {
            TimerManager.clear(this.timeout);
            this.owner.setBusy(false);
            this.html.classList.remove("cooldown");
        }
        return this;
    }
};
