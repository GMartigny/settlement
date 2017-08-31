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
    var now = Utils.getNow();
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

    this.super(null, holder);
    console.log("Started in " + (Utils.getNow() - now) + "ms");
}
GameController.tickLength = 2000;
GameController.extends(Model, "GameController", /** @lends GameController.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.resourcesList = Utils.wrap(Resource.LST_ID);
        html.appendChild(this.resourcesList);

        this.peopleList = Utils.wrap(People.LST_ID);
        html.appendChild(this.peopleList);

        this.visualPane = Utils.wrap("visualPane");
        html.appendChild(this.visualPane);

        this.eventsList = Utils.wrap(Event.LST_ID);
        html.appendChild(this.eventsList);

        this.logsList = Utils.wrap("logs");
        html.appendChild(this.logsList);

        return html;
    },
    /**
     * Start a new adventure
     * @private
     */
    init: function (holder) {
        var game = this;
        DataManager.bindAll(this);

        holder.appendChild(this.html);

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
            TimerManager.timeout(this.prepareNewcomer.bind(this, 1), 500);
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
            if (Utils.isArray(given)) {
                given.forEach(function (r) {
                    game.earn.apply(game, r);
                });
            }
        })
        // We may use resources
        .observe(msgType.USE, function (use) {
            if (Utils.isArray(use)) {
                Utils.compactResources(use).forEach(function (resource) {
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
        if (!Utils.isArray(actions)) {
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
        if (!Utils.isArray(actions)) {
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
        return Utils.formatTime(this.getSettledTime());
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
        var elapse = MathUtils.floor((Utils.getNow() - this.lastTick) / GameController.tickLength);
        this.lastTick += elapse * GameController.tickLength;

        if (this.flags.paused) {
            elapse = 0;
        }

        setTimeout(this.refresh.bind(this), GameController.tickLength / 3);

        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.survived += elapse * GameController.tickLength;
                // People consume resources to survive
                var peopleConsumption = DataManager.get(DataManager.ids.people).needs;
                if (this.flags.drought) {
                    peopleConsumption[0][0] *= 2;
                }
                peopleConsumption.forEach(function (consumption) {
                    this.consume(consumption[0], consumption[1], function (diff) {
                        this.flags[consumption[2]] = diff;
                    });
                }, this);

                var peopleDropRate = DataManager.get(DataManager.ids.people).dropRate;
                if (this.canSomeoneArrive() && MathUtils.random() < peopleDropRate) {
                    this.prepareNewcomer();
                }

                // Random event can happen
                var eventDropRate = 0.01; // FIXME: No magic number
                if (!this.flags.popup && MathUtils.random() < eventDropRate) {
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
     * @param {ID} resourceId - Resource id
     * @param {lackOfResources} lack - A callback function in case of lack
     */
    consume: function (amount, resourceId, lack) {
        if (amount) {
            var instance = this.resources.get(resourceId);
            if (!instance) {
                instance = new Resource(resourceId);
            }
            if (instance && instance.has(amount)) {
                instance.update(-amount);
                instance.warnLack = false;
            }
            else if (Utils.isFunction(lack)) {
                var diff = amount - instance.count;
                instance.set(0);
                lack.call(this, diff, resourceId);

                if (!instance.warnLack) {
                    instance.warnLack = true;
                    MessageBus.notify(MessageBus.MSG_TYPES.RUNS_OUT, resourceId);
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
        if (this.resources.has(id)) {
            this.resources.get(id).update(amount);
        }
        else {
            var res = new Resource(id, amount);
            this.resources.push(id, res);
            this.resourcesList.appendChild(res.html);
        }
    },
    /**
     * Build a person object and add it to the camp
     * @param {Number} [amount=1] - Number of person that rejoin
     */
    prepareNewcomer: function (amount) {
        var game = this;
        peopleFactory(amount).then(function (persons) {
            persons.forEach(function (person) {
                person.addAction(game.initialActions.getValues());

                if (!game.people.length) {
                    person.life = 0;
                    person.energy = 0;
                    person.updateLife(0);
                    person.updateEnergy(0);
                }
            });
            game.arrive(persons);
        });
    },
    /**
     * Add someone to the camp
     * @param {Array<People>|People} people - A people or an array of people instance
     */
    arrive: function (people) {
        if (!Utils.isArray(people)) {
            people = [people];
        }

        people.forEach(function (person) {

            if (this.people.length) {
                MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person);

                if (this.people.length === 2) {
                    TimerManager.timeout(function () {
                        var message = person.name + " say that there's other desert-walkers " +
                            "ready to join you if there's room for them.";
                        MessageBus.notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, message);
                    }, 2000);
                }
            }

            this.people.push(person);
            this.peopleList.appendChild(person.html);

            //noinspection BadExpressionStatementJS - force redraw
            person.html.offsetHeight;
            person.html.classList.add("arrived");
        }, this);
    },
    /**
     * Build something
     * @param {ID} id - Building id
     */
    build: function (id) {
        this.buildingsInProgress.out(id);
        if (!this.buildings.has(id)) {
            var bld = new Building(id);
            this.buildings.push(id, bld);
        }
    },
    /**
     * Return all unlocked craftables
     * @return {Array<ID>}
     */
    unlockedCraftables: function () {
        var craftables = [];

        DataManager.ids.resources.craftables.deepBrowse(function (id) {
            var craft = DataManager.get(id);
            if ((!craft.ifHas || this.buildings.has(craft.ifHas)) &&
                (!craft.condition || (Utils.isFunction(craft.condition) && craft.condition()))) {
                craftables.push(id);
            }
        }, this);

        return craftables;
    },
    /**
     * Return all possible craftables according to current resources
     * @return {Array<ID>}
     */
    possibleCraftables: function () {
        var game = this;

        return this.unlockedCraftables().filter(function (id) {
            var craft = DataManager.get(id);
            var keep = true;
            if (Utils.isFunction(craft.consume)) {
                craft.consume(craft).forEach(function (res) {
                    keep = keep && game.hasEnough(res[1], res[0]);
                });
            }
            return keep;
        });
    },
    /**
     * Return all accessible buildings
     * @return {Array<ID>}
     */
    possibleBuildings: function () {
        var buildings = [];

        DataManager.ids.buildings.deepBrowse(function (id) {
            var building = DataManager.get(id);
            if (!this.isBuildingInProgress(id) &&
                !this.isBuildingDone(id) &&
                (!building.upgrade || this.buildings.has(building.upgrade)) &&
                (!building.ifHas || this.isBuildingDone(building.ifHas))) {
                buildings.push(id);
            }
        }, this);

        return buildings;
    },
    isBuildingInProgress: function (buildingId) {
        return this.buildingsInProgress.includes(buildingId);
    },
    isBuildingDone: function (buildingId) {
        var isDone = false;
        this.buildings.forEach(function (building) {
            var data = building.data;
            isDone = isDone || data.id === buildingId;
            if (!isDone) {
                while (data.upgrade && !isDone) {
                    data = DataManager.get(data.upgrade);
                    isDone = isDone || data.id === buildingId;
                }
            }
        }, this);
        return isDone;
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
                (!event.condition || (Utils.isFunction(event.condition) && event.condition(event)));
        }, this);

        if (list.length) {
            return Utils.randomize(list);
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
