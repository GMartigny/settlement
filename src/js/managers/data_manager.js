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

    /**
     * @typedef {String} ID - A generated unique ID
     */
    /**
     * @typedef {Object} Data
     * @param {ID} id - unique ID
     * @param {String|function} name - The displayed name
     * @param {String|Function} desc - A description for tooltip
     * @param {Number} [order] - Order for display
     */
    /**
     * @typedef {Object} ConsumerData
     * @param {Function} [consume] - Return consumed resources
     */
    /**
     * @typedef {Object} ResourceData
     * @extends Data
     * @param {String} icon - Icon image of the resource
     * @param {Number} dropRate - Chance of getting it
     */
    /**
     * @typedef {Object} CraftableData
     * @extends ResourceData
     * @extends ConsumerData
     */
    /**
     * @typedef {Object} ActionData
     * @extends Data
     * @extends ConsumerData
     * @param {Function} [options] - Return an array of options for this action
     * @param {Function} [condition] - Return true if can be done
     * @params {Function} [give] - Return an array of given resources
     * @param {Function} [unlock] - Return an array of unlocked action for this person
     * @param {Function} [lock] - Return an array of locked action for this person
     * @param {Function} [build] - Return an array of built buildings id
     * @param {Number|Function} [time=0] - In game time to do
     * @param {Number} [timeDelta=0] - Added randomness to time
     * @param {Number|Function} [energy=time*5] - Energy taken to do
     * @param {Array<Number>} [giveSpan] - Span of randomness for give
     * @param {String} log - A log string to display when done
     */
    /**
     * @typedef {Object} BuildingData
     * @extends ActionData
     * @param {Function} [unlock] - Return an array of unlocked action for all people
     * @param {Function} [lock] - Return an array of locked action for all people
     * @param {Function} [upgrade] - Return a building ID to upgrade
     * @param {String} asset - Id of the graphical asset
     */
    /**
     * @typedef {Object} EventData
     * @extends ActionData
     * @param {String} asset - Id of the graphical asset
     * @param {Number} dropRate - Chance of getting it
     */
    // jscs:disable jsDoc
    var data = {
        /***** RESOURCES *****/
        resources: {
            /***** GATHERABLES *****/
            gatherables: {
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
                        icon: "metal-scraps",
                        dropRate: 100,
                        order: 40
                    }
                },
                uncommon: { // drop rate between 80 and 20
                    plastic: {
                        name: "nuts and bolts",
                        desc: "Little metal nuts and bolts to fasten anything in place.",
                        icon: "nuts-and-bolts",
                        dropRate: 70,
                        order: 50
                    },
                    sand: {
                        name: "sand",
                        desc: "Just pure fine sand.",
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
                        icon: "medications",
                        dropRate: 5,
                        order: 70
                    },
                    electronic: {
                        name: "electronics",
                        desc: "Some basic micro-electronics components.",
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
                        desc: "A rough uncut gem of quartz. Quite valuable.",
                        icon: "gem",
                        dropRate: 0.1,
                        order: 77
                    }
                }
            },
            /***** CRAFTABLES *****/
            craftables: {
                basic: { // Max 2 gatherables, no more than uncommon
                    stone: {
                        name: "smooth stone",
                        desc: "A round and well polish stone.",
                        icon: "stone",
                        consume: function () {
                            return [
                                [3, data.resources.gatherables.common.rock]
                            ];
                        },
                        dropRate: 100,
                        order: 90
                    },
                    glass: {
                        name: "glass pane",
                        desc: "A see-through building component.",
                        icon: "glass-pane",
                        condition: function () {
                            return this.buildings.has(data.buildings.small.furnace.id);
                        },
                        consume: function () {
                            return [
                                [4, data.resources.gatherables.uncommon.sand]
                            ];
                        },
                        dropRate: 60,
                        order: 100
                    },
                    component: {
                        name: "component",
                        desc: "Some mechanical parts for others craftables.",
                        icon: "pipes-large",
                        consume: function () {
                            return [
                                [2, data.resources.gatherables.common.scrap],
                                [2, data.resources.gatherables.uncommon.plastic]
                            ];
                        },
                        dropRate: 120,
                        order: 110
                    },
                    tool: {
                        name: "tool",
                        desc: "The base for any tinkerer.",
                        icon: "tools",
                        consume: function () {
                            return [
                                [1, data.resources.craftables.basic.component],
                                [2, data.resources.gatherables.common.rock]
                            ];
                        },
                        dropRate: 90,
                        order: 111
                    }
                },
                complex: { // At least 2 requirements with 1 craftables
                    brick: {
                        name: "brick",
                        desc: "Bricks will give walls for larger constructions.",
                        icon: "brick",
                        condition: function () {
                            return this.buildings.has(data.buildings.small.well.id);
                        },
                        consume: function () {
                            return [
                                [1, data.resources.craftables.basic.stone],
                                [1, data.resources.craftables.basic.tool]
                            ];
                        },
                        dropRate: 80,
                        order: 112
                    },
                    circuit: {
                        name: "circuit",
                        desc: "That's a little rough, but it's actually a functioning circuit board.",
                        icon: "electronic-circuit-board",
                        consume: function () {
                            return [
                                [1, data.resources.gatherables.common.scrap],
                                [2, data.resources.craftables.basic.component],
                                [3, data.resources.gatherables.rare.electronic]
                            ];
                        },
                        dropRate: 60,
                        order: 114
                    },
                    metalPipe: {
                        name: "metal pipe",
                        desc: "Pipes that you forge from junk metal.",
                        icon: "pipes-small",
                        condition: function () {
                            return this.buildings.has(data.buildings.medium.forge.id);
                        },
                        consume: function () {
                            return [
                                [4, data.resources.gatherables.common.scrap],
                                [1, data.resources.craftables.basic.tool]
                            ];
                        },
                        dropRate: 80,
                        order: 115
                    },
                    furniture: {
                        name: "furniture",
                        desc: "A proper settlement needs better than pile of trash for table and seats.",
                        icon: "glass-table",
                        consume: function () {
                            return [
                                [2, data.resources.craftables.basic.glass],
                                [2, data.resources.craftables.complex.metalPipe]
                            ];
                        },
                        dropRate: 40,
                        order: 116
                    }
                },
                advanced: { // At least 3 requirements with 2 craftables (and more)
                    jewelry: {
                        name: "jewelry",
                        desc: "A really beautiful ornament you could use for trading.",
                        icon: "jewelry",
                        condition: function () {
                            return this.buildings.has(data.buildings.small.furnace.id);
                        },
                        consume: function () {
                            return [
                                [4, data.resources.gatherables.rare.electronic],
                                [3, data.resources.gatherables.special.quartz]
                            ];
                        },
                        dropRate: 40,
                        order: 117
                    },
                    engine: {
                        name: "engine",
                        desc: "Amazing what you manage to do with all those scraps !",
                        icon: "engine",
                        condition: function () {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        consume: function () {
                            return [
                                [10, data.resources.gatherables.uncommon.oil],
                                [5, data.resources.craftables.basic.tool],
                                [5, data.resources.craftables.complex.metalPipe]
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
                                [10, data.resources.craftables.basic.component],
                                [7, data.resources.craftables.basic.tool],
                                [3, data.resources.craftables.complex.circuit]
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
            consumption: {
                water: 1 / time.day,
                food: 1 / time.day
            },
            needs: function (flags) {
                var waterNeed = data.people.consumption.water * (flags.drought ? 2 : 1);
                return [
                    [waterNeed, data.resources.gatherables.common.water, "thirsty"],
                    [data.people.consumption.food, data.resources.gatherables.common.food, "starving"]
                ];
            },
            dropRate: 0.005
        },
        /***** BUILDINGS *****/
        buildings: {
            small: {
                forum1: {
                    name: "forum",
                    desc: "",
                    time: 1,
                    consume: function () {
                        return [
                            []
                        ];
                    },
                    asset: "forum+1",
                    log: ""
                },
                furnace: {
                    name: "furnace",
                    desc: "Survival require to craft as much as gather things.",
                    time: 7,
                    consume: function () {
                        return [
                            [8, data.resources.gatherables.common.rock],
                            [3, data.resources.gatherables.uncommon.oil]
                        ];
                    },
                    asset: "furnace",
                    log: "A small furnace can smelt small things like sand or little electronic."
                },
                plot: {
                    name: "farm plot",
                    desc: "A little arranged plot of soil to grow some food.",
                    time: 12,
                    consume: function () {
                        return [
                            [5, data.resources.gatherables.common.food],
                            [10, data.resources.gatherables.uncommon.sand]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.harvest.id
                        ];
                    },
                    asset: "plot",
                    log: "More crops required more care but that's going to help us keeping a constant stock of food."
                },
                pharmacy: {
                    name: "pharmacy",
                    desc: "\"Maybe we should avoid letting medications rot in plain sunlight ?!\"",
                    time: 6,
                    consume: function () {
                        return [
                            [5, data.resources.gatherables.rare.medication],
                            [4, data.resources.craftables.basic.component]
                        ];
                    },
                    asset: "pharmacy",
                    log: "Sorting our medications should prevent further mistakes and bad reaction."
                },
                well: {
                    name: "well",
                    desc: "Just a large hole into the ground.",
                    time: 16,
                    condition: function () {
                        return !this.buildings.has(data.buildings.big.pump.id);
                    },
                    consume: function () {
                        return [
                            [10, data.resources.craftables.basic.stone],
                            [3, data.resources.craftables.basic.tool]
                        ];
                    },
                    give: function () {
                        return [
                            [5, data.resources.gatherables.common.water]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.drawFrom.well
                        ];
                    },
                    lock: function () {
                        return [
                            data.actions.drawFrom.river.id
                        ];
                    },
                    asset: "well",
                    log: "Drawing water from the ground should allow to further polish stone into bricks."
                }
            },
            medium: {
                forge: {
                    name: "forge",
                    desc: "A good upgrade to the furnace.",
                    time: 10,
                    consume: function () {
                        return [
                            [5, data.resources.gatherables.uncommon.oil],
                            [10, data.resources.craftables.basic.stone],
                            [2, data.resources.craftables.basic.tool]
                        ];
                    },
                    upgrade: function () {
                        return data.buildings.small.furnace.id;
                    },
                    asset: "furnace+1",
                    log: "We can now work metal better and make more complex part."
                },
                plot2: {
                    name: "field",
                    desc: "",
                    consume: function () {
                        return [
                            [10, data.resources.gatherables.common.water]
                        ];
                    },
                    upgrade: function () {
                        return data.buildings.small.plot.id;
                    },
                    unlock: function () {
                        return [
                            data.actions.harvest
                        ];
                    },
                    asset: "plot+1",
                    log: ""
                }
            },
            big: {
                workshop: {
                    name: "workshop",
                    desc: "Organizing your workforce make them more efficient at crafting.",
                    time: 3 * time.day,
                    energy: 90,
                    condition: function () {
                        return this.buildings.has(data.buildings.small.furnace.id);
                    },
                    consume: function () {
                        return [
                            [6, data.resources.gatherables.common.scrap],
                            [5, data.resources.craftables.basic.glass],
                            [10, data.resources.craftables.basic.tool],
                            [15, data.resources.craftables.complex.brick]
                        ];
                    },
                    give: function () {
                        return [];
                    },
                    asset: "workshop",
                    log: "Good organisation allow you to prepare project and do much more complex crafting."
                },
                radio: {
                    name: "radio-station",
                    desc: "Broadcasting could finally bring us some help.",
                    time: 6,
                    energy: 60,
                    condition: function () {
                        return this.buildings.has(data.buildings.big.workshop.id);
                    },
                    consume: function () {
                        return [
                            [4, data.resources.craftables.complex.circuit],
                            [1, data.resources.craftables.advanced.computer]
                        ];
                    },
                    asset: "radio-station",
                    log: "\"Message received. We thought no one survive the crash. Glad you still have the cube." +
                        "Unfortunately we can't risk being located, bring it to sent position. Over.\""
                },
                pump: {
                    name: "water pump",
                    desc: "A buried contraption that collect water from the earth moisture.",
                    time: 3 * time.day,
                    energy: 120,
                    consume: function () {
                        return [
                            [20, data.resources.craftables.basic.stone],
                            [5, data.resources.craftables.complex.metalPipe],
                            [1, data.resources.craftables.advanced.engine]
                        ];
                    },
                    upgrade: function () {
                        return data.buildings.small.well.id;
                    },
                    unlock: function () {
                        return [data.actions.drawFrom.well];
                    },
                    asset: "pump",
                    log: "A big upgrade to your well ! Now we have a continuous flow of water coming."
                },
                trading: {
                    name: "trading post",
                    desc: "Since the radio station bring a handful of merchant, better take advantage of it.",
                    time: time.day,
                    energy: 70,
                    condition: function () {
                        return this.buildings.has(data.buildings.big.radio.id) &&
                            this.resources.has(data.resources.craftables.complex.jewelry);
                    },
                    consume: function () {
                        return [
                            [2, data.resources.craftables.basic.glass],
                            [10, data.resources.craftables.complex.brick],
                            [2, data.resources.craftables.complex.furniture]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.exchange
                        ];
                    },
                    asset: "trading-post",
                    log: "Arranging some space allow us to trade with merchant caravan passing by."
                },
                module: {
                    name: "module",
                    desc: "With that, we can finally deliver the cube to security.",
                    time: time.week,
                    energy: 100,
                    condition: function () {
                        return this.buildings.has(data.buildings.big.radio.id);
                    },
                    consume: function () {
                        return [
                            [15, data.resources.gatherables.uncommon.oil],
                            [3, data.resources.craftables.complex.furniture],
                            [1, data.resources.craftables.advanced.computer],
                            [2, data.resources.craftables.advanced.engine]
                        ];
                    },
                    unlock: function () {
                        return [
                            data.actions.launch
                        ];
                    },
                    asset: "module",
                    log: "What a journey, but there we are. We build so many things and explore lots of places.<br/>" +
                    "Now it's time to end it all !"
                }
            },
            special: {
                wreckage: {
                    name: "wreckage",
                    desc: "Remainings of space-ships.",
                    asset: "wreckage",
                    log: ""
                },
                forum: {
                    name: "forum",
                    desc: "The center and start of our settlement.",
                    unlock: function () {
                        return [
                            data.actions.sleep
                        ];
                    },
                    upgrade: function () {
                        return data.buildings.special.wreckage.id;
                    },
                    give: function () {
                        return [
                            [1, data.resources.room]
                        ];
                    },
                    asset: "forum",
                    log: ""
                }
            }
        },
        /***** ACTIONS *****/
        actions: {
            wakeUp: {
                name: "wake up",
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
                time: 1,
                energy: 0,
                give: function () {
                    TimerManager.timeout(function () {
                        MessageBus.notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, "We need a shelter.");
                    }, 1000);
                    return [
                        [10, data.resources.gatherables.common.water],
                        [8, data.resources.gatherables.common.food],
                        [2, data.resources.craftables.basic.component]
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
                time: 1,
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
                giveSpan: [3, 6],
                give: function (action, option) {
                    return [ // FIXME tmp
                        [round(random.apply(null, action.data.giveSpan)), option]
                    ];
                },
                options: function () {
                    var possibles = [];
                    data.resources.gatherables.deepBrowse(function (resource) {
                        possibles.push(resource);
                    });
                    return possibles;
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
                        [2, data.resources.gatherables.common.water]
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
                        return [action.data.id];
                    }
                    else {
                        return [];
                    }
                },
                giveSpan: [1, 3],
                give: function (action) {
                    var give = randomizeMultiple(data.resources.gatherables, action.data.giveSpan);
                    if (random() < data.resources.gatherables.special.ruins.dropRate) {
                        give.push([1, data.resources.gatherables.special.ruins]);
                        var location = randomize(data.locations.near);
                        this.knownLocations.push(location);
                        effect.location = an(location.name);
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
                        [2, data.resources.gatherables.common.water]
                    ];
                },
                giveSpan: [2, 4],
                give: function (action, option, effect) {
                    var give = randomize(data.resources.gatherables, action.data.giveSpan);
                    // Add 50% chance for ruins (or 100% if explorer)
                    var baseDropRate = data.resources.gatherables.special.ruins.dropRate;
                    var isExplorer = action.owner.perk && action.owner.perk.id === data.perks.explorer;
                    var modifier = isExplorer ? 1 : 0.5;
                    if (random() < (baseDropRate + (1 - baseDropRate) * modifier)) {
                        give.push([1, data.resources.gatherablse.special.ruins]);
                        var location = randomize(isExplorer ? data.locations.epic : data.locations.far);
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
                desc: "Remember that location we saw the other day ? Let's see what we can find there.",
                time: 2 * time.day,
                energy: 110,
                isOut: 1,
                consume: function () {
                    return [
                        [4, data.resources.gatherables.common.water],
                        [1, data.resources.gatherables.common.food],
                        [1, data.resources.gatherables.special.ruins]
                    ];
                },
                giveSpan: [5, 9],
                give: function (action) {
                    var location = this.knownLocations.random();
                    // remember it for log
                    action.location = location;
                    return randomizeMultiple(location.give(), action.data.giveSpan);
                },
                log: function (effect, action) {
                    // log using location's data
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
                options: function () {
                    return this.unlockedCraftables();
                },
                give: function (action, option) {
                    return option;
                },
                log: function () {
                    return "@people.name succeeds to craft @give.";
                },
                order: 30
            },
            build: {
                name: "build",
                desc: "Put together some materials to come up with what looks like a building.",
                build: function (action, option) {
                    return option;
                },
                options: function () {
                    return this.possibleBuildings();
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
                    giveSpan: [2, 6],
                    give: function (action) {
                        return [
                            [round(random.apply(null, action.data.giveSpan)), data.resources.gatherables.common.water]
                        ];
                    },
                    log: "Coming back from the river, @people.name brings @give with @people.accusative.",
                    order: 60
                },
                well: {
                    name: "draw water",
                    desc: "Get some water from our well.",
                    time: 2,
                    energy: 15,
                    giveSpan: [1, 3],
                    give: function (action) {
                        var hasPump = this.buildings.has(data.buildings.big.pump.id);
                        var draw = random.apply(null, action.data.giveSpan) + (hasPump ? 4 : 0);

                        return [
                            [round(draw), data.resources.gatherables.common.water]
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
                    var hasField = this.buildings.has(data.buildings.medium.plot2.id);
                    return hasField ? 6 : 4;
                },
                consume: function () {
                    var hasField = this.buildings.has(data.buildings.medium.plot2.id);
                    return [
                        [hasField ? 3 : 2, data.resources.gatherables.common.water]
                    ];
                },
                giveSpan: [1.5, 2], // [3, 4] with field
                give: function (action) {
                    var hasField = this.buildings.has(data.buildings.medium.plot2.id);
                    var rand = random.apply(null, action.giveSpan) * (hasField ? 2 : 1);
                    return [
                        [round(rand), data.resources.gatherables.common.food]
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
                        [2, data.resources.gatherables.rare.medication]
                    ];
                },
                give: function (action, effect) {
                    var lifeChange = 99;
                    if (!this.buildings.has(data.buildings.small.pharmacy.id) && random() < 2 / 5) {
                        lifeChange = -10;
                        // remember for log
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
            exchange: {
                name: "exchange",
                desc: "Caravan passing by carry lots of useful stuff, let's see what's possible to trade.",
                time: 7,
                energy: 20,
                consume: function () {
                    return [
                        [2, data.resources.craftables.complex.jewelry]
                    ];
                },
                giveSpan: [2, 3],
                give: function (action) {
                    var possible = {
                        basic: data.resources.craftables.basic,
                        complex: data.resources.craftables.complex
                    };
                    return randomizeMultiple(possible, action.data.giveSpan);
                },
                log: "@people.name manage to trade a couple of jewelries for @give."
            },
            launch: {
                name: "launch",
                desc: "",
                time: 12,
                energy: 30,
                isOut: 1,
                consume: function () {
                    return [
                        [10, data.resources.gatherables.uncommon.oil]
                    ];
                },
                give: function () {
                    MessageBus.notify(MessageBus.MSG_TYPES.WIN);
                    return [];
                },
                log: function () {
                    return "After " + this.getSurvivalDuration() + ", you finally leave this damn crash-site.<br/>" +
                        "You have to leave everyone behind. You make a promise to yourself to come back " +
                        "as soon as you can.";
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
                            data.resources.gatherables.common.rock,
                            data.resources.gatherables.common.scrap,
                            data.resources.craftables.basic.component
                        ];
                    },
                    log: "That was hard to climb those mountains, but at least @people find @give.",
                    dropRate: 90
                },
                desert: {
                    name: "desert",
                    give: function () {
                        return [
                            data.resources.gatherables.common.scrap,
                            data.resources.gatherables.uncommon.oil,
                            data.resources.gatherables.uncommon.sand
                        ];
                    },
                    log: "Dunes everywhere give a felling of hopelessness. Anyway, here's @give for the stock.",
                    dropRate: 100
                },
                supermarket: {
                    name: "hangar",
                    give: function () {
                        return [
                            data.resources.gatherables.common.food,
                            data.resources.gatherables.rare.medication,
                            data.resources.craftables.basic.glass
                        ];
                    },
                    log: "Quite easy to loot, but full of dangers too. " +
                        "Hopefully, @people.name return safely and got @give.",
                    dropRate: 80
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
                            data.resources.gatherables.common.water,
                            data.resources.gatherables.uncommon.plastic,
                            data.resources.craftables.basic.stone
                        ];
                    },
                    log: "It's nice by the river, @people.name found @give.",
                    dropRate: 40
                },
                ruin: {
                    name: "old ruin",
                    give: function () {
                        return [
                            data.resources.gatherables.rare.electronic,
                            data.resources.craftables.basic.component,
                            data.resources.craftables.basic.tool
                        ];
                    },
                    log: "Amazing no-one get lost in those caves to get @give.",
                    dropRate: 60
                }
            },
            epic: {
                building: {
                    name: "abandoned building",
                    give: function () {
                        return [
                            data.resources.gatherables.rare.medication,
                            data.resources.craftables.basic.glass,
                            data.resources.craftables.complex.circuit
                        ];
                    },
                    log: "No-one could guess what that building was, but it sure was interesting. " +
                        "@people.name find @give.",
                    dropRate: 30
                },
                spaceship: {
                    name: "spaceship wreck",
                    give: function () {
                        return [
                            data.resources.gatherables.rare.electronic,
                            data.resources.craftables.basic.tool,
                            data.resources.craftables.complex.furniture
                        ];
                    },
                    log: "What a chance to find a wreckage with not melted stuff inside. It was possible to get @give.",
                    dropRate: 20
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
                    timeDelta: 4,
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
                    log: "A harsh drought has fall, water will be more important than ever."
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
                desc: "The veteran of the camp and leader of the exploration. " +
                    "@people.nominative knows the best spot of resources.",
                actions: function () {
                    return [
                        data.actions.roam.id,
                        data.actions.scour.id,
                        data.actions.explore.id
                    ];
                },
                iteration: 30,
                effect: function (action) {
                    // Always find epic locations
                    // And get an extras when exploring
                    if (action.id === data.actions.explore.id) {
                        var extra = 2;
                        action.giveSpan.map(function (value) {
                            return value + extra;
                        });
                    }
                }
            },
            tinkerer: {
                name: "tinkerer",
                desc: "",
                actions: function () {
                    return [
                        data.actions.craft.id,
                        data.actions.build.id
                    ];
                },
                iteration: 50,
                effect: function (action) {
                    // Really quick to make things
                    action.time = (isFunction(action.time) ? action.time() : action.time) * 0.6;
                }
            },
            healer: {
                name: "doctor",
                desc: "Knowing enough about medicine make @people.accusative confident to heal others.",
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
                effect: function (action) {
                    var ratio = 1.5;
                    action.giveSpan = action.giveSpan.map(function (value) {
                        return value * ratio;
                    });
                }
            },
            lounger: {
                name: "lounger",
                desc: "Doing nothing all day's not gonna make things done.",
                actions: function () {
                    return [
                        data.actions.sleep
                    ];
                },
                condition: function (person) {
                    return person.stats.idle / (3 * time.day);
                },
                effect: function (action) {
                    // Won't use energy while idle
                    // Sleep longer
                    action.time = (isFunction(action.time) ? action.time() : action.time) * 1.2;
                }
            },
            merchant: {
                name: "merchant",
                desc: "The ancient art of trading have been one of the most important skill you could have.",
                action: function () {
                    return [
                        data.actions.exchange
                    ];
                },
                iteration: 10,
                effect: function (action) {
                    action.consume = function () {
                        return [
                            [1, data.resources.craftables.complex.jewelry]
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

