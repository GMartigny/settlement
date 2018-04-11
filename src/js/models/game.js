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
    const now = Utils.getNow();
    Utils.log(`Loaded in ${now}ms`);
    console.log(`Starting ${VERSION}`);

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
        incidents: [], // Incidents that can't be rerun (unique or in progress)
    };
    this.lastTick = now;

    GameController.holder = holder;
    this.super(null, assets);
    Utils.log(`Started in ${Utils.getNow() - now}ms`);
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
    holder: null,
});

GameController.extends(View, "GameController", /** @lends GameController.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();
        html.hide();

        this.resourcesList = Utils.wrap(Resource.LST_ID, null, html);

        const topPart = Utils.wrap("topPart", null, html);

        this.peopleList = Utils.wrap(People.LST_ID, null, topPart);

        this.logsList = Utils.wrap("logs", null, topPart);

        this.visualPane = Utils.wrap("visualPane", null, html);

        this.incidentsList = Utils.wrap(Incident.LST_ID, null, html);

        const bottomOptionsNode = Utils.wrap("bottomOptions", null, html);
        const wipeSaveClickable = new Clickable("wipe", "Clear save", () => {
            new Popup({
                name: "Clear save",
                desc: "Completely wipe the saved game. Careful, this is irreversible.",
                yes: {
                    name: "Restart anew",
                    action: this.wipeSave.bind(this, true),
                },
                no: "Cancel",
            }, "wipeIt");
        });
        bottomOptionsNode.appendChild(wipeSaveClickable.html);
        const creditsClickable = new Clickable("credits", "Credits", () => {
            const creditsData = [
                {
                    task: "Code",
                    name: "Guillaume Martigny",
                    url: "https://www.guillaume-martigny.fr/#en",
                }, {
                    task: "Graphics",
                    name: "Olivier Michas",
                    url: "https://twitter.com/OliverMichas",
                },
            ];
            const credits = `<ul>
                ${creditsData.map(hero => `<li>${hero.task}: ${hero.name.link(hero.url)}</li>`).join("")}
            </ul>`;
            new Popup({
                name: `Settlement ${VERSION}`,
                desc: credits,
            });
        });
        bottomOptionsNode.appendChild(creditsClickable.html);

        return html;
    },
    /**
     * Start a new adventure
     * @param {Object} media - Pre-loaded assets
     */
    init (media) {
        DataManager.bindAll(this);

        GameController.holder.html = "";
        GameController.holder.appendChild(this.html);

        // Start managers
        GraphicManager.start(this.visualPane, media.assets, {
            assets: media.assetsData,
            positions: media.buildingsData,
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
                name: `Early access [${VERSION}]`,
                desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>" +
                "If you want to report a bug or anything to improve the game, go to " +
                "<a href='https://github.com/GMartigny/settlement'>the project's page</a>.<br/><br/>" +
                "Thanks for playing !",
                yes: {
                    name: "Got it !",
                    action () {
                        localStorage.setItem("known", "1");
                    },
                },
            });
        }
        // Start the refresh loop
        this.refresh();
        this.show();
    },
    /**
     * Set off event listeners
     */
    registerObservers () {
        const msgType = MessageBus.MSG_TYPES;

        MessageBus
            .observe(msgType.ACTION_END, () => this.saveGame())
            .observe(msgType.CLICK, (actionData) => {
                this.saveGame();
                sendEvent("Action", "start", actionData.name);
            })
            // We may find resources
            .observe(msgType.GIVE, (given) => {
                let initiator = null;
                if (given.initiator) {
                    initiator = given.initiator;
                    given = given.give;
                }
                if (Utils.isArray(given)) {
                    const particles = [];
                    const particlesFragment = document.createDocumentFragment();
                    given.forEach((info) => {
                        this.earn(...info);

                        if (initiator) {
                            const id = info[1];
                            const data = DataManager.get(id);
                            if (data.icon) {
                                const destination = this.resources.get(id);
                                for (let i = 0; i < info[0]; ++i) {
                                    const particle = new Particle(data.icon, initiator, destination);
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
            .observe(msgType.USE, (use) => {
                if (Utils.isArray(use)) {
                    Utils.compactResources(use).forEach(couple => this.consume(...couple));
                }
            })
            // Keep track of building in progress
            .observe(msgType.START_BUILD, buildingId => this.buildingsInProgress.push(buildingId))
            // We may build
            .observe(msgType.BUILD, buildingId => this.build(buildingId))
            // New people arrival
            .observe(msgType.ARRIVAL, () => sendEvent("People", "arrive", this.getSettledTime()))
            // And we may die :'(
            .observe(msgType.LOOSE_SOMEONE, (person) => {
                sendEvent("People", "die", person.stats.age);

                // The last hope fade away
                const isGameOver = this.people.size <= 0;
                const message = isGameOver ?
                    "The last @common standing passed away. The last hope fades out in silence." :
                    "@name just died, @possessive body is dragged outside and buried.";
                LogManager.log(LogManager.personify(message, person), LogManager.LOG_TYPES.WARN);

                if (isGameOver) {
                    MessageBus.notify(msgType.LOOSE);
                }
            })
            .observe(msgType.LOOSE, () => {
                this.flags.gameOver = true;
                sendEvent("Game", "loose", this.getSettledTime());
            })

            // Keep track of running incidents
            .observe(msgType.INCIDENT_START, (incident) => {
                this.incidentsList.appendChild(incident.html);
                this.incidents.push(incident);
                this.saveGame();
            })
            .observe(msgType.INCIDENT_END, (incident) => {
                // incident remove its html itself
                this.incidents.delete(incident.getId());
                if (!incident.data.unique) {
                    this.flags.incidents.out(incident.getId());
                }
                this.saveGame();
            })

            // Lock or unlock actions for all
            .observe(msgType.LOCK, this.removeFromInitialActions.bind(this))
            .observe(msgType.UNLOCK, this.addToInitialActions.bind(this))

            // End of the game
            .observe(msgType.WIN, () => {
                this.flags.win = true;
                sendEvent("Game", "win", this.getSettledTime());
            })

            .observe(msgType.KEYS.SPACE, (direction) => {
                if (direction === "up") {
                    this.togglePause();
                }
            });
    },
    /**
     * Add actions to initial actions list
     * @param {ID|Array<ID>} actions - One or more actionId
     */
    addToInitialActions (actions) {
        if (!Utils.isArray(actions)) {
            actions = [actions];
        }

        actions.forEach((actionId) => {
            if (!this.initialActions.includes(actionId)) {
                this.initialActions.push(actionId);
            }
        });
        this.people.forEach(people => people.addAction(actions));
    },
    /**
     * Remove actions from initial actions list
     * @param {ID|Array<ID>} actions - One or more action ID
     */
    removeFromInitialActions (actions) {
        if (!Utils.isArray(actions)) {
            actions = [actions];
        }

        actions.forEach(actionId => this.initialActions.out(actionId));
        this.people.forEach(people => people.lockAction(actions));
    },
    /**
     * Return the time since settlement
     * @return {Number}
     */
    getSettledTime () {
        return MathsUtils.floor(this.flags.settled ? this.flags.settled / GameController.TICK_LENGTH : 0);
    },
    /**
     * Return a well formatted play duration
     * @return {String}
     */
    getSurvivalDuration () {
        return Utils.formatTime(this.getSettledTime());
    },
    /**
     * Toggle pause state
     */
    togglePause () {
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
    refresh () {
        const elapse = MathsUtils.floor((Utils.getNow() - this.lastTick) / GameController.TICK_LENGTH);
        this.lastTick += elapse * GameController.TICK_LENGTH;

        requestAnimationFrame(this.refresh.bind(this));

        if (this.flags.win) {
            if (!Popup.OPENED && this.people.size) {
                const game = this;
                new Popup({
                    name: "The road ahead",
                    desc: "From the rumors, much of the east coast have not been destroy by bombs. " +
                        "Some survivors have set new community from scratch.<br/>" +
                        "From what can be heard, those groups accept anyone willing to live peacefully. " +
                        "Let's find them !",
                    yes: {
                        name: "Let the journey begin ...",
                        action () {
                            game.people.forEach((person, id, list) => {
                                person.hide();
                                list.delete(id);
                            });
                            MessageBus.notify(MessageBus.MSG_TYPES.UNBUILD, DataManager.ids.buildings.big.module);
                            game.saveGame();
                        },
                    },
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
                        action: () => this.wipeSave(true),
                    },
                });
            }
        }
        else if (!this.flags.paused) {
            if (this.flags.settled) {
                this.flags.settled += elapse * GameController.TICK_LENGTH;

                // People consume resources to survive
                this.tickConsumption(elapse);

                // Someone arrive
                const peopleDropRate = DataManager.get(DataManager.ids.people).dropRate;
                if (this.canSomeoneArrive() && MathsUtils.random() < peopleDropRate) {
                    this.prepareNewcomer();
                }

                // Random incident can happen
                if (!Popup.OPENED && MathsUtils.random() < Incident.DROP_RATE) {
                    this.startIncident(this.getRandomIncident());
                }
            }

            // Refresh resources
            this.resources.forEach(resource => resource.refresh(this.resources));

            // Refresh people
            this.people.forEach((person, id) => {
                if (person.isDead()) {
                    this.people.delete(id);
                    person.die();
                }
                else {
                    person.refresh(this.resources, elapse, this.flags);
                }
            });

            if (elapse) {
                this.saveGame();
            }
        }
    },
    /**
     * Compute and apply people's need
     * @param {Number} elapse - Number of tick
     */
    tickConsumption (elapse) {
        const peopleConsumption = DataManager.get(DataManager.ids.people).needs;
        peopleConsumption.forEach((consumption) => {
            const resourceId = consumption[1];
            this.flags[consumption[2]] = 0;
            const drought = this.incidents.get(DataManager.ids.incidents.hard.drought);
            if (resourceId === DataManager.ids.resources.gatherables.common.water && drought) {
                consumption[0] *= drought.data.multiplier;
            }
            const hasDoggy = +(this.flags.incidents.includes(DataManager.ids.incidents.medium.strayDog));
            const amount = this.people.size + hasDoggy;
            const warn = this.consume(consumption[0] * amount * elapse, resourceId, (diff) => {
                this.flags[consumption[2]] = diff;
            });
            const data = DataManager.get(resourceId);
            if (!data.initialDropRate) {
                data.initialDropRate = data.dropRate;
            }
            // Decrease dropRate if not lacking
            const dropRateDecrease = 0.99;
            data.dropRate = warn ? data.initialDropRate : data.dropRate * (dropRateDecrease ** elapse);
        });
    },
    /**
     * Check if game has enough of a resource
     * @param {String} id - Resource ID
     * @param {Number} amount - Amount needed
     * @return {Boolean}
     */
    hasEnough (id, amount) {
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
    consume (amount, resourceId, lack) {
        let lacked = false;
        if (amount) {
            if (!this.resources.has(resourceId)) {
                this.earn(0, resourceId);
            }
            const instance = this.resources.get(resourceId);
            if (instance.has(amount)) {
                instance.update(-amount);
                instance.warnLack = false;
            }
            else {
                lacked = true;
                if (Utils.isFunction(lack)) {
                    const diff = amount - (instance ? instance.count : 0);
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
    earn (amount, resourceId) {
        if (this.resources.has(resourceId)) {
            this.resources.get(resourceId).update(amount);
        }
        else {
            const resource = new Resource(resourceId, amount);
            this.resources.push(resource);
            this.resourcesList.appendChild(resource.html);
        }
    },
    /**
     * Build a person object and add it to the camp
     * @param {Number} [amount=1] - Number of person that rejoin
     */
    prepareNewcomer (amount) {
        People.peopleFactory(amount || 1).then((persons) => {
            persons.forEach((person) => {
                person.addAction(this.initialActions);

                // First one start empty
                if (!this.people.size) {
                    person.life = 0;
                    person.energy = 0;
                    person.updateLife(0);
                    person.updateEnergy(0);
                }
            });
            this.arrive(persons);
        });
    },
    /**
     * A new person arrive
     * @param {Array<People>|People} people - A people or an array of people instance
     */
    arrive (people) {
        if (!Utils.isArray(people)) {
            people = [people];
        }

        people.forEach((person) => {
            if (this.people.size) {
                MessageBus.notify(MessageBus.MSG_TYPES.ARRIVAL, person);

                // The first newcomer
                if (this.people.size === 1) {
                    const description = LogManager.personify("attracted by the crash a @common approach. " +
                        "@nominative accept to team up.", person);
                    LogManager.log(description, MessageBus.MSG_TYPES.LOGS.EVENT);
                    TimerManager.timeout(() => {
                        const message = "There's other wanderers ready to join if there's room for them.";
                        LogManager.log(message, MessageBus.MSG_TYPES.LOGS.QUOTE);
                    }, GameController.TICK_LENGTH * 3);
                }
            }

            this.addPeople(person);

            person.show.defer(person);
        });
    },
    /**
     * Add a person to the camp
     * @param {People} person - New person to add
     */
    addPeople (person) {
        this.people.push(person);
        this.peopleList.appendChild(person.html);

        let peopleSize = this.people.size;
        this.people.forEach(each => each.html.style.zIndex = String(peopleSize--));
    },
    /**
     * Build something
     * @param {ID} id - Building id
     */
    build (id) {
        this.buildingsInProgress.out(id);
        if (!this.buildings.has(id)) {
            const building = new Building(id);
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
    unlockedCraftables () {
        const craftables = [];

        DataManager.ids.resources.craftables.deepBrowse((id) => {
            const craft = DataManager.get(id);
            if ((!craft.ifHas || this.buildings.has(craft.ifHas)) &&
                (!craft.condition || (Utils.isFunction(craft.condition) && craft.condition()))) {
                craftables.push(id);
            }
        });

        return craftables;
    },
    /**
     * Return all possible craftables according to current resources
     * @return {Array<ID>}
     */
    possibleCraftables () {
        return this.unlockedCraftables().filter((id) => {
            const craft = DataManager.get(id);
            let keep = true;
            if (Utils.isFunction(craft.consume)) {
                keep = craft.consume(craft).some(res => this.hasEnough(res[1], res[0]));
            }
            return keep;
        });
    },
    /**
     * Return all accessible buildings
     * @return {Array<ID>}
     */
    possibleBuildings () {
        const buildings = [];

        DataManager.ids.buildings.deepBrowse((id) => {
            const building = DataManager.get(id);
            if (!building.shadow &&
                !this.isBuildingInProgress(id) &&
                !this.isBuildingDone(id) &&
                (!building.upgrade || this.buildings.has(building.upgrade)) &&
                (!building.ifHas || this.isBuildingDone(building.ifHas))) {
                buildings.push(id);
            }
        });

        return buildings;
    },
    /**
     * Tell if building is already in progress
     * @param {ID} buildingId - Any building ID
     * @return {Boolean}
     */
    isBuildingInProgress (buildingId) {
        return this.buildingsInProgress.includes(buildingId);
    },
    /**
     * Tell if this building (or an upgrade) is done
     * @param {ID} buildingId - Any building ID
     * @return {Boolean}
     */
    isBuildingDone (buildingId) {
        let isDone = false;
        this.buildings.forEach((building) => {
            if (!isDone) {
                let doneId = building.getId();
                let doneUpgrade = building.data.upgrade;
                isDone = isDone || doneId === buildingId;
                // Follow upgrade cascade
                while (doneUpgrade && !isDone) {
                    doneId = doneUpgrade;
                    doneUpgrade = DataManager.get(doneId).upgrade;
                    isDone = isDone || doneId === buildingId;
                }
            }
        });
        return isDone;
    },
    /**
     * Decide if someone can join the colony
     * @return {Boolean}
     */
    canSomeoneArrive () {
        return this.hasEnough(DataManager.ids.resources.room, this.people.size + 1);
    },
    /**
     * Return an id of incident that can happened or null otherwise
     * @return {ID|null}
     */
    getRandomIncident () {
        let list = [];
        const elapsedWeek = this.getSettledTime() / DataManager.time.week;
        ({
            1: DataManager.ids.incidents.easy,
            2: DataManager.ids.incidents.medium,
            5: DataManager.ids.incidents.hard,
        }).browse((value, key) => {
            if (elapsedWeek > key) {
                list.insert(value);
            }
        });
        // filter incidents already running or with unmatched conditions
        list = list.filter((incidentId) => {
            const incidentData = DataManager.get(incidentId);
            return !this.incidents.has(incidentId) &&
                (!incidentData.condition || (Utils.isFunction(incidentData.condition) && incidentData.condition()));
        });

        return list.length ? Utils.randomize(list) : null;
    },
    /**
     * Start an incident
     * @param {ID} incidentId - The incident's id
     */
    startIncident (incidentId) {
        if (incidentId && !this.flags.incidents.includes(incidentId)) {
            const incident = new Incident(incidentId);
            this.flags.incidents.push(incident.getId());
            incident.start();
            this.saveGame();
            sendEvent("Incident", "start", incident.data.name);
        }
    },
    /**
     * Save the whole game state
     */
    saveGame () {
        if (!this.flags.gameOver) {
            SaveManager.persist(this);
        }
    },
    /**
     * Turn the game state into a json, shouldn't be called directly
     * @return {Object} Game's state
     */
    toJSON () {
        // TODO: can be greatly optimize to save space on storage
        const json = {
            flg: this.flags,
            res: this.resources.getValues(),
            plp: this.people.getValues(),
            iac: this.initialActions,
            bld: this.buildings.getValues(),
            inc: this.incidents.getValues(),
            lct: this.knownLocations,
            bip: this.buildingsInProgress,
            upk: Perk.usedId,
            vrn: VERSION,
        };
        delete json.flg.paused;
        delete json.flg.popup;
        return json;
    },
    /**
     * Load the game from storage
     */
    loadGame () {
        sendEvent("Game", "reload");
        const data = SaveManager.load();

        const loadedVersion = data.vrn && data.vrn.substr(0, data.vrn.lastIndexOf("."));
        const currentVersion = VERSION.substr(0, VERSION.lastIndexOf("."));
        if (loadedVersion !== currentVersion) {
            // TODO: display a differential changelog
            new Popup({
                name: "New version",
                desc: "Since the last time you played, a new version of the game has been released.<br/>" +
                    "You may want to restart to experience all the cool new features. ;)<br/>" +
                    "<a href='https://github.com/GMartigny/settlement#changelog'>Changelog</a>",
            });
        }

        MessageBus.notify(MessageBus.MSG_TYPES.GIVE, data.res);
        data.bld.forEach(bld => MessageBus.notify(MessageBus.MSG_TYPES.BUILD, bld.id));
        data.inc.forEach((inc) => {
            const incident = new Incident(inc.id);
            if (inc.rmn) {
                incident.run(inc.rmn);
            }
        });
        data.plp.forEach((personData) => {
            const person = new People(personData.nam, personData.gnd);
            person.setLife(personData.lif);
            person.setEnergy(personData.ene);
            person.stats = personData.sts;
            if (personData.prk) {
                person.gainPerk(personData.prk);
            }
            personData.act.forEach((actionData) => {
                person.addAction(actionData.id);
                const action = person.actions.get(actionData.id);
                action.repeated = actionData.rpt;
                if (actionData.rmn) {
                    action.choosenOptionId = actionData.opi;
                    action.energyDrain = actionData.egd;
                    action.start(actionData.rmn, actionData.elp);
                }
            });

            this.addPeople(person);
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
    wipeSave (withReload) {
        sendEvent("Game", "wipe");
        SaveManager.clear();
        if (withReload) {
            location.reload();
        }
    },
});
if (IS_DEV) {
    /**
     * Earn one of each resources and buildings
     */
    GameController.prototype.resourcesOverflow = function resourcesOverflow () {
        const amount = 50;
        DataManager.ids.resources.deepBrowse(id => this.earn(amount, id));
    };
    /**
     * Build a random building
     */
    GameController.prototype.nextBuilding = function nextBuilding () {
        const pick = this.possibleBuildings().random();
        MessageBus.notify(MessageBus.MSG_TYPES.BUILD, pick);
    };
    /**
     * Put everyone in a almost dead state
     */
    GameController.prototype.wannaLoose = function wannaLoose () {
        const lifeLeft = 5;
        const energyLEft = 0;
        this.people.forEach((person) => {
            person.setLife(lifeLeft);
            person.setEnergy(energyLEft);
        });
    };
}
