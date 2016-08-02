"use strict";
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
    this.people = [];
    this.settled = 0;

    this.flags = {
        ready: 0,
        paused: 0
    };

    this.lastTick = performance.now();
    this.init();

    this.refresh();
}
Game.version = "0.1";
Game.isDev = 1;
Game.hourToMs = 2000;
Game.tickLength = Game.hourToMs;
Game.prototype = {
    /**
     * Start a new adventure
     */
    init: function () {
        log("Starting v" + Game.version);

        this.data = dataManager.getData();

        var game = this;
        deepBrowse(this.data, function (item) {
            item.id = pickID();
            for (var attr in item) {
                if (item.hasOwnProperty(attr) && isFunction(item[attr])) {
                    item[attr] = item[attr].bind(game);
                }
            }
        });

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
            log("We loose " + person.name);
            this.resources.get(this.data.resources.room.id).update(-1);
            this.people.out(person);
            if (!this.people.length) {
                log("We held up for " + this.getSurviveDuration());
            }
        }.bind(this));

        var logTypes = [MessageBus.MSG_TYPES.INFO, MessageBus.MSG_TYPES.WARN, MessageBus.MSG_TYPES.FLAVOR];
        MessageBus.getInstance().observe(logTypes, function (message, type) {
            this.log(message, type);
        }.bind(this));

        this.flags.ready = 1;
    },
    /**
     * Return a well formatted play duration
     * @return {string}
     */
    getSurviveDuration: function () {
        return formatTime((performance.now() - this.settled) / Game.hourToMs);
    },
    /**
     * Add some log
     * @param message
     * @param type
     */
    log: function (message, type) {
        type = type || 0;
        var types = ["info", "warning", "flavor"];
        this.logsList.appendChild(wrap(types[type], message));
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
            elapse = floor((now - this.lastTick) / Game.tickLength);
        this.lastTick += elapse * Game.tickLength;

        if (this.flags.paused) {
            this.settled += elapse * Game.tickLength;
            elapse = 0;
        }

        raf(this.refresh.bind(this));

        if (elapse > 0) {
            if (this.settled) {
                // We use some resources
                var needs = this.data.people.need();
                needs.forEach(function (need) {
                    var state = need[1].id === this.data.resources.gatherable.common.water.id ? "thirsty" : "starving";
                    this.consume(need[0] * this.people.length, need[1], function (number) {
                        this.people.forEach(function (person) {
                            person[state] = true;
                        });
                    });
                }.bind(this));

                // We have enough room and someone arrive
                if (this.hasEnough(this.data.resources.room.id, this.people.length + 1)) {
                    if (random() < this.data.people.dropRate) {
                        this.welcome();
                    }
                }
            }

            // Let's now recount our resources
            this.resources.forEach(function (resource, id, list) {
                resource.refresh(list);
            });

            this.people.forEach(function (p) {
                p.refresh(this.resources.items, elapse, this.settled);
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
                log("Use " + amount + " " + resource.name);
                instance.update(-amount);
            }
            else if (isFunction(lack)) {
                log("Ran out of " + amount + " " + resource.name);
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
        log("Acquire " + amount + " " + resource.name);
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
                if (this.settled) {
                    person.addAction(this.data.actions.settle.unlock());
                }
                else {
                    person.addAction(this.data.actions.settle);
                }
                this.people.push(person);
                //noinspection BadExpressionStatementJS force redraw
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
        log("We add " + an(building.name) + " to the camp");
        var id = building.id;
        if (this.buildings.has(id)) {
            this.buildings.get(id).add(1);
        }
        else {
            var bld = new Building(building);
            this.buildings.push(id, bld);
            this.buildingsList.appendChild(bld.html);
        }
    },
    /**
     * Return all possible craftables
     * @return {Array}
     */
    possibleCraftables: function () {
        var craftables = [],
            resources = this.resources.items;
        deepBrowse(this.data.resources.craftable, function (craft) {
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
            done = this.buildings.items;

        deepBrowse(this.data.buildings, function (build) {
            if (!build.unique || build.unique && !done[build.id]) {
                buildings.push(build);
            }
        });

        return buildings;
    }
};
