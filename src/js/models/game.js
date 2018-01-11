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
    Utils.log("Loaded in " + now + "ms");
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
        paused: false, // The game is paused
        win: false, // The game has been won
        gameOver: false, // the game is lost
        settled: 0, // For how long settled
        incidents: [] // Incidents that can't be rerun (unique or in progress)
    };
    this.lastTick = now;

    GameController.holder = holder;
    this.super(null, assets);
    Utils.log("Started in " + (Utils.getNow() - now) + "ms");
}

GameController.static(/** @lends GameController */{
    /**
     * Convert from in game hour to ms
     * @type {Number}
     * @const
     */
    TICK_LENGTH: 2000,
    /**
     * Time between refresh in ms
     * @type {Number}
     * @const
     */
    REFRESH_RATE: 200,
    /**
     * HTML element wrapping the game
     * @type {HTMLElement}
     */
    holder: null
});

GameController.extends(View, "GameController", /** @lends GameController.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();
        html.hide();

        this.resourcesList = Utils.wrap(Resource.LST_ID, null, html);

        var topPart = Utils.wrap("topPart", null, html);

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
                    action: game.wipeSave.bind(game, true)
                },
                no: "Cancel"
            }, "wipeIt");
        });
        bottomOptionsNode.appendChild(wipeSaveClickable.html);
        var creditsClickable = new Clickable("credits", "Credits", function openCreditsPopup () {
            var creditsData = [
                {
                    task: "Design and code",
                    name: "Guillaume Martigny",
                    url: "https://www.guillaume-martigny.fr/#en"
                }, {
                    task: "Graphics",
                    name: "if you want your name here, send me an email",
                    url: "mailto:https://www.guillaume-martigny.fr"
                }
            ];
            var credits = "<ul>";
            creditsData.forEach(function (hero) {
                credits += "<li>" + hero.task + ": " + hero.name.link(hero.url) + "</li>";
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
     * @param {Object} media - Pre-loaded assets
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
            this.prepareNewcomer.defer(this);
        }

        // early access warning
        if (!IS_DEV && IS_BETA && localStorage.getItem("known")) {
            new Popup({
                name: "Early access [" + VERSION + "]",
                desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>" +
                "If you want to report a bug or anything to improve the game, go to " +
                "<a href='https://github.com/GMartigny/settlement'>the project's page</a>.<br/><br/>" +
                "Thanks for playing !",
                yes: {
                    name: "Got it !",
                    action: function () {
                        localStorage.setItem("known", "1");
                    }
                }
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

        MessageBus.observe(msgType.CLICK, function observesActionClick (actionData) {
            game.saveGame();
            sendEvent("Action", "start", actionData.name);
        })
        .observe(msgType.ACTION_END, function observesActionEnd () {
            game.saveGame();
        })
        // We may find resources
        .observe(msgType.GIVE, function observesResourcesGive (given) {
            var initiator = null;
            if (given.initiator) {
                initiator = given.initiator;
                given = given.give;
            }
            if (Utils.isArray(given)) {
                var particles = [];
                var particlesFragment = document.createDocumentFragment();
                given.forEach(function earnAndAddParticle (info) {
                    game.earn.apply(game, info);

                    if (initiator) {
                        var id = info[1];
                        var data = DataManager.get(id);
                        if (data.icon) {
                            var destination = game.resources.get(id);
                            for (var i = 0; i < info[0]; ++i) {
                                var particle = new Particle(data.icon, initiator, destination);
                                particlesFragment.appendChild(particle.html);
                                particles.push(particle);
                            }
                        }
                    }
                });

                if (particles.length) {
                    GameController.holder.appendChild(particlesFragment);
                    Particle.batch.defer(null, particles);
                }
            }
        })
        // We may use resources
        .observe(msgType.USE, function observesResourcesUse (use) {
            if (Utils.isArray(use)) {
                Utils.compactResources(use).forEach(function (resource) {
                    game.consume.apply(game, resource);
                });
            }
        })
        // Keep track of building in progress
        .observe(msgType.START_BUILD, function observesBuildingStart (buildingId) {
            game.buildingsInProgress.push(buildingId);
        })
        // We may build
        .observe(msgType.BUILD, this.build.bind(this))
        // New people arrival
        .observe(msgType.ARRIVAL, function observesPeopleArrival () {
            sendEvent("People", "arrive", game.getSettledTime());
        })
        // And we may die :'(
        .observe(msgType.LOOSE_SOMEONE, function observesPeopleLose (person) {
            sendEvent("People", "die", person.stats.age);

            // The last hope fade away
            var isGameOver = game.people.size <= 0;
            var message = isGameOver ? "The last @common standing passed away. The last hope fades out in silence." :
                "@name just died, @possessive body is dragged outside and buried.";
            LogManager.log(LogManager.personify(message, person), LogManager.LOG_TYPES.WARN);

            if (isGameOver) {
                MessageBus.notify(msgType.LOOSE);
            }
        })
        .observe(msgType.LOOSE, function observesGameOver () {
            game.flags.gameOver = true;
            sendEvent("Game", "loose", game.getSettledTime());
        })

        // Keep track of running incidents
        .observe(msgType.INCIDENT_START, function observesIncidentStart (incident) {
            game.incidentsList.appendChild(incident.html);
            game.incidents.push(incident);
            game.saveGame();
        })
        .observe(msgType.INCIDENT_END, function observesIncidentEnd (incident) {
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

        // End of the game
        .observe(msgType.WIN, function observesGameWin () {
            game.flags.win = true;
            sendEvent("Game", "win", game.getSettledTime());
        })

        .observe(msgType.KEYS.SPACE, function observesSpaceStroke (direction) {
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

        actions.forEach(function addToInitialActions (actionId) {
            if (!this.initialActions.includes(actionId)) {
                this.initialActions.push(actionId);
            }
        }, this);
        this.people.forEach(function callAddActions (people) {
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

        actions.forEach(function removeFromInitialActions (actionId) {
            this.initialActions.out(actionId);
        }, this);
        this.people.forEach(function callLockAction (people) {
            people.lockAction(actions);
        });
    },
    /**
     * Return the time since settlement
     * @return {Number}
     */
    getSettledTime: function () {
        return MathsUtils.floor(this.flags.settled ? this.flags.settled / GameController.TICK_LENGTH : 0);
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
        var elapse = MathsUtils.floor((Utils.getNow() - this.lastTick) / GameController.TICK_LENGTH);
        this.lastTick += elapse * GameController.TICK_LENGTH;

        requestAnimationFrame(this.refresh.bind(this));

        if (this.flags.win) {
            if (!Popup.OPENED && this.people.size) {
                var game = this;
                new Popup({
                    name: "The road ahead",
                    desc: "From the rumors, much of the east coast have not been destroy by bombs. " +
                        "Some survivors have set new community from scratch.<br/>" +
                        "From what can be heard, those groups accept anyone willing to live peacefully. " +
                        "Let's find them !",
                    yes: {
                        name: "Let the journey begin ...",
                        action: function () {
                            game.people.forEach(function (person, id, list) {
                                person.hide();
                                list.delete(id);
                            });
                            MessageBus.notify(MessageBus.MSG_TYPES.UNBUILD, DataManager.ids.buildings.big.module);
                            game.saveGame();
                        }
                    }
                });
            }
        }
        else if (this.flags.gameOver) {
            if (!Popup.OPENED) {
                new Popup({
                    name: "Lost",
                    desc: "",
                    yes: {
                        name: "Try again",
                        action: this.wipeSave.bind(this, true)
                    }
                });
            }
        }
        else if (!this.flags.paused) {
            if (this.flags.settled) {
                this.flags.settled += elapse * GameController.TICK_LENGTH;

                // People consume resources to survive
                this.tickConsumption(elapse);

                // Someone arrive
                var peopleDropRate = DataManager.get(DataManager.ids.people).dropRate;
                if (this.canSomeoneArrive() && MathsUtils.random() < peopleDropRate) {
                    this.prepareNewcomer();
                }

                // Random incident can happen
                if (!Popup.OPENED && MathsUtils.random() < Incident.DROP_RATE) {
                    this.startIncident(this.getRandomIncident());
                }
            }

            // Refresh resources
            this.resources.forEach(function refreshResources (resource, id, list) {
                resource.refresh(list);
            });

            // Refresh people
            this.people.forEach(function refreshPeople (person, id, list) {
                if (person.isDead()) {
                    list.delete(id);
                    person.die();
                }
                else {
                    person.refresh(this.resources, elapse, this.flags);
                }
            }, this);

            if (elapse) {
                this.saveGame();
            }
        }
    },
    /**
     * Compute and apply people's need
     * @param {Number} elapse - Number of tick
     */
    tickConsumption: function (elapse) {
        var peopleConsumption = DataManager.get(DataManager.ids.people).needs;
        peopleConsumption.forEach(function peopleConsumptionUse (consumption) {
            var resourceId = consumption[1];
            this.flags[consumption[2]] = 0;
            var drought = this.incidents.get(DataManager.ids.incidents.hard.drought);
            if (resourceId === DataManager.ids.resources.gatherables.common.water && drought) {
                consumption[0] *= drought.data.multiplier;
            }
            var amount = this.people.size + (this.flags.incidents.includes(DataManager.ids.incidents.medium.strayDog));
            var warn = this.consume(consumption[0] * amount * elapse, resourceId, function setLackResource (diff) {
                this.flags[consumption[2]] = diff;
            });
            var data = DataManager.get(resourceId);
            if (!data.initialDropRate) {
                data.initialDropRate = data.dropRate;
            }
            // Decrease dropRate if not lacking
            var dropRateDecrease = 0.98;
            data.dropRate = warn ? data.initialDropRate : data.dropRate * MathsUtils.pow(dropRateDecrease, elapse);
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
     * @param {ID} resourceId - Resource Id
     */
    /**
     * Need to use a resource
     * @param {Number} amount - Amount to use
     * @param {ID} resourceId - Resource id
     * @param {lackOfResources} lack - A callback function in case of lack
     * @return {Boolean} Has not enough of it
     */
    consume: function (amount, resourceId, lack) {
        var lacked = false;
        if (amount) {
            if (!this.resources.has(resourceId)) {
                this.earn(0, resourceId);
            }
            var instance = this.resources.get(resourceId);
            if (instance.has(amount)) {
                instance.update(-amount);
                instance.warnLack = false;
            }
            else {
                lacked = true;
                if (Utils.isFunction(lack)) {
                    var diff = amount - (instance ? instance.count : 0);
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
        return lacked;
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
        People.peopleFactory(amount || 1).then(function prepareNewPersons (persons) {
            persons.forEach(function preparePerson (person) {
                person.addAction(game.initialActions);

                // First one start empty
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
     * A new person arrive
     * @param {Array<People>|People} people - A people or an array of people instance
     */
    arrive: function (people) {
        if (!Utils.isArray(people)) {
            people = [people];
        }

        people.forEach(function addToPeopleList (person) {
            if (this.people.size) {
                MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person);

                // The first newcomer
                if (this.people.size === 1) {
                    var description = LogManager.personify("attracted by the crash a @common approach. " +
                        "@nominative accept to team up.", person);
                    LogManager.log(description, MessageBus.MSG_TYPES.LOGS.EVENT);
                    TimerManager.timeout(function otherWalkersBlab () {
                        var message = "There's other wanderers ready to join if there's room for them.";
                        LogManager.log(message, MessageBus.MSG_TYPES.LOGS.QUOTE);
                    }, GameController.TICK_LENGTH * 3);
                }
            }

            this.addPeople(person);

            person.show.defer(person);
        }, this);
    },
    /**
     * Add a person to the camp
     * @param {People} person - New person to add
     */
    addPeople: function (person) {
        this.people.push(person);
        this.peopleList.appendChild(person.html);

        var peopleSize = this.people.size;
        this.people.forEach(function (each) {
            each.html.style.zIndex = String(peopleSize--);
        });
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
            if (building.data.upgrade) {
                this.buildings.delete(building.data.upgrade);
            }
            sendEvent("Building", "built", building.data.name);
        }
    },
    /**
     * Return all unlocked craftables
     * @return {Array<ID>}
     */
    unlockedCraftables: function () {
        var craftables = [];

        DataManager.ids.resources.craftables.deepBrowse(function checkUnlocked (id) {
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

        return this.unlockedCraftables().filter(function checkConsumption (id) {
            var craft = DataManager.get(id);
            var keep = true;
            if (Utils.isFunction(craft.consume)) {
                craft.consume(craft).forEach(function checkHasResources (res) {
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

        DataManager.ids.buildings.deepBrowse(function checkIfUnlocked (id) {
            var building = DataManager.get(id);
            if (!building.shadow &&
                !this.isBuildingInProgress(id) &&
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
     * @return {Boolean}
     */
    isBuildingInProgress: function (buildingId) {
        return this.buildingsInProgress.includes(buildingId);
    },
    /**
     * Tell if this building (or an upgrade) is done
     * @param {ID} buildingId - Any building ID
     * @return {Boolean}
     */
    isBuildingDone: function (buildingId) {
        var isDone = false;
        this.buildings.forEach(function checkIfDone (building) {
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
        ({
            1: DataManager.ids.incidents.easy,
            2: DataManager.ids.incidents.medium,
            5: DataManager.ids.incidents.hard
        }).browse(function (value, key) {
            if (elapsedWeek > key) {
                list.insert(value);
            }
        });
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
    /**
     * Turn the game state into a json, shouldn't be called directly
     * @return {Object} Game's state
     */
    toJSON: function () {
        // TODO: can be greatly optimize to save space on storage
        var json = {
            flg: this.flags,
            res: this.resources.getValues(),
            plp: this.people.getValues(),
            iac: this.initialActions,
            bld: this.buildings.getValues(),
            inc: this.incidents.getValues(),
            lct: this.knownLocations,
            bip: this.buildingsInProgress,
            upk: Perk.usedId,
            vrn: VERSION
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

        var loadedVersion = data.vrn && data.vrn.substr(0, data.vrn.lastIndexOf("."));
        var currentVersion = VERSION.substr(0, VERSION.lastIndexOf("."));
        if (loadedVersion !== currentVersion) {
            // TODO: display a differential changelog
            new Popup({
                name: "New version",
                desc: "Since the last time you played, a new version of the game has been released.<br/>" +
                    "You may want to restart to experience all the cool new features. ;)<br/>" +
                    "<a href='https://github.com/GMartigny/settlement#changelog'>Changelog</a>"
            });
        }

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

            game.addPeople(person);
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
     * @param {Boolean} [withReload=false] - Trigger a page reload too
     */
    wipeSave: function (withReload) {
        sendEvent("Game", "wipe");
        SaveManager.clear();
        if (withReload) {
            location.reload();
        }
    }
});
if (IS_DEV) {
    /**
     * Earn one of each resources and buildings
     */
    GameController.prototype.resourcesOverflow = function resourcesOverflow () {
        var amount = 50;
        DataManager.ids.resources.deepBrowse(function earn50 (id) {
            this.earn(amount, id);
        }.bind(this));
    };
    /**
     * Build a random building
     */
    GameController.prototype.nextBuilding = function nextBuilding () {
        var pick = this.possibleBuildings().random();
        MessageBus.notify(MessageBus.MSG_TYPES.BUILD, pick);
    };
    /**
     * Put everyone in a almost dead state
     */
    GameController.prototype.wannaLoose = function wannaLoose () {
        var lifeLeft = 5;
        var energyLEft = 0;
        this.people.forEach(function lowLifeNoEnergy (person) {
            person.setLife(lifeLeft);
            person.setEnergy(energyLEft);
        });
    };
}
