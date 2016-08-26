"use strict";
/**
 * Factory for people
 * @param amount Number of people to create
 * @return {Promise}
 */
function peopleFactory (amount) {
    return new Promise(function (resolve, reject) {
        if (Game.isDev) {
            resolve((new Array(amount)).fill(new People("John Doe")));
        }
        else {
            People.randomName(amount).then(function (data) {
                try {
                    var results = JSON.parse(data.target.response).results;
                    var people = [];
                    results.forEach(function (res) {
                        people.push(new People(capitalize(res.name.first + " " + capitalize(res.name.last))));
                    });
                    resolve(people);
                }
                catch (e) {
                    reject(e);
                }
            });
        }
    });
}

/**
 * Class for people
 * @param name
 * @constructor
 */
function People (name) {
    this.name = name;
    this.actions = new Collection();

    this.busy = false;
    this.energy = 100;
    this.starving = false;
    this.life = 100;
    this.thirsty = false;

    this.plan = false;

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
     * @param resources Resources list
     * @param elapse Elapse time since last call
     * @param flags Game flags
     * @return {People} Itself
     */
    refresh: function (resources, elapse, flags) {
        this.actions.forEach(function (action) {
            action.refresh(resources, flags);
        });
        if (flags.settled) {
            var ratio = 1;
            if (this.busy) {
                ratio = 5;
                if (this.busy.relaxing) {
                    ratio *= (1 - this.busy.relaxing);
                }
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
     * Set busy with an action
     * @param action Current action
     * @returns {People} Itself
     */
    setBusy: function (action) {
        this.busy = !!action ? action : false;
        this.html.classList.toggle("busy", !!action);
        return this;
    },
    /**
     * Change energy
     * @param amount Amount to apply
     * @returns {number} Current energy
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
     * @returns {boolean}
     */
    isTired: function () {
        return this.energy <= 0;
    },
    /**
     * Change life
     * @param amount Amount to apply
     * @returns {number} Current life
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
     * @param building Building to plan
     * @returns {People} Itself
     */
    planBuilding: function (building) {
        this.plan = building;
        return this;
    },
    /**
     * Add some actions
     * @param actions One or more actions to add
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
     * @param actions One or more actions to lock
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
     * @returns {People} Itself
     */
    die: function () {
        if (this.html.classList.contains("arrived")) {
            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOOSE_SOMEONE, this);
            this.html.classList.remove("arrived");
            this.actions.forEach(function (action) {
                action.cancel();
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
 * @param amount Number of name to get
 * @return {Promise}
 */
People.randomName = function (amount) {
    return new Promise(function (resolve, reject) {
        var baseUrl = "https://randomuser.me/api?inc=gender,name",
            countries = ["AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR", "GB", "IE", "NL", "NZ", "TR", "US"];
        get(baseUrl + "&nat=" + countries.join(",") + "&noinfo&results=" + amount, resolve, reject);
    });
};
