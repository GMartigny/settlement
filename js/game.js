"use strict";
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
Game.time = {
    hour: 1,
    day: 24,
    month: 30 * 24,
    year: 12 * 30 * 24,
    hourToMs: 2000
};
Game.tickLength = Game.time.hourToMs;
Game.prototype = {
    /**
     * Start a new adventure
     */
    init: function () {
        log("Starting v" + Game.version);

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

        MessageBus.getInstance().observe([MessageBus.MSG_TYPES.INFO, MessageBus.MSG_TYPES.WARN, MessageBus.MSG_TYPES.FLAVOR], function (message, type) {
            this.log(message, type);
        }.bind(this));

        this.flags.ready = 1;
    },
    /**
     * Return a well formatted play duration
     * @return {string}
     */
    getSurviveDuration: function () {
        return formatTime((performance.now() - this.settled) / Game.time.hourToMs);
    },
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

                // We have enougth room and someone arrive
                if (this.hasEnough(this.data.resources.room.id, this.people.length + 1) && random() < this.data.people.dropRate) {
                    this.welcome();
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
            var instance = this.resources[resource.id];
            if (instance.has(amount)) {
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
        } else if (amount > 0) {
            var res = new Resource(resource, amount);
            this.resources.set(id, res);
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
            this.buildings.set(id, bld);
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
            if (isFunction(craft.consume)) {
                craft.consume(this).forEach(function (res) {
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
    },
    data: {
        resources: {
            /* GATHERABLE */
            gatherable: {
                common: {
                    water: {
                        name: "Water",
                        desc: "Water is definatly important to survive in this harsh environment.",
                        icon: [0, 0],
                        dropRate: 130
                    },
                    food: {
                        name: "Food",
                        desc: "Everyone need food to keep his strength.",
                        icon: [1, 0],
                        dropRate: 120
                    },
                    rock: {
                        name: "Rock",
                        desc: "\"There's rocks everywhere ! Why would you bring this back ?\"",
                        icon: [2, 0],
                        dropRate: 100
                    },
                    scrap: {
                        name: "Scrap Metal",
                        desc: "An old rusty piece of metal.",
                        icon: [3, 0],
                        dropRate: 80
                    }
                },
                uncommon: {
                    oil: {
                        name: "Oil",
                        desc: "About a liter of gas-oil",
                        icon: [0, 1],
                        dropRate: 30
                    },
                    plastic: {
                        name: "Plastic",
                        desc: "A sturdy piece of plastic",
                        icon: [1, 1],
                        dropRate: 50
                    }
                },
                rare: {
                    medication: {
                        name: "Medication",
                        desc: "An unmark medication, hope it'll help.",
                        icon: [2, 1],
                        dropRate: 10
                    }
                }
            },
            ruins: {
                name: "Ruins",
                desc: "The location of an ancient building.",
                icon: [3, 1]
            },
            /* CRAFTABLE */
            craftable: {
                component: {
                    name: "Component",
                    desc: "A mechanical part for others craftables.",
                    icon: [1, 2],
                    consume: function () {
                        return [
                            [2, this.data.resources.gatherable.common.scrap],
                            [2, this.data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    dropRate: 100
                },
                engine: {
                    name: "Engine",
                    desc: "Amazing what you manage to do with all those scraps !",
                    icon: [2, 2],
                    consume: function () {
                        return [
                            [10, this.data.resources.gatherable.common.scrap],
                            [20, this.data.resources.craftable.component],
                            [5, this.data.resources.craftable.tool],
                            [10, this.data.resources.gatherable.uncommon.oil]
                        ];
                    },
                    dropRate: 70
                },
                tool: {
                    name: "Tool",
                    desc: "The base of any tinkerer.",
                    icon: [3, 2],
                    consume: function () {
                        return [
                            [2, this.data.resources.gatherable.common.scrap],
                            [2, this.data.resources.craftable.component],
                            [1, this.data.resources.gatherable.common.rock]
                        ];
                    },
                    dropRate: 90
                },
                stone: {
                    name: "Smooth stone",
                    desc: "A well polish stone.",
                    icon: [0, 3],
                    consume: function () {
                        return [
                            [6, this.data.resources.gatherable.common.rock]
                        ];
                    },
                    dropRate: 110
                },
                computer: {
                    name: "Computer",
                    desc: "Well, Internet is down since 2136 but it can be useful.",
                    icon: [1, 3],
                    consume: function () {
                        return [
                            [5, this.data.resources.craftable.component],
                            [3, this.data.resources.craftable.tool],
                            [10, this.data.resources.gatherable.common.scrap],
                            [2, this.data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    dropRate: 15
                }
            },
            room: {
                name: "Room",
                desc: "A place for someone to join us.",
                icon: [0, 2]
            }
        },
        people: {
            name: "People",
            desc: "The workforce and the bane of you camp.",
            need: function () {
                return [
                    [1.5 / Game.time.day, this.data.resources.gatherable.common.food],
                    [1 / Game.time.day, this.data.resources.gatherable.common.water]
                ];
            },
            dropRate: 0.1
        },
        /* BUILDINGS */
        buildings: {
            small: {
                tent: {
                    name: "Tent",
                    desc: "Allow someone to rejoin your colony.",
                    time: 3,
                    consume: function () {
                        return [
                            [3, this.data.resources.gatherable.common.rock],
                            [5, this.data.resources.gatherable.common.scrap],
                            [2, this.data.resources.craftable.component]
                        ];
                    },
                    give: function () {
                        return [
                            [1, this.data.resources.room]
                        ];
                    },
                    dropRate: 100
                },
                well: {
                    name: "Well",
                    desc: "Just a large hole into the ground.",
                    time: 12,
                    unlock: function () {
                        return [this.data.actions.draw];
                    },
                    consume: function () {
                        return [
                            [8, this.data.resources.gatherable.common.rock],
                            [4, this.data.resources.gatherable.common.scrap],
                            [1, this.data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    give: function () {
                        return [
                            [8, this.data.resources.gatherable.common.water]
                        ];
                    },
                    dropRate: 80
                },
                farm: {
                    name: "Farm",
                    desc: "A plotted land with some seeds has always provided food.",
                    time: Game.time.day,
                    unlock: function () {
                        return [this.data.actions.harvest];
                    },
                    consume: function () {
                        return [
                            [6, this.data.resources.gatherable.common.rock],
                            [6, this.data.resources.gatherable.uncommon.plastic],
                            [1, this.data.resources.craftable.tool]
                        ];
                    }
                },
                dropRate: 70
            },
            big: {
                pump: {
                    name: "Water pump",
                    desc: "A buried contraption that collect water from the earth moisture.",
                    time: 3 * Game.time.day,
                    unlock: function () {
                        return [this.data.actions.draw];
                    },
                    consume: function () {
                        return [
                            [100, this.data.resources.craftable.stone],
                            [10, this.data.resources.gatherable.uncommon.plastic],
                            [10, this.data.resources.craftable.component],
                            [1, this.data.resources.craftable.engine],
                            [3, this.data.resources.craftable.tool],
                            [15, this.data.resources.gatherable.common.water]
                        ];
                    },
                    give: function () {
                        return [
                            [40, this.data.resources.gatherable.common.water]
                        ];
                    },
                    collect: function () {
                        return [
                            [2 / Game.time.day, this.data.resources.gatherable.common.water]
                        ];
                    },
                    dropRate: 15
                },
                workshop: {
                    name: "Workshop",
                    desc: "Organizing your workforce make them more efficient at crafting.",
                    time: 3 * Game.time.day,
                    unique: true,
                    consume: function () {
                        return [
                            [20, this.data.resources.craftable.stone],
                            [20, this.data.resources.gatherable.common.scrap],
                            [15, this.data.resources.craftable.component],
                            [8, this.data.resources.craftable.tool]
                        ];
                    },
                    give: function () {
                        return [];
                    },
                    dropRate: 10
                },
                barrak: {
                    name: "Barrack",
                    desc: "Some place to sleep for a few people.",
                    time: 2 * Game.time.day + 5 * Game.time.hour,
                    consume: function () {
                        return [
                            [5, this.data.resources.craftable.tool],
                            [10, this.data.resources.gatherable.common.scrap],
                            [7, this.data.resources.gatherable.common.rock]
                        ];
                    },
                    give: function () {
                        return [random(2, 4), this.data.resources.room];
                    },
                    dropRate: 10
                }
            },
            special: {
                forum: {
                    name: "Forum",
                    desc: "The center and start of our settlement.",
                    unique: true
                }
            }
        },
        /* ACTIONS */
        actions: {
            settle: {
                name: "Settle",
                desc: "Ok, let's settle right here !",
                time: 1,
                unlock: function () {
                    return [
                        this.data.actions.gather
                    ];
                },
                lock: function () {
                    return [this.data.actions.settle];
                },
                build: function () {
                    return this.data.buildings.special.forum;
                },
                give: function () {
                    this.settled = performance.now();
                    return [
                        [3, this.data.resources.room],
                        [10, this.data.resources.gatherable.common.water],
                        [5, this.data.resources.gatherable.common.food],
                        [2, this.data.resources.craftable.tool]
                    ];
                }
            },
            gather: {
                name: "Gather resources",
                desc: "Go out to bring back resources, that's the best you can do.",
                time: 3,
                isOut: 1,
                unlock: function () {
                    return [this.data.actions.roam, this.data.actions.sleep];
                },
                give: function () {
                    var res = [];
                    for (var i = 0, l = round(random(1, 3)); i < l; ++i) {
                        res.push(randomize(this.data.resources.gatherable, `1-${5 / l}`));
                    }
                    return res;
                }
            },
            roam: {
                name: "Roam",
                desc: "Explore the surroundings hoping to find something interesting.",
                time: 7,
                isOut: 1,
                consume: function () {
                    return [
                        [2, this.data.resources.gatherable.common.water]
                    ];
                },
                unlock: function () {
                    return [this.data.actions.explore, this.data.actions.craft];
                },
                give: function () {
                    return [
                        randomize(this.data.resources.gatherable, "1-2"),
                        [floor(random(0, 2)), this.data.resources.ruins]
                    ];
                }
            },
            explore: {
                name: "Explore a ruin",
                desc: "Remember that ruin you saw the other day ? Let's see what's inside.",
                time: Game.time.day,
                isOut: 1,
                consume: function () {
                    return [
                        [4, this.data.resources.gatherable.common.water],
                        [1, this.data.resources.gatherable.common.food],
                        [1, this.data.resources.ruins]
                    ];
                },
                give: function () {
                    return [
                        randomize(this.data.resources.gatherable, "1-3"),
                        randomize(this.data.resources.craftable, "3-7")
                    ];
                }
            },
            craft: {
                name: "Craft something",
                desc: "Use some resources to tinker something useful.",
                time: 6,
                unlock: function () {
                    return [this.data.actions.plan];
                },
                consume: function () {
                    return [];
                },
                give: function () {
                    var pick = randomize(this.possibleCraftables());
                    if (pick) {
                        if (isFunction(pick.consume)) {
                            MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.USE, pick.consume(this));
                        }
                        return [
                            [1, pick]
                        ];
                    }
                    else {
                        return [];
                    }
                }
            },
            plan: {
                name: "Plan a building",
                desc: "Prepare blueprint and space for a new building.",
                time: 8,
                relaxing: 0.5,
                unlock: function () {
                    return [this.data.actions.build];
                },
                give: function (action) {
                    action.owner.planBuilding(randomize(this.possibleBuildings()));
                    return [];
                },
                consume: function () {
                    return [
                        [1, this.data.resources.gatherable.common.water],
                        [1, this.data.resources.gatherable.common.food],
                        [1, this.data.resources.craftable.tool]
                    ];
                }
            },
            build: {
                name: function (action) {
                    return "Build " + an(action.owner.plan.name);
                },
                desc: function (action) {
                    return action.owner.plan.desc;
                },
                time: function (action) {
                    return action.owner.plan.time;
                },
                consume: function (action) {
                    var consume = [
                        [2, this.data.resources.gatherable.common.water],
                        [1, this.data.resources.gatherable.common.food]
                    ];
                    if (isFunction(action.owner.plan.consume)) {
                        consume.push.apply(consume, action.owner.plan.consume(action));
                    }
                    return consume;
                },
                lock: function (action) {
                    var lock = [this.data.actions.build];
                    if (isFunction(action.owner.plan.lock)) {
                        lock.push.apply(lock, action.owner.plan.lock(action));
                    }
                    return lock;
                },
                unlock: function (action) {
                    var unlock = [];
                    if (isFunction(action.owner.plan.unlock)) {
                        unlock.push.apply(unlock, action.owner.plan.unlock(action));
                    }
                    return unlock;
                },
                build: function (action) {
                    return action.owner.plan;
                },
                give: function (action) {
                    var give = [];
                    if (isFunction(action.owner.plan.give)) {
                        give.push.apply(give, action.owner.plan.give(action));
                    }
                    return give;
                },
                collect: function (action) {
                    var collect = [];
                    if (isFunction(action.owner.plan.collect)) {
                        collect.push.apply(collect, action.owner.plan.collect(action));
                    }
                    return collect;
                }
            },
            draw: {
                name: "Draw water",
                desc: "Get some water from our well.",
                time: 5,
                give: function () {
                    return [
                        [random(1, 3), this.data.resources.gatherable.common.water]
                    ];
                }
            },
            harvest: {
                name: "Harvest crops",
                desc: "It's not the biggest, but it'll fill our stomachs.",
                time: 4,
                consume: function () {
                    return [
                        [2, this.data.resources.gatherable.common.water]
                    ];
                },
                give: function () {
                    return [
                        [random(1, 3), this.data.resources.gatherable.common.food]
                    ];
                }
            },
            sleep: {
                name: "Sleep",
                desc: "Get some rest.",
                time: 10,
                relaxing: 1,
                give: function (action) {
                    action.owner.updateEnergy(100);
                    return [];
                },
                unlock: function () {
                    return [this.data.actions.heal];
                }
            },
            heal: {
                name: "Heal",
                desc: "\"I really hope those pills are still good.\"",
                time: 2,
                relaxing: 0.8,
                consume: function () {
                    return [
                        [2, this.data.resources.gatherable.rare.medication]
                    ];
                },
                give: function (action) {
                    action.owner.updateLife(random() > 0.05 ? 100 : -10);
                    return [];
                }
            }
        },
        events: {
            sandstorm: {
                name: "Sand storm",
                desc: "",
                time: Game.time.day,
                effect: function () {

                },
                dropRate: 100
            }
        }
    }
};