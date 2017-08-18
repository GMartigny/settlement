"use strict";
/* exported peopleFactory People */

/**
 * Factory for people
 * @param {Number} [amount=1] - Number of people to create
 * @return {Promise}
 */
function peopleFactory (amount) {
    // We don't want to spam the webservice when in dev
    if (IS_DEV) {
        var res = [];
        for (var i = 0; i < amount; ++i) {
            var code = "Bot-" + randomStr(3).toUpperCase();
            res.push(new People(code));
        }
        return Promise.resolve(res);
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
    this.actions = new Map();

    this.busy = false;
    this.energy = 100;
    this.starving = false;
    this.life = 100;
    this.thirsty = false;

    this.stats = {
        idle: 0,
        age: 0
    };
    this.perk = null;

    this.super();
}
People.LST_ID = "peopleList";
People.extends(Model, "People", /** @lends People.prototype */ {
    /**
     * Initialise object
     * @private
     */
    init: function () {
        this.setPronouns();
        // Tooltip on health bar
        new Tooltip(this.lifeBar.html, {
            name: "Health",
            desc: "The first thing you want is a good health."
        });
        // Tooltip on energy bar
        new Tooltip(this.energyBar.html, {
            name: "Energy",
            desc: "Drained faster when busy or hungry."
        });
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     * @memberOf People#
     */
    toHTML: function () {
        var html = this._toHTML();

        this.nameNode = wrap("name", capitalize(this.name));
        html.appendChild(this.nameNode);

        this.lifeBar = new Bar("life", 25);
        html.appendChild(this.lifeBar.html);

        this.energyBar = new Bar("energy");
        html.appendChild(this.energyBar.html);

        this.actionList = wrap("actionList");
        html.appendChild(this.actionList);

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Map} resources - Resources list
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
            else if (this.perk && this.perk.id === DataManager.ids.perks.lounger) {
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
     * @param {Object} [actionId=false] - Current action's data
     */
    setBusy: function (actionId) {
        if (actionId && actionId !== DataManager.ids.actions.sleep) {
            this.stats.idle = 0;
        }
        this.busy = actionId || false;
        this.html.classList.toggle("busy", this.busy);
    },
    /**
     * Free from busy state
     */
    finishAction: function () {
        this.rollForPerk(this.busy);
        this.setBusy();
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

        this.energyBar.set(this.energy);

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
        this.lifeBar.set(this.life);
        return this.life;
    },
    /**
     * Add some actions
     * @param {ID|Array<ID>} actionsId - One or more actions to add
     * @memberOf People#
     */
    addAction: function (actionsId) {
        if (!isArray(actionsId)) {
            actionsId = [actionsId];
        }

        actionsId.forEach(function (id) {
            if (!this.actions.has(id)) {
                var action = new Action(id, this);
                this.actions.push(id, action);
                this.actionList.appendChild(action.html);
            }
        }, this);
    },
    /**
     * Lock some actions
     * @param {ID|Array<ID>} actionsId - One or more actions ID to lock
     */
    lockAction: function (actionsId) {
        if (!isArray(actionsId)) {
            actionsId = [actionsId];
        }

        actionsId.forEach(function (id) {
            this.actions.get(id).lock();
            this.actions.delete(id);
        }, this);
    },
    /**
     * Try to obtains a perk
     * @param {ID} actionId - Action's data
     * @returns {Boolean} true if got perk
     */
    rollForPerk: function (actionId) {
        var gotPerk = false;
        if (!this.perk) {
            var self = this;
            var perksIdList = DataManager.ids.perks;
            // browse all perks
            perksIdList.deepBrowse(function (perkId) {
                // perk not already used
                if (!Perk.isUsed(perkId)) {
                    var perkData = DataManager.get(perkId);
                    // perk is compatible
                    var actionsIds = perkData.actions;
                    if (!actionsIds || actionsIds.includes(actionId)) {
                        if (!isFunction(perkData.condition) || perkData.condition(self)) {
                            var done = 0;
                            if (!actionsIds) {
                                done = 1 / (perkData.iteration || 0);
                            }
                            else {
                                done = actionsIds.reduce(function (sum, id) {
                                    var action = self.actions.get(id);
                                    return sum + (action ? action.repeated : 0);
                                }, 0) / (perkData.iteration || 0);
                            }
                            done = done < 1 ? 0 : done;
                            // perk dice roll
                            if (done && random() < done) {
                                // perk is unlocked
                                self.gainPerk(perkId);
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
     * @param {ID} perkId - The perk data
     * @memberOf People#
     */
    gainPerk: function (perkId) {
        var perk = new Perk(perkId, this);
        this.perk = perk;
        this.nameNode.appendChild(perk.html);

        MessageBus.notify(MessageBus.MSG_TYPES.GAIN_PERK, this);
    },
    /**
     * Check for perk
     * @param {ID} perkId - A perk id
     * @returns {Boolean}
     */
    hasPerk: function (perkId) {
        return this.perk && this.perk.data.id === perkId;
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
    },
    getStraight: function () {
        var straight = {
            nam: this.name,
            gnd: this.gender,
            lif: this.life,
            ene: this.energy,
            stt: this.stats,
            prk: this.perk,
            act: []
        };
        this.actions.forEach(function (action) {
            straight.act.push(action.getStraight());
        });
        return straight;
    }
});
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
                reject(new URIError("[" + response.status + "] " + url + " " + response.statusText));
            }
        });
    });
};
