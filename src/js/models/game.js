"use strict";
/* exported GameController */

/**
 * Main game controller
 * This is where all game logic is done
 * @param {HTMLElement} holder - HTML element holding the game
 * @param {Object} assets - All graphical resources
 * @constructor
 * @extends View
 */
function GameController (holder, assets) {
    var now = Utils.getNow();
    console.log("Loaded in " + now + "ms");
    console.log("Starting " + VERSION);

    this.assets = assets;

    this.resources = new Map();
    this.buildings = new Map();
    this.incidents = new Map();
    this.people = new Map();
    this.initialActions = [];
    this.knownLocations = [];
    this.buildingsInProgress = [];

    this.flags = {
        ready: false, // The game is ready
        paused: false, // The game is paused
        win: false, // The game has been won
        gameOver: false, // the game is lost
        settled: 0, // For how long settled
        popup: false, // A popup is shown
        incidents: [] // Incidents that can't be rerun (unique or in progress)
    };
    this.lastTick = now;

    GameController.holder = holder;
    this.super(null, assets);
    console.log("Started in " + (Utils.getNow() - now) + "ms");
}
/**
 * Convert from in game hour to ms
 * @type {Number}
 */
GameController.tickLength = 2000;
GameController.holder = null;
GameController.extends(View, "GameController", /** @lends GameController.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();
        html.hide();

        var topPart = Utils.wrap("topPart", null, html);

        this.resourcesList = Utils.wrap(Resource.LST_ID, null, html);

        this.peopleList = Utils.wrap(People.LST_ID, null, topPart);

        this.logsList = Utils.wrap("logs", null, topPart);

        this.visualPane = Utils.wrap("visualPane", null, html);

        this.incidentsList = Utils.wrap(Incident.LST_ID, null, html);

        var game = this;

        var bottomOptionsNode = Utils.wrap("bottomOptions", null, html);
        var wipeSaveClickable = new Clickable("wipe", "Clear save", function openWipeSavePopup () {
            new Popup({
                name: "Clear save",
                desc: "Completely wipe the saved game. Careful, this is irreversible.",
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
        bottomOptionsNode.appendChild(wipeSaveClickable.html);
        var creditsClickable = new Clickable("credits", "Credits", function openCreditsPopup () {
            var creditsData = [
                {
                    task: "Design and code",
                    name: "Guillaume Martigny",
                    url: "https://www.guillaume-martigny.fr"
                }, {
                    task: "Graphics",
                    name: "if you want your name here, send me an email",
                    url: "mailto:https://www.guillaume-martigny.fr"
                }
            ];
            var credits = "<ul>";
            creditsData.forEach(function (hero) {
                credits += "<li>" + hero.task + ": <a href='" + hero.url + "'>" + hero.name + "</a></li>";
            });
            credits += "</ul>";
            new Popup({
                name: "Settlement " + VERSION,
                desc: credits
            });
        });
        bottomOptionsNode.appendChild(creditsClickable.html);

        return html;
    },
    /**
     * Start a new adventure
     * @param {Object} media - ??
     */
    init: function (media) {
        DataManager.bindAll(this);

        GameController.holder.innerHTML = "";
        GameController.holder.appendChild(this.html);

        // Start managers
        GraphicManager.start(this.visualPane, media.assets, {
            assets: media.assetsData,
            positions: media.buildingsData
        });
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

        if (!IS_DEV && IS_BETA) {
            // early access warning
            new Popup({
                name: "Early access [" + VERSION + "]",
                desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>" +
                "If you want to report a bug or anything to improve the game, go to " +
                "<a href='https://github.com/GMartigny/settlement'>the project's page</a>.<br/><br/>" +
                "Thanks for playing !",
                yes: "Got it !"
            });
        }
        // Start the refresh loop
        this.refresh();
        this.show();
    },
    /**
     * Set off event listeners
     */
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
        .observe(msgType.BUILD, function (buildingId) {
            game.build(buildingId);
        })
        .observe(msgType.ARRIVAL, function () {
            sendEvent("People", "arrive", game.getSettledTime());
        })
        // And we may die :'(
        .observe(msgType.LOOSE_SOMEONE, function (person) {
            game.people.delete(person.id);
            sendEvent("People", "die", person.stats.age);
            // The last hope fade away
            if (game.people.size <= 0) {
                MessageBus.notify(msgType.LOOSE, game.getSettledTime());
            }
        })
        .observe(msgType.LOOSE, function () {
            game.flags.gameOver = true;
            game.wipeSave();
        })

        // Keep track of running incidents
        .observe(msgType.INCIDENT_START, function (incident) {
            game.incidentsList.appendChild(incident.html);
            game.incidents.push(incident);
        })
        .observe(msgType.INCIDENT_END, function (incident) {
            // incident remove its html itself
            game.incidents.delete(incident.getId());
            if (!incident.data.unique) {
                game.flags.incidents.out(incident.getId());
            }
            game.saveGame();
        })

        // Lock or unlock actions for all
        .observe(msgType.LOCK, this.removeFromInitialActions.bind(this))
        .observe(msgType.UNLOCK, this.addToInitialActions.bind(this))

        .observe(msgType.SAVE, this.saveGame.bind(this))

        // End of the game
        .observe(msgType.WIN, function () {
            this.flags.win = true;
            sendEvent("Game", "win", game.getSettledTime());
            new Popup({ // TODO
                name: "You win !!",
                desc: ""
            });
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
        return MathsUtils.floor(this.flags.settled ? this.flags.settled / GameController.tickLength : 0);
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
            this.lastTick = Utils.getNow();
        }
    },
    /**
     * Loop function called every game tick
     */
    refresh: function () {
        var elapse = MathsUtils.floor((Utils.getNow() - this.lastTick) / GameController.tickLength);
        this.lastTick += elapse * GameController.tickLength;

        if (this.flags.paused || this.flags.gameOver) {
            elapse = 0;
        }

        TimerManager.timeout(this.refresh.bind(this), GameController.tickLength / 10);

        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.settled += elapse * GameController.tickLength;

                // People consume resources to survive
                this.tickConsumption(elapse);

                // Someone arrive
                var peopleDropRate = DataManager.get(DataManager.ids.people).dropRate;
                if (this.canSomeoneArrive() && MathsUtils.random() < peopleDropRate) {
                    this.prepareNewcomer();
                }

                // Random incident can happen
                if (!this.flags.popup && MathsUtils.random() < Incident.DROP_RATE) {
                    this.startIncident(this.getRandomIncident());
                }
            }

            // Refresh resources
            this.resources.forEach(function (resource, id, list) {
                resource.refresh(list);
            });

            // Refresh people
            this.people.forEach(function (people) {
                people.refresh(this.resources, elapse, this.flags);
            }, this);

            MessageBus.notify(MessageBus.MSG_TYPES.SAVE);
        }
    },
    /**
     * Compute and apply people's need
     * @param {Number} elapse - Number of tick
     */
    tickConsumption: function (elapse) {
        var peopleConsumption = DataManager.get(DataManager.ids.people).needs;
        peopleConsumption.forEach(function peopleConsumptionUse (consumption) {
            this.flags[consumption[2]] = 0;
            var drought = this.incidents.get(DataManager.ids.incidents.hard.drought);
            if (consumption[1] === DataManager.ids.resources.gatherables.common.water && drought) {
                consumption[0] *= drought.data.multiplier;
            }
            var amount = this.people.size + (this.flags.doggy ? 1 : 0);
            this.consume(consumption[0] * amount * elapse, consumption[1], function setLackResource (diff) {
                this.flags[consumption[2]] = diff;
            });
        }, this);
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
     * @param {ID} resourceId - Resource id
     */
    earn: function (amount, resourceId) {
        if (this.resources.has(resourceId)) {
            this.resources.get(resourceId).update(amount);
        }
        else {
            var resource = new Resource(resourceId, amount);
            this.resources.push(resource);
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

                if (!game.people.size) {
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
            if (this.people.size) {
                MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person);

                // The first newcomer
                if (this.people.size === 1) {
                    var description = LogManager.personify("attracted by the explosion a @common approach. " +
                        "@nominative accept to team up.", person);
                    new Popup({
                        name: "Newcomer",
                        desc: description
                    });
                    TimerManager.timeout(function () {
                        var message = "There's other desert-walkers ready to join if there's room for them.";
                        MessageBus.notify(MessageBus.MSG_TYPES.LOGS.QUOTE, message);
                    }, GameController.tickLength * 3);
                }
            }

            this.people.push(person);
            this.peopleList.appendChild(person.html);

            person.show.defer(person);
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
            this.buildings.push(building);
            sendEvent("Building", "built", building.data.name);
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
            if (!isDone) {
                var doneId = building.getId();
                var doneUpgrade = building.data.upgrade;
                isDone = isDone || doneId === buildingId;
                // Follow upgrade cascade
                while (doneUpgrade && !isDone) {
                    doneId = doneUpgrade;
                    doneUpgrade = DataManager.get(doneId).upgrade;
                    isDone = isDone || doneId === buildingId;
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
        return this.hasEnough(DataManager.ids.resources.room, this.people.size + 1);
    },
    /**
     * Return an id of incident that can happened or null otherwise
     * @return {ID|null}
     */
    getRandomIncident: function () {
        var list = [],
            elapsedWeek = this.getSettledTime() / DataManager.time.week;
        // TODO : find a better solution ?
        if (elapsedWeek > 1) {
            list.push.apply(list, DataManager.ids.incidents.easy);
            if (elapsedWeek > 2) {
                list.push.apply(list, DataManager.ids.incidents.medium);
                if (elapsedWeek > 5) {
                    list.push.apply(list, DataManager.ids.incidents.hard);
                }
            }
        }
        // filter incidents already running or with unmatched conditions
        list = list.filter(function filterIncident (incidentId) {
            var incidentData = DataManager.get(incidentId);
            return !this.incidents.has(incidentId) &&
                (!incidentData.condition || (Utils.isFunction(incidentData.condition) && incidentData.condition()));
        }, this);

        return list.length ? Utils.randomize(list) : null;
    },
    /**
     * Start an incident
     * @param {ID} incidentId - The incident's id
     */
    startIncident: function (incidentId) {
        if (incidentId && !this.flags.incidents.includes(incidentId)) {
            var incident = new Incident(incidentId);
            this.flags.incidents.push(incident.getId());
            incident.start();
            this.saveGame();
            sendEvent("Incident", "start", incident.data.name);
        }
    },
    /**
     * Save the whole game state
     */
    saveGame: function () {
        if (!this.flags.gameOver) {
            SaveManager.persist(this);
        }
    },
    toJSON: function () {
        var json = {
            flg: this.flags,
            res: this.resources.getValues(),
            plp: this.people.getValues(),
            iac: this.initialActions,
            bld: this.buildings.getValues(),
            inc: this.incidents.getValues(),
            lct: this.knownLocations,
            bip: this.buildingsInProgress,
            upk: Perk.usedId
        };
        delete json.flg.paused;
        delete json.flg.popup;
        return json;
    },
    /**
     * Load the game from storage
     */
    loadGame: function () {
        sendEvent("Game", "reload");
        var data = SaveManager.load();
        var game = this;

        MessageBus.notify(MessageBus.MSG_TYPES.GIVE, data.res);
        data.bld.forEach(function rebuildBuildings (bld) {
            MessageBus.notify(MessageBus.MSG_TYPES.BUILD, bld.id);
        });
        data.inc.forEach(function restartIncident (inc) {
            var incident = new Incident(inc.id);
            if (inc.rmn) {
                incident.run(inc.rmn);
            }
        });
        data.plp.forEach(function instantiatePeople (personData) {
            var person = new People(personData.nam, personData.gnd);
            person.setLife(personData.lif);
            person.setEnergy(personData.ene);
            person.stats = personData.sts;
            if (personData.prk) {
                person.gainPerk(personData.prk);
            }
            personData.act.forEach(function instantiateAction (actionData) {
                person.addAction(actionData.id);
                var action = person.actions.get(actionData.id);
                action.repeated = actionData.rpt;
                if (actionData.rmn) {
                    action.choosenOptionId = actionData.opi;
                    action.energyDrain = actionData.egd;
                    action.start(actionData.rmn, actionData.elp);
                }
            });

            game.people.push(person);
            game.peopleList.appendChild(person.html);
            person.show();
        });
        Perk.usedId = data.upk;
        this.addToInitialActions(data.iac);
        this.knownLocations = data.lct;
        this.buildingsInProgress = data.bip;
        this.flags = data.flg;
    },
    /**
     * Clear the save
     */
    wipeSave: function () {
        sendEvent("Game", "wipe");
        SaveManager.clear();
    }
});
if (IS_DEV) {
    /**
     * Earn one of each resources and buildings
     */
    GameController.prototype.resourcesOverflow = function resourcesOverflow () {
        DataManager.ids.resources.deepBrowse(function (id) {
            this.earn(50, id);
        }.bind(this));
    };
    /**
     * Build a random building
     */
    GameController.prototype.nextBuilding = function nextBuilding () {
        var pick = this.possibleBuildings().random();
        MessageBus.notify(MessageBus.MSG_TYPES.BUILD, pick);
    };
    GameController.prototype.wannaLoose = function wannaLoose () {
        this.people.forEach(function (person) {
            person.setLife(5);
            person.setEnergy(0);
        });
    };
}
