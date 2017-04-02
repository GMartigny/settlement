"use strict";
/**
 * Class for actions
 * @param {People} owner - THe action owner
 * @param {Object} data - The action data
 * @constructor
 */
function Action (owner, data, parentAction) {
    this.locked = true;
    this.running = false;
    this.options = null;
    this.optionsWrapper = null;

    this.owner = owner;
    this.parentAction = parentAction || null;
    this.repeated = 0;
    this.data = null;

    this.location = false; // TODO used ?

    this.html = this.toHTML(data);
    this.tooltip = new Tooltip(this.html, data);

    this._init(data);
    this.generateOptions();
}
Action.prototype = {
    /**
     * Initialise object
     * @param {Object} data - The action data
     * @private
     */
    _init: function (data) {
        this.data = data;
        data = consolidateData(this, this.data, ["time", "energy"]);
        if (isUndefined(this.data.energy)) {
            this.data.energy = data.time * 5;
        }
    },
    /**
     * Return HTML for display
     * @param {Object} data - The action data
     * @return {HTMLElement}
     */
    toHTML: function (data) {
        var html = wrap("action clickable disabled animated", capitalize(data.name));

        if (isFunction(data.options)) {
            html.classList.add("withOptions");
            this.optionsWrapper = wrap("options");
            html.appendChild(this.optionsWrapper);
        }
        else {
            html.addEventListener("click", function () {
                if (!this.locked && !this.running && !this.owner.busy) {
                    this.click.call(this);
                }
            }.bind(this));
        }

        html.style.order = data.order;

        return html;
    },
    generateOptions: function () {
        if (isFunction(this.data.options)) {
            this.options = new Collection();
            var options = this.data.options(this);
            for (var i = 0, l = options.length; i < l; ++i) {
                var option = new Action(this.owner, options[i]);
                this.options.push(option);
                this.optionsWrapper.appendChild(option.html);
            }
        }
    },
    /**
     * Loop function called every game tick
     * @param {Collection} resources - Game resources
     * @param {Object} flags - Game flags
     */
    refresh: function (resources, flags) {
        var data = consolidateData(this, this.data, ["name", "desc", "time", "energy", "consume"]);

        this.locked = (this.owner.isTired() && data.energy > 0) ||
            (this.data.isOut && flags.cantGoOut) ||
            (this.parentAction && this.parentAction.locked);

        // check consummation
        if (isArray(data.consume)) {
            this.tooltip.refresh(resources, data);
            if (!this.locked) {
                data.consume.forEach(function (r) {
                    var id = r[1].id;
                    if (!resources.has(id) || !resources.get(id).has(r[0])) {
                        this.locked = true;
                    }
                }.bind(this));
            }
        }
        if (this.options) {
            this.options.forEach(function (option) {
                option.refresh(resources, flags);
            });
        }

        if (this.locked) {
            this.html.classList.add("disabled");
        }
        else {
            this.html.classList.remove("disabled");
        }
    },
    /**
     * Player click on action
     * @param {*} [option] - The choosed option
     * @return {Boolean} Is launched
     */
    click: function (option) {
        if (!this.owner.busy && !this.locked) {
            // Use
            if (isArray(this.data.consume)) {
                MessageBus.notify(MessageBus.MSG_TYPES.USE, this.data.consume);
            }

            if (this.parentAction) {
                return this.parentAction.click(this);
            }
            else {
                ++this.repeated;

                this.owner.setBusy(this.data);
                var duration = (this.data.time || 0) * GameController.tickLength;

                if (this.data.deltaTime) {
                    duration += random(-this.data.deltaTime, this.data.deltaTime);
                }

                this.html.style.animationDuration = duration + "ms";
                this.html.classList.add("cooldown");

                this.timeout = TimerManager.timeout(this.end.bind(this), duration);
                return true;
            }

        }
        else {
            return false;
        }
    },
    /**
     * Resolve the end of an action
     */
    end: function () {
        this.timeout = 0;
        this.html.classList.remove("cooldown");

        var effect = {
            name: this.data.name,
            people: this.owner
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
            MessageBus.notify(MessageBus.MSG_TYPES.GIVE, give);
            effect.give = formatArray(give);
        }

        // Unlock
        var unlockForOne = [];
        var unlockForAll = [];
        if (isFunction(this.data.unlock)) {
            var unlock = this.data.unlock(this).filter(function (action) {
                return !action.condition || (action.condition && action.condition(this));
            }.bind(this));

            if (this.data.unique) {
                unlockForAll = unlock;
            }
            else {
                unlockForOne = unlock;
            }
        }
        if (unlockForAll.length) {
            // add to all
            MessageBus.notify(MessageBus.MSG_TYPES.UNLOCK, unlockForAll);
        }
        if (unlockForOne.length) {
            // add to owner
            this.owner.addAction(unlockForOne);
        }

        // Lock
        if (isFunction(this.data.lock)) {
            var lock = this.data.lock(this);
            this.owner.lockAction(lock);
        }
        if (this.data.unique) {
            MessageBus.notify(MessageBus.MSG_TYPES.LOCK, this.data.id);
        }

        if (build) {
            if (isFunction(build.upgrade)) {
                MessageBus.notify(MessageBus.MSG_TYPES.UPGRADE, {
                    from: build.upgrade(),
                    to: build
                });
            }
            else {
                MessageBus.notify(MessageBus.MSG_TYPES.BUILD, build);
            }
        }

        if (this.owner.plan) {
            effect.plan = an(this.owner.plan.name);
        }
        if (this.owner.project) {
            effect.project = an(this.owner.project.name);
        }

        // Log
        var rawLog = "";
        if (isFunction(this.data.log)) {
            rawLog = this.data.log(effect, this);
        }
        else if (this.data.log) {
            rawLog = this.data.log;
        }
        var log = LogManager.personify(rawLog, effect);
        MessageBus.notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, capitalize(log));
        this.owner.finishAction();
    },
    /**
     * Change the action according to an effect
     * @param effect
     */
    applyEffect: function (effect) {
        if (isFunction(effect)) {
            effect(this.data);
            this._init(this.data);
        }
    },
    /**
     * Lock this action
     * @return {Action} Itself
     * @return {Action} Itself
     */
    lock: function () {
        this.cancel();
        this.html.remove();
        this.tooltip.remove();
    },
    /**
     * Cancel this action
     */
    cancel: function () {
        if (this.timeout) {
            TimerManager.clear(this.timeout);
            this.owner.setBusy(false);
            this.html.classList.remove("cooldown");
        }
    }
};
