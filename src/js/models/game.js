"use strict";
/* global VERSION, IS_DEV, performance */

/**
 * Main game controller
 * This is where all game logic is done
 * @param {HTMLElement} holder - HTML element holding the game
 * @param {Object} assets - All graphical resources
 * @constructor
 */
function GameController (holder, assets) {
    var now = round(performance.now());
    console.log("Loaded in " + now + "ms");
    console.log("Starting " + VERSION);

    this.assets = assets;

    this.resources = new Collection();
    this.buildings = new Collection();
    this.events = new Collection();
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

    this.super();
    holder.appendChild(this.html);
    console.log("Started in " + round(performance.now() - now) + "ms");
}
GameController.tickLength = 2000;
GameController.extends(Model, "GameController", {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.resourcesList = wrap();
        this.resourcesList.id = Resource.LST_ID;
        html.appendChild(this.resourcesList);

        this.peopleList = wrap();
        this.peopleList.id = People.LST_ID;
        html.appendChild(this.peopleList);

        this.visualPane = wrap();
        this.visualPane.id = "visualPane";
        html.appendChild(this.visualPane);

        this.eventsList = wrap();
        this.eventsList.id = Event.LST_ID;
        html.appendChild(this.eventsList);

        this.logsList = wrap();
        this.logsList.id = "logs";
        html.appendChild(this.logsList);

        return html;
    },
    /**
     * Start a new adventure
     * @private
     */
    _init: function () {
        var game = this;
        DataManager.data.deepBrowse(function (item) {
            item.id = pickID();
            item.browse(function (attr, attrName) {
                if (isFunction(attr)) {
                    item[attrName] = attr.bind(game);
                }
            });
        });

        this.initialActions.push(DataManager.data.actions.wakeUp);

        KeyManager.attach(KeyManager.KEYS.SPACE, this.togglePause.bind(this));

        // Start managers
        GraphicManager.start(this.visualPane, this.assets.images, this.assets.data);
        LogManager.start(this.logsList);

        // First person arrives
        TimerManager.timeout(this.welcome.bind(this, 1, true), 500);

        // We may find resources
        MessageBus.observe(MessageBus.MSG_TYPES.GIVE, function (given) {
            if (isArray(given)) {
                given.forEach(function (r) {
                    game.earn.apply(game, r);
                });
            }
        })
        // We may use resources
        .observe(MessageBus.MSG_TYPES.USE, function (use) {
            if (isArray(use)) {
                compactResources(use).forEach(function (resource) {
                    game.consume.apply(game, resource);
                });
            }
        })
        // We may build
        .observe(MessageBus.MSG_TYPES.BUILD, function (building) {
            if (building) {
                game.build(building);
            }
        })
        // Put the ships wreckage into play
        .notify(MessageBus.MSG_TYPES.BUILD, DataManager.data.buildings.special.wreckage)

        // And we may die :'(
        .observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function (person) {
            game.people.out(person);
            // The last hope fade away
            if (game.people.length <= 0) {
                MessageBus.notify(MessageBus.MSG_TYPES.LOOSE, game.getSurvivalDuration());
                game.flags.paused = true;
            }
        })

        // Keep track of running events
        .observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
            game.events.push(event.data.id, event);
        })
        .observe(MessageBus.MSG_TYPES.EVENT_END, function (event) {
            game.events.pop(event.data.id);
        })

        // Lock or unlock actions for all
        .observe(MessageBus.MSG_TYPES.LOCK, function (actions) {
            game.removeFromInitialActions(actions);
        })
        .observe(MessageBus.MSG_TYPES.UNLOCK, function (actions) {
            game.addToInitialActions(actions);
        })

        // End of the game
        .observe(MessageBus.MSG_TYPES.WIN, function () {
            this.flags.paused = true;
        });

        if (!IS_DEV) {
            // early access warning
            popup({
                name: "Early access",
                desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>" +
                "If you want to report a bug or anything to improve the game, go to " +
                "<a href='https://github.com/GMartigny/settlement'>the project's page</a>.<br/><br/>" +
                "Thanks for playing !"
            }, function () {
                this.flags.ready = true;
            }.bind(this));
        }

        this.lastTick = performance.now();
        this.refresh();
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
     * @param {ID|Array<ID>} actions - One or more action ID
     */
    removeFromInitialActions: function (actions) {
        if (!isArray(actions)) {
            actions = [actions];
        }

        actions.forEach(function (action) {
            this.initialActions.pop(action);
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
        this.html.classList.toggle("paused", this.flags.paused);
        this.html.classList.toggle("backdrop", this.flags.paused);
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
                var peopleConsumption = DataManager.data.people.needs(this.flags);
                MessageBus.notify(MessageBus.MSG_TYPES.USE, peopleConsumption, true);
                peopleConsumption.forEach(function (need) {
                    var amount = need[0];
                    var resource = need[1];
                    var lacking = need[2];

                    var instance = this.resources.has(resource.id) && this.resources.get(resource.id);
                    if (!instance) {
                        instance = new Resource(resource);
                        this.resources.push(instance);
                    }
                    if (instance.count < amount) {
                        if (!instance.warnLack) {
                            MessageBus.notify(MessageBus.MSG_TYPES.RUNS_OUT, resource);
                            instance.warnLack = true;
                        }
                        this.flags[lacking] += amount - instance.count;
                    }
                    else {
                        instance.warnLack = false;
                        this.flags[lacking] = 0;
                    }
                }.bind(this));

                if (this.canSomeoneArrive() && random() < DataManager.data.people.dropRate) {
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
     * @param {ResourceData} resource - Resource data
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
                    MessageBus.notify(MessageBus.MSG_TYPES.RUNS_OUT, resource.name);
                }
            }
        }
    },
    /**
     * Earn some resource
     * @param {Number} amount - Amount to earn
     * @param {ResourceData} resource - Resource data
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
        var game = this;
        peopleFactory(amount).then(function (persons) {
            persons.forEach(function (person) {
                person.addAction(game.initialActions.values());

                game.people.push(person);
                game.peopleList.appendChild(person.html);

                if (first) {
                    person.life = 0;
                    person.energy = 0;
                    person.updateLife(0);
                    person.updateEnergy(0);
                }
                else {
                    //noinspection BadExpressionStatementJS - force redraw
                    person.html.offsetHeight;
                    MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person.name);

                    if (game.people.length === 2) {
                        TimerManager.timeout(function () {
                            MessageBus.notify(
                                MessageBus.MSG_TYPES.LOGS.FLAVOR,
                                person.name + " say that there's other desert-walkers " +
                                    "ready to join you if there's room for them.");
                        }, 2000);
                    }
                }

                person.html.classList.add("arrived");
            });
        });
    },
    /**
     * Build something
     * @param {BuildingData} building - Building data
     */
    build: function (building) {
        var id = building.id;
        if (!this.buildings.has(id)) {
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
     * Upgrade a building
     * @param {Object} upgrade -
     */
    upgradeBuilding: function (upgrade) {
        if (upgrade) {
            this.buildings.set(upgrade.from, upgrade.to);
        }
    },
    /**
     * Return all unlocked craftables
     * @return {Array<CraftableData>}
     */
    unlockedCraftables: function () {
        var craftables = [];

        DataManager.data.resources.craftables.deepBrowse(function (craft) {
            if (!craft.condition || (isFunction(craft.condition) && craft.condition())) {
                craftables.push(craft);
            }
        });

        return craftables;
    },
    /**
     * Return all possible craftables according to current resources
     * @return {Array<CraftableData>}
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
     * @return {Array<BuildingData>}
     */
    possibleBuildings: function () {
        var buildings = [],
            done = this.buildings;

        DataManager.data.buildings.deepBrowse(function (build) {
            // not already done
            if (!done.has(build.id)) {
                // no condition or condition meet
                if (!isFunction(build.condition) || build.condition(build)) {
                    // has the upgraded building
                    if (!isFunction(build.upgrade) || done.has(build.upgrade())) {
                        buildings.push(build);
                    }
                }
            }
        });

        return buildings;
    },
    /**
     * Decide if someone can join the colony
     * @return {Boolean}
     */
    canSomeoneArrive: function () {
        return this.hasEnough(DataManager.data.resources.room.id, this.people.length + 1);
    },
    /**
     * Return an event that can happened
     * @return {EventData|null}
     */
    getRandomEvent: function () {
        var list = [],
            time = this.getSettledTime() / DataManager.time.week;
        // TODO : find better definition
        if (time > 1) {
            list.push.apply(list, DataManager.data.events.easy.values());
            if (time > 2) {
                list.push.apply(list, DataManager.data.events.medium.values());
                if (time > 5) {
                    list.push.apply(list, DataManager.data.events.hard.values());
                }
            }
        }
        // filter events already running or with unmatched conditions
        list = list.filter(function (event) {
            return !this.events.has(event.id) &&
                (!event.condition || (isFunction(event.condition) && event.condition(event)));
        }.bind(this));

        if (list.length) {
            return randomize(list);
        }
        else {
            return null;
        }
    }
});
if (IS_DEV) {
    /**
     * Earn one of each resources and buildings
     */
    GameController.prototype.resourcesOverflow = function () {
        DataManager.data.resources.gatherables.deepBrowse(function (resource) {
            this.earn(50, resource);
        }.bind(this));
        DataManager.data.resources.craftables.deepBrowse(function (resource) {
            this.earn(50, resource);
        }.bind(this));
    };
    /**
     * Build a random building
     */
    GameController.prototype.nextBuilding = function () {
        var pick = this.possibleBuildings().random();
        MessageBus.notify(MessageBus.MSG_TYPES.BUILD, pick);
    };
}
