/**
 * Data holder
 * @type {{time, data}}
 */
var DataManager = (function () {
    var time = {
        minute: 1 / 60,
        hour: 1,
        day: 24,
        week: 7 * 24,
        month: 30 * 24,
        year: 12 * 30 * 24
    };
    // jscs:disable jsDoc
    var data = {
        /***** RESOURCES *****/
        resources: {
            /***** GATHERABLES *****/
            gatherable: {
                common: {
                    water: {
                        name: "water",
                        desc: "Water is definitely important to survive in this harsh environment.",
                        icon: "water",
                        dropRate: 130,
                        order: 10
                    },
                    food: {
                        name: "food",
                        desc: "Everyone need food to keep his strength.",
                        icon: "food",
                        dropRate: 120,
                        order: 20
                    },
                    rock: {
                        name: "rock",
                        desc: "\"There's rocks everywhere ! Why would you bring this back ?\"",
                        icon: "rock",
                        dropRate: 100,
                        order: 30
                    },
                    scrap: {
                        name: "scrap metal",
                        desc: "An old rusty piece of metal.",
                        icon: "scrap",
                        dropRate: 80,
                        order: 40
                    }
                },
                uncommon: {
                    oil: {
                        name: "oil",
                        desc: "About a liter of gas-oil.",
                        icon: "oil",
                        dropRate: 30,
                        order: 50
                    },
                    plastic: {
                        name: "plastic",
                        desc: "A sturdy piece of plastic.",
                        icon: "plastic",
                        dropRate: 50,
                        order: 60
                    }
                },
                rare: {
                    medication: {
                        name: "medication",
                        desc: "An unmark medication, hope it'll help.",
                        icon: "medication",
                        dropRate: 10,
                        order: 70
                    }
                }
            },
            ruins: {
                name: "ruin",
                desc: "The location of an ancient building.",
                icon: "ruin",
                order: 80
            },
            /***** CRAFTABLES *****/
            craftable: {
                component: {
                    name: "component",
                    desc: "A mechanical part for others craftables.",
                    icon: "component",
                    consume: function () {
                        return [
                            [2, data.resources.gatherable.common.scrap],
                            [2, data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    dropRate: 100,
                    order: 90
                },
                tool: {
                    name: "tool",
                    desc: "The base of any tinkerer.",
                    icon: "tool",
                    consume: function () {
                        return [
                            [2, data.resources.gatherable.common.scrap],
                            [2, data.resources.craftable.component],
                            [1, data.resources.gatherable.common.rock]
                        ];
                    },
                    dropRate: 90,
                    order: 100
                },
                stone: {
                    name: "smooth stone",
                    desc: "A well polish stone.",
                    icon: "stone",
                    consume: function () {
                        return [
                            [6, data.resources.gatherable.common.rock]
                        ];
                    },
                    dropRate: 110,
                    order: 110
                },
                engine: {
                    name: "engine",
                    desc: "Amazing what you manage to do with all those scraps !",
                    icon: "engine",
                    consume: function () {
                        return [
                            [10, data.resources.gatherable.common.scrap],
                            [20, data.resources.craftable.component],
                            [5, data.resources.craftable.tool],
                            [10, data.resources.gatherable.uncommon.oil]
                        ];
                    },
                    dropRate: 70,
                    order: 120
                },
                computer: {
                    name: "computer",
                    desc: "Well, Internet is down since 2136 but it can be useful.",
                    icon: "computer",
                    consume: function () {
                        return [
                            [5, data.resources.craftable.component],
                            [3, data.resources.craftable.tool],
                            [10, data.resources.gatherable.common.scrap],
                            [2, data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    dropRate: 15,
                    order: 130
                }
            },
            room: {
                name: "room",
                desc: "A place for someone in the camp.",
                icon: "room",
                order: 0
            }
        },
        people: {
            name: "people",
            desc: "The workforce and the bane of you camp.",
            need: function () {
                return [
                    [1.5 / time.day, data.resources.gatherable.common.food],
                    [1 / time.day, data.resources.gatherable.common.water]
                ];
            },
            dropRate: 0.05
        },
        /***** BUILDINGS *****/
        buildings: {
            small: {
                tent: {
                    name: "tent",
                    desc: "Allow someone to rejoin your colony.",
                    time: 3,
                    consume: function () {
                        return [
                            [3, data.resources.gatherable.common.rock],
                            [5, data.resources.gatherable.common.scrap],
                            [2, data.resources.craftable.component]
                        ];
                    },
                    give: function () {
                        return [
                            [1, data.resources.room]
                        ];
                    },
                    dropRate: 100
                },
                well: {
                    name: "well",
                    desc: "Just a large hole into the ground.",
                    time: 12,
                    unlock: function () {
                        return [data.actions.drawFrom.well];
                    },
                    consume: function () {
                        return [
                            [8, data.resources.gatherable.common.rock],
                            [4, data.resources.gatherable.common.scrap],
                            [1, data.resources.gatherable.uncommon.plastic]
                        ];
                    },
                    give: function () {
                        return [
                            [8, data.resources.gatherable.common.water]
                        ];
                    },
                    dropRate: 80
                },
                farm: {
                    name: "farm",
                    desc: "A plotted land with some seeds has always provided food.",
                    time: time.day,
                    unlock: function () {
                        return [data.actions.harvest];
                    },
                    consume: function () {
                        return [
                            [6, data.resources.gatherable.common.rock],
                            [6, data.resources.gatherable.uncommon.plastic],
                            [1, data.resources.craftable.tool]
                        ];
                    }
                },
                dropRate: 70
            },
            big: {
                pump: {
                    name: "water pump",
                    desc: "A buried contraption that collect water from the earth moisture.",
                    time: 3 * time.day,
                    unlock: function () {
                        return [data.actions.drawFrom.well];
                    },
                    consume: function () {
                        return [
                            [100, data.resources.craftable.stone],
                            [10, data.resources.gatherable.uncommon.plastic],
                            [10, data.resources.craftable.component],
                            [1, data.resources.craftable.engine],
                            [3, data.resources.craftable.tool],
                            [15, data.resources.gatherable.common.water]
                        ];
                    },
                    give: function () {
                        return [
                            [40, data.resources.gatherable.common.water]
                        ];
                    },
                    collect: function () {
                        return [
                            [2 / time.day, data.resources.gatherable.common.water]
                        ];
                    },
                    dropRate: 15
                },
                workshop: {
                    name: "workshop",
                    desc: "Organizing your workforce make them more efficient at crafting.",
                    time: 3 * time.day,
                    unique: true,
                    consume: function () {
                        return [
                            [20, data.resources.craftable.stone],
                            [20, data.resources.gatherable.common.scrap],
                            [15, data.resources.craftable.component],
                            [8, data.resources.craftable.tool]
                        ];
                    },
                    give: function () {
                        return [];
                    },
                    dropRate: 10
                },
                barrak: {
                    name: "barrack",
                    desc: "Some place to sleep for a few people.",
                    time: 2 * time.day + 5 * time.hour,
                    consume: function () {
                        return [
                            [5, data.resources.craftable.tool],
                            [10, data.resources.gatherable.common.scrap],
                            [7, data.resources.gatherable.common.rock]
                        ];
                    },
                    give: function () {
                        return [round(random(2, 4)), data.resources.room];
                    },
                    dropRate: 10
                }
            },
            special: {
                forum: {
                    name: "forum",
                    desc: "The center and start of our settlement.",
                    unlock: function () {
                        return [data.actions.sleep];
                    },
                    give: function () {
                        return [
                            [2, data.resources.room]
                        ];
                    },
                    unique: true
                }
            }
        },
        /***** ACTIONS *****/
        actions: {
            wakeUp: {
                name: "wake up",
                unlock: function () {
                    return [
                        data.actions.look
                    ];
                },
                log: "@people gets up painfully.",
                order: 0,
                unique: true
            },
            look: {
                name: "look around",
                desc: "What am I doing here ?",
                time: 2,
                give: function () {
                    TimerManager.timeout(function () {
                        this.log("We need a shelter.", MessageBus.MSG_TYPES.LOGS.FLAVOR);
                    }.bind(this), 1000);
                    return [,
                        [10, data.resources.gatherable.common.water],
                        [5, data.resources.gatherable.common.food],
                        [2, data.resources.craftable.component]
                    ];
                },
                unlock: function () {
                    return [
                        data.actions.settle
                    ];
                },
                log: "After some thinking, @people remembers the attack. @pronoun grabs @give laying around.",
                order: 0,
                unique: true
            },
            settle: {
                name: "settle here",
                desc: "Ok, let's settle right there !",
                time: 3,
                unlock: function () {
                    this.flags.settled = performance.now();
                    return [
                        data.actions.gather
                    ];
                },
                build: function () {
                    return data.buildings.special.forum;
                },
                give: function () {
                    return [];
                },
                log: "@people installs @build with @give to sleep in.",
                order: 0,
                unique: true
            },
            gather: {
                name: "gather resources",
                desc: "Go out to bring back resources, that's the best you can do.",
                time: 3,
                isOut: 1,
                unlock: function () {
                    return [data.actions.roam];
                },
                give: function () {
                    return randomizeMultiple(data.resources.gatherable, "3-6");
                },
                log: "@people comes back with @give.",
                order: 0
            },
            roam: {
                name: "roam",
                desc: "Explore the surroundings hoping to find something interesting.",
                time: 7,
                isOut: 1,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.common.water]
                    ];
                },
                unlock: function () {
                    return [data.actions.explore, data.actions.craft];
                },
                give: function () {
                    return [
                        randomize(data.resources.gatherable, "1-3")
                    ];
                },
                log: "Not far from here, @people finds @location. @pronoun also brings back @give.",
                order: 10
            },
            explore: {
                name: "explore a ruin",
                desc: "Remember that location we saw the other day ? Let's see what we can find.",
                time: time.day,
                isOut: 1,
                relaxing: 0.17,
                consume: function () {
                    return [
                        [4, data.resources.gatherable.common.water],
                        [1, data.resources.gatherable.common.food],
                        [1, data.resources.ruins]
                    ];
                },
                give: function (action) {
                    var location = this.knownLocations.random();
                    // remember it for log
                    action.location = location;
                    return randomizeMultiple(location.give(), "5-9");
                },
                log: function (effect, action) {
                    var log = action.location.log;
                    if (isFunction(log)) {
                        return log(effect, action);
                    }
                    else if (log) {
                        return log.replace(/@(\w+)/gi, function (match, capture) {
                            return effect[capture] || "";
                        });
                    }
                },
                order: 20
            },
            craft: {
                name: "craft something",
                desc: "Use some resources to tinker something useful.",
                time: 6,
                unlock: function () {
                    return [data.actions.plan];
                },
                consume: function () {
                    return [];
                },
                give: function () {
                    var pick = randomize(this.possibleCraftables());
                    if (pick) {
                        if (isFunction(pick.consume)) {
                            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, pick.consume(this));
                        }
                        return [
                            [1, pick]
                        ];
                    }
                    else {
                        return [];
                    }
                },
                log: "@people succeeds to craft @give.",
                order: 30
            },
            plan: {
                name: "plan a building",
                desc: "Prepare blueprint and space for a new building.",
                time: 8,
                relaxing: 0.5,
                unlock: function () {
                    return [data.actions.build];
                },
                give: function (action) {
                    action.owner.planBuilding(randomize(this.possibleBuildings()));
                    return [];
                },
                consume: function () {
                    return [
                        [1, data.resources.gatherable.common.water],
                        [1, data.resources.gatherable.common.food],
                        [1, data.resources.craftable.tool]
                    ];
                },
                log: "Everything's ready to build @plan",
                order: 40
            },
            build: {
                name: function (action) {
                    return "build " + an(action.owner.plan.name);
                },
                desc: function (action) {
                    return action.owner.plan.desc;
                },
                time: function (action) {
                    return action.owner.plan.time;
                },
                consume: function (action) {
                    var consume = [
                        [2, data.resources.gatherable.common.water],
                        [1, data.resources.gatherable.common.food]
                    ];
                    if (isFunction(action.owner.plan.consume)) {
                        consume.push.apply(consume, action.owner.plan.consume(action));
                    }
                    return consume;
                },
                lock: function (action) {
                    var lock = [data.actions.build];
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
                log: "Building @building gives @give",
                order: 50
            },
            drawFrom: {
                river: {
                    name: "draw water",
                    desc: "Get some water from the river.",
                    time: 8,
                    give: function () {
                        return [
                            [round(random(2, 5)), data.resources.gatherable.common.water]
                        ];
                    },
                    log: "Coming back from the river, @people brings back @give.",
                    order: 60
                },
                well: {
                    name: "draw water",
                    desc: "Get some water from our well.",
                    time: 2,
                    give: function () {
                        return [
                            [round(random(1, 2)), data.resources.gatherable.common.water]
                        ];
                    },
                    log: "Using our well, @people get @give.",
                    order: 60
                }
            },
            harvest: {
                name: "harvest crops",
                desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
                time: 4,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.common.water]
                    ];
                },
                give: function () {
                    return [
                        [round(random(1, 3)), data.resources.gatherable.common.food]
                    ];
                },
                order: 70
            },
            sleep: {
                name: "sleep",
                desc: "Get some rest.",
                time: 10,
                relaxing: 1,
                give: function (action) {
                    action.owner.updateEnergy(100);
                    return [];
                },
                unlock: function () {
                    return [data.actions.heal];
                },
                log: "@people feels well rested now.",
                order: 5
            },
            heal: {
                name: "heal",
                desc: "\"I really hope those pills are still good.\"",
                time: 2,
                relaxing: 0.8,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.rare.medication]
                    ];
                },
                give: function (action) {
                    action.owner.updateLife(random() > 0.05 ? 100 : -10);
                    return [];
                },
                order: 6
            }
        },
        /***** LOCATIONS *****/
        locations: {
            river: {
                name: "river",
                unlock: function () {
                    return [data.actions.drawFrom.river];
                },
                give: function () {
                    return [
                        data.resources.gatherable.common.water,
                        data.resources.gatherable.common.rock,
                        data.resources.gatherable.uncommon.plastic,
                        data.resources.craftable.stone
                    ];
                },
                dropRate: 20
            },
            mountain: {
                name: "mountain",
                give: function () {
                    return [
                        data.resources.gatherable.common.rock,
                        data.resources.gatherable.common.food,
                        data.resources.craftable.component,
                        data.resources.craftable.tool
                    ];
                },
                dropRate: 80
            },
            desert: {
                name: "desert",
                give: function () {
                    return [
                        data.resources.gatherable.common.rock,
                        data.resources.gatherable.common.scrap,
                        data.resources.gatherable.uncommon.oil,
                        data.resources.craftable.engine
                    ];
                },
                dropRate: 120
            },
            building: {
                name: "abandoned building",
                dropRate: 100,
                hasRuin: 1,
                give: function () {
                    return [
                        data.resources.gatherable.common.scrap,
                        data.resources.gatherable.uncommon.plastic,
                        data.resources.craftable.tool,
                        data.resources.craftable.computer,
                        data.resources.gatherable.rare.medication
                    ];
                }
            },
            ruin: {
                name: "old ruin",
                dropRate: 100,
                hasRuin: 1,
                give: function () {
                    return [
                        data.resources.gatherable.common.rock,
                        data.resources.gatherable.common.food,
                        data.resources.craftable.stone,
                        data.resources.craftable.component
                    ];
                }
            }
        },
        /***** EVENTS *****/
        events: {
            dropRate: 0.01,
            easy: {
                sandstorm: {
                    name: "sandstorm",
                    desc: "The wind is blowing hard, impossible to go out for now.",
                    time: function () {
                        var delta = time.day / 3;
                        return time.day + round(random(-delta, delta));
                    },
                    effect: function (isOn) {
                        this.flags.cantGoOut = isOn;
                    },
                    dropRate: 100
                },
                crate: {
                    name: "you find an old crate",
                    desc: "Would you want to open it ?",
                    yes: "Yes",
                    no: "Leave it there",
                    effect: function (isOn) {
                        if (isOn) {
                            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GIVE, data.actions.gather.give());
                        }
                    },
                    dropRate: 50
                }
            },
            medium: {
                death: { // TODO: test to remove
                    name: "the grim Reaper",
                    desc: "Sometimes death strike unexpectedly.",
                    condition: function () {
                        return this.people.length > 1;
                    },
                    effect: function (isOn) {
                        if (isOn) {
                            this.people.random().die();
                        }
                    },
                    dropRate: 10
                },
                party: {
                    name: "party",
                    desc: "Someone propose to throw a party to change our mind.",
                    time: time.day,
                    yes: "Great idea !",
                    no: "We can't afford it.",
                    effect: function (isOn) {
                        this.flags.productivity *= isOn ? 2 : 0.5;
                        if (isOn) {
                            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, [
                                [1 * this.people.length, data.resources.gatherable.common.water],
                                [3 * this.people.length, data.resources.gatherable.common.food]
                            ]);
                        }
                    },
                    dropRate: 25
                }
            },
            hard: {
                drought: {
                    name: "drought",
                    desc: "The climate is so hot, we consume more water.",
                    time: function () {
                        var delta = time.day;
                        return 3 * time.day + round(random(-delta, delta));
                    },
                    effect: function (isOn) {
                        this.flags.drought = isOn;
                    },
                    dropRate: 6
                }
            }
        }
    };
    // jscs:enable jsDoc

    return {
        time: time,
        data: data
    };
})();

