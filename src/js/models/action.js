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
 * @extends Model
 */
function Action (id, owner, parentAction) {
    this.locked = true;
    this.clickable = null;
    this.options = null;
    this.optionsWrapper = null;

    this.owner = owner;
    this.parentAction = parentAction || null;
    this.repeated = 0;
    this.chosenOptionId = null;
    this.energyDrain = null;

    this.super(id);
}
Action.RUNNING_CLASS = "running";
Action.extends(Model, "Action", /** @lends Action.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.clickable = new Clickable("name disabled animated", Utils.capitalize(this.data.name));
        html.appendChild(this.clickable.html);

        if (Utils.isFunction(this.data.options)) {
            this.clickable.setAsDropdown(true);
            this.optionsWrapper = Utils.wrap("options", null, html);
            this.optionsWrapper.hide();

            html.addEventListener("mouseover", this.showOptions.bind(this));
            html.addEventListener("mouseout", this.hideOption.bind(this));

            /**
             * For keyboard control (but with downside as is)
             * html.addEventListener("focusin", this.showOptions.bind(this));
             * html.addEventListener("focusout", this.hideOption.bind(this));
             */
        }
        else {
            this.clickable.setAction(this.click.bind(this, null));
        }

        if (this.data.order) {
            html.style.order = this.data.order;
        }

        return html;
    },
    showOptions: function () {
        this.optionsWrapper.show();
        var position = this.html.getBoundingClientRect();
        this.optionsWrapper.style.top = (position.top + position.height) + "px";
        this.optionsWrapper.style.left = position.left + "px";
    },
    hideOption: function () {
        this.optionsWrapper.hide();
        this.optionsWrapper.style.left = "";
    },
    /**
     * Initialise object
     * @private
     */
    init: function () {
        Action.timeAndEnergyFallback(this.data);

        this.tooltip = new Tooltip(this.clickable.html, this.data);

        this.manageOptions();
    },
    /**
     * If needed, create and maintain options for this action
     */
    manageOptions: function () {
        if (Utils.isFunction(this.data.options)) {
            if (!this.options) {
                this.options = new Map();
            }
            var newOptions = this.data.options(this);
            // Looks for options not available anymore
            this.options.forEach(function (option) {
                if (!newOptions.includes(option.getId())) {
                    option.lock();
                }
            });
            // Add new options
            var option, id;
            for (var i = 0, l = newOptions.length; i < l; ++i) {
                id = newOptions[i];
                if (!this.options.has(id)) {
                    option = new Action(id, this.owner, this);
                    this.options.push(option);
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
        this.locked = (this.owner.isTired() && this.data.energy > 0) || // is tired and demand energy
            (this.data.isOut && flags.incidents.includes(DataManager.ids.incidents.easy.sandstorm)) || // is outside and a sand-storm is running
            (this.parentAction && this.parentAction.locked); // its parent action is locked

        this.tooltip.refresh(resources, this.data);

        // check consumption
        if (Utils.isArray(this.data.consume) && !this.locked) {
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

        this.clickable.toggle(!this.locked);
    },
    /**
     * Player click on action
     * @param {ID} [optionId] - The chosen option's id
     */
    click: function (optionId) {
        if (!this.owner.busy && !this.locked) {

            if (this.parentAction) {
                this.parentAction.click(this.getId());
            }
            else if (optionId || !this.options) {
                // Merge data from this and selected option
                this.chosenOptionId = optionId;
                var data = this.mergeWithOption(optionId);
                // Use resources
                if (Utils.isArray(data.consume)) {
                    MessageBus.notify(MessageBus.MSG_TYPES.USE, data.consume);
                }

                // Tell the game controller to filter out building in progress
                if (data.build) {
                    MessageBus.notify(MessageBus.MSG_TYPES.START_BUILD, data.build);
                }

                ++this.repeated;

                var duration = this.defineDuration(data);

                this.energyDrain = data.energy / duration;

                this.start(duration * GameController.tickLength);
                sendEvent("Action", "start", this.data.name);

                MessageBus.notify(MessageBus.MSG_TYPES.SAVE, null, true);
            }
        }
    },
    /**
     * Determine the duration of the action
     * @param {ActionData} data - This action's data
     * @return {Number} In "in game" hours
     */
    defineDuration: function (data) {
        var duration = (data.time || 0);

        if (data.timeDelta) {
            duration += MathsUtils.random(-data.timeDelta, data.timeDelta);
        }
        if (data.timeBonus) {
            duration -= duration * data.timeBonus;
        }
        return duration;
    },
    /**
     * Start this action's cooldown
     * @param {Number} duration - Time until the action resolution (ms)
     * @param {Number} [consumed=0] - Time already consumed
     */
    start: function (duration, consumed) {
        consumed = consumed || 0;
        var totalActionDuration = duration + consumed;
        this.owner.setBusy(this.getId(), this.energyDrain);
        this.clickable.startCoolDown(totalActionDuration, consumed, this.end.bind(this));

        this.html.classList.add(Action.RUNNING_CLASS);
    },
    /**
     * Take this action, its option and what it may build and merge all together
     * @param {ID} [optionId] - Any ID for the chosen option
     * @return {ActionData}
     */
    mergeWithOption: function (optionId) {
        var merge = {};
        var data = this.data;
        var option = optionId ? DataManager.get(optionId) : {};

        var build = {};
        var buildId = option.build || data.build;

        if (buildId) {
            if (buildId === DataManager.ids.option) {
                buildId = optionId;
            }
            else {
                build = DataManager.get(buildId);
            }
        }

        merge.build = buildId;
        merge.optionId = optionId;

        var fallback = ["name", "desc", "log", "time", "timeDelta", "timeBonus", "energy", "giveSpan"]; // Others
        var concat = ["consume", "give", "giveList", "unlock", "lock", "unlockForAll", "lockForAll"]; // Array
        var mix = []; // Object

        fallback.forEach(function (prop) {
            merge[prop] = build[prop] || option[prop] || data[prop];
        });

        concat.forEach(function (prop) {
            if (data[prop] || option[prop] || build[prop]) {
                merge[prop] = (data[prop] || []).concat(option[prop] || []).concat(build[prop] || []);
            }
        });

        mix.forEach(function (prop) {
            if (build[prop] || data[prop] || option[prop]) {
                merge[prop] = Object.assign({}, (data[prop] || {}), (option[prop] || {}), (build[prop] || {}));
            }
        });

        Action.timeAndEnergyFallback(merge);

        return merge;
    },
    /**
     * Resolve the end of an action
     */
    end: function () {
        this.html.classList.remove(Action.RUNNING_CLASS);

        var effect = {
            name: this.data.name,
            people: this.owner
        };
        var data = this.mergeWithOption(this.chosenOptionId);
        this.chosenOptionId = null;

        this.owner.finishAction();

        // Effect
        if (Utils.isFunction(this.data.effect)) {
            this.data.effect(this, data, effect);
        }

        var result = this.resolveAction(effect, data);

        // Give
        if (result.give.length) {
            MessageBus.notify(MessageBus.MSG_TYPES.GIVE, {
                give: result.give,
                initiator: this
            });
        }

        // Unlock for all
        if (result.unlock.forAll.length) {
            // add to all
            MessageBus.notify(MessageBus.MSG_TYPES.UNLOCK, result.unlock.forAll);
        }
        // add to owner
        this.owner.addAction(result.unlock.forOne);

        // Lock for all
        if (result.lock.forAll.length) {
            // lock to all
            MessageBus.notify(MessageBus.MSG_TYPES.LOCK, result.lock.forAll);
        }
        // lock to owner
        this.owner.lockAction(result.lock.forOne);

        // Build
        if (result.build) {
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, result.build);
        }

        MessageBus.notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, result.log);

        MessageBus.notify(MessageBus.MSG_TYPES.SAVE, null, true);
    },
    /**
     * Resolve all function of this action
     * @param {ActionEffect} effect - An editable object carrying effect for log
     * @param {ActionData} data - Data of action + option
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

        // Give
        // The first gather action is fixed to ensure 1 possible crafting and a good start
        var isFirstGather = this.getId() === DataManager.ids.actions.gather &&
            this.repeated === 1 &&
            this.owner.hasPerk(DataManager.ids.perks.first);
        if (isFirstGather) {
            var gatherables = DataManager.ids.resources.gatherables;
            result.give = [
                [2, gatherables.common.rock],
                [1, gatherables.uncommon.bolts],
                [1, gatherables.rare.medication]
            ];
        }
        else if (Utils.isArray(data.give)) {
            result.give = data.give;
        }
        else if (data.giveSpan && data.giveList) {
            result.give = Utils.randomizeMultiple(data.giveList, data.giveSpan);
        }
        // Replace option token with chosen option
        result.give.forEach(function (couple, index, array) {
            if (couple[1] === DataManager.ids.option) {
                array[index] = [couple[0], data.optionId];
            }
        });

        // Unlock
        if (Utils.isArray(this.data.unlockAfter)) {
            this.data.unlockAfter.forEach(function (couple) {
                if (this.repeated > couple[0]) {
                    result.unlock.forOne.push(couple[1]);
                    result.lock.forOne.push(this.getId());
                }
            }, this);
        }
        if (Utils.isArray(data.unlock)) {
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
        if (Utils.isArray(data.unlockForAll)) {
            result.unlock.forAll.insert(data.unlockForAll.filter(function (id) {
                var action = DataManager.get(id);
                return !action.condition || action.condition(this);
            }, this));
        }

        // Lock
        if (Utils.isArray(this.data.lockAfter)) {
            this.data.lockAfter.forEach(function (couple) {
                if (this.repeated > couple[0]) {
                    result.lock.forOne.push(couple[1]);
                }
            }, this);
        }
        if (Utils.isArray(data.lock)) {
            // Unique actions have to lock for everyone
            if (this.data.unique) {
                result.lock.forAll = data.lock;
            }
            else {
                result.lock.forOne = data.lock;
            }
        }
        if (Utils.isArray(data.lockForAll)) {
            result.lock.forAll.insert(data.lockForAll);
        }
        // Unique action lock itself
        if (this.data.unique) {
            result.lock.forAll.push(this.getId());
        }

        // Build
        if (data.build) {
            var build = DataManager.get(data.build);
            result.build = data.build;
            effect.build = Utils.an(build.name);
        }

        effect.give = Utils.formatArray(result.give);

        // Log
        var rawLog = Utils.isFunction(data.log) ? data.log(effect, this) : data.log || "";
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
            this.parentAction.options.delete(this.getId());
        }

        this.remove();
    },
    /**
     * Cancel this action
     */
    cancel: function () {
        if (this.clickable.isRunning()) {
            this.owner.setBusy();
            this.html.classList.remove(Action.RUNNING_CLASS);
            this.clickable.endCoolDown();
        }
    },
    /**
     * Get this data in plain object
     * @return {Object}
     */
    toJSON: function () {
        var json = this._toJSON();
        json.rpt = this.repeated;
        if (this.clickable.isRunning()) {
            json.elp = this.clickable.getElapsed();
            json.rmn = this.clickable.getRemaining();
            json.egd = this.energyDrain;
            json.opi = this.chosenOptionId;
        }
        return json;
    }
});

Action.static(/** @lends Action */{
    /**
     * Set time and energy according to Action fallback rule (time is 0 if omitted, energy is time * 5 if omitted)
     * @param {ActionData} data - Some data to fill (will be modified)
     */
    timeAndEnergyFallback: function (data) {
        if (Utils.isUndefined(data.energy) && !Utils.isUndefined(data.time)) {
            var defaultEnergyDrain = 5;
            data.energy = data.time * defaultEnergyDrain;
        }
        data.time = data.time || 0;
    }
});
