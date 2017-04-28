"use strict";
/* global IS_DEV */

/**
 * Factory for people
 * @param {Number} [amount=1] - Number of people to create
 * @return {Promise}
 */
function peopleFactory (amount) {
    // We don't want to spam the webservice when in dev
    if (IS_DEV) {
        var code = "Bot-" + random().toString(36).substr(round(random(2, 9)), 3).toUpperCase();
        return Promise.resolve((new Array(amount || 1)).fill(new People(code)));
    }
    else {
        return People.randomName(amount).then(function (response) {
            var people = [];
            response.results.forEach(function (data) {
                var name = capitalize(data.name.first + "")/* + " " + capitalize(data.name.last)*/;
                var person = new People(name, data.gender);
                people.push(person);
            });
            return people;
        });
    }
}

/**
 * Class for people
 * @param {String} name - It's name
 * @param {"male"|"female"} [gender="other"] - It's gender
 * @constructor
 */
function People (name, gender) {
    this.name = name;
    this.gender = gender || "other";
    this.actions = new Collection();

    this.busy = false;
    this.energy = 100;
    this.starving = false;
    this.life = 100;
    this.thirsty = false;

    this.stats = {
        actionsDone: {}, // FIXME duplicate for action.repeated
        idle: 0,
        age: 0
    };
    this.perk = null;

    this.super();
}
People.extends(Model, "People", /** @lends People.prototype */ {
    /**
     * Initialise object
     * @private
     */
    _init: function () {
        this.setPronouns();
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        var nameNode = wrap("name", capitalize(this.name));
        this.perkNode = wrap("perk");
        nameNode.appendChild(this.perkNode);
        html.appendChild(nameNode);

        this.lifeBar = wrap("bar life");
        new Tooltip(this.lifeBar, {
            name: "Health",
            desc: "The first thing you want is a good health."
        });

        html.appendChild(this.lifeBar);
        this.energyBar = wrap("bar energy");
        new Tooltip(this.energyBar, {
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
            else if (this.perk && this.perk.id === DataManager.data.perks.lounger.id) {
                ratio = 0;
            }
            this.updateEnergy(-elapse * ratio - this.starving * 30); // getting tired
            if (this.thirsty) { // drying
                this.updateLife(-elapse * this.thirsty * 30);
            }
        }
        this.starving = 0;
        this.thirsty = 0;
    },
    /**
     * Define people pronouns
     */
    setPronouns: function () {
        switch (this.gender) {
            case "female":
                this.nominative = "she";
                this.accusative = "her";
                this.possessive = "her";
                this.reflexive = "herself";
                break;
            case "male":
                this.nominative = "he";
                this.accusative = "him";
                this.possessive = "his";
                this.reflexive = "himself";
                break;
            default:
                this.nominative = "it";
                this.accusative = "it";
                this.possessive = "it";
                this.reflexive = "itself";
        }
    },
    /**
     * Set busy with an action
     * @param {Object} action - Current action's data
     */
    setBusy: function (action) {
        if (action && action.id !== DataManager.data.actions.sleep.id) {
            this.stats.idle = 0;
        }
        this.busy = action || false;
        this.html.classList.toggle("busy", this.busy);
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
        this.setBusy(null);
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
     * Add some actions
     * @param {ActionData|Array<ActionData>} actions - One or more actions to add
     * @memberOf People#
     */
    addAction: function (actions) {
        if (isArray(actions)) {
            for (var i = 0, l = actions.length; i < l; ++i) {
                this.addAction(actions[i]);
            }
        }
        else {
            if (!this.actions.has(actions.id)) {
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
    },
    /**
     * Lock some actions
     * @param {ID|Array<ID>} actions - One or more actions ID to lock
     */
    lockAction: function (actions) {
        if (isArray(actions)) {
            for (var i = 0, l = actions.length; i < l; ++i) {
                this.lockAction(actions[i]);
            }
        }
        else if (this.actions.has(actions)) {
            this.actions.pop(actions).lock();
        }
    },
    /**
     * Try to obtains a perk
     * @param {Object} action - Action's data
     * @returns {Boolean} true if got perk
     */
    rollForPerk: function (action) {
        var gotPerk = false;
        if (!this.perk) {
            var self = this;
            var perksList = DataManager.data.perks;
            // browse all perks
            perksList.deepBrowse(function (perk) {
                // perk not used
                if (!People.usedPerks.includes(perk.id)) {
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
                                gotPerk = true;
                            }
                        }
                    }
                }
            });
        }
        return gotPerk;
    },
    /**
     * Add a perk
     * @param {Object} perk - The perk data
     */
    gainPerk: function (perk) {
        perk.desc = LogManager.personify(perk.desc, {
            people: this
        });
        this.perk = perk;
        this.perkNode.textContent = "the \"" + capitalize(perk.name) + "\"";
        new Tooltip(this.perkNode, perk);

        MessageBus.notify(MessageBus.MSG_TYPES.GAIN_PERK, this);
        if (isFunction(perk.unlock)) {
            this.addAction(perk.unlock());
        }
        if (isFunction(perk.lock)) {
            this.lockAction(perk.lock());
        }
        People.usedPerks.push(perk.id);
    },
    /**
     * Kill it for good
     */
    die: function () {
        if (this.html.classList.contains("arrived")) {
            MessageBus.notify(MessageBus.MSG_TYPES.LOOSE_SOMEONE, this);
            this.html.classList.remove("arrived");
            this.actions.forEach(function (action) {
                action.cancel();
                action.tooltip.remove();
            });
            TimerManager.timeout(function () {
                this.html.remove();
            }.bind(this), 400);
        }
    }
});
People.LST_ID = "peopleList";
People.usedPerks = [];
/**
 * Return a promise for a random name
 * @param {Number} [amount=1] - Number of name to get
 * @returns {Promise}
 */
People.randomName = function (amount) {
    return new Promise(function (resolve, reject) {
        var baseUrl = "https://randomuser.me/api?inc=gender,name";
        var countries = ["AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR", "GB", "IE", "NL", "NZ", "TR", "US"];
        var url = baseUrl + "&nat=" + countries.join(",") + "&noinfo&results=" + (amount || 1);

        fetch(url).then(function (response) {
            if (response.ok) {
                return response.json().then(resolve);
            }
            else {
                reject(URIError("[" + response.status + "] " + url + " " + response.statusText));
            }
        });
    });
};
