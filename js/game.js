function Game(holder, media) {
    this.holder = holder;

    this.resources = {};
    this.buildings = {};
    this.people = [];

    this.lastTick = performance.now();
    this.init();

    this.loop = setInterval(function() {
        this.refresh();
    }.bind(this), Game.tickLength);
}
Game.flags = {
    isDev: 1
};
Game.time = {
    hour: 1,
    day: 24,
    month: 30 * 24,
    year: 12 * 30 * 24,
    hourToMs: 2000
};
Game.tickLength = Game.time.hourToMs;
Game.prototype = {
    // Let's start a new adventure
    init: function() {
        var game = this;
        deepBrowse(this.data, function(item) {
            item.id = pickID();
            for(var attr in item){
                if(item.hasOwnProperty(attr) && isFunction(item[attr])){
                    item[attr] = item[attr].bind(game);
                }
            }
        });

        var ressourceList = document.createElement("div");
        ressourceList.id = Resource.LST_ID;
        for (var name in this.resources) {
            if (this.resources.hasOwnProperty(name)) {
                ressourceList.appendChild(this.resources[name].html);
            }
        }
        this.holder.appendChild(ressourceList);

        var peopleList = document.createElement("div");
        peopleList.id = People.LST_ID;
        this.holder.appendChild(peopleList);

        // A person arrives
        setTimeout(this.earn.bind(this, 1, this.data.resources.people), 300);

        // We may find resources
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.GIVE, function(given) {
            given.forEach(function(r) {
                this.earn.apply(this, r);
            }.bind(this));
        }.bind(this));

        // We may use resources
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.USE, function(use) {
            use.forEach(function(r) {
                this.consume.apply(this, r);
            }.bind(this));
        }.bind(this));

        // We may build
        MessageBus.getInstance().observe(MessageBus.MSG_TYPES.BUILD, function(building) {
            this.build(building);
        }.bind(this));

        Game.flags.ready = 1;
    },
    refresh: function() {
        var now = performance.now(),
            elapse = floor((now - this.lastTick) / Game.tickLength);
        this.lastTick += elapse * Game.tickLength;

        if (Game.settled) {
            // We use some resources
            var needs = this.data.resources.people.need();
            needs.forEach(function(r) {
                this.consume.call(this, r[0] * this.people.length, r[1], function(n, r) {
                    log("We run out of " + n + " " + r.name);
                });
            }.bind(this));
        }

        // Let's now recount our resources
        for (var name in this.resources) {
            if (this.resources.hasOwnProperty(name)) {
                this.resources[name].refresh();
            }
        }

        this.people.forEach(function(p) {
            p.refresh(this.resources, elapse);
        }.bind(this));
    },
    // We need to use this
    consume: function(amount, resource, lack) {
        log("Use " + amount + " " + resource.name);
        var instance = this.resources[resource.id];
        if (instance.has(amount)) {
            instance.update(-amount);
        }
        else if (isFunction(lack)) {
            var diff = amount - instance.get();
            instance.set(0);
            lack.call(this, diff, resource);
        }
    },
    // Cool I find something
    earn: function(amount, resource) {
        log("Acquire " + amount + " " + resource.name);
        var id = resource.id;
        if (this.resources[id]) {
            this.resources[id].update(amount);
        } else if (amount > 0) {
            var r = new Resource(resource, amount);
            this.resources[id] = r;
            document.getElementById(Resource.LST_ID).appendChild(r.html);
        }

        if (resource.id === this.data.resources.people.id) {
            this.welcome(amount);
        }
    },
    // Welcome to our campement
    welcome: function(amount) {
        peopleFactory(amount).then(function(persons) {
            persons.forEach(function(person) {
                if (Game.settled) {
                    person.addAction(this.data.actions.settle.unlock());
                }
                else {
                    person.addAction(this.data.actions.settle);
                }
                this.people.push(person);
                document.getElementById(People.LST_ID).appendChild(person.html);
            }.bind(this));
        }.bind(this));
    },
    // We built something
    build: function(building) {
        // TODO
        log("We add " + an(building) + " to the camp");
    },
    data: {
        resources: {
            /* GATHERABLE */
            gatherable: {
                common: {
                    water: {
                        name: "Water",
                        desc: "Water is important to survive in this harsh environment.",
                        img: [],
                        dropRate: 100
                    },
                    food: {
                        name: "Food",
                        desc: "Everyone need food to keep his strength.",
                        dropRate: 90
                    },
                    rock: {
                        name: "Rock",
                        desc: "\"There's rocks everywhere ! Why would you bring this back ?\"",
                        dropRate: 120
                    },
                    metal_scrap: {
                        name: "Metal scrap",
                        desc: "A rusty piece of metal.",
                        dropRate: 80
                    }
                },
                uncommon: {
                    oil: {
                        name: "Oil",
                        desc: "About a liter of gas-oil",
                        dropRate: 30
                    },
                    plastic: {
                        name: "Plastic",
                        desc: "A sturdy piece of plastic",
                        dropRate: 50
                    }
                },
                rare: {
                    medication: {
                        name: "Medication",
                        desc: "An unmark medication, hope it'll help.",
                        dropRate: 10
                    }
                }
            },
            ruins: {
                name: "Ruins",
                desc: "The location of an ancient building."
            },
            /* CRAFTABLE */
            craftable: {
                component: {
                    name: "Component",
                    desc: "",
                    consume: function() {
                        return [
                            [2, this.data.resources.gatherable.common.metal_scrap],
                            [2, this.data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    dropRate: 100
                },
                engine: {
                    name: "Engine",
                    desc: "",
                    consume: function() {
                        return [
                            [10, this.data.resources.gatherable.common.metal_scrap],
                            [20, this.data.resources.craftable.component],
                            [5, this.data.resources.craftable.tool],
                            [10, this.data.resources.gatherable.uncommon.oil]
                        ]
                    },
                    dropRate: 70
                },
                tool: {
                    name: "Tool",
                    desc: "",
                    consume: function() {
                        return [
                            [2, this.data.resources.gatherable.common.metal_scrap],
                            [2, this.data.resources.craftable.component],
                            [1, this.data.resources.gatherable.common.rock]
                        ];
                    },
                    dropRate: 90
                },
                stone: {
                    name: "Smooth stone",
                    desc: "",
                    consume: function() {
                        return [
                            [3, this.data.resources.gatherable.common.rock],
                            [1, this.data.resources.craftable.tool]
                        ];
                    },
                    dropRate: 110
                },
                computer: {
                    name: "Computer",
                    desc: "",
                    consume: function() {
                        return [
                            [5, this.data.resources.craftable.component],
                            [3, this.data.resources.craftable.tool],
                            [10, this.data.resources.gatherable.common.metal_scrap],
                            [2, this.data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    dropRate: 15
                }
            },
            people: {
                name: "People",
                desc: "The workforce and the bane of you camp.",
                need: function() {
                    return [
                        [1.5 / Game.time.day, this.data.resources.gatherable.common.food],
                        [1 / Game.time.day, this.data.resources.gatherable.common.water]
                    ]
                }
            }
        },
        /* BUILDINGS */
        buildings: {
            small: {
                tent: {
                    name: "Tent",
                    desc: "Allow someone to rejoin your colony.",
                    time: 3,
                    consume: function() {
                        return [
                            [3, this.data.resources.gatherable.common.rock],
                            [5, this.data.resources.gatherable.common.metal_scrap],
                            [2, this.data.resources.craftable.component]
                        ];
                    },
                    give: function() {
                        return [1, this.data.resources.people];
                    },
                    dropRate: 100
                },
                well: {
                    name: "Well",
                    desc: "Just a large hole into the groud",
                    time: 12,
                    unlock: function() {
                        return [this.data.actions.draw];
                    },
                    consume: function() {
                        return [
                            [8, this.data.resources.gatherable.common.rock],
                            [4, this.data.resources.gatherable.common.metal_scrap],
                            [1, this.data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    give: function() {
                        return [8, this.data.resources.gatherable.common.water];
                    },
                    dropRate: 80
                },
                farm: {
                    name: "Farm",
                    desc: "",
                    time: Game.time.day,
                    unlock: function() {
                        return [this.data.actions.harvest];
                    },
                    consume: function() {
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
                    unlock: function() {
                        return [this.data.actions.draw];
                    },
                    consume: function() {
                        return [
                            [100, this.data.resources.gatherable.common.rock],
                            [10, this.data.resources.gatherable.uncommon.plastic],
                            [10, this.data.resources.craftable.component],
                            [1, this.data.resources.craftable.engine],
                            [3, this.data.resources.craftable.tool],
                            [15, this.data.resources.gatherable.common.water]
                        ];
                    },
                    give: function() {
                        return [
                            [40, this.data.resources.gatherable.common.water]
                        ];
                    },
                    collect: function() {
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
                    consume: function() {
                        return [
                            [20, this.data.resources.gatherable.common.rock],
                            [20, this.data.resources.gatherable.common.metal_scrap],
                            [15, this.data.resources.craftable.component],
                            [8, this.data.resources.craftable.tool]
                        ];
                    },
                    give: function() {
                        return [];
                    },
                    dropRate: 10
                },
                barrak: {
                    name: "Barrack",
                    desc: "",
                    time: 2 * Game.time.day + 5 * Game.time.hour,
                    consume: function() {
                        return [
                            [5, this.data.resources.craftable.tool]
                        ];
                    },
                    give: function() {
                        return [random(2, 4), this.data.resources.people];
                    },
                    dropRate: 10
                }
            }
        },
        /* ACTIONS */
        actions: {
            settle: {
                name: "Settle",
                desc: "Ok let's settle right there !",
                time: 1,
                unlock: function() {
                    return [
                        this.data.actions.gather
                    ];
                },
                lock: function() {
                    return [this.data.actions.settle];
                },
                give: function() {
                    Game.settled = true;
                    return [
                        [10, this.data.resources.gatherable.common.water],
                        [5, this.data.resources.gatherable.common.food],
                        [2, this.data.resources.people]
                    ];
                }
            },
            gather: {
                name: "Gather ressources",
                desc: "Go out to bring back resources, that's the best you can do.",
                time: 4,
                unlock: function() {
                    return [this.data.actions.roam, this.data.actions.sleep];
                },
                give: function() {
                    var res = [];
                    for (var i = 0, l = random(1, 4) << 0; i < l; ++i) {
                        res.push(randomize(this.data.resources.gatherable, "1-" + (5 / l)));
                    }
                    return res;
                }
            },
            roam: {
                name: "Roam",
                desc: "Explore the surroundings hoping to find something interesting.",
                time: 8,
                consume: function() {
                    return [
                        [2, this.data.resources.gatherable.common.water]
                    ];
                },
                unlock: function() {
                    return [this.data.actions.explore, this.data.actions.craft];
                },
                give: function() {
                    return [
                        randomize(this.data.resources.gatherable, "0-2"),
                        [random(0, 2) << 0, this.data.resources.ruins]
                    ];
                }
            },
            explore: {
                name: "Explore a ruin",
                desc: "Remember that ruin you saw the other day ? Let's see what's inside.",
                time: Game.time.day * 2,
                consume: function() {
                    return [
                        [4, this.data.resources.gatherable.common.water],
                        [1, this.data.resources.gatherable.common.food],
                        [2, this.data.resources.craftable.tool],
                        [1, this.data.resources.ruins]
                    ];
                },
                give: function() {
                    return [
                        randomize(this.data.resources.gatherable, "1-3"),
                        randomize(this.data.resources.craftable, "3-7")
                    ];
                }
            },
            craft: {
                name: "Craft something",
                desc: "Use some resources to tinker something useful.",
                time: 4,
                unlock: function() {
                    return [this.data.actions.plan];
                },
                consume: function() {
                    return [
                        [1, this.data.resources.gatherable.common.water]
                    ];
                },
                give: function() {
                    return [randomize(this.data.resources.craftable, "1-2")];
                }
            },
            plan: {
                name: "Plan a building",
                desc: "Prepare blueprint and space for a new building.",
                time: 10,
                relaxing: true,
                unlock: function() {
                    return [this.data.actions.build];
                },
                give: function(action) {
                    action.owner.planBuilding(randomize(this.data.buildings));
                    return [];
                },
                consume: function() {
                    return [
                        [1, this.data.resources.gatherable.common.water],
                        [1, this.data.resources.gatherable.common.food],
                        [1, this.data.resources.craftable.tool]
                    ];
                }
            },
            build: {
                name: function(action) {
                    return "Build " + an(action.owner.plan.name);
                },
                desc: function(action) {
                    return action.owner.plan.desc;
                },
                time: function(action) {
                    return action.owner.plan.time;
                },
                consume: function(action) {
                    var consume = [
                        [2, this.data.resources.gatherable.common.water],
                        [1, this.data.resources.gatherable.common.food]
                    ];
                    if(isArray(action.owner.plan.consume)){
                        consume.push.apply(consume, action.owner.plan.consume);
                    }
                    return consume;
                },
                lock: function(action) {
                    var lock = [this.data.actions.build];
                    if(isFunction(action.owner.plan.lock)){
                        lock.push.apply(lock, action.owner.plan.lock(action));
                    }
                    return lock;
                },
                unlock: function(action) {
                    var unlock = [];
                    if(isFunction(action.owner.plan.unlock)){
                        unlock.push.apply(unlock, action.owner.plan.unlock(action));
                    }
                    return unlock;
                },
                give: function(action) {
                    MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.BUILD, action.owner.plan);
                    var give = [];
                    if(isFunction(action.owner.plan.give)){
                        give.push.apply(give, action.owner.plan.give(action));
                    }
                    return give;
                },
                collect: function(action) {
                    var collect = [];
                    if(isFunction(action.owner.plan.collect)){
                        collect.push.apply(collect, action.owner.plan.collect(action));
                    }
                    return collect;
                }
            },
            draw: {
                name: "Draw water",
                desc: "Get some water from your well.",
                time: 5,
                give: function() {
                    return [
                        [random(1, 3), this.data.resources.gatherable.common.water]
                    ];
                }
            },
            harvest: {
                name: "Harvest crops",
                desc: "",
                time: 4,
                consume: function() {
                    return [
                        [2, this.data.resources.gatherable.common.water]
                    ];
                },
                give: function() {
                    return [
                        [random(1, 3), this.data.resources.gatherable.common.food]
                    ];
                }
            },
            sleep: {
                name: "Sleep",
                desc: "Get some rest.",
                time: 12,
                relaxing: true,
                give: function(action) {
                    action.owner.updateEnergy(100);
                    return [];
                },
                unlock: function() {
                    return [this.data.actions.heal];
                }
            },
            heal :{
                name: "Heal",
                desc: "\"I really hope thoses pills are still good.\"",
                time: 2,
                relaxing: true,
                consume: function() {
                    return [
                        [2, this.data.gatherable.rare.medication]
                    ];
                },
                give: function(action) {
                    action.owner.updateLife(100);
                    return [];
                }
            }
        }
    }
};