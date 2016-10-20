"use strict";
/* global VERSION, IS_DEV */

/**
 * Loader
 */
(function () {
    console.groupCollapsed("Loading");

    var _assets = "dist/img/assets.png";
    var _assetsData = "dist/js/assets.json";

    loadAsync([
        "dist/img/icons.png",
        _assets,
        _assetsData
    ], function (percent, file) {
        console.log(file + " : " + percent.toFixed(2) + "%");
    }).then(function (media) {
        console.groupEnd();
        try {
            var Game = new GameController(document.getElementById("main"), {
                images: media[sanitize(_assets)],
                data: media[sanitize(_assetsData)]
            });
            if (IS_DEV) {
                window.G = Game;
            }
        }
        catch (e) {
            console.warn("Fail to load game : " + e.message, e.stack);
        }
    }).catch(function (error) {
        console.warn(error.message);
    });
})();

/**
 * Main game controller
 * This is where all game logic is decided
 * @param {HTMLElement} holder - HTML element holding the game
 * @param {Object} assets - All graphical resources
 * @constructor
 */
function GameController (holder, assets) {
    this.holder = holder;
    this.assets = assets;

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
        console.log("Starting " + VERSION);
        console.log("Stated in " + round(performance.now()) + "ms");

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

        KeyManager.attach(KeyManager.KEYS.SPACE, this.togglePause.bind(this));

        this.resourcesList = wrap();
        this.resourcesList.id = Resource.LST_ID;
        this.holder.appendChild(this.resourcesList);

        this.peopleList = wrap();
        this.peopleList.id = People.LST_ID;
        this.holder.appendChild(this.peopleList);

        this.visualPane = wrap();
        this.visualPane.id = "visualPane";
        this.holder.appendChild(this.visualPane);

        this.eventsList = wrap();
        this.eventsList.id = Event.LST_ID;
        this.holder.appendChild(this.eventsList);

        this.logsList = wrap();
        this.logsList.id = "logs";
        this.holder.appendChild(this.logsList);

        GraphicManager.start(this.visualPane, this.assets.images, this.assets.data);
        LogManager.start(this.logsList);
        TimerManager.start();

        // First person arrives
        TimerManager.timeout(this.welcome.bind(this, 1, true), 500);

        var busInstance = MessageBus.getInstance();
        // We may find resources
        busInstance.observe(MessageBus.MSG_TYPES.GIVE, function (given) {
            if (isArray(given)) {
                given.forEach(function (r) {
                    game.earn.apply(game, r);
                });
            }
        });

        // We may have a resource collector
        busInstance.observe(MessageBus.MSG_TYPES.COLLECT, function (collected) {
            if (isArray(collected)) {
                compactResources(game.collects.concat(collected));
            }
        });

        // We may use resources
        busInstance.observe(MessageBus.MSG_TYPES.USE, function (use) {
            if (isArray(use)) {
                compactResources(use).forEach(function (resource) {
                    game.consume.apply(game, resource);
                });
            }
        });

        // We may build
        busInstance.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
            if (building) {
                game.build(building);
            }
        });

        // And we may die :'(
        busInstance.observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function (person) {
            game.people.out(person);
            // The last hope fade away
            if (game.people.length <= 0) {
                MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOOSE, game.getSurvivalDuration());
                game.flags.paused = true;
            }
        });

        // Keep track of running events
        busInstance.observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
            game.events.push(event.data.id, event);
        });
        busInstance.observe(MessageBus.MSG_TYPES.EVENT_END, function (event) {
            game.events.pop(event.data.id);
        });

        // Lock or unlock actions for all
        busInstance.observe(MessageBus.MSG_TYPES.LOCK, function (actions) {
            game.removeFromInitialActions(actions);
        });
        busInstance.observe(MessageBus.MSG_TYPES.UNLOCK, function (actions) {
            game.addToInitialActions(actions);
        });

        busInstance.observe(MessageBus.MSG_TYPES.WIN, function () {
            this.flags.paused = true;
        });

        if (!IS_DEV) {
            // early access warning
            popup({
                name: "Early access",
                desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>" +
                "If you want to report a bug or anything to improve the game, go to " +
                "<a href='https://github.com/GMartigny/settlement'>the repo</a>.<br/><br/>" +
                "Thanks for playing !"
            }, function () {
                this.flags.ready = true;
            }.bind(this));
        }

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

        setTimeout(this.refresh.bind(this), GameController.tickLength / 3);

        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.survived += elapse * GameController.tickLength;
                // People consume resources to survive
                // TODO : need refacto
                DataManager.data.people.need().forEach(function (need) {
                    var waterId = DataManager.data.resources.gatherable.common.water.id;
                    var state = need[1].id === waterId ? "thirsty" : "starving";
                    this.consume(need[0] * this.people.length, need[1], function (number) {
                        // update people if lacking
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
                        this.flags.popup = event.start(function (event) {
                            if (event.data.time) {
                                this.eventsList.appendChild(event.html);
                            }
                            this.flags.popup = false;
                        }.bind(this));
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
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.RUNS_OUT, resource.name);
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
     * @param {Number} [amount=1] - Number of person that rejoin
     * @param {Boolean} [first=false] - First person
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
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.ARRIVAL, person.name);

                    if (this.people.length === 2) {
                        TimerManager.timeout(function () {
                            MessageBus.getInstance().notify(
                                MessageBus.MSG_TYPES.LOGS.FLAVOR,
                                person.name + " say that there's other desert-walkers " +
                                    "ready to join you if there's room for them.");
                        }.bind(this), 2000);
                    }
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

            if (isFunction(building.lock)) {
                this.removeFromInitialActions(building.lock(bld));
            }
            if (isFunction(building.unlock)) {
                this.addToInitialActions(building.unlock(bld));
            }
        }
    },
    /**
     * Return all unlocked craftables
     * @return {Array}
     */
    unlockedCraftables: function () {
        var craftables = [];

        deepBrowse(DataManager.data.resources.craftable, function (craft) {
            if (!craft.condition || (isFunction(craft.condition) && craft.condition())) {
                craftables.push(craft);
            }
        });

        return craftables;
    },
    /**
     * Return all possible craftables
     * @return {Array}
     */
    possibleCraftables: function () {
        var resources = this.resources.items;

        return this.unlockedCraftables().filter(function (craft) {
            var keep = true;
            if (isFunction(craft.consume)) {
                craft.consume(craft).forEach(function (res) {
                    keep = keep && resources[res[1].id] && resources[res[1].id].has(res[0]);
                });
            }
            return keep;
        });
    },
    /**
     * Return all accessible buildings
     * @return {Array}
     */
    possibleBuildings: function () {
        var buildings = [],
            done = this.buildings;

        deepBrowse(DataManager.data.buildings, function (build) {
            if ((!build.unique || build.unique && !done.has(build.id)) &&
                (isFunction(build.condition) && build.condition())) {
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
if (IS_DEV) {
    /**
     * Earn one of each resources
     * @returns {GameController} Itself
     */
    GameController.prototype.oneOfEach = function () {
        deepBrowse(DataManager.data.resources, function (resource) {
            this.earn(1, resource);
        }.bind(this));

        deepBrowse(DataManager.data.buildings, function (build) {
            this.build(build);
        }.bind(this));

        return this;
    };
}
