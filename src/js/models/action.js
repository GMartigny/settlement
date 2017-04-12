"use strict";
/**
 * Class for actions
 * @param {People} owner - THe action owner
 * @param {ActionData} data - The action data
 * @param {Action} [parentAction] - If this action has a parent
 * @constructor
 */
function Action (owner, data, parentAction) {
    this.locked = true;
    this.running = false;
    this.nameNode = null;
    this.options = null;
    this.optionsWrapper = null;

    this.owner = owner;
    this.parentAction = parentAction || null;
    this.repeated = 0;

    this.location = false; // FIXME I'm ugly

    this.super(data);
}
Action.extends(Model, /** @lends Action.prototype */ {
    /**
     * Initialise object
     * @private
     */
    _init: function () {
        var data = consolidateData(this, this.data, ["time", "energy"]);
        if (isUndefined(this.data.energy) && data.time) {
            this.data.energy = data.time * 5;
        }

        this.tooltip = new Tooltip(this.nameNode, data);

        this.manageOptions();
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        var name = wrap("name clickable disabled animated", capitalize(this.data.name));
        this.nameNode = name;
        html.appendChild(name);

        if (isFunction(this.data.options)) {
            html.classList.add("withOptions");
            this.optionsWrapper = wrap("options");
            html.appendChild(this.optionsWrapper);
        }
        else {
            html.addEventListener("click", this.click.bind(this));
        }

        html.style.order = this.data.order;

        return html;
    },
    /**
     * If needed, create and maintain options for this action
     */
    manageOptions: function () {
        if (isFunction(this.data.options)) {
            if (!this.options) {
                this.options = new Collection();
            }
            var newOptions = this.data.options(this);
            // Looks for options not available anymore
            this.options.forEach(function (option) {
                var find = newOptions.find(function (item) {
                    return item.id === option.data.id;
                });
                if (!find) {
                    option.lock();
                }
            });
            // Add new options
            var option, data;
            for (var i = 0, l = newOptions.length; i < l; ++i) {
                data = newOptions[i];
                if (!this.options.has(data.id)) {
                    option = new Action(this.owner, data, this);
                    this.options.push(data.id, option);
                    this.optionsWrapper.appendChild(option.html);
                }
            }
        }
    },
    /**
     * Loop function called every game tick
     * @param {Collection} resources - Game resources
     * @param {Object} flags - Game flags
     */
    refresh: function (resources, flags) {
        var data = consolidateData(this, this.data, ["time", "energy", "consume"]);

        this.locked = (this.owner.isTired() && data.energy > 0) ||
            (this.data.isOut && flags.cantGoOut) ||
            (this.parentAction && this.parentAction.locked);

        this.tooltip.refresh(resources, data);

        // check consummation
        if (isArray(data.consume)) {
            if (!this.locked) {
                data.consume.forEach(function (r) {
                    var id = r[1].id;
                    if (!resources.has(id) || !resources.get(id).has(r[0])) {
                        this.locked = true;
                    }
                }.bind(this));
            }
        }
        this.manageOptions();
        if (this.options) {
            this.options.forEach(function (option) {
                option.refresh(resources, flags);
            });
        }

        if (this.locked) {
            this.nameNode.classList.add("disabled");
        }
        else {
            this.nameNode.classList.remove("disabled");
        }
    },
    /**
     * Player click on action
     * @param {CraftableData|BuildingData} [option] - The chosen option
     * @return {Boolean} Is launched
     */
    click: function (option) {
        if (!this.running && !this.owner.busy && !this.locked) {
            var data = consolidateData(this, (option || this.data), ["time", "timeDelta", "consume"]);
            // Use
            if (isArray(data.consume)) {
                MessageBus.notify(MessageBus.MSG_TYPES.USE, data.consume);
            }

            if (this.parentAction) {
                return this.parentAction.click(this);
            }
            else {
                ++this.repeated;

                this.owner.setBusy(data);

                var duration = (data.time || 0) * GameController.tickLength;

                if (data.timeDelta) {
                    duration += random(-data.timeDelta, data.timeDelta) * GameController.tickLength;
                }

                this.nameNode.style.animationDuration = duration + "ms";
                this.nameNode.classList.add("cooldown");

                this.timeout = TimerManager.timeout(this.end.bind(this, option), duration);
                return true;
            }
        }
        else {
            return false;
        }
    },
    /**
     * Resolve the end of an action
     * @param {CraftableData|BuildingData} [option] - The chosen option
     */
    end: function (option) {
        this.timeout = 0;
        this.nameNode.classList.remove("cooldown");

        var effect = {
            name: this.data.name,
            people: this.owner
        };

        if (isFunction(this.data.effect)) {
            this.data.effect(effect);
        }

        // Build
        if (isFunction(this.data.build)) {
            var build = this.data.build(this, option);
            effect.build = an(build.name);
        }

        // Give
        var give = [];
        if (isFunction(this.data.give)) {
            give = this.data.give(this, effect);
        }
        // Add from constructed building
        if (build && isFunction(build.give)) {
            give = give.concat(build.give(this, option));
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
        if (this.data.log) {
            if (isFunction(this.data.log)) {
                rawLog = this.data.log(effect, this);
            }
            else {
                rawLog = this.data.log;
            }
        }
        var log = LogManager.personify(rawLog, effect);
        MessageBus.notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, capitalize(log));
        this.owner.finishAction();
    },
    /**
     * Change the action according to an effect
     * @param {Function} effect -
     */
    applyEffect: function (effect) {
        if (isFunction(effect)) {

        }
    },
    /**
     * Lock this action
     */
    lock: function () {
        this.cancel();
        this.tooltip.remove();

        if (this.options) {
            this.options.forEach(function (option) {
                option.lock();
            });
        }

        this.html.remove();
    },
    /**
     * Cancel this action
     */
    cancel: function () {
        if (this.timeout) {
            TimerManager.clear(this.timeout);
            this.owner.setBusy(false);
            this.nameNode.classList.remove("cooldown");
        }
    }
});
