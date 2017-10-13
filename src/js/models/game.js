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
    this.initialActions = [];
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

        this.logsList = Utils.wrap("logs");
        html.appendChild(this.logsList);

        this.visualPane = Utils.wrap("visualPane");
        html.appendChild(this.visualPane);

        this.eventsList = Utils.wrap(Event.LST_ID);
        html.appendChild(this.eventsList);

        var game = this;

        var bottomOptions = Utils.wrap("bottomOptions");
        var wipeSaveNode = Utils.wrap("wipe clickable", "Clear save");
        wipeSaveNode.addEventListener("click", function () {
            popup({
                name: "Clear your save",
                desc: "Completely wipe your saved game. Careful, this is irreversible."
            }, {
                yes: {
                    name: "Restart anew",
                    action: function () {
                        game.wipeSave();
                        location.reload();
                    }
                },
                no: {
                    name: "Cancel"
                }
            }, "wipeIt");
        });
        bottomOptions.appendChild(wipeSaveNode);
        var credits = Utils.wrap("credits clickable", "Credits");
        credits.addEventListener("click", function () {
            popup({
                name: "Settlement",
                desc: "<ul>" +
                "<li>Design and code: Guillaume Martigny</li>" +
                "<li>Graphics: Maybe you ;)</li>"
            });
        });
        bottomOptions.appendChild(credits);
        html.appendChild(bottomOptions);

        return html;
    },
    /**
     * Start a new adventure
     * @param {HTMLElement} holder - The whole game HTML holder
     * @private
     */
    init: function (holder) {
        var game = this;
        DataManager.bindAll(this);

        holder.innerHTML = "";
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
        // And we may die :'(
        .observe(msgType.LOOSE_SOMEONE, function (person) {
            game.people.out(person);
            // The last hope fade away
            if (game.people.length <= 0) {
                MessageBus.notify(msgType.LOOSE, game.getSettledTime());
                game.flags.paused = true;
                game.wipeSave();
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

        .observe(msgType.SAVE, this.saveGame.bind(this))

        // End of the game
        .observe(msgType.WIN, function () {
            this.flags.paused = true;
            // TODO
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

        actions.forEach(function (actionId) {
            if (!this.initialActions.includes(actionId)) {
                this.initialActions.push(actionId);
            }
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

        actions.forEach(function (actionId) {
            this.initialActions.out(actionId);
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

        TimerManager.timeout(this.refresh.bind(this), GameController.tickLength / 3);

        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.survived += elapse * GameController.tickLength;
                // People consume resources to survive
                var peopleConsumption = DataManager.get(DataManager.ids.people).needs;
                if (this.flags.drought) {
                    peopleConsumption[0][0] *= 2;
                }
                peopleConsumption.forEach(function (consumption) {
                    this.flags[consumption[2]] = 0;
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
            this.saveGame();
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
            if (instance) {
                if (instance.has(amount)) {
                    instance.update(-amount);
                    instance.warnLack = false;
                }
                else {
                    if (Utils.isFunction(lack)) {
                        var diff = amount - instance.count;
                        lack.call(this, diff, resourceId);
                    }

                    instance.set(0);

                    // Warn for consuming more than available
                    if (!instance.warnLack) {
                        instance.warnLack = true;
                        MessageBus.notify(MessageBus.MSG_TYPES.RUNS_OUT, resourceId);
                    }
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
            var resource = new Resource(id, amount);
            this.resources.push(id, resource);
            this.resourcesList.appendChild(resource.html);
        }
    },
    /**
     * Build a person object and add it to the camp
     * @param {Number} [amount=1] - Number of person that rejoin
     */
    prepareNewcomer: function (amount) {
        var game = this;
        peopleFactory(amount || 1).then(function (persons) {
            persons.forEach(function (person) {
                person.addAction(game.initialActions);

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

                if (this.people.length === 1) {
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
            var building = new Building(id);
            this.buildings.push(id, building);
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
    /**
     * Tell if building is already in progress
     * @param {ID} buildingId - Any building ID
     * @returns {Boolean}
     */
    isBuildingInProgress: function (buildingId) {
        return this.buildingsInProgress.includes(buildingId);
    },
    /**
     * Tell if this building (or an upgrade) is done
     * @param {ID} buildingId - Any building ID
     * @returns {Boolean}
     */
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
     * Return an id of event that can happened or null otherwise
     * @return {ID|null}
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
        list = list.filter(function (eventId) {
            var eventData = DataManager.get(eventId);
            return !this.events.has(eventId) &&
                (!eventData.condition || (Utils.isFunction(eventData.condition) && eventData.condition()));
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
     * @param {ID} eventId - The event's data
     */
    startEvent: function (eventId) {
        // in the right conditions
        if (eventId) {
            var event = new Event(eventId);
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
            iac: this.initialActions,
            bld: this.buildings.getValues().map(function (building) {
                return building.getStraight();
            }),
            evt: this.events.getValues().map(function (event) {
                return event.getStraight();
            }),
            lct: this.knownLocations,
            bip: this.buildingsInProgress,
            settled: this.flags.settled,
            survived: this.flags.survived
        };

        SaveManager.persist(gameData);
    },
    loadGame: function () {
        var data = SaveManager.load();

        MessageBus.notify(MessageBus.MSG_TYPES.GIVE, data.res);

        this.arrive(data.plp.map(function (personData) {
            var person = new People(personData.nam, personData.gnd);
            person.setLife(personData.lif);
            person.setEnergy(personData.ene);
            person.stats = personData.sts;
            if (personData.prk) {
                person.gainPerk(personData.prk);
            }
            personData.act.forEach(function (actionData) {
                person.addAction(actionData.id);
                var action = person.actions.get(actionData.id);
                action.repeated = actionData.repeated;
                if (actionData.remaining) {
                    action.choosenOptionId = actionData.optionId;
                    action.energyDrain = actionData.energyDrain;
                    action.start(actionData.remaining, actionData.elapsed);
                }
            });
            return person;
        }));
        this.addToInitialActions(data.iac);
        data.bld.forEach(function (bld) {
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, bld.id);
        });
        // TODO events
        this.knownLocations = data.lct;
        this.buildingsInProgress = data.bip;
        this.flags.settled = data.settled;
        this.flags.survived = data.survived;
    },
    wipeSave: function () {
        sendEvent("Save", "wipe");
        SaveManager.clear();
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
