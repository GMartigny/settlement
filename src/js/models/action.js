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

    this.super(id);
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
            html.addEventListener("click", function () {
                this.click();
            }.bind(this), true);
        }

        html.style.order = this.data.order;

        return html;
    },
    /**
     * Initialise object
     * @private
     */
    init: function () {
        this.data.time = this.data.time || 0;
        if (isUndefined(this.data.energy)) {
            this.data.energy = this.data.time * 5;
        }

        this.tooltip = new Tooltip(this.nameNode, this.data);

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
                if (!newOptions.includes(option.data.id)) {
                    option.lock();
                }
            });
            // Add new options
            var option, id;
            for (var i = 0, l = newOptions.length; i < l; ++i) {
                id = newOptions[i];
                if (!this.options.has(id)) {
                    option = new Action(id, this.owner, this);
                    this.options.push(id, option);
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
        this.locked = (this.owner.isTired() && this.data.energy > 0) ||
            (this.data.isOut && flags.cantGoOut) ||
            (this.parentAction && this.parentAction.locked);

        this.tooltip.refresh(resources, this.data);

        // check consumption
        if (isArray(this.data.consume) && !this.locked) {
            this.data.consume.forEach(function (r) {
                var id = r[1];
                if (!resources.has(id) || !resources.get(id).has(r[0])) {
                    this.locked = true;
                }
            }, this);
        }
        this.manageOptions();
        if (this.options) {
            this.options.forEach(function (option) {
                option.refresh(resources, flags);
            });
        }

        this.nameNode.classList.toggle(Action.DISABLED_CLASS, this.locked);
    },
    /**
     * Player click on action
     * @param {ID} [optionId] - The chosen option's id
     * @return {Boolean} Is launched
     */
    click: function (optionId) {
        if (!this.running && !this.owner.busy && !this.locked) {

            if (this.parentAction) {
                return this.parentAction.click(this.data.id);
            }
            else if (optionId || !this.options) {
                // Merge data from this and selected option
                var data = optionId ? this.mergeWithOption(optionId) : this.data;
                // Use resources
                if (isArray(data.consume)) {
                    MessageBus.notify(MessageBus.MSG_TYPES.USE, data.consume);
                }

                // Tell the game controller to filter out building in progress
                if (data.build) {
                    var build = data.build === DataManager.ids.option ? optionId : data.build;
                    MessageBus.notify(MessageBus.MSG_TYPES.START_BUILD, build);
                }

                this.html.classList.add(Action.RUNNING_CLASS);
                ++this.repeated;

                var duration = (data.time || 0);

                if (data.timeDelta) {
                    duration += random(-data.timeDelta, data.timeDelta);
                }
                if (data.timeBonus) {
                    duration -= duration * data.timeBonus;
                }

                this.owner.setBusy(this.data.id, data.energy / duration);

                duration *= GameController.tickLength;

                this.nameNode.style.animationDuration = duration + "ms";
                this.nameNode.classList.add(Action.COOLDOWN_CLASS);

                this.timeout = TimerManager.timeout(this.end.bind(this, data), duration);
                return true;
            }
        }
        else {
            return false;
        }
    },
    mergeWithOption: function (optionId) {
        var merge = {};
        var option = DataManager.get(optionId);
        var data = this.data;

        // FIXME: unfinished
        var buildId = null;
        if (option.build) {
            buildId = option.build;
        }
        if (!buildId && data.build) {
            buildId = data.build;
            if (buildId === DataManager.ids.option) {
                buildId = null;
                console.warn("An action try to build the same as the selected option");
            }
        }

        var build = buildId ? DataManager.get(buildId) : {};
        merge.build = buildId;

        var fallback = ["name", "desc", "log", "time", "timeDelta", "timeBonus", "energy"];
        var concat = ["consume", "give", "unlock", "lock", "unlockForAll", "lockForAll"];
        var mix = ["giveList"];

        fallback.forEach(function (prop) {
            if (data[prop] || option[prop]) {
                merge[prop] = build[prop] || option[prop] || data[prop];
            }
        });

        concat.forEach(function (prop) {
            if (data[prop] || option[prop]) {
                merge[prop] = (build[prop] || []).concat(data[prop] || []).concat(option[prop] || []);
            }
        });

        mix.forEach(function (prop) {
            if (data[prop] || option[prop]) {
                merge[prop] = Object.assign({}, (build[prop] || {}), (data[prop] || {}), (option[prop] || {}));
            }
        });

        merge.optionId = optionId;

        return merge;
    },
    /**
     * Resolve the end of an action
     * @param {Data} data - Data of action + option
     */
    end: function (data) {
        this.timeout = null;
        this.html.classList.remove(Action.RUNNING_CLASS);
        this.nameNode.classList.remove(Action.COOLDOWN_CLASS);

        var effect = {
            name: this.data.name,
            people: this.owner
        };

        if (isFunction(this.data.effect)) {
            this.data.effect(this, data, effect);
        }

        var result = this.resolveAction(effect, data);

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
            // lock to all
            MessageBus.notify(MessageBus.MSG_TYPES.LOCK, result.lock.forAll);
        }
        if (result.lock.forOne.length) {
            // lock to owner
            this.owner.lockAction(result.lock.forOne);
        }

        // Build
        if (result.build) {
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, result.build);
        }

        MessageBus.notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, capitalize(result.log));

        this.owner.finishAction();
    },
    /**
     * Resolve all function of this action
     * @param {ActionEffect} effect - An editable object carrying effect for log
     * @param {Data} data - Data of action + option
     * @return {{give: Array, unlock: {forAll: Array, forOne: Array}, lock: {forAll: Array, forOne: Array}}}
     */
    resolveAction: function (effect, data) {
        var result = {
            give: [],
            unlock: {
                forAll: [],
                forOne: []
            },
            lock: {
                forAll: [],
                forOne: []
            },
            log: ""
        };

        var specialIdOption = DataManager.ids.option;

        // Give
        if (isArray(data.give)) {
            result.give = data.give;
        }
        else if (data.giveSpan && data.giveList) {
            result.give = randomizeMultiple(data.giveList, data.giveSpan);
        }
        result.give.forEach(function (couple) {
            if (couple[1] === specialIdOption) {
                couple[1] = data.optionId;
            }
        }, this);

        var repeated = this.repeated;

        // Unlock
        if (isArray(this.data.unlockAfter)) {
            this.data.unlockAfter.forEach(function (couple) {
                if (repeated > couple[0]) {
                    result.unlock.forOne.push(couple[1]);
                }
            });
        }
        if (isArray(data.unlock)) {
            var unlock = data.unlock.filter(function (id) {
                var action = DataManager.get(id);
                return !action.condition || action.condition(this);
            }, this);
            // Unique actions have to unlock for everyone
            if (this.data.unique) {
                result.unlock.forAll.insert(unlock);
            }
            else {
                result.unlock.forOne.insert(unlock);
            }
        }
        if (isArray(data.unlockForAll)) {
            result.unlock.forAll.insert(data.unlockForAll.filter(function (id) {
                var action = DataManager.get(id);
                return !action.condition || action.condition(this);
            }, this));
        }

        // Lock
        if (isArray(this.data.lockAfter)) {
            this.data.lockAfter.forEach(function (couple) {
                if (repeated > couple[0]) {
                    result.lock.forOne.push(couple[1]);
                }
            });
        }
        if (isArray(data.lock)) {
            // Unique actions have to lock for everyone
            if (this.data.unique) {
                result.lock.forAll = data.lock;
            }
            else {
                result.lock.forOne = data.lock;
            }
        }
        if (isArray(data.lockForAll)) {
            result.lock.forAll.insert(data.lockForAll);
        }
        // Unique action lock itself
        if (this.data.unique) {
            result.lock.forAll.push(this.data.id);
        }

        // Build
        if (data.build) {
            if (data.build === specialIdOption) {
                data.build = data.optionId;
            }
            var build = DataManager.get(data.build);
            result.build = data.build;
            effect.build = an(build.name);
        }

        result.give = compactResources(result.give);
        effect.give = formatArray(result.give);

        // Log
        var logData = data.log || "";
        var rawLog = isFunction(logData) ? logData(effect, this) : logData;
        result.log = LogManager.personify(rawLog, effect);

        return result;
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
            this.parentAction.options.delete(this.data.id);
        }

        this.html.remove();
    },
    /**
     * Cancel this action
     */
    cancel: function () {
        if (this.timeout) {
            TimerManager.clear(this.timeout);
            this.owner.setBusy();
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
