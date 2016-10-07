"use strict";
/**
 * Factory for people
 * @param {Number} amount - Number of people to create
 * @return {Promise}
 */
function peopleFactory (amount) {
    amount = amount || 1;
    if (window.isDev) {
        var code = "Bot-" + random().toString(36).substr(-round(random(2, 22)), 3).toUpperCase();
        return Promise.resolve((new Array(amount)).fill(new People(code)));
    }
    else {
        return People.randomName(amount).then(function (data) {
            try {
                var results = JSON.parse(data.target.response).results;
                var people = [];
                results.forEach(function (res) {
                    var name = capitalize(res.name.first)/* + " " + capitalize(res.name.last)*/;
                    var person = new People(name, res.gender);
                    people.push(person);
                });
                resolve(people);
            }
            catch (e) {
                reject(e);
            }
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
    this.actions = new Collection();

    this.busy = false;
    this.energy = 100;
    this.starving = false;
    this.life = 100;
    this.thirsty = false;

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
        html.appendChild(wrap("name", this.name));
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
     * Return the people pronoun
     * @return {string}
     */
    getPronoun: function () {
        switch (this.gender) {
            case "female":
                return "she";
            case "male":
                return "he";
            default:
                return "it";
        }
    },
    /**
     * Set busy with an action
     * @param {Action} action - Current action
     * @returns {People} Itself
     */
    setBusy: function (action) {
        this.busy = !!action ? action : false;
        this.html.classList.toggle("busy", !!action);
        return this;
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
     * Kill a person
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
