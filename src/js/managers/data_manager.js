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
    var directions = [
        "north", "south", "east", "west",
        "north-east", "north-west", "south-east", "south-west"
    ];
    // jscs:disable jsDoc
    /**
     * Common fields description
     * name: A name for display
     * desc: Description for tooltip
     * icon: Name of the icon
     * condition: A condition to match
     * time: Time it take
     * deltaTime: Random margin time
     * energy: Energy it draw (default: 5 * time)
     * consume: Resources consumed
     * give: Resources to earn
     * collect: Start to collect resources
     * lock: Actions to lock
     * unlock: Actions to unlock
     * build: Something to build
     * unique: Should done only once
     * dropRate: Chance of drop compare to others
     * log: Message to display on logs
     * order: How to sort with others
     */
    var data = {
        /***** RESOURCES *****/
        resources: {
            /***** GATHERABLES *****/
            gatherable: {
                common: { // drop rate more than 80
                    water: {
                        name: "water",
                        desc: "Water is definitely important to survive in this harsh environment.",
                        icon: "water-bottle",
                        dropRate: 130,
                        order: 10
                    },
                    food: {
                        name: "food",
                        desc: "Everyone need food to keep his strength.",
                        icon: "foodcan",
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
                        icon: "scrap-metal",
                        dropRate: 80,
                        order: 40
                    }
                },
                uncommon: { // drop rate between 80 and 30
                    plastic: {
                        name: "plastic",
                        desc: "A sturdy piece of plastic.",
                        icon: "jerrican",
                        dropRate: 60,
                        order: 50
                    },
                    sand: {
                        name: "sand",
                        desc: "It's pure fine sand.",
                        icon: "sand-pile",
                        dropRate: 30,
                        order: 55
                    },
                    oil: {
                        name: "oil",
                        desc: "About a liter of gas-oil.",
                        icon: "oil-bucket",
                        dropRate: 20,
                        order: 60
                    }
                },
                rare: { // drop rate lower than 30
                    medication: {
                        name: "medication",
                        desc: "An unmark medication, hope it'll help.",
                        icon: "medication",
                        dropRate: 10,
                        order: 70
                    },
                    electronic: {
                        name: "electronic",
                        desc: "Basic micro-electronics components.",
                        icon: "electronic-parts",
                        dropRate: 15,
                        order: 75
                    }
                }
            },
            /***** CRAFTABLES *****/
            craftable: {
                basic: { // Max 2 gatherables, no more than uncommon
                    stone: {
                        name: "smooth stone",
                        desc: "A well polish stone.",
                        icon: "stone",
                        consume: function () {
                            return [
                                [6, data.resources.gatherable.common.rock]
                            ];
                        },
                        dropRate: 100,
                        order: 90
                    },
                    glass: {
                        name: "glass pane",
                        desc: "",
                        icon: "glass-pane",
                        consume: function () {
                            return [
                                [4, data.resources.gatherable.uncommon.sand]
                            ];
                        },
                        dropRate: 100,
                        order: 100
                    },
                    component: {
                        name: "component",
                        desc: "A mechanical part for others craftables.",
                        icon: "pipe-large",
                        consume: function () {
                            return [
                                [2, data.resources.gatherable.common.scrap],
                                [2, data.resources.gatherable.uncommon.plastic]
                            ];
                        },
                        dropRate: 100,
                        order: 110
                    },
                    tool: {
                        name: "tool",
                        desc: "The base of any tinkerer.",
                        icon: "tool",
                        consume: function () {
                            return [
                                [2, data.resources.craftable.basic.component],
                                [3, data.resources.gatherable.common.rock]
                            ];
                        },
                        dropRate: 90,
                        order: 111
                    }
                },
                complex: { // At least 2 requirements with 1 craftables
                    brick: {
                        name: "brick",
                        desc: "Bricks will give wall to larger constructions.",
                        icon: "brick",
                        consume: function () {
                            return [
                                [3, data.resources.craftable.basic.stone],
                                [1, data.resources.craftable.basic.tool]
                            ];
                        },
                        dropRate: 80,
                        order: 112
                    },
                    circuit: {
                        name: "circuit",
                        desc: "That's a little rough, but it's actually a functioning circuit board.",
                        icon: "circuit-board",
                        consume: function () {
                            return [
                                [2, data.resources.gatherable.common.scrap],
                                [1, data.resources.craftable.basic.component],
                                [1, data.resources.gatherable.rare.electronic]
                            ];
                        },
                        dropRate: 70,
                        order: 114
                    },
                    metalPipe: {
                        name: "metal pipe",
                        desc: "Simple pipes that you smith from junk metal.",
                        icon: "pipe-small",
                        consume: function () {
                            return [
                                [5, data.resources.gatherable.common.scrap],
                                [1, data.resources.craftable.basic.tool]
                            ];
                        },
                        condition: function () {
                            return this.buildings.has(data.buildings.medium.forge.id);
                        },
                        dropRate: 70,
                        order: 115
                    }
                },
                advanced: { // At least 3 requirements with 2 craftables (and more)
                    engine: {
                        name: "engine",
                        desc: "Amazing what you manage to do with all those scraps !",
                        icon: "engine",
                        consume: function () {
                            return [
                                [15, data.resources.gatherable.uncommon.oil],
                                [5, data.resources.craftable.basic.tool],
                                [5, data.resources.craftable.complex.metalPipe]
                            ];
                        },
                        condition: function () {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        dropRate: 30,
                        order: 120
                    },
                    computer: {
                        name: "computer",
                        desc: "Well, Internet is down since 2136 but it can still be useful.",
                        icon: "computer",
                        consume: function () {
                            return [
                                [10, data.resources.craftable.basic.component],
                                [7, data.resources.craftable.basic.tool],
                                [3, data.resources.craftable.complex.circuit]
                            ];
                        },
                        condition: function () {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        dropRate: 20,
                        order: 130
                    },
                    beacon: {
                        name: "beacon",
                        desc: "",
                        icon: "radio-station",
                        consume: function () {
                            return [
                                [6, data.resources.craftable.basic.glass],
                                [4, data.resources.craftable.complex.circuit],
                                [1, data.resources.craftable.advanced.computer]
                            ];
                        },
                        give: function () {
                            data.people.dropRate = 0.9;
                            return [];
                        },
                        dropRate: 10,
                        order: 140
                    }
                }
            },
            ruins: {
                name: "location",
                desc: "Directions to a point of interest we found earlier.",
                icon: "map",
                order: 80,
                dropRate: 0.6
            },
            room: {
                name: "room",
                desc: "A place for someone in the camp.",
                icon: "person",
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
            dropRate: 0.01
        },
        /***** BUILDINGS *****/
        buildings: {
            small: {
                tent: {
                    name: "tent",
                    desc: "Allow someone to rejoin your colony.",
                    time: 4,
                    consume: function () {
                        return [
                            [6, data.resources.gatherable.common.scrap],
                            [3, data.resources.craftable.basic.stone]
                        ];
                    },
                    give: function () {
                        return [
                            [1, data.resources.room]
                        ];
                    },
                    dropRate: 100
                },
                plot: {
                    name: "farm plot",
                    desc: "",
                    time: 12,
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.common.food],
                            [10, data.resources.gatherable.uncommon.sand]
                        ];
                    },
                    unlock: function () {
                        return [data.actions.harvest];
                    }
                },
                well: {
                    name: "well",
                    desc: "Just a large hole into the ground.",
                    time: 16,
                    energy: 80,
                    condition: function () {
                        return !this.buildings.has(data.buildings.big.pump.id);
                    },
                    consume: function () {
                        return [
                            [10, data.resources.craftable.basic.stone],
                            [3, data.resources.craftable.basic.tool]
                        ];
                    },
                    give: function () {
                        return [
                            [5, data.resources.gatherable.common.water]
                        ];
                    },
                    unlock: function () {
                        return [data.actions.drawFrom.well];
                    },
                    dropRate: 80
                }
            },
            medium: {
                forge: {
                    name: "forge",
                    desc: "",
                    time: 10,
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.uncommon.oil],
                            [10, data.resources.craftable.basic.stone],
                            [3, data.resources.craftable.basic.tool]
                        ];
                    },
                    dropRate: 60
                }
            },
            big: {
                barrack: {
                    name: "barrack",
                    desc: "Some place to sleep for a few people.",
                    time: 2 * time.day,
                    energy: 110,
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.uncommon.sand],
                            [5, data.resources.gatherable.uncommon.plastic],
                            [10, data.resources.craftable.complex.brick],
                            [2, data.resources.craftable.basic.glass]
                        ];
                    },
                    give: function () {
                        return [round(random(3, 4)), data.resources.room];
                    },
                    dropRate: 20
                },
                workshop: {
                    name: "workshop",
                    desc: "Organizing your workforce make them more efficient at crafting.",
                    time: 3 * time.day,
                    energy: 90,
                    unique: true,
                    consume: function () {
                        return [
                            [6, data.resources.gatherable.common.scrap],
                            [5, data.resources.craftable.basic.glass],
                            [10, data.resources.craftable.basic.tool],
                            [15, data.resources.craftable.complex.brick]
                        ];
                    },
                    give: function () {
                        return [];
                    },
                    dropRate: 20
                },
                pump: {
                    name: "water pump",
                    desc: "A buried contraption that collect water from the earth moisture.",
                    time: 3 * time.day,
                    energy: 120,
                    unique: true,
                    consume: function () {
                        return [
                            [30, data.resources.craftable.basic.stone],
                            [7, data.resources.craftable.complex.metalPipe],
                            [1, data.resources.craftable.advanced.engine]
                        ];
                    },
                    give: function () {
                        return [
                            [10, data.resources.gatherable.common.water]
                        ];
                    },
                    unlock: function () {
                        return [data.actions.drawFrom.well];
                    },
                    collect: function () {
                        return [
                            [2 / time.day, data.resources.gatherable.common.water]
                        ];
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
                energy: 0,
                unlock: function (action) {
                    action.owner.updateEnergy(100);
                    action.owner.updateLife(100);
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
                energy: 0,
                give: function () {
                    var messageType = MessageBus.MSG_TYPES.LOGS.FLAVOR;
                    TimerManager.timeout(this.log.bind(this, "We need a shelter.", messageType), 1000);
                    return [,
                        [10, data.resources.gatherable.common.water],
                        [5, data.resources.gatherable.common.food],
                        [2, data.resources.craftable.basic.component]
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
                energy: 0,
                unlock: function () {
                    this.flags.settled = true;
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
                log: "@people installs @build inside a ship-wreck with @give to sleep in.",
                order: 0,
                unique: true
            },
            gather: {
                name: "gather resources",
                desc: "Go out to bring back resources, that's the best you can do.",
                time: 3,
                isOut: 1,
                unlock: function () {
                    return [
                        data.actions.roam
                    ];
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
                time: 2,
                isOut: 1,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.common.water]
                    ];
                },
                condition: function (action) {
                    return !action.owner.actions.has(data.actions.scour.id);
                },
                unlock: function (action) {
                    var unlock = [
                        data.actions.explore,
                        data.actions.craft
                    ];
                    if (action.repeated > 10) {
                        unlock.push(data.actions.scour);
                    }
                    return unlock;
                },
                lock: function (action) {
                    if (action.repeated > 10) {
                        return [action.data];
                    }
                    else {
                        return [];
                    }
                },
                give: function (action, effet) {
                    var give = [
                        randomize(data.resources.gatherable, "1-3")
                    ];
                    if (random() < data.resources.ruins.dropRate) {
                        give.push([1, data.resources.ruins]);
                        var location = randomize(data.locations.near);
                        this.knownLocations.push(location);
                        effet.location = an(location.name);
                    }
                    return give;
                },
                log: function (effect) {
                    var log;
                    if (effect.location) {
                        log = "Heading @direction, @people spots @location. @pronoun also brings back @give.";
                    }
                    else {
                        log = "Despite nothing special found towards @direction, @people brings back @give.";
                    }
                    effect.direction = directions.random();

                    return log.replace(/@(\w+)/gi, function (match, capture) {
                        return effect[capture] || "";
                    });
                },
                order: 10
            },
            scour: { // OP ?
                name: "scour",
                desc: "Knowledge of ",
                time: 6,
                isOut: 1,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.common.water]
                    ];
                },
                give: function () {
                    var give = [
                        randomize(data.resources.gatherable, "2-4")
                    ];
                    // Add 50% chance for ruins
                    var chance = data.resources.ruins.dropRate + (1 - data.resources.ruins.dropRate) * 0.5;
                    if (random() < chance) {
                        give.push([1, data.resources.ruins]);
                        var location = randomize(data.locations.near);
                        this.knownLocations.push(location);
                        effet.location = an(location.name);
                    }
                    return give;
                },
                log: function (effect) {
                    var log;
                    if (effect.location) {
                        log = "Heading @direction, @people spots @location. @pronoun also brings back @give.";
                    }
                    else {
                        log = "Despite nothing special found towards @direction, @people brings back @give.";
                    }
                    return log.replace(/@(\w+)/gi, function (match, capture) {
                        return effect[capture] || "";
                    });
                },
                order: 10
            },
            explore: {
                name: "explore a ruin",
                desc: "Remember that location we saw the other day ? Let's see what we can find.",
                time: 2 * time.day,
                energy: 110,
                isOut: 1,
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
                time: function () {
                    return this.buildings.has(data.buildings.big.workshop.id) ? 4 : 6;
                },
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
                energy: 20,
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
                energy: function (action) {
                    return action.owner.plan.energy;
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
                    var lock = [action.data];
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
                log: "Building @build gives @give",
                order: 50
            },
            drawFrom: {
                river: {
                    name: "draw water",
                    desc: "Get some water from the river.",
                    time: 8,
                    energy: 50,
                    condition: function (action) {
                        return !action.owner.actions.has(data.actions.drawFrom.well.id);
                    },
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
                    energy: 15,
                    give: function () {
                        var draw;
                        if (this.buildings.has(data.buildings.big.pump.id)) {
                            draw = random(5, 9);
                        }
                        else if (this.buildings.has(data.buildings.small.well.id)) {
                            draw = random(1, 3);
                        } // shouldn't have other case
                        return [
                            [round(draw), data.resources.gatherable.common.water]
                        ];
                    },
                    lock: function () {
                        return [data.actions.drawFrom.river];
                    },
                    log: "Using our well, @people get @give.",
                    order: 60
                }
            },
            harvest: {
                name: "harvest crops",
                desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
                time: 5,
                consume: function () {
                    return [
                        [1, data.resources.gatherable.common.water]
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
                energy: 0,
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
                energy: 0,
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
            near: {
                mountain: {
                    name: "mountain",
                    give: function () {
                        return [
                            data.resources.gatherable.common.rock,
                            data.resources.gatherable.common.scrap,
                            data.resources.craftable.basic.component
                        ];
                    },
                    dropRate: 80
                },
                desert: {
                    name: "desert",
                    give: function () {
                        return [
                            data.resources.gatherable.common.scrap,
                            data.resources.gatherable.uncommon.oil,
                            data.resources.gatherable.uncommon.sand
                        ];
                    },
                    dropRate: 120
                },
                supermarket: {
                    name: "supermarket",
                    give: function () {
                        return [
                            data.resources.gatherable.common.food,
                            data.resources.gatherable.rare.medication,
                            data.resources.craftable.basic.glass
                        ];
                    }
                }
            },
            far: {
                river: {
                    name: "river",
                    unlock: function () {
                        return [data.actions.drawFrom.river];
                    },
                    give: function () {
                        return [
                            data.resources.gatherable.common.water,
                            data.resources.gatherable.uncommon.plastic,
                            data.resources.craftable.basic.stone
                        ];
                    },
                    dropRate: 20
                },
                ruin: {
                    name: "old ruin",
                    give: function () {
                        return [
                            data.resources.gatherable.rare.electronic,
                            data.resources.craftable.basic.component,
                            data.resources.craftable.basic.tool
                        ];
                    },
                    dropRate: 100
                }
            },
            epic: {
                building: {
                    name: "abandoned building",
                    give: function () {
                        return [
                            data.resources.gatherable.rare.medication,
                            data.resources.craftable.basic.glass,
                            data.resources.craftable.complex.circuit
                        ];
                    },
                    dropRate: 100
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
                    time: 20,
                    deltaTime: 4,
                    effect: function (isOn) {
                        this.flags.cantGoOut = isOn;
                    },
                    dropRate: 100,
                    log: "A sandstorm has started and prevent anyone from leaving the camp."
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
                    dropRate: 50,
                    log: "Upon opening, you find @give in it."
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
                    dropRate: 25,
                    log: "We make a little party to try forget our situation."
                }
            },
            hard: {
                drought: {
                    name: "drought",
                    desc: "The climate is so hot, we consume more water.",
                    time: 3 * time.day,
                    timeDelta: 10,
                    effect: function (isOn) {
                        this.flags.drought = isOn;
                    },
                    dropRate: 6,
                    log: "A harsh drought fall on us, water will be more important than ever."
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

