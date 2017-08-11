"use strict";
/* exported GameController */

/**
 * Main game controller
 * This is where all game logic is done
 * @param {HTMLElement} holder - HTML element holding the game
 * @param {Object} assets - All graphical resources
 * @constructor
 */
function GameController (holder, assets) {
    var now = getNow();
    console.log("Loaded in " + now + "ms");
    console.log("Starting " + VERSION);

    this.assets = assets;

    this.resources = new Map();
    this.buildings = new Map();
    this.events = new Map();
    this.people = [];
    this.initialActions = new Map();
    this.knownLocations = [];
    this.buildingsInProgress = [];

    this.flags = {
        ready: false,
        paused: false,
        settled: false,
        survived: 0,
        popup: false,
        productivity: 1
    };
    this.lastTick = now;

    this.super();
    holder.appendChild(this.html);
    console.log("Started in " + (getNow() - now) + "ms");
}
GameController.tickLength = 2000;
GameController.extends(Model, "GameController", /** @lends GameController.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.resourcesList = wrap(Resource.LST_ID);
        html.appendChild(this.resourcesList);

        this.peopleList = wrap(People.LST_ID);
        html.appendChild(this.peopleList);

        this.visualPane = wrap("visualPane");
        html.appendChild(this.visualPane);

        this.eventsList = wrap(Event.LST_ID);
        html.appendChild(this.eventsList);

        this.logsList = wrap("logs");
        html.appendChild(this.logsList);

        return html;
    },
    /**
     * Start a new adventure
     * @private
     */
    init: function () {
        var game = this;
        DataManager.bindAll(this);

        // Start managers
        GraphicManager.start(this.visualPane, this.assets.images, this.assets.data);
        LogManager.start(this.logsList);

        this.registerObservers();

        if (SaveManager.hasData()) {
            this.loadGame();
        }
        else {
            // Put the ships wreckage into play
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, DataManager.ids.buildings.special.wreckage);
            this.initialActions.push(DataManager.ids.actions.wakeUp);

            // First person arrives
            TimerManager.timeout(this.welcome.bind(this, 1, true), 500);
        }

        if (!IS_DEV && VERSION.includes("v0.")) {
            // early access warning
            popup({
                name: "Early access [" + VERSION + "]",
                desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>" +
                "If you want to report a bug or anything to improve the game, go to " +
                "<a href='https://github.com/GMartigny/settlement'>the project's page</a>.<br/><br/>" +
                "Thanks for playing !"
            }, {
                yes: {
                    name: "Got it !",
                    action: function () {
                        game.flags.ready = true;
                    }
                }
            });
        }
        // Start the refresh loop
        this.refresh();
    },
    registerObservers: function () {
        var game = this;
        var msgType = MessageBus.MSG_TYPES;

        // We may find resources
        MessageBus.observe(msgType.GIVE, function (given) {
            if (isArray(given)) {
                given.forEach(function (r) {
                    game.earn.apply(game, r);
                });
            }
        })
        // We may use resources
        .observe(msgType.USE, function (use) {
            if (isArray(use)) {
                compactResources(use).forEach(function (resource) {
                    game.consume.apply(game, resource);
                });
            }
        })
        // Keep track of building in progress
        .observe(msgType.START_BUILD, function (buildingId) {
            game.buildingsInProgress.push(buildingId);
        })
        // We may build
        .observe(msgType.BUILD, this.build.bind(this))
        // Some may arrive
        .observe(msgType.ARRIVAL, this.arrive.bind(this))
        // And we may die :'(
        .observe(msgType.LOOSE_SOMEONE, function (person) {
            game.people.out(person);
            // The last hope fade away
            if (game.people.length <= 0) {
                MessageBus.notify(msgType.LOOSE, game.getSettledTime());
                game.flags.paused = true;
            }
        })

        // Keep track of running events
        .observe(msgType.EVENT_START, function (event) {
            game.events.push(event.data.id, event);
        })
        .observe(msgType.EVENT_END, function (event) {
            game.events.delete(event.data.id);
        })

        // Lock or unlock actions for all
        .observe(msgType.LOCK, this.removeFromInitialActions.bind(this))
        .observe(msgType.UNLOCK, this.addToInitialActions.bind(this))

        // End of the game
        .observe(msgType.WIN, function () {
            this.flags.paused = true;
        })

        .observe(msgType.KEYS.SPACE, function (direction) {
            if (direction === "up") {
                game.togglePause();
            }
        });
    },
    /**
     * Add actions to initial actions list
     * @param {ID|Array<ID>} actions - One or more actionId
     */
    addToInitialActions: function (actions) {
        if (!isArray(actions)) {
            actions = [actions];
        }

        actions.forEach(function (action) {
            this.initialActions.push(action);
        }, this);
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
            this.initialActions.delete(action);
        }, this);
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
        var now = getNow();
        var elapse = floor((now - this.lastTick) / GameController.tickLength);
        this.lastTick += elapse * GameController.tickLength;

        if (this.flags.paused) {
            elapse = 0;
        }

        setTimeout(this.refresh.bind(this), GameController.tickLength / 3);

        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.survived += elapse * GameController.tickLength;
                // People consume resources to survive
                var peopleConsumption = DataManager.get(DataManager.ids.people);
                if (this.flags.drought) {
                    peopleConsumption[0][0] *= 2;
                }
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
                }, this);

                var peopleDropRate = DataManager.get(DataManager.ids.people).dropRate;
                if (this.canSomeoneArrive() && random() < peopleDropRate) {
                    this.welcome();
                }

                // Random event can happen
                var eventDropRate = 0.01; // FIXME: No magic number
                if (!this.flags.popup && random() < eventDropRate) {
                    this.startEvent(this.getRandomEvent());
                }
            }

            // Let's now recount our resources
            this.resources.forEach(function (resource, id, list) {
                resource.refresh(list);
            });

            this.people.forEach(function (people) {
                people.refresh(this.resources, elapse, this.flags);
            }, this);
        }
    },
    /**
     * Check if game has enough of a resource
     * @param {String} id - Resource ID
     * @param {Number} amount - Amount needed
     * @return {Boolean}
     */
    hasEnough: function (id, amount) {
        return this.resources.has(id) && this.resources.get(id).has(amount);
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
                var diff = amount - instance.count;
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
     * @param {ID} id - Resource id
     */
    earn: function (amount, id) {
        var resource = DataManager.get(id);
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
     * @param {Boolean} [firstOne=false] - First person
     */
    welcome: function (amount, firstOne) {
        var game = this;
        peopleFactory(amount).then(function (persons) {
            persons.forEach(function (person) {
                person.addAction(game.initialActions.getValues());

                if (firstOne) {
                    person.life = 0;
                    person.energy = 0;
                    person.updateLife(0);
                    person.updateEnergy(0);
                }
                else {
                    if (game.people.length === 2) {
                        TimerManager.timeout(function () {
                            var message = person.name + " say that there's other desert-walkers " +
                                "ready to join you if there's room for them.";
                            MessageBus.notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, message);
                        }, 2000);
                    }
                }
                MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person);

            });
        });
    },
    /**
     * Add someone to the camp
     * @param {Array<People>|People} people - A people or an array of people instance
     */
    arrive: function (people) {
        if (isArray(people)) {
            people.forEach(this.arrive.bind(this));
        }
        else {
            this.people.push(people);
            this.peopleList.appendChild(people.html);

            //noinspection BadExpressionStatementJS - force redraw
            people.html.offsetHeight;
            people.html.classList.add("arrived");
        }
    },
    /**
     * Build something
     * @param {BuildingData} building - Building data
     */
    build: function (building) {
        var id = building.id;
        this.buildingsInProgress.out(id);
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
     * Return all unlocked craftables
     * @return {Array<CraftableData>}
     */
    unlockedCraftables: function () {
        var craftables = [];

        DataManager.ids.resources.craftables.deepBrowse(function (id) {
            var craft = DataManager.get(id);
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
        var game = this;

        return this.unlockedCraftables().filter(function (craft) {
            var keep = true;
            if (isFunction(craft.consume)) {
                craft.consume(craft).forEach(function (res) {
                    keep = keep && game.hasEnough(res[1].id, res[0]);
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
            done = this.buildings,
            inProgress = this.buildingsInProgress;

        DataManager.ids.buildings.deepBrowse(function (id) {
            var build = DataManager.get(id);
            // not already done or in progress
            if (!(done.has(id) || inProgress.includes(id))) {
                // no condition or condition meet
                if (!isFunction(build.condition) || build.condition(build)) {
                    // has the upgraded building
                    if (!build.upgrade || done.has(build.upgrade)) {
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
        return this.hasEnough(DataManager.ids.resources.room, this.people.length + 1);
    },
    /**
     * Return an event that can happened
     * @return {EventData|null}
     */
    getRandomEvent: function () {
        var list = [],
            elapsedWeek = this.getSettledTime() / DataManager.time.week;
        // TODO : find a better solution
        if (elapsedWeek > 1) {
            list.push.apply(list, DataManager.ids.events.easy);
            if (elapsedWeek > 2) {
                list.push.apply(list, DataManager.ids.events.medium);
                if (elapsedWeek > 5) {
                    list.push.apply(list, DataManager.ids.events.hard);
                }
            }
        }
        // filter events already running or with unmatched conditions
        list = list.filter(function (id) {
            var event = DataManager.get(id);
            return !this.events.has(id) &&
                (!event.condition || (isFunction(event.condition) && event.condition(event)));
        }.bind(this));

        if (list.length) {
            return randomize(list);
        }
        else {
            return null;
        }
    },
    /**
     * Start an event
     * @param {EventData} eventData - The event's data
     */
    startEvent: function (eventData) {
        // in the right conditions
        if (eventData) {
            var event = new Event(eventData);
            this.flags.popup = !!event.start(function (event) {
                if (event.data.time) {
                    this.eventsList.appendChild(event.html);
                }
                this.flags.popup = false;
            }.bind(this));
        }
    },
    /**
     * Save the whole game state
     */
    saveGame: function () {
        var gameData = {
            stl: this.flags.settled,
            res: this.resources.getValues().map(function (resource) {
                return resource.getStraight();
            }),
            plp: this.people.map(function (people) {
                return people.getStraight();
            }),
            iac: this.initialActions.getValues(),
            bld: this.buildings.getValues().map(function (building) {
                return building.getStraight();
            }),
            evt: this.events.getValues().map(function (event) {
                return event.getStraight();
            }),
            lct: this.knownLocations,
            bip: this.buildingsInProgress
        };

        SaveManager.persist(gameData);
        MessageBus.notify(MessageBus.MSG_TYPES.SAVE);
    },
    loadGame: function () {
        var data = SaveManager.load();

        MessageBus.notify(MessageBus.MSG_TYPES.GIVE, data.res);

        data.plp.forEach(function (personData) {
            var person = new People(personData.nam, personData.gnd);
            person.life = personData.lif;
            person.energy = personData.ene;
            person.stats = personData.stt;
            if (personData.prk) {
                person.gainPerk(personData.prk);
            }
            personData.act.forEach(function (action) {
                person.addAction(action.data);
                person.actions.get(action.data.id).repeated = action.repeated;
            });
            MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person);
        });
        game.addToInitialActions(data.iac);
        data.bld.forEach(MessageBus.notify.bind(MessageBus, MessageBus.MSG_TYPES.BUILD));
        // TODO events
        game.knownLocations = data.lct;
        game.buildingsInProgress = data.bip;
    }
});
if (IS_DEV) {
    /**
     * Earn one of each resources and buildings
     */
    GameController.prototype.resourcesOverflow = function () {
        DataManager.ids.resources.gatherables.deepBrowse(function (id) {
            this.earn(50, id);
        }.bind(this));
        DataManager.ids.resources.craftables.deepBrowse(function (id) {
            this.earn(50, id);
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
