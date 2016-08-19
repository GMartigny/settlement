/**
 * Class holding data
 * @constructor
 */
function DataManager () {
}
DataManager.time = {
    hour: 1,
    day: 24,
    week: 7 * 24,
    month: 30 * 24,
    year: 12 * 30 * 24
};
// jscs:disable jsDoc
DataManager.data = {
    /***** RESOURCES *****/
    resources: {
        /***** GATHERABLES *****/
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
        /***** CRAFTABLES *****/
        craftable: {
            component: {
                name: "Component",
                desc: "A mechanical part for others craftables.",
                icon: [1, 2],
                consume: function () {
                    return [
                        [2, DataManager.data.resources.gatherable.common.scrap],
                        [2, DataManager.data.resources.gatherable.uncommon.plastic]
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
                        [10, DataManager.data.resources.gatherable.common.scrap],
                        [20, DataManager.data.resources.craftable.component],
                        [5, DataManager.data.resources.craftable.tool],
                        [10, DataManager.data.resources.gatherable.uncommon.oil]
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
                        [2, DataManager.data.resources.gatherable.common.scrap],
                        [2, DataManager.data.resources.craftable.component],
                        [1, DataManager.data.resources.gatherable.common.rock]
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
                        [6, DataManager.data.resources.gatherable.common.rock]
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
                        [5, DataManager.data.resources.craftable.component],
                        [3, DataManager.data.resources.craftable.tool],
                        [10, DataManager.data.resources.gatherable.common.scrap],
                        [2, DataManager.data.resources.gatherable.uncommon.plastic]
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
                [1.5 / DataManager.time.day, DataManager.data.resources.gatherable.common.food],
                [1 / DataManager.time.day, DataManager.data.resources.gatherable.common.water]
            ];
        },
        dropRate: 0.05
    },
    /***** BUILDINGS *****/
    buildings: {
        small: {
            tent: {
                name: "Tent",
                desc: "Allow someone to rejoin your colony.",
                time: 3,
                consume: function () {
                    return [
                        [3, DataManager.data.resources.gatherable.common.rock],
                        [5, DataManager.data.resources.gatherable.common.scrap],
                        [2, DataManager.data.resources.craftable.component]
                    ];
                },
                give: function () {
                    return [
                        [1, DataManager.data.resources.room]
                    ];
                },
                dropRate: 100
            },
            well: {
                name: "Well",
                desc: "Just a large hole into the ground.",
                time: 12,
                unlock: function () {
                    return [DataManager.data.actions.draw];
                },
                consume: function () {
                    return [
                        [8, DataManager.data.resources.gatherable.common.rock],
                        [4, DataManager.data.resources.gatherable.common.scrap],
                        [1, DataManager.data.resources.gatherable.uncommon.plastic]
                    ];
                },
                give: function () {
                    return [
                        [8, DataManager.data.resources.gatherable.common.water]
                    ];
                },
                dropRate: 80
            },
            farm: {
                name: "Farm",
                desc: "A plotted land with some seeds has always provided food.",
                time: DataManager.time.day,
                unlock: function () {
                    return [DataManager.data.actions.harvest];
                },
                consume: function () {
                    return [
                        [6, DataManager.data.resources.gatherable.common.rock],
                        [6, DataManager.data.resources.gatherable.uncommon.plastic],
                        [1, DataManager.data.resources.craftable.tool]
                    ];
                }
            },
            dropRate: 70
        },
        big: {
            pump: {
                name: "Water pump",
                desc: "A buried contraption that collect water from the earth moisture.",
                time: 3 * DataManager.time.day,
                unlock: function () {
                    return [DataManager.data.actions.draw];
                },
                consume: function () {
                    return [
                        [100, DataManager.data.resources.craftable.stone],
                        [10, DataManager.data.resources.gatherable.uncommon.plastic],
                        [10, DataManager.data.resources.craftable.component],
                        [1, DataManager.data.resources.craftable.engine],
                        [3, DataManager.data.resources.craftable.tool],
                        [15, DataManager.data.resources.gatherable.common.water]
                    ];
                },
                give: function () {
                    return [
                        [40, DataManager.data.resources.gatherable.common.water]
                    ];
                },
                collect: function () {
                    return [
                        [2 / DataManager.time.day, DataManager.data.resources.gatherable.common.water]
                    ];
                },
                dropRate: 15
            },
            workshop: {
                name: "Workshop",
                desc: "Organizing your workforce make them more efficient at crafting.",
                time: 3 * DataManager.time.day,
                unique: true,
                consume: function () {
                    return [
                        [20, DataManager.data.resources.craftable.stone],
                        [20, DataManager.data.resources.gatherable.common.scrap],
                        [15, DataManager.data.resources.craftable.component],
                        [8, DataManager.data.resources.craftable.tool]
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
                time: 2 * DataManager.time.day + 5 * DataManager.time.hour,
                consume: function () {
                    return [
                        [5, DataManager.data.resources.craftable.tool],
                        [10, DataManager.data.resources.gatherable.common.scrap],
                        [7, DataManager.data.resources.gatherable.common.rock]
                    ];
                },
                give: function () {
                    return [random(2, 4), DataManager.data.resources.room];
                },
                dropRate: 10
            }
        },
        special: {
            forum: {
                name: "Forum",
                desc: "The center and start of our settlement.",
                unlock: function () {
                    return [DataManager.data.actions.sleep];
                },
                unique: true
            }
        }
    },
    /***** ACTIONS *****/
    actions: {
        settle: {
            name: "Settle",
            desc: "Ok, let's settle right here !",
            time: 1,
            unlock: function () {
                var unlocked = [
                    DataManager.data.actions.gather
                ];
                unlocked.forEach(function (action) {
                    this.initialActions.push(action);
                }.bind(this));
                return unlocked;
            },
            lock: function () {
                var locked = [DataManager.data.actions.settle];
                locked.forEach(function (action) {
                    this.initialActions.pop(action.id);
                }.bind(this));
                return locked;
            },
            build: function () {
                return DataManager.data.buildings.special.forum;
            },
            give: function () {
                this.flags.settled = performance.now();
                return [
                    [2, DataManager.data.resources.room],
                    [1, DataManager.data.resources.gatherable.common.water],
                    [1, DataManager.data.resources.gatherable.common.food],
                    [2, DataManager.data.resources.craftable.tool]
                ];
            }
        },
        gather: {
            name: "Gather resources",
            desc: "Go out to bring back resources, that's the best you can do.",
            time: 3,
            isOut: 1,
            unlock: function () {
                return [DataManager.data.actions.roam];
            },
            give: function () {
                var res = [];
                for (var i = 0, l = round(random(1, 3)); i < l; ++i) {
                    res.push(randomize(DataManager.data.resources.gatherable, "1-" + (5 / l)));
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
                    [2, DataManager.data.resources.gatherable.common.water]
                ];
            },
            unlock: function () {
                return [DataManager.data.actions.explore, DataManager.data.actions.craft];
            },
            give: function () {
                return [
                    randomize(DataManager.data.resources.gatherable, "1-3"),
                    [round(random(0, 1)), DataManager.data.resources.ruins]
                ];
            }
        },
        explore: {
            name: "Explore a ruin",
            desc: "Remember that ruin you saw the other day ? Let's see what's inside.",
            time: DataManager.time.day,
            isOut: 1,
            relaxing: 0.15,
            consume: function () {
                return [
                    [4, DataManager.data.resources.gatherable.common.water],
                    [1, DataManager.data.resources.gatherable.common.food],
                    [1, DataManager.data.resources.ruins]
                ];
            },
            give: function () {
                return [
                    randomize(DataManager.data.resources.gatherable, "1-3"),
                    randomize(DataManager.data.resources.craftable, "3-7")
                ];
            }
        },
        craft: {
            name: "Craft something",
            desc: "Use some resources to tinker something useful.",
            time: 6,
            unlock: function () {
                return [DataManager.data.actions.plan];
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
            }
        },
        plan: {
            name: "Plan a building",
            desc: "Prepare blueprint and space for a new building.",
            time: 8,
            relaxing: 0.5,
            unlock: function () {
                return [DataManager.data.actions.build];
            },
            give: function (action) {
                action.owner.planBuilding(randomize(this.possibleBuildings()));
                return [];
            },
            consume: function () {
                return [
                    [1, DataManager.data.resources.gatherable.common.water],
                    [1, DataManager.data.resources.gatherable.common.food],
                    [1, DataManager.data.resources.craftable.tool]
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
                    [2, DataManager.data.resources.gatherable.common.water],
                    [1, DataManager.data.resources.gatherable.common.food]
                ];
                if (isFunction(action.owner.plan.consume)) {
                    consume.push.apply(consume, action.owner.plan.consume(action));
                }
                return consume;
            },
            lock: function (action) {
                var lock = [DataManager.data.actions.build];
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
                    [round(random(1, 3)), DataManager.data.resources.gatherable.common.water]
                ];
            }
        },
        harvest: {
            name: "Harvest crops",
            desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
            time: 4,
            consume: function () {
                return [
                    [2, DataManager.data.resources.gatherable.common.water]
                ];
            },
            give: function () {
                return [
                    [round(random(1, 3)), DataManager.data.resources.gatherable.common.food]
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
                return [DataManager.data.actions.heal];
            }
        },
        heal: {
            name: "Heal",
            desc: "\"I really hope those pills are still good.\"",
            time: 2,
            relaxing: 0.8,
            consume: function () {
                return [
                    [2, DataManager.data.resources.gatherable.rare.medication]
                ];
            },
            give: function (action) {
                action.owner.updateLife(random() > 0.05 ? 100 : -10);
                return [];
            }
        }
    },
    /***** EVENTS *****/
    events: {
        dropRate: 0.3,
        easy: {
            sandstorm: {
                name: "Sand storm",
                desc: "The wind is blowing hard, impossible to go out for now.",
                time: function () {
                    var delta = DataManager.time.day / 3;
                    return DataManager.time.day + random(-delta, delta);
                },
                effect: function (isOn) {
                    this.flags.cantGoOut = isOn;
                },
                dropRate: 100
            },
            crate: {
                name: "You find an old crate",
                desc: "Would you want to open it ?",
                yes: "Yes",
                no: "Leave it there",
                effect: function (isOn) {
                    if (isOn) {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GIVE, DataManager.data.actions.gather.give());
                    }
                },
                dropRate: 50
            }
        },
        medium: {
            death: {
                name: "The grim Reaper",
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
                name: "Throw a party",
                desc: "Someone propose to throw a party to change our mind.",
                time: DataManager.time.day,
                yes: "Great idea !",
                no: "We can't afford it.",
                effect: function (isOn) {
                    this.flags.productivity *= isOn ? 2 : 0.5;
                    if (isOn) {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, [
                            [1 * this.people.length, DataManager.data.resources.gatherable.common.water],
                            [3 * this.people.length, DataManager.data.resources.gatherable.common.food]
                        ]);
                    }
                },
                dropRate: 25
            }
        },
        hard: {
            drought: {
                name: "Drought",
                desc: "The climate is so hot, we consume more water.",
                time: function () {
                    var delta = DataManager.time.day;
                    return 3 * DataManager.time.day + random(-delta, delta);
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
