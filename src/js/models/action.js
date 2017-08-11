"use strict";
/* exported Action */

/**
 * @typedef {Object} ActionEffect
 * @prop {String} name - Action's name
 * @prop {People} people - Action's owner
 * @prop {String} [give] - Resources given by the action
 * @prop {String} [build] - Name of the build building (prefix with "a" or "an")
 * @prop [*] - Can carry any other data put by action's function
 */

/**
 * Class for actions
 * @extends Model
 * @param {ID} id - Action's data
 * @param {People} owner - Action's owner
 * @param {Action} [parentAction] - If this action has a parent
 * @constructor
 */
function Action (id, owner, parentAction) {
    this.locked = true;
    this.running = false;
    this.nameNode = null;
    this.options = null;
    this.optionsWrapper = null;

    this.owner = owner;
    this.parentAction = parentAction || null;
    this.repeated = 0;

    var data = DataManager.get(id);
    this.super(data);
}
Action.COOLDOWN_CLASS = "cooldown";
Action.RUNNING_CLASS = "running";
Action.DISABLED_CLASS = "disabled";
Action.extends(Model, "Action", /** @lends Action.prototype */ {
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
            html.addEventListener("click", this.click.bind(this), true);
        }

        html.style.order = this.data.order;

        return html;
    },
    /**
     * Initialise object
     * @private
     */
    init: function () {
        var data = consolidateData([this], this.data, ["time", "energy", "consume"]);
        if (isUndefined(this.data.energy) && data.time) {
            this.data.energy = data.time * 5;
        }

        this.tooltip = new Tooltip(this.nameNode, data);

        this.manageOptions();
    },
    /**
     * If needed, create and maintain options for this action
     * @memberOf Action#
     */
    manageOptions: function () {
        if (isFunction(this.data.options)) {
            if (!this.options) {
                this.options = new Map();
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
                    option = new Action(data, this.owner, this);
                    this.options.push(data.id, option);
                    this.optionsWrapper.appendChild(option.html);
                }
            }
        }
    },
    /**
     * Loop function called every game tick
     * @param {Map} resources - Game resources
     * @param {Object} flags - Game flags
     */
    refresh: function (resources, flags) {
        var data = consolidateData([this], this.data, ["time", "energy", "consume"]);

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
                }, this);
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
                var data = consolidateData([this], cherryPick, ["time", "timeDelta", "timeBonus"]);
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

                this.owner.setBusy(this.data.id);

                var duration = (data.time || 0) * GameController.tickLength;

                if (data.timeDelta) {
                    duration += random(-data.timeDelta, data.timeDelta) * GameController.tickLength;
                }
                if (data.timeBonus) {
                    duration -= duration * data.timeBonus;
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

        if (isFunction(this.data.effect)) {
            this.data.effect(this, option, effect);
        }

        var result = this.resolveAction(effect, option);

        // Give
        if (result.give.length) {
            MessageBus.notify(MessageBus.MSG_TYPES.GIVE, result.give);
        }

        // Unlock
        if (result.unlock.forAll.length) {
            // add to all
            MessageBus.notify(MessageBus.MSG_TYPES.UNLOCK, result.unlock.forAll);
        }
        if (result.unlock.forOne.length) {
            // add to owner
            this.owner.addAction(result.unlock.forOne);
        }

        // Lock
        if (result.lock.forAll.length) {
            MessageBus.notify(MessageBus.MSG_TYPES.LOCK, result.lock.forAll);
        }
        if (result.lock.forOne.length) {
            this.owner.lockAction(result.lock.forOne);
        }

        // Build
        if (result.build) {
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, result.build);
        }

        // Log
        var logData = (option && option.log) || this.data.log || "";
        var rawLog;
        if (isFunction(logData)) {
            rawLog = logData(effect, this);
        }
        else {
            rawLog = logData;
        }
        var log = LogManager.personify(rawLog, effect);
        MessageBus.notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, capitalize(log));

        this.owner.finishAction();
    },
    /**
     * Resolve all function of this action
     * @param {ActionEffect} effect - An editable object carrying effect for log
     * @param {CraftableData|BuildingData} [option] - The chosen option
     * @return {{give: Array, unlock: {forAll: Array, forOne: Array}, lock: {forAll: Array, forOne: Array}}}
     */
    resolveAction: function (effect, option) {
        var result = {
            give: [],
            unlock: {
                forAll: [],
                forOne: []
            },
            lock: {
                forAll: [],
                forOne: []
            }
        };
        var data = consolidateData([this, option, effect], this.data, ["give", "unlock", "lock", "build"]);

        // Give
        if (isArray(data.give)) {
            result.give = data.give;
        }
        else if (data.giveSpan && data.giveList) {
            result.give = randomizeMultiple(data.giveList, data.giveSpan);
        }

        // Unlock
        if (isArray(data.unlock)) {
            var unlock = data.unlock.filter(function (action) {
                return !action.condition || (action.condition && action.condition(this));
            }.bind(this));

            // Unique actions have to unlock for everyone
            if (data.unique) {
                result.unlock.forAll = unlock;
            }
            else {
                result.unlock.forOne = unlock;
            }
        }

        // Lock
        if (isArray(data.lock)) {
            var lock = data.lock;

            // Unique actions have to lock for everyone
            if (data.unique) {
                result.lock.forAll = lock;
            }
            else {
                result.lock.forOne = lock;
            }
        }
        // Unique action lock itself
        if (data.unique) {
            result.lock.forAll.push(data.id);
        }

        // Build
        if (data.build) {
            result.build = data.build;
            effect.build = an(result.build.name);

            // Add from building
            var moreData = consolidateData([this, option, effect], data.build, ["give", "unlock", "lock"]);
            if (isArray(moreData.give)) {
                result.give = result.give.concat(moreData.give);
            }
            if (isArray(moreData.unlock)) {
                result.unlock.forAll = result.unlock.forAll.concat(moreData.unlock);
            }
            if (isArray(moreData.lock)) {
                result.lock.forAll = result.lock.forAll.concat(moreData.lock);
            }
        }

        result.give = compactResources(result.give);
        effect.give = formatArray(result.give);

        return result;
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
        // else if (this.parentAction) {
        //     this.parentAction.options.pop(this.data.id);
        // }

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
    },
    getStraight: function () {
        var straight = this._getStraight();
        straight.repeated = this.repeated;
        return straight;
    }
});
