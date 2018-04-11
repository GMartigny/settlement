/* exported peopleFactory People */

/**
 * Class for people
 * @param {String} name - It's name
 * @param {"male"|"female"} [gender="other"] - It's gender
 * @constructor
 * @extends View
 */
function People (name, gender) {
    this.id = Utils.pickUniqueID();
    this.name = name;
    this.gender = gender || "other";
    this.actions = new Map();

    this.busy = false;
    this.energyDrain = 0.7;
    this.energy = 100;
    this.life = 100;

    this.stats = {
        idle: 0,
        age: 0,
    };
    this.perk = null;

    this.super();
}
People.extends(View, "People", /** @lends People.prototype */ {
    /**
     * Initialise object
     * @private
     */
    init () {
        this.setPronouns();
        // Tooltip on health bar
        new Tooltip(this.lifeBar.html, {
            name: "Health",
            desc: "The first thing anyone want is a good health.",
        });
        // Tooltip on energy bar
        new Tooltip(this.energyBar.html, {
            name: "Energy",
            desc: "Drained faster when busy or hungry.",
        });
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();

        this.nameNode = Utils.wrap("name", Utils.capitalize(this.name), html);

        const lifeBarWarningThreshold = 25;
        this.lifeBar = new Bar("life", "#f52158", lifeBarWarningThreshold);
        html.appendChild(this.lifeBar.html);

        this.energyBar = new Bar("energy", "#19f5ba");
        html.appendChild(this.energyBar.html);

        this.actionList = Utils.wrap("actionList", null, html);

        html.hide();

        return html;
    },
    /**
     * Loop function called every game tick
     * @param {Map} resources - Resources list
     * @param {Number} elapse - Elapse tick since last call
     * @param {Object} flags - Game flags
     */
    refresh (resources, elapse, flags) {
        this.actions.forEach(action => action.refresh(resources, flags));
        if (flags.settled) {
            this.stats.age += elapse;
            this.stats.idle += elapse;
            const lackingDrainRatio = 30;
            const energyLose = this.energyDrain + (flags.starving * lackingDrainRatio);
            this.updateEnergy(-elapse * energyLose); // getting tired
            let lifeLose = 0;
            if (flags.thirsty) { // drying
                lifeLose += flags.thirsty * lackingDrainRatio;
            }
            // If an acid-rain is running and busy outside
            const busyWith = DataManager.get(this.busy);
            if (flags.incidents.includes(DataManager.ids.incidents.medium.acidRain)
                && busyWith && busyWith.isOut) {
                lifeLose += DataManager.get(DataManager.ids.incidents.medium.acidRain).lifeLose;
            }
            this.updateLife(-elapse * lifeLose);
        }
    },
    /**
     * Define people pronouns
     */
    setPronouns () {
        switch (this.gender) {
            case "female":
                this.common = "woman";
                this.nominative = "she";
                this.accusative = "her";
                this.possessive = "her";
                this.reflexive = "herself";
                break;
            case "male":
                this.common = "man";
                this.nominative = "he";
                this.accusative = "him";
                this.possessive = "his";
                this.reflexive = "himself";
                break;
            default:
                this.common = "robot";
                this.nominative = "it";
                this.accusative = "it";
                this.possessive = "its";
                this.reflexive = "itself";
        }
    },
    /**
     * Set busy with an action
     * @param {ID} [actionId=false] - Current action's id or null to set it free
     * @param {Number} [energyDrain] - How much energy to drain per refresh
     */
    setBusy (actionId, energyDrain) {
        this.busy = actionId || false;
        if (actionId) {
            if (actionId !== DataManager.ids.actions.sleep) {
                this.stats.idle = 0;
            }
            // FIXME: energy drain rely on tick which is not precise
            this.energyDrain = energyDrain;
        }
        else {
            this.energyDrain = 1;
        }
        this.html.classList.toggle("busy", this.busy);
    },
    /**
     * Free from busy state
     */
    finishAction () {
        this.rollForPerk(this.busy);
        this.setBusy();
    },
    /**
     * Change energy
     * @param {Number} amount - Amount to apply
     * @return {Number} Current energy
     */
    updateEnergy (amount) {
        this.energy += amount;
        let value = this.energy;

        if (value > People.MAX_BAR_VALUE) {
            value = People.MAX_BAR_VALUE;
        }
        else if (value < 0) {
            this.updateLife(value);
            value = 0;
        }

        this.setEnergy(value);

        return value;
    },
    /**
     * Set energy to a new value
     * @param {Number} value - Any number between 0 and 100
     */
    setEnergy (value) {
        this.energy = value;
        this.energyBar.set(value);
    },
    /**
     * Test if tired
     * @return {Boolean}
     */
    isTired () {
        return this.energy.equals(0) || this.energy < 0;
    },
    /**
     * Change life
     * @param {Number} amount - Amount to apply
     * @return {Number} Current life
     */
    updateLife (amount) {
        let value = this.life + amount;

        if (value > People.MAX_BAR_VALUE) {
            value = People.MAX_BAR_VALUE;
        }

        this.setLife(value);

        return value;
    },
    /**
     * Set life to a new value (and die if needed be)
     * @param {Number} value - Any number between 0 and 100
     */
    setLife (value) {
        this.life = value;
        this.lifeBar.set(value);
    },
    /**
     * Add some actions
     * @param {ID|Array<ID>} actionsId - One or more actions to add
     */
    addAction (actionsId) {
        if (!Utils.isArray(actionsId)) {
            actionsId = [actionsId];
        }

        actionsId.forEach((id) => {
            if (!this.actions.has(id)) {
                const action = new Action(id, this);
                this.actions.push(action);
                this.actionList.appendChild(action.html);
            }
        });
    },
    /**
     * Lock some actions
     * @param {ID|Array<ID>} actionsId - One or more actions ID to lock
     */
    lockAction (actionsId) {
        if (!Utils.isArray(actionsId)) {
            actionsId = [actionsId];
        }

        actionsId.forEach((id) => {
            const action = this.actions.get(id);
            if (action) {
                action.lock();
                this.actions.delete(id);
            }
        });
    },
    /**
     * Try to obtains a perk
     * @param {ID} actionId - Action's data
     * @return {Boolean} true if got perk
     */
    rollForPerk (actionId) {
        let gotPerk = false;
        if (!this.perk) {
            // browse all perks
            DataManager.ids.perks.deepBrowse((perkId) => {
                // perk not already used
                if (!Perk.isUsed(perkId)) {
                    const perkData = DataManager.get(perkId);
                    // perk is compatible
                    const actionsIds = perkData.actions;
                    if (!actionsIds || actionsIds.includes(actionId)) {
                        if (!Utils.isFunction(perkData.condition) || perkData.condition(this)) {
                            let done = 0;
                            if (actionsIds) {
                                done = actionsIds.reduce((sum, id) => {
                                    const action = this.actions.get(id);
                                    return sum + (action ? action.repeated : 0);
                                }, 0) / (perkData.iteration || 0);
                            }
                            else {
                                done = 1 / (perkData.iteration || 0);
                            }
                            done = done < 1 ? 0 : done;
                            // perk dice roll
                            if (done && MathsUtils.random() < done) {
                                // perk is unlocked
                                this.gainPerk(perkId);
                                MessageBus.notify(MessageBus.MSG_TYPES.GAIN_PERK, this);
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
     */
    gainPerk (perkId) {
        this.perk = new Perk(perkId, this);
        this.nameNode.appendChild(this.perk.html);
    },
    /**
     * Check for perk
     * @param {ID} perkId - A perk id
     * @return {Boolean}
     */
    hasPerk (perkId) {
        return this.perk && this.perk.getId() === perkId;
    },
    /**
     * Define if this one's dead
     * @return {Boolean}
     */
    isDead () {
        return this.life < 0;
    },
    /**
     * Kill it for good
     */
    die () {
        MessageBus.notify(MessageBus.MSG_TYPES.LOOSE_SOMEONE, this);

        this.actions.forEach((action) => {
            action.cancel();
            action.tooltip.remove();
        });

        this.hide(this.remove);
    },
    /**
     * Get this data in plain object
     * @return {Object}
     */
    toJSON () {
        const json = {
            nam: this.name,
            gnd: this.gender,
            lif: this.life,
            ene: this.energy,
            sts: this.stats,
            act: this.actions.getValues(),
        };
        if (this.perk) {
            json.prk = this.perk.getId();
        }
        return json;
    },
});

People.static(/** @lends People */ {
    LST_ID: "peopleList",
    MAX_BAR_VALUE: 100,
    /**
     * Factory for people
     * @param {Number} [amount=1] - Number of people to create
     * @return {Promise}
     */
    peopleFactory (amount = 1) {
        // We don't want to spam the webservice when in dev
        if (IS_DEV) {
            const res = [];
            const botNameLength = 3;
            for (let i = 0; i < amount; ++i) {
                const code = `Bot-${Utils.randomStr(botNameLength).toUpperCase()}`;
                res.push(new People(code));
            }
            return Promise.resolve(res);
        }

        return this.randomName(amount).then((response) => {
            const people = [];
            response.results.forEach((data) => {
                const name = Utils.capitalize(data.name.first)/* + " " + Utils.capitalize(data.name.last) */;
                const person = new People(name, data.gender);
                people.push(person);
            });
            return people;
        });
    },
    /**
     * Return a promise for a random name
     * @param {Number} [amount=1] - Number of name to get
     * @return {Promise}
     */
    randomName (amount = 1) {
        return new Promise((resolve, reject) => {
            const baseUrl = "https://randomuser.me/api?inc=gender,name";
            const countries = [
                "AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR", "GB", "IE", "NL", "NZ", "TR", "US",
            ];
            const url = `${baseUrl}&nat=${countries.join(",")}&noinfo&results=${amount}`;

            fetch(url).then((response) => {
                if (response.ok) {
                    response.json().then(resolve);
                }
                else {
                    reject(new URIError(`[${response.status}] ${url} ${response.statusText}`));
                }
            });
        });
    },
});
