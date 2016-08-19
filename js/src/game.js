"use strict";

var G;
console.groupCollapsed("Loading");
var media = loadMedia([
    {src: "img/icons.png", type: "image"}
], function (prc, file) {
    log(file + " : " + prc + "%");
    if (prc >= 100) {
        console.groupEnd();
        try {
            G = new Game(document.getElementById("main"), media);
        }
        catch (e) {
            log("Fail to load game : " + e.message);
        }
    }
});

/**
 * Main game class
 * @param holder HTML element holding the game
 * @param media All graphical resources
 * @constructor
 */
function Game (holder, media) {
    this.holder = holder;

    this.resources = new Collection();
    this.buildings = new Collection();
    this.events = new Collection();
    this.collects = [];
    this.people = [];
    this.initialActions = new Collection();

    this.flags = {
        ready: false,
        paused: false,
        settled: false,
        popup: false,
        productivity: 1
    };

    this.lastTick = performance.now();
    this._init();

    this.refresh();
}
Game.isDev = 1;
Game.hourToMs = 2000;
Game.tickLength = Game.hourToMs;
Game.prototype = {
    /**
     * Start a new adventure
     * @private
     */
    _init: function () {
        log("Starting v" + window.version);

        var game = this;
        deepBrowse(DataManager.data, function (item) {
            item.id = pickID();
            for (var attr in item) {
                if (item.hasOwnProperty(attr) && isFunction(item[attr])) {
                    item[attr] = item[attr].bind(game);
                }
            }
        });

        this.initialActions.push(DataManager.data.actions.settle);

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

        this.logsList = wrap();
        this.logsList.id = "logs";
        this.holder.appendChild(this.logsList);

        this.eventsList = wrap();
        this.eventsList.id = Event.LST_ID;
        this.holder.appendChild(this.eventsList);

        // A person arrives
        TimerManager.timeout(this.welcome.bind(this), 400 * (Game.isDev ? 1 : 10));

        // We may find resources
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.GIVE, function (given) {
            if (isArray(given)) {
                compactResources(given).forEach(function (r) {
                    this.earn.apply(this, r);
                }.bind(this));
            }
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
            this.log("We loose " + person.name, MessageBus.MSG_TYPES.WARN);
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

        var logTypes = [MessageBus.MSG_TYPES.INFO, MessageBus.MSG_TYPES.WARN, MessageBus.MSG_TYPES.FLAVOR];
        MessageBus.getInstance().observe(logTypes, function (message, type) {
            this.log(message, type);
        }.bind(this));

        this.flags.ready = 1;
    },
    /**
     * Add actions to initial actions list
     * @param actions
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
     * @param actions
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
     * @return {number}
     */
    getSettledTime: function () {
        return this.flags.settled ? (performance.now() - this.flags.settled) / Game.hourToMs : 0;
    },
    /**
     * Return a well formatted play duration
     * @return {string}
     */
    getSurvivalDuration: function () {
        return formatTime(this.getSettledTime());
    },
    /**
     * Add some log
     * @param message
     * @param type
     */
    log: function (message, type) {
        type = type || 0;
        var types = {
            0: "info",
            1: "warning",
            2: "flavor"
        };
        this.logsList.appendChild(wrap(types[type], message));
    },
    /**
     * Toggle pause state
     */
    togglePause: function () {
        this.flags.paused = !this.flags.paused;
        this.holder.classList.toggle("paused", this.flags.paused);
        document.body.classList.toggle("backdrop", this.flags.paused);
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
            elapse = floor((now - this.lastTick) / Game.tickLength);
        this.lastTick += elapse * Game.tickLength;

        if (this.flags.paused) {
            if (this.flags.settled) {
                // shift time to keep same difference
                this.flags.settled += elapse * Game.tickLength;
            }
            elapse = 0;
        }

        raf(this.refresh.bind(this));

        if (elapse > 0) {
            if (this.flags.settled) {
                // We use some resources
                // TODO : need refacto
                var needs = DataManager.data.people.need();
                needs.forEach(function (need) {
                    var state = need[1].id === DataManager.data.resources.gatherable.common.water.id ? "thirsty" : "starving";
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
                people.refresh(this.resources.items, elapse, this.flags);
            }.bind(this));
        }
    },
    /**
     * Check if game has enough of a resource
     * @param id Resource ID
     * @param amount Amount needed
     * @return {boolean}
     */
    hasEnough: function (id, amount) {
        return this.resources.get(id).has(amount);
    },
    /**
     * Need to use a resource
     * @param amount Amount to use
     * @param resource Resource
     * @param lack A callback function in case of lack<br/>
     * Will get (missingAmount, resource) as params
     */
    consume: function (amount, resource, lack) {
        if (amount) {
            var instance = this.resources.get(resource.id);
            if (instance && instance.has(amount)) {
                instance.update(-amount);
            }
            else if (isFunction(lack)) {
                var diff = amount - instance.get();
                instance.set(0);
                lack.call(this, diff, resource);
            }
        }
    },
    /**
     * Earn some resource
     * @param amount Amount to earn
     * @param resource Resource
     */
    earn: function (amount, resource) {
        var id = resource.id;
        if (this.resources.has(id)) {
            this.resources.get(id).update(amount);
        }
        else if (amount > 0) {
            var res = new Resource(resource, amount);
            this.resources.push(id, res);
            this.resourcesList.appendChild(res.html);
        }
    },
    /**
     * Welcome people to the camp
     * @param amount Number of person to rejoin
     */
    welcome: function (amount) {
        peopleFactory(amount).then(function (persons) {
            persons.forEach(function (person) {
                person.addAction(this.initialActions.values());

                this.people.push(person);
                //noinspection BadExpressionStatementJS - force redraw
                this.peopleList.appendChild(person.html).offsetHeight;
                person.html.classList.add("arrived");
            }.bind(this));
        }.bind(this));
    },
    /**
     * Build something
     * @param building Building
     */
    build: function (building) {
        this.log("We add " + an(building.name) + " to the camp");
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
        var craftables = [],
            resources = this.resources.items;
        deepBrowse(DataManager.data.resources.craftable, function (craft) {
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
     * @return {boolean}
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
        // filter already running or unmatch conditions
        return randomize(list.filter(function (event) {
            return !this.events.has(event.id) &&
                (!event.condition || (isFunction(event.condition) && event.condition(event)));
        }.bind(this)));
    }
};
