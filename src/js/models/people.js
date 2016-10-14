"use strict";
/**
 * Factory for people
 * @param {Number} amount - Number of people to create
 * @return {Promise}
 */
function peopleFactory (amount) {
    amount = amount || 1;
    // We don't want to spam the webservice when in dev
    if (window.isDev) {
        var code = "Bot-" + random().toString(36).substr(-round(random(2, 22)), 3).toUpperCase();
        return Promise.resolve((new Array(amount)).fill(new People(code)));
    }
    else {
        return People.randomName(amount).then(function (data) {
            var results = JSON.parse(data.target.response).results;
            var people = [];
            results.forEach(function (res) {
                var name = capitalize(res.name.first)/* + " " + capitalize(res.name.last)*/;
                var person = new People(name, res.gender);
                people.push(person);
            });
            return people;
        });
    }
}

/**
 * Class for people
 * @param {String} name - It's name
 * @param {"male"|"female"} gender - It's gender
 * @constructor
 */
function People (name, gender) {
    this.name = name;
    this.gender = gender || "other";
    this.setPronouns();
    this.actions = new Collection();

    this.busy = false;
    this.energy = 100;
    this.starving = false;
    this.life = 100;
    this.thirsty = false;

    this.stats = {
        actionsDone: {},
        idle: 0,
        age: 0
    };
    this.perk = null;

    this.plan = null;
    this.project = null;

    this.html = this.toHTML();
}
People.prototype = {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = wrap("people");

        var nameNode = wrap("name", this.name);
        this.perkNode = wrap("perk");
        nameNode.appendChild(this.perkNode);
        html.appendChild(nameNode);

        this.lifeBar = wrap("bar life");
        tooltip(this.lifeBar, {
            name: "Health",
            desc: "The first thing you want is a good health."
        });

        html.appendChild(this.lifeBar);
        this.energyBar = wrap("bar energy");
        tooltip(this.energyBar, {
            name: "Energy",
            desc: "Drained faster when busy or hungry."
        });
        html.appendChild(this.energyBar);

        this.actionList = wrap("actionList");
        html.appendChild(this.actionList);

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Collection} resources - Resources list
     * @param {Number} elapse - Elapse tick since last call
     * @param {Object} flags - Game flags
     * @return {People} Itself
     */
    refresh: function (resources, elapse, flags) {
        this.actions.forEach(function (action) {
            action.refresh(resources, flags);
        });
        if (flags.settled) {
            this.stats.age += elapse;
            this.stats.idle += elapse;
            var ratio = 0.7;
            if (this.busy) {
                ratio = (this.busy.energy || 0) / this.busy.time;
            }
            this.updateEnergy(-elapse * ratio - this.starving * 30); // getting tired
            if (this.thirsty) { // drying
                this.updateLife(-elapse * this.thirsty * 30);
            }
            else if (this.energy > 80 && !(this.starving || this.thirsty)) { // healing
                this.updateLife(elapse * 0.5);
            }
        }
        this.starving = 0;
        this.thirsty = 0;
        return this;
    },
    /**
     * Define people pronouns
     * @param {String} gender - The people's gender
     */
    setPronouns: function () {
        switch (this.gender) {
            case "female":
                this.nominative = "she";
                this.accusative = "her";
                this.possessive = "her";
                this.reflexive = "herself";
            case "male":
                this.nominative = "he";
                this.accusative = "him";
                this.possessive = "his";
                this.reflexive = "hisself";
            default:
                this.nominative = "it";
                this.accusative = "it";
                this.possessive = "it";
                this.reflexive = "itself";
        }
    },
    /**
     * Set busy with an action
     * @param {Action} action - Current action
     * @returns {People} Itself
     */
    setBusy: function (action) {
        if (action && action.id !== DataManager.data.actions.sleep.id) {
            this.stats.idle = 0;
        }
        this.busy = !!action ? action : false;
        this.html.classList.toggle("busy", !!action);
        return this;
    },
    /**
     * Free from busy state
     */
    finishAction: function () {
        if (this.stats.actionsDone[this.busy.id]) {
            ++this.stats.actionsDone[this.busy.id];
        }
        else {
            this.stats.actionsDone[this.busy.id] = 1;
        }
        this.rollForPerk(this.busy);
        this.setBusy(false);
    },
    /**
     * Change energy
     * @param {Number} amount - Amount to apply
     * @returns {Number} Current energy
     */
    updateEnergy: function (amount) {
        this.energy += amount;

        if (this.energy > 100) {
            this.energy = 100;
        }
        else if (this.energy < 0) {
            this.updateLife(this.energy);
            this.energy = 0;
        }

        this.energyBar.style.width = this.energy + "%";

        return this.energy;
    },
    /**
     * Test if tired
     * @returns {Boolean}
     */
    isTired: function () {
        return this.energy <= 0;
    },
    /**
     * Change life
     * @param {Number} amount - Amount to apply
     * @returns {Number} Current life
     */
    updateLife: function (amount) {
        this.life += amount;
        if (this.life > 100) {
            this.life = 100;
        }
        else if (this.life < 0) {
            this.die();
        }
        this.lifeBar.style.width = this.life + "%";
        this.lifeBar.classList[this.life < 25 ? "add" : "remove"]("warning");
        return this.life;
    },
    /**
     * Plan a building
     * @param {Object} building - Building to plan's data
     * @returns {People} Itself
     */
    planBuilding: function (building) {
        this.plan = building;
        return this;
    },
    /**
     * Prepare a project
     * @param {Object} craftable - Craftable tto prepare's data
     * @return {People} Itself
     */
    prepareProject: function (craftable) {
        this.project = craftable;
        return this;
    },
    /**
     * Add some actions
     * @param {Action|Array} actions - One or more actions to add
     * @returns {People} Itself
     */
    addAction: function (actions) {
        if (isArray(actions)) {
            for (var i = 0, l = actions.length; i < l; ++i) {
                this.addAction(actions[i]);
            }
        }
        else {
            if (this.actions.has(actions.id)) {
                this.actions.get(actions.id)._init(actions);
            }
            else {
                var action = new Action(this, actions);
                if (this.perk && isFunction(this.perk.effect)) {
                    if (!this.perk.actions || this.perk.actions().includes(actions.id)) {
                        action.applyEffect(this.perk.effect);
                    }
                }
                this.actions.push(actions.id, action);
                this.actionList.appendChild(action.html);
            }
        }
        return this;
    },
    /**
     * Lock some actions
     * @param {Action|Array} actions - One or more actions to lock
     * @returns {People}
     */
    lockAction: function (actions) {
        if (isArray(actions)) {
            for (var i = 0, l = actions.length; i < l; ++i) {
                this.lockAction(actions[i]);
            }
        }
        else {
            this.actions.pop(actions.id).lock();
        }
        return this;
    },
    /**
     * Try to obtains a perk
     */
    rollForPerk: function (action) {
        if (!this.perk) {
            var self = this;
            var perksList = DataManager.data.perks;
            // browse all perks
            deepBrowse(perksList, function (perk) {
                // perk is compatible
                var actionsIds = isFunction(perk.actions) && perk.actions();
                if (!actionsIds || actionsIds.includes(action.id)) {
                    if (!isFunction(perk.condition) || perk.condition(action)) {
                        var done = 0;
                        if (!actionsIds) {
                            done = 1 / (perk.iteration || 0);
                        }
                        else {
                            done = actionsIds.reduce(function (sum, id) {
                                    return sum + (self.stats.actionsDone[id] || 0);
                                }, 0) / (perk.iteration || 0);
                        }
                        done = done < 1 ? 0 : done;
                        // perk dice roll
                        if (done && random() < perksList.dropRate * done) {
                            // perk is unlocked
                            self.gainPerk.call(self, perk);
                        }
                    }
                }
            });
        }
    },
    /**
     * Add a perk
     * @param {Object} perk - The perk data
     */
    gainPerk: function (perk) {
        perk.desc = LogManager.personify(perk.desc, this);
        this.perk = perk;
        this.perkNode.textContent = "the \"" + capitalize(perk.name) + "\"";
        tooltip(this.perkNode, perk);

        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GAIN_PERK, this);
        if (isFunction(perk.effect)) {
            var actionsIds = isFunction(perk.actions) && perk.actions();
            this.actions.filter(function (action) {
                return !actionsIds || actionsIds.includes(action.data.id);
            }).forEach(function (action) {
                action.applyEffect(perk.effect);
            });
        }
        if (isFunction(perk.unlock)) {
            this.addAction(perk.unlock());
        }
        if (isFunction(perk.lock)) {
            this.lockAction(perk.lock());
        }
    },
    /**
     * Kill this
     * @returns {People} Itself (one last time)
     */
    die: function () {
        if (this.html.classList.contains("arrived")) {
            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOOSE_SOMEONE, this);
            this.html.classList.remove("arrived");
            this.actions.forEach(function (action) {
                action.cancel();
                action.tooltip.remove();
            });
            TimerManager.timeout(function () {
                this.html.remove();
            }.bind(this), 400);
        }
        return this;
    }
};
People.LST_ID = "peopleList";
/**
 * Return a promise for a random name
 * @param {Number} amount - Number of name to get
 * @return {Promise}
 */
People.randomName = function (amount) {
    return new Promise(function (resolve, reject) {
        var baseUrl = "https://randomuser.me/api?inc=gender,name";
        var countries = ["AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR", "GB", "IE", "NL", "NZ", "TR", "US"];
        var url = baseUrl + "&nat=" + countries.join(",") + "&noinfo&results=" + amount;

        var xhr = new XMLHttpRequest();
        xhr.open("get", url);
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send();
    });
};
