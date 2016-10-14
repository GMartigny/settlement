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
                        dropRate: 140,
                        order: 10
                    },
                    food: {
                        name: "food",
                        desc: "Everyone need food to keep his strength.",
                        icon: "foodcan",
                        dropRate: 140,
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
                        dropRate: 100,
                        order: 40
                    }
                },
                uncommon: { // drop rate between 80 and 20
                    plastic: {
                        name: "plastic",
                        desc: "A sturdy piece of plastic.",
                        icon: "",
                        dropRate: 70,
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
                        name: "fuel",
                        desc: "About a liter of gas-oil.",
                        icon: "jerrycan",
                        dropRate: 20,
                        order: 60
                    }
                },
                rare: { // drop rate lower than 20
                    medication: {
                        name: "medication",
                        desc: "An unlabeled medication, hope it's still good.",
                        icon: "medication",
                        dropRate: 5,
                        order: 70
                    },
                    electronic: {
                        name: "electronic",
                        desc: "Basic micro-electronics components.",
                        icon: "electronic-parts",
                        dropRate: 10,
                        order: 75
                    }
                },
                special: {
                    ruins: {
                        name: "location",
                        desc: "Directions to a point of interest we found earlier.",
                        icon: "map",
                        order: 80,
                        dropRate: 0.6
                    },
                    quartz: {
                        name: "quartz cristal",
                        desc: "",
                        icon: "",
                        dropRate: 0.1,
                        order: 77
                    }
                }
            },
            /***** CRAFTABLES *****/
            craftable: {
                basic: { // Max 2 gatherables, no more than uncommon
                    stone: {
                        name: "smooth stone",
                        desc: "A well polish and round stone.",
                        icon: "stone",
                        consume: function () {
                            return [
                                [3, data.resources.gatherable.common.rock]
                            ];
                        },
                        dropRate: 100,
                        order: 90
                    },
                    glass: {
                        name: "glass pane",
                        desc: "",
                        icon: "glass-pane",
                        condition: function () {
                            return this.buildings.has(data.buildings.small.furnace.id);
                        },
                        consume: function () {
                            return [
                                [4, data.resources.gatherable.uncommon.sand]
                            ];
                        },
                        dropRate: 60,
                        order: 100
                    },
                    component: {
                        name: "component",
                        desc: "Some mechanical parts for others craftables.",
                        icon: "pipe-large",
                        consume: function () {
                            return [
                                [2, data.resources.gatherable.common.scrap],
                                [2, data.resources.gatherable.uncommon.plastic]
                            ];
                        },
                        dropRate: 120,
                        order: 110
                    },
                    tool: {
                        name: "tool",
                        desc: "The base of any tinkerer.",
                        icon: "tool",
                        consume: function () {
                            return [
                                [1, data.resources.craftable.basic.component],
                                [2, data.resources.gatherable.common.rock]
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
                        condition: function () {
                            return this.buildings.has(data.buildings.small.well.id);
                        },
                        consume: function () {
                            return [
                                [1, data.resources.craftable.basic.stone],
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
                                [1, data.resources.gatherable.common.scrap],
                                [2, data.resources.craftable.basic.component],
                                [3, data.resources.gatherable.rare.electronic]
                            ];
                        },
                        dropRate: 60,
                        order: 114
                    },
                    metalPipe: {
                        name: "metal pipe",
                        desc: "Simple pipes that you forge from junk metal.",
                        icon: "pipe-small",
                        condition: function () {
                            return this.buildings.has(data.buildings.medium.forge.id);
                        },
                        consume: function () {
                            return [
                                [4, data.resources.gatherable.common.scrap],
                                [1, data.resources.craftable.basic.tool]
                            ];
                        },
                        dropRate: 80,
                        order: 115
                    },
                    furniture: {
                        name: "furniture",
                        desc: "",
                        icon: "",
                        consume: function () {
                            return [
                                [2, data.resources.craftable.basic.glass],
                                [2, data.resources.craftable.complex.metalPipe]
                            ];
                        },
                        dropRate: 40,
                        order: 116
                    },
                    jewelry: {
                        name: "jewelry",
                        desc: "",
                        icon: "",
                        condition: function () {
                            return this.buildings.has(data.buildings.small.furnace.id);
                        },
                        consume: function () {
                            return [
                                [4, data.resources.gatherable.rare.electronic],
                                [3, data.resources.gatherable.special.quartz]
                            ];
                        },
                        dropRate: 40,
                        order: 117
                    }
                },
                advanced: { // At least 3 requirements with 2 craftables (and more)
                    engine: {
                        name: "engine",
                        desc: "Amazing what you manage to do with all those scraps !",
                        icon: "engine",
                        condition: function () {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        consume: function () {
                            return [
                                [10, data.resources.gatherable.uncommon.oil],
                                [5, data.resources.craftable.basic.tool],
                                [5, data.resources.craftable.complex.metalPipe]
                            ];
                        },
                        dropRate: 30,
                        order: 120
                    },
                    computer: {
                        name: "computer",
                        desc: "Well, Internet is down since 2136 but it can still be useful.",
                        icon: "computer",
                        condition: function () {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        consume: function () {
                            return [
                                [10, data.resources.craftable.basic.component],
                                [7, data.resources.craftable.basic.tool],
                                [3, data.resources.craftable.complex.circuit]
                            ];
                        },
                        dropRate: 20,
                        order: 130
                    }
                }
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
            dropRate: 0.005
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
                            [7, data.resources.gatherable.common.scrap],
                            [5, data.resources.gatherable.common.rock]
                        ];
                    },
                    give: function () {
                        return [
                            [1, data.resources.room]
                        ];
                    },
                    log: "That's small and ugly, but someone can sleep safely in here.",
                    dropRate: 100
                },
                furnace: {
                    name: "furnace",
                    desc: "",
                    time: 7,
                    consume: function () {
                        return [
                            [8, data.resources.gatherable.common.rock],
                            [3, data.resources.gatherable.uncommon.oil]
                        ];
                    },
                    log: "A small furnace can smelt small things like sand or little electronic.",
                    unique: true,
                    dropRate: 90
                },
                plot: {
                    name: "farm plot",
                    desc: "A little arranged plot of earth to grow some food.",
                    time: 12,
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.common.food],
                            [10, data.resources.gatherable.uncommon.sand]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.harvest
                        ];
                    },
                    log: "More crops required more care but that's going to help us keeping a constant stock of food.",
                    dropRate: 80
                },
                pharmacy: {
                    name: "pharmacy",
                    desc: "",
                    time: 6,
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.rare.medication],
                            [4, data.resources.craftable.basic.component]
                        ];
                    },
                    log: "Sorting our medications should prevent further mistakes and bad reaction.",
                    unique: true,
                    dropRate: 70
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
                        return [
                            data.actions.drawFrom.well
                        ];
                    },
                    lock: function () {
                        return [
                            data.actions.drawFrom.river
                        ];
                    },
                    log: "We find out that it's possible to draw some water from the ground and use it to make bricks.",
                    unique: true,
                    dropRate: 80
                }
            },
            medium: {
                forge: {
                    name: "forge",
                    desc: "A good upgrade to our little furnace.",
                    time: 10,
                    condition: function () {
                        this.buildings.has(data.buildings.small.furnace.id);
                    },
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.uncommon.oil],
                            [10, data.resources.craftable.basic.stone],
                            [2, data.resources.craftable.basic.tool]
                        ];
                    },
                    log: "We can now work metal better and make more complex part.",
                    unique: true,
                    dropRate: 60
                },
                house: {
                    name: "house",
                    desc: "",
                    time: 13,
                    condition: function () {
                        this.buildings.has(data.buildings.small.tent.id);
                    },
                    consume: function () {
                        return [
                            [7, data.resources.gatherable.common.rock],
                            [1, data.resources.craftable.complex.furniture]
                        ];
                    },
                    give: function () {
                        return [round(random(2, 3)), data.resources.room];
                    },
                    log: "Better than a simple tent, it provide @give.",
                    dropRate: 50
                }
            },
            big: {
                barrack: {
                    // Deactivated
                    name: "barrack",
                    desc: "Some place to sleep for a few people.",
                    time: 2 * time.day,
                    energy: 110,
                    condition: function () {
                        return this.buildings.has(data.buildings.medium.house.id) && false;
                    },
                    consume: function () {
                        return [
                            [5, data.resources.gatherable.uncommon.sand],
                            [8, data.resources.craftable.complex.brick],
                            [1, data.resources.craftable.complex.furniture]
                        ];
                    },
                    give: function () {
                        return [round(random(3, 4)), data.resources.room];
                    },
                    log: "That's a lots of space to welcome wanderers.",
                    dropRate: 0
                },
                workshop: {
                    name: "workshop",
                    desc: "Organizing your workforce make them more efficient at crafting.",
                    time: 3 * time.day,
                    energy: 90,
                    unique: true,
                    condition: function () {
                        return this.buildings.has(data.buildings.small.furnace.id);
                    },
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
                    unlock: function () {
                        return [
                            data.actions.project
                        ];
                    },
                    log: "Good organisation allow you to prepare project and do much more complex crafting.",
                    dropRate: 30
                },
                radio: {
                    name: "radio-station",
                    desc: "",
                    time: 6,
                    energy: 60,
                    unique: true,
                    condition: function () {
                        return this.buildings.has(data.buildings.big.workshop.id);
                    },
                    consume: function () {
                        return [
                            [4, data.resources.craftable.complex.circuit],
                            [1, data.resources.craftable.advanced.computer]
                        ];
                    },
                    log: "\"Message received. We thought no one survive the crash. " +
                        "Unfortunately we can't risk being located, come to sent position.\"",
                    dropRate: 20
                },
                pump: {
                    name: "water pump",
                    desc: "A buried contraption that collect water from the earth moisture.",
                    time: 3 * time.day,
                    energy: 120,
                    unique: true,
                    condition: function () {
                        return this.buildings.has(data.buildings.small.well.id);
                    },
                    consume: function () {
                        return [
                            [20, data.resources.craftable.basic.stone],
                            [5, data.resources.craftable.complex.metalPipe],
                            [1, data.resources.craftable.advanced.engine]
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
                    log: "A big upgrade to your well ! Now we have a continuous flow of water soming.",
                    dropRate: 10
                },
                trading: {
                    name: "trading post",
                    desc: "",
                    time: time.day,
                    energy: 70,
                    unique: true,
                    condition: function () {
                        return this.buildings.has(data.buildings.big.radio.id);
                    },
                    consume: function () {
                        return [
                            [2, data.resources.craftable.basic.glass],
                            [10, data.resources.craftable.complex.brick],
                            [2, data.resources.craftable.complex.furniture]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.exchange
                        ];
                    },
                    log: "Arranging some space allow us to trade with merchant caravan passing by.",
                    dropRate: 10
                },
                module: {
                    name: "module",
                    desc: "With that, we can finally go seek for help.",
                    time: time.week,
                    energy: 100,
                    unique: true,
                    condition: function () {
                        return this.buildings.has(data.buildings.big.radio.id);
                    },
                    consume: function () {
                        return [
                            [15, data.resources.gatherable.uncommon.oil],
                            [3, data.resources.craftable.complex.furniture],
                            [1, data.resources.craftable.advanced.computer],
                            [2, data.resources.craftable.advanced.engine]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.launch
                        ];
                    },
                    log: "What a journey, but there we are. We build so many things and explore lots of places.<br/>" +
                    "Now we can end this all !",
                    dropRate: 5
                }
            },
            special: {
                forum: {
                    name: "forum",
                    desc: "The center and start of our settlement.",
                    unlock: function () {
                        return [
                            data.actions.sleep
                        ];
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
                log: "@people.name gets up painfully.",
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
                    TimerManager.timeout(function () {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, "We need a shelter.");
                    }, 1000);
                    return [,
                        [10, data.resources.gatherable.common.water],
                        [8, data.resources.gatherable.common.food],
                        [2, data.resources.craftable.basic.component]
                    ];
                },
                unlock: function () {
                    return [
                        data.actions.settle
                    ];
                },
                log: "After some thinking, @people.name remembers the attack. " +
                    "@people.nominative grabs @give laying around.",
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
                log: "@people.name installs @build inside a ship-wreck with @give to sleep in.",
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
                log: "@people.name comes back with @give.",
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
                    var give = randomizeMultiple(data.resources.gatherable, "1-3");
                    if (random() < data.resources.gatherable.special.ruins.dropRate) {
                        give.push([1, data.resources.gatherable.special.ruins]);
                        var location = randomize(Object.assign({}, data.locations.near));
                        this.knownLocations.push(location);
                        effet.location = an(location.name);
                    }
                    return give;
                },
                log: function (effect) {
                    var log;
                    if (effect.location) {
                        log = "Heading @direction, @people.name spots @location, " +
                            "so @people.nominative brings back @give.";
                    }
                    else {
                        log = "Despite nothing special found towards @direction, @people.name brings back @give.";
                    }
                    effect.direction = directions.random();

                    return log;
                },
                order: 10
            },
            scour: {
                name: "scour",
                desc: "Knowledge of the area allows for better findings.",
                time: 6,
                isOut: 1,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.common.water]
                    ];
                },
                give: function (action, effect) {
                    var give = randomize(data.resources.gatherable, "2-4");
                    // Add 50% chance for ruins
                    var baseDropRate = data.resources.gatherable.special.ruins.dropRate;
                    if (random() < baseDropRate + (1 - baseDropRate) * 0.5) {
                        give.push([1, data.resources.gatherable.special.ruins]);
                        var location = randomize(data.locations);
                        this.knownLocations.push(location);
                        effect.location = an(location.name);
                    }
                    return give;
                },
                log: function (effect) {
                    var log;
                    if (effect.location) {
                        log = "@people.name knew @people.nominative could find @location towards @direction, " +
                            "so @people.nominative comes back with @give.";
                    }
                    else {
                        log = "No special location towards @direction, but @people.name find @give.";
                    }
                    return log;
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
                        [1, data.resources.gatherable.special.ruins]
                    ];
                },
                give: function (action) {
                    var location = this.knownLocations.random();
                    // remember it for log
                    action.location = location;
                    return randomizeMultiple(location.give(), "5-9");
                },
                log: function (effect, action) {
                    var log = action.location.log || "";
                    return isFunction(log) ? log(effect, action) : log;
                },
                order: 20
            },
            craft: {
                name: "craft something",
                desc: "Use some resources to tinker something useful.",
                time: function () {
                    return this.buildings.has(data.buildings.big.workshop.id) ? 4 : 5;
                },
                unlock: function () {
                    return [data.actions.plan];
                },
                give: function () {
                    var possible = this.possibleCraftables();
                    if (possible.length) {
                        var pick = randomize(possible);
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
                log: function (effect) {
                    if (effect.give) {
                        return "@people.name succeeds to craft @give.";
                    }
                    else {
                        effect.logType = MessageBus.MSG_TYPES.LOGS.WARN;
                        return "Nothing could be made with what you have right now.";
                    }
                },
                order: 30
            },
            plan: {
                name: "plan a building",
                desc: "Prepare blueprint and space for a new building.",
                time: 8,
                energy: 20,
                consume: function () {
                    return [
                        [1, data.resources.gatherable.common.water],
                        [1, data.resources.gatherable.common.food],
                        [1, data.resources.craftable.basic.tool]
                    ];
                },
                give: function (action) {
                    action.owner.planBuilding(randomize(this.possibleBuildings()));
                    return [];
                },
                unlock: function () {
                    return [data.actions.build];
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
                log: function (effect, action) {
                    var log = action.owner.plan.log;
                    return isFunction(log) ? log(effect, action) : log;
                },
                order: 50
            },
            drawFrom: {
                river: {
                    name: "draw water",
                    desc: "Get some water from the river.",
                    time: 8,
                    energy: 50,
                    isOut: 1,
                    condition: function (action) {
                        return !action.owner.actions.has(data.actions.drawFrom.well.id);
                    },
                    give: function () {
                        return [
                            [round(random(2, 6)), data.resources.gatherable.common.water]
                        ];
                    },
                    log: "Coming back from the river, @people.name brings back @give.",
                    order: 60
                },
                well: {
                    name: "draw water",
                    desc: "Get some water from our well.",
                    time: 2,
                    energy: 15,
                    give: function () {
                        var draw = 0;
                        if (this.buildings.has(data.buildings.small.well.id)) {
                            draw = random(1, 3);
                        }
                        else if (this.buildings.has(data.buildings.big.pump.id)) {
                            draw = random(5, 7);
                        } // shouldn't have other case

                        return [
                            [round(draw), data.resources.gatherable.common.water]
                        ];
                    },
                    log: "Using our well, @people.name get @give.",
                    order: 60
                }
            },
            harvest: {
                name: "harvest crops",
                desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
                time: function () {
                    var nbCrops = this.buildings.get(data.buildings.small.plot.id).number;
                    return 4 + nbCrops;
                },
                consume: function () {
                    return [
                        [1, data.resources.gatherable.common.water]
                    ];
                },
                give: function () {
                    var nbCrops = this.buildings.get(data.buildings.small.plot.id).number;
                    return [
                        [round(random(1.5 * nbCrops, 2 * nbCrops)), data.resources.gatherable.common.food]
                    ];
                },
                log: "Our crops produce @give.",
                order: 70
            },
            sleep: {
                name: "sleep",
                desc: "Get some rest to restore energy.",
                time: 9,
                energy: 0,
                give: function (action) {
                    action.owner.updateEnergy(100);
                    return [];
                },
                unlock: function () {
                    return [
                        data.actions.heal
                    ];
                },
                log: "@people.name feels well rested now.",
                order: 5
            },
            heal: {
                name: "heal",
                desc: "\"I really hope those pills are still good.\"",
                time: 2,
                energy: 1,
                consume: function () {
                    return [
                        [2, data.resources.gatherable.rare.medication]
                    ];
                },
                give: function (action, effect) {
                    var lifeChange = 99;
                    if (!this.buildings.has(data.buildings.small.pharmacy.id) && random() < 2 / 5) {
                        lifeChange = -15;
                        effect.wasBad = true;
                    }
                    action.owner.updateLife(lifeChange);
                    return [];
                },
                log: function (effect) {
                    if (effect.wasBad) {
                        return "After feeling not so well, @people.name realise taking these pills" +
                            "took a hit on his health.";
                    }
                    else {
                        return "This time, it actually improve @people's health.";
                    }
                },
                order: 6
            },
            project: {
                name: "project",
                desc: "Prepare in order to craft an object.",
                time: 2,
                energy: 20,
                give: function (action) {
                    action.owner.prepareProject(randomize(this.unlockedCraftables()));
                    return [];
                },
                unlock: function () {
                    return [
                        data.actions.make
                    ];
                }
            },
            make: {
                name: function (action) {
                    return "make " + an(action.owner.project.name);
                },
                desc: "Now that all is ready, craft what we need.",
                time: function () {
                    var time = data.actions.craft.time;
                    return isFunction(time) ? time() : time;
                },
                consume: function (action) {
                    var consume = [];
                    if (isFunction(action.owner.project.consume)) {
                        consume.push.apply(consume, action.owner.project.consume(action));
                    }
                    return consume;
                },
                lock: function (action) {
                    var lock = [action.data];
                    if (isFunction(action.owner.project.lock)) {
                        lock.push.apply(lock, action.owner.project.lock(action));
                    }
                    return lock;
                },
                unlock: function (action) {
                    var unlock = [];
                    if (isFunction(action.owner.project.unlock)) {
                        unlock.push.apply(unlock, action.owner.project.unlock(action));
                    }
                    return unlock;
                },
                log: "@people.name successfully made @give."
            },
            exchange: {
                name: "exchange",
                desc: "",
                time: 7,
                energy: 20,
                consume: function () {
                    return [
                        [2, data.resources.craftable.complex.jewelry]
                    ];
                },
                give: function () {
                    var possible = Object.assign({}, data.resources.craftable.basic, data.resources.craftable.complex);
                    delete possible.jewelry;
                    return randomizeMultiple(possible, "2-3");
                }
            },
            launch: {
                name: "launch",
                desc: "",
                time: 12,
                energy: 30,
                isOut: 1,
                consume: function () {
                    return [
                        [10, data.resources.gatherable.uncommon.oil]
                    ];
                },
                give: function () {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.WIN);
                    return [];
                }
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
                    log: "",
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
                    log: "",
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
                    log: "",
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
                    log: "",
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
                    log: "",
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
                }
            },
            medium: {
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
        },
        /***** PERKS *****/
        perks: {
            dropRate: 0.1,
            first: {
                name: "first-one",
                desc: "The very first one to install the settlement.",
                actions: function () {
                    return [
                        data.actions.settle.id
                    ];
                },
                iteration: 0
            },
            rookie: {
                name: "rookie",
                desc: "All group has a rookie, all @people.nominative want is to prove @people.nominative's efficient.",
                condition: function () {
                    return this.people.length > 2;
                },
                effect: function (action) {
                    action.time = (isFunction(action.time) ? action.time() : action.time) * 0.95;
                }
            },
            explorer: {
                name: "gadabout",
                desc: "",
                actions: function () {
                    return [
                        data.actions.roam.id,
                        data.actions.scour.id,
                        data.actions.explore.id
                    ];
                },
                iteration: 50,
                effect: function (action) {
                    var give = isFunction(action.give) && action.give();
                    give.push(randomize(data.resources.gatherable, "1-2"));
                }
            },
            tinkerer: {
                name: "tinkerer",
                desc: "",
                actions: function () {
                    return [
                        data.actions.craft.id,
                        data.actions.build.id,
                        data.actions.make.id
                    ];
                },
                iteration: 50,
                effect: function (action) {
                }
            },
            healer: {
                name: "doctor",
                desc: "Knowing enough about medecine make @people.accusative confident to heal others.",
                actions: function () {
                    return [
                        data.actions.heal.id
                    ];
                },
                condition: function () {
                    return this.buildings.has(data.buildings.small.pharmacy.id);
                },
                iteration: 5,
                effect: function (action) {
                    var people = this.people;
                    action.give = function () {
                        var lowest = null;
                        people.forEach(function (p) {
                            if (!lowest || p.life < lowest.life) {
                                lowest = p;
                            }
                        });
                        lowest.updateLife(99);
                        return [];
                    };
                }
            },
            harvester: {
                name: "harvester",
                desc: "",
                actions: function () {
                    return [
                        data.actions.gather.id,
                        data.actions.harvest.id,
                        data.actions.drawFrom.river.id,
                        data.actions.drawFrom.well.id
                    ];
                },
                iteration: 70,
                effect: function () {
                }
            },
            lounger: {
                name: "lounger",
                desc: "",
                actions: function () {
                    return [
                        data.actions.sleep
                    ];
                },
                condition: function (person) {
                    return person.stats.idle / time.week;
                },
                effect: function () {
                }
            },
            merchant: {
                name: "merchant",
                desc: "",
                action: function () {
                    return [
                        data.actions.exchange
                    ];
                },
                iteration: 10,
                effect: function (action) {
                    action.consume = function () {
                        return [
                            [1, data.resources.craftable.complex.jewelry]
                        ];
                    };
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

