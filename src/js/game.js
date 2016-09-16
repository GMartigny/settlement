"use strict";

console.groupCollapsed("Loading");
/**
 * Global var for the game object
 */
var G;
preloadImages([
    "dist/img/icons.png"
], function (percent, file) {
    console.log(file + " : " + percent + "%");
}).then(function (media) {
    console.groupEnd();
    try {
        G = new GameController(document.getElementById("main"), media);
    }
    catch (e) {
        console.warn("Fail to load game : " + e.message);
    }
});

/**
 * Main game controller
 * This is where all game logic is decided
 * @param {HTMLElement} holder - HTML element holding the game
 * @param {Object} media - All graphical resources
 * @constructor
 */
function GameController (holder, media) {
    this.holder = holder;
    this.media = media;

    this.resources = new Collection();
    this.buildings = new Collection();
    this.events = new Collection();
    this.collects = [];
    this.people = [];
    this.initialActions = new Collection();
    this.knownLocations = new Collection();

    this.flags = {
        ready: false,
        paused: false,
        settled: false,
        survived: 0,
        popup: false,
        productivity: 1
    };

    this.lastTick = performance.now();
    this._init();

    this.refresh();
}
GameController.tickLength = 2000;
GameController.prototype = {
    /**
     * Start a new adventure
     * @private
     */
    _init: function () {
        log("Starting " + window.VERSION);

        var game = this;
        deepBrowse(DataManager.data, function (item) {
            item.id = pickID();
            for (var attr in item) {
                if (item.hasOwnProperty(attr) && isFunction(item[attr])) {
                    item[attr] = item[attr].bind(game);
                }
            }
        });

        this.initialActions.push(DataManager.data.actions.wakeUp);

        window.onkeypress = function (e) {
            switch (e.keyCode) {
                case 32:
                    this.togglePause();
                    break;
            }
        }.bind(this);

        this.resourcesList = wrap();
        this.resourcesList.id = Resource.LST_ID;
        this.holder.appendChild(this.resourcesList);

        this.peopleList = wrap();
        this.peopleList.id = People.LST_ID;
        this.holder.appendChild(this.peopleList);

        this.buildingsList = wrap();
        this.buildingsList.id = Building.LST_ID;
        this.holder.appendChild(this.buildingsList);

        this.eventsList = wrap();
        this.eventsList.id = Event.LST_ID;
        this.holder.appendChild(this.eventsList);

        this.logsList = wrap();
        this.logsList.id = "logs";
        this.holder.appendChild(this.logsList);

        // First person arrives
        TimerManager.timeout(this.welcome.bind(this, 1, true), 500);

        // We may find resources
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.GIVE, function (given) {
            if (isArray(given)) {
                given.forEach(function (r) {
                    this.earn.apply(this, r);
                }.bind(this));
            }
        }.bind(this));

        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.FIND_LOCATION, function (location) {
            this.knownLocations.push(location);
        }.bind(this));

        // We may have a resource collector
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.COLLECT, function (collected) {
            if (isArray(collected)) {
                compactResources(this.collects.concat(collected));
            }
        }.bind(this));

        // We may use resources
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.USE, function (use) {
            if (isArray(use)) {
                compactResources(use).forEach(function (r) {
                    this.consume.apply(this, r);
                }.bind(this));
            }
        }.bind(this));

        // We may build
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.BUILD, function (building) {
            if (building) {
                this.build(building);
            }
        }.bind(this));

        // And we may die :'(
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function (person) {
            this.log("We loose " + person.name, MessageBus.MSG_TYPES.LOGS.WARN);
            // TODO : Decide of gameplay
            // this.resources.get(DataManager.data.resources.room.id).update(-1);
            this.people.out(person);
            // The last hope fade away
            if (this.people.length <= 0) {
                this.log("We held up for " + this.getSurvivalDuration());
                this.flags.paused = true;
            }
        }.bind(this));

        // Keep track of running events
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
            this.events.push(event.data.id, event);
            this.flags.popup = false;
        }.bind(this));
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.EVENT_END, function (event) {
            this.events.pop(event.data.id);
        }.bind(this));

        // Lock or unlock actions for all
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.LOCK, function (actions) {
            this.removeFromInitialActions(actions);
        }.bind(this));
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.UNLOCK, function (actions) {
            this.addToInitialActions(actions);
        }.bind(this));

        // Log informations
        var logTypes = MessageBus.MSG_TYPES.LOGS.values();
        MessageBus.getInstance().observe(logTypes, function (message, type) {
            this.log(message, type);
        }.bind(this));

        this.flags.ready = true;
    },
    /**
     * Add actions to initial actions list
     * @param {Action|Array} actions - One or more action
     */
    addToInitialActions: function (actions) {
        if (!isArray(actions)) {
            actions = [actions];
        }

        actions.forEach(function (action) {
            this.initialActions.push(action);
        }.bind(this));
        this.people.forEach(function (people) {
            people.addAction(actions);
        });
    },
    /**
     * Remove actions from initial actions list
     * @param {Action|Array} actions - One or more action
     */
    removeFromInitialActions: function (actions) {
        if (!isArray(actions)) {
            actions = [actions];
        }

        actions.forEach(function (action) {
            this.initialActions.pop(action.id);
        }.bind(this));
        this.people.forEach(function (people) {
            people.lockAction(actions);
        });
    },
    /**
     * Return the time since settlement
     * @return {Number}
     */
    getSettledTime: function () {
        return this.flags.settled ? this.flags.survived / GameController.tickLength : 0;
    },
    /**
     * Return a well formatted play duration
     * @return {String}
     */
    getSurvivalDuration: function () {
        return formatTime(this.getSettledTime());
    },
    /**
     * Add some log
     * @param {String} message
     * @param {Number} type
     */
    log: function (message, type) {
        if (message.length) {
            type = type || 0;
            var types = {
                0: "info",
                1: "warning",
                2: "flavor",
                3: "event"
            };
            this.logsList.insertBefore(wrap("log " + types[type], message), this.logsList.firstChild);
            var logs = Array.prototype.slice.call(this.logsList.children);
            if (logs.length > LogManager.maxLog) {
                logs.last().remove();
            }
        }
    },
    /**
     * Toggle pause state
     */
    togglePause: function () {
        this.flags.paused = !this.flags.paused;
        this.holder.classList.toggle("paused", this.flags.paused);
        if (this.flags.paused) {
            TimerManager.stopAll();
        }
        else {
            TimerManager.restartAll();
        }
    },
    /**
     * Loop function called every game tick
     */
    refresh: function () {
        var now = performance.now(),
            elapse = floor((now - this.lastTick) / GameController.tickLength);
        this.lastTick += elapse * GameController.tickLength;

        if (this.flags.paused) {
            elapse = 0;
        }

        TimerManager.timeout(this.refresh.bind(this), GameController.tickLength / 3);

        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.survived += elapse * GameController.tickLength;
                // We use some resources
                // TODO : need refacto
                var needs = DataManager.data.people.need();
                needs.forEach(function (need) {
                    var waterId = DataManager.data.resources.gatherable.common.water.id;
                    var state = need[1].id === waterId ? "thirsty" : "starving";
                    this.consume(need[0] * this.people.length, need[1], function (number) {
                        this.people.forEach(function (person, index, list) {
                            person[state] = number / list.length;
                        });
                    });
                }.bind(this));

                if (this.canSomeoneArrive()) {
                    this.welcome();
                }

                // Random event can happen
                if (!this.flags.popup && random() < DataManager.data.events.dropRate) {
                    var eventData = this.getRandomEvent();
                    // in the right conditions
                    if (eventData) {
                        var event = new Event(eventData);
                        event.start(function (event) {
                            if (event.data.time) {
                                this.eventsList.appendChild(event.html);
                            }
                            this.flags.popup = false;
                        }.bind(this));
                        this.flags.popup = true;
                    }
                }
            }

            // Let's now recount our resources
            this.resources.forEach(function (resource, id, list) {
                resource.refresh(list);
            });

            this.people.forEach(function (people) {
                people.refresh(this.resources, elapse, this.flags);
            }.bind(this));
        }
    },
    /**
     * Save the game state
     */
    save: function () {
        var state = {};

        SaveManager.store(state);
    },
    /**
     * Check if game has enough of a resource
     * @param {String} id - Resource ID
     * @param {Number} amount - Amount needed
     * @return {Boolean}
     */
    hasEnough: function (id, amount) {
        return this.resources.get(id).has(amount);
    },
    /**
     * A callback to handle missing resources
     * @callback lackOfResources
     * @param {Number} missingAmount
     * @param {Object} resource - Resource data
     */
    /**
     * Need to use a resource
     * @param {Number} amount - Amount to use
     * @param {Object} resource - Resource data
     * @param {lackOfResources} lack - A callback function in case of lack
     */
    consume: function (amount, resource, lack) {
        if (amount) {
            var instance = this.resources.get(resource.id);
            if (instance && instance.has(amount)) {
                instance.update(-amount);
                instance.warnLack = false;
            }
            else if (isFunction(lack)) {
                var diff = amount - instance.get();
                instance.set(0);
                lack.call(this, diff, resource);

                if (!instance.warnLack) {
                    instance.warnLack = true;
                    var message = "We run out of " + resource.name + ", we need to do something.";
                    this.log(MessageBus.MSG_TYPES.LOGS.WARN, message);
                }
            }
        }
    },
    /**
     * Earn some resource
     * @param {Number} amount - Amount to earn
     * @param {Object} resource - Resource data
     */
    earn: function (amount, resource) {
        var id = resource.id;
        if (this.resources.has(id)) {
            this.resources.get(id).update(amount);
        }
        else {
            var res = new Resource(resource, amount);
            this.resources.push(id, res);
            this.resourcesList.appendChild(res.html);
        }
    },
    /**
     * Welcome people to the camp
     * @param {Number} amount - Number of person that rejoin
     * @param {Boolean} first - First person
     */
    welcome: function (amount, first) {
        peopleFactory(amount).then(function (persons) {
            persons.forEach(function (person) {
                person.addAction(this.initialActions.values());

                this.people.push(person);
                this.peopleList.appendChild(person.html);

                if (first) {
                    person.life = 0;
                    person.energy = 0;
                    person.updateLife(0);
                    person.updateEnergy(0);
                }
                else {
                    //noinspection BadExpressionStatementJS - force redraw
                    person.html.offsetHeight;
                    this.log(person.name + " arrives.", MessageBus.MSG_TYPES.LOGS.EVENT);
                }

                person.html.classList.add("arrived");
            }.bind(this));
        }.bind(this));
    },
    /**
     * Build something
     * @param {Object} building - Building data
     */
    build: function (building) {
        var id = building.id;
        if (this.buildings.has(id)) {
            this.buildings.get(id).add(1);
        }
        else {
            var bld = new Building(building);
            this.buildings.push(id, bld);
            this.buildingsList.appendChild(bld.html);

            if (isFunction(building.lock)) {
                this.removeFromInitialActions(building.lock(bld));
            }
            if (isFunction(building.unlock)) {
                this.addToInitialActions(building.unlock(bld));
            }
        }
    },
    /**
     * Return all possible craftables
     * @return {Array}
     */
    possibleCraftables: function () {
        var craftables = [];
        var resources = this.resources.items;
        var unlockedCraftables = DataManager.data.resources.craftable.basic;

        deepBrowse(unlockedCraftables, function (craft) {
            var ok = true;
            if (craft.consume && isFunction(craft.consume)) {
                craft.consume(craft).forEach(function (res) {
                    ok = ok && resources[res[1].id] && resources[res[1].id].has(res[0]);
                });
            }

            if (ok) {
                craftables.push(craft);
            }
        });
        return craftables;
    },
    /**
     * Return all accessible buildings
     * @return {Array}
     */
    possibleBuildings: function () {
        var buildings = [],
            done = this.buildings;

        deepBrowse(DataManager.data.buildings, function (build) {
            if (!build.unique || build.unique && !done.has(build.id)) {
                buildings.push(build);
            }
        });

        return buildings;
    },
    /**
     * Decide if someone can join the colony
     * @return {Boolean}
     */
    canSomeoneArrive: function () {
        return this.hasEnough(DataManager.data.resources.room.id, this.people.length + 1) &&
            random() < DataManager.data.people.dropRate &&
            this.getSettledTime() / DataManager.time.day > 2;
    },
    /**
     * Return an event that can happened
     * @return {*}
     */
    getRandomEvent: function () {
        var list = [],
            time = this.getSettledTime() / DataManager.time.week;
        if (time > 1) {
            list.push.apply(list, DataManager.data.events.easy.values());
            if (time > 2) {
                list.push.apply(list, DataManager.data.events.medium.values());
                if (time > 5) {
                    list.push.apply(list, DataManager.data.events.hard.values());
                }
            }
        }
        // filter events already running or unmatched conditions
        list = list.filter(function (event) {
            return !this.events.has(event.id) &&
                (!event.condition || (isFunction(event.condition) && event.condition(event)));
        }.bind(this));

        if (list.length) {
            return randomize(list);
        }
        else {
            return false;
        }
    }
};
