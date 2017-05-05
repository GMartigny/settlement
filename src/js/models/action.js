"use strict";
/**
 * Class for actions
 * @extends Model
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

    this.super(data);
}
Action.COOLDOWN_CLASS = "cooldown";
Action.RUNNING_CLASS = "running";
Action.DISABLED_CLASS = "disabled";
Action.extends(Model, "Action", /** @lends Action.prototype */ {
    /**
     * Initialise object
     * @private
     */
    _init: function () {
        var data = consolidateData(this, this.data, ["time", "energy", "consume"]);
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
     * @memberOf Action#
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
            this.nameNode.classList.add(Action.DISABLED_CLASS);
        }
        else {
            this.nameNode.classList.remove(Action.DISABLED_CLASS);
        }
    },
    /**
     * Player click on action
     * @param {CraftableData|BuildingData} [option] - The chosen option
     * @return {Boolean} Is launched
     */
    click: function (option) {
        if (!this.running && !this.owner.busy && !this.locked) {

            if (this.parentAction) {
                return this.parentAction.click(this.data);
            }
            else {
                // Merge data from this and selected option
                var cherryPick = Object.assign({}, option, this.data);
                var data = consolidateData(this, cherryPick, ["time", "timeDelta", "timeBonus", "consume"]);
                // Use resources
                if (isArray(data.consume)) {
                    MessageBus.notify(MessageBus.MSG_TYPES.USE, data.consume);
                }

                // Tell the game controller to filter out building in progress
                if (isFunction(data.build)) {
                    var build = data.build(this, option);
                    MessageBus.notify(MessageBus.MSG_TYPES.START_BUILD, build.id);
                }

                this.html.classList.add(Action.RUNNING_CLASS);
                ++this.repeated;

                this.owner.setBusy(data);

                var duration = (data.time || 0) * GameController.tickLength;

                if (data.timeDelta) {
                    duration += random(-data.timeDelta, data.timeDelta) * GameController.tickLength;
                }
                if (data.timeBonus) {
                    duration = data.timeBonus;
                }

                this.nameNode.style.animationDuration = duration + "ms";
                this.nameNode.classList.add(Action.COOLDOWN_CLASS);

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
        this.html.classList.remove(Action.RUNNING_CLASS);
        this.nameNode.classList.remove(Action.COOLDOWN_CLASS);

        var effect = {
            name: this.data.name,
            people: this.owner
        };

        // Build
        if (isFunction(this.data.build)) {
            var build = this.data.build(this, option, effect);
            effect.build = an(build.name);
        }

        // Give
        var give = [];
        if (isFunction(this.data.give)) {
            give = this.data.give(this, option, effect);
        }
        // Add from constructed building
        if (build && isFunction(build.give)) {
            give = give.concat(build.give(this, option, effect));
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
            var unlock = this.data.unlock(this, option, effect).filter(function (action) {
                return !action.condition || (action.condition && action.condition(this));
            }.bind(this));

            // Unique actions have to unlock for everyone
            if (this.data.unique) {
                unlockForAll = unlock;
            }
            else {
                unlockForOne = unlock;
            }
        }
        // Add from constructed building
        if (build && isFunction(build.unlock)) {
            unlockForAll = unlockForAll.concat(build.unlock(this, option, effect));
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
        var lockForOne = [];
        var lockForAll = [];
        if (isFunction(this.data.lock)) {
            var lock = this.data.lock(this, option, effect);

            // Unique actions have to lock for everyone
            if (this.data.unique) {
                lockForAll = lock;
            }
            else {
                lockForOne = lock;
            }
        }
        if (this.data.unique) {
            lockForAll.push(this.data.id);
        }
        // Add from constructed building
        if (build && isFunction(build.lock)) {
            lockForAll = lockForAll.concat(build.lock(this, option, effect));
        }
        if (lockForAll.length) {
            MessageBus.notify(MessageBus.MSG_TYPES.LOCK, lockForAll);
        }
        if (lockForOne.length) {
            this.owner.lockAction(lockForOne);
        }

        if (build) {
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, build);
        }

        // Log
        var logData = (option && option.log) || this.data.log;
        var rawLog = "";
        if (logData) {
            if (isFunction(logData)) {
                rawLog = logData(effect, this);
            }
            else {
                rawLog = logData;
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
            effect(this.data);
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
        else if (this.parentAction) {
            this.parentAction.options.pop(this.data.id);
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
            this.html.classList.remove(Action.RUNNING_CLASS);
            this.nameNode.classList.remove(Action.COOLDOWN_CLASS);
        }
    }
});
