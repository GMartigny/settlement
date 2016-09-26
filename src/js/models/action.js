"use strict";
/**
 * Class for actions
 * @param {People} owner - THe action owner
 * @param {Object} data - The action data
 * @constructor
 */
function Action (owner, data) {
    this.locked = true;
    this.running = false;

    this.owner = owner;
    this.repeated = 0;
    this.data = {};

    this.location = false;

    this.html = this.toHTML(data);

    this._init(data);
}
Action.prototype = {
    /**
     * Initialise object
     * @param {Object} data - The action data
     * @private
     * @return {Action} Itself
     */
    _init: function (data) {
        this.data = consolidateData(this, data, ["name", "desc", "time", "energy", "consume"]);
        if (isUndefined(this.data.energy)) {
            this.data.energy = this.data.time * 5;
        }

        this.html.textContent = capitalize(this.data.name);

        if (this.tooltip) {
            this.tooltip.remove().update(this.data);
        }
        else {
            this.tooltip = tooltip(this.html, this.data);
        }

        return this;
    },
    /**
     * Return HTML for display
     * @param {Object} data - The action data
     * @return {HTMLElement}
     */
    toHTML: function (data) {
        var html = wrap("action clickable disabled animated");

        html.addEventListener("click", function () {
            if (!this.locked && !this.running && !this.owner.busy) {
                this.click.call(this);
            }
        }.bind(this));

        html.style.order = data.order;

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Collection} resources - Game resources
     * @param {Object} flags - Game flags
     * @return {Action} Itself
     */
    refresh: function (resources, flags) {
        this.locked = (this.owner.isTired() && this.data.energy > 0) ||
            (this.data.isOut && flags.cantGoOut);

        // check consummation
        if (isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
            if (!this.locked) {
                this.data.consume.forEach(function (r) {
                    var id = r[1].id;
                    if (!resources.has(id) || !resources.get(id).has(r[0])) {
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
        if (!this.owner.busy && !this.locked) {
            // Use
            if (isArray(this.data.consume)) {
                MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, this.data.consume);
            }

            ++this.repeated;

            this.owner.setBusy(this.data);
            var duration = (this.data.time || 0) * GameController.tickLength;

            if (this.data.deltaTime) {
                duration += random(-this.data.deltaTime, this.data.deltaTime);
            }

            this.html.style.animationDuration = duration + "ms";
            this.html.classList.add("cooldown");

            this.timeout = TimerManager.timeout(function () {
                this.timeout = 0;
                this.owner.setBusy(false);
                this.html.classList.remove("cooldown");

                var effect = {
                    name: this.data.name,
                    people: this.owner.name,
                    pronoun: this.owner.getPronoun()
                };

                // Build
                if (isFunction(this.data.build)) {
                    var build = this.data.build(this);
                    effect.build = an(build.name);
                }

                // Give
                var give = [];
                if (isFunction(this.data.give)) {
                    give = this.data.give(this, effect);
                }
                // Add from constructed building
                if (build && isFunction(build.give)) {
                    give = give.concat(build.give(this));
                }
                give = compactResources(give);
                if (give.length) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GIVE, give);
                    effect.give = formatArray(give);
                }

                // Start collect
                var collect = [];
                if (isFunction(this.data.collect)) {
                    collect = this.data.collect(this);
                }
                // Add from constructed building
                if (build && isFunction(build.collect)) {
                    collect = collect.concat(build.collect(this));
                }
                collect = compactResources(collect);
                if (collect.length) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.COLLECT, collect);
                    effect.collect = formatArray(collect);
                }

                // Unlock
                if (isFunction(this.data.unlock)) {
                    var unlock = this.data.unlock(this).filter(function (action) {
                        return !action.condition || (action.condition && action.condition(this));
                    }.bind(this));
                    if (this.data.unique) {
                        // add to all
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.UNLOCK, unlock);
                    }
                    else {
                        // add to owner
                        this.owner.addAction(unlock);
                    }
                }
                // Lock
                if (isFunction(this.data.lock)) {
                    var lock = this.data.lock(this);
                    this.owner.lockAction(lock);
                }
                if (this.data.unique) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOCK, this.data);
                }

                if (build) {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.BUILD, build);
                }

                // Log
                var log = "";
                if (isFunction(this.data.log)) {
                    log = this.data.log(effect, this);
                }
                else if (this.data.log) {
                    log = this.data.log;
                }
                log = log.replace(/@(\w+)/gi, function (match, capture) {
                    return effect[capture] || "";
                });
                MessageBus.getInstance().notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, capitalize(log));
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
