"use strict";
/* exported DataManager */

/**
 * Data holder
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
     * @prop {String|Function} name - The displayed name
     * @prop {String|Function} [desc] - A description for tooltip
     */
    /**
     * @typedef {Object} UniqueData
     * @extends Data
     * @prop {ID} id - unique ID
     * @prop {Number} [order] - Order for display
     */
    /**
     * @typedef {Object} ConsumerData
     * @prop {Function} consume - Return consumed resources
     */
    /**
     * @typedef {Object} ResourceData
     * @extends UniqueData
     * @prop {String} icon - Icon image of the resource
     * @prop {Number} dropRate - Chance of getting it
     */
    /**
     * @typedef {Object} CraftableData
     * @extends ResourceData
     * @extends ConsumerData
     */
    /**
     * @typedef {Object} ActionData
     * @extends UniqueData
     * @extends ConsumerData
     * @prop {Function} [options] - Return an array of options for this action
     * @prop {Function} [condition] - Return true if can be done
     * @prop {Function} [give] - Return an array of given resources (can be replace by giveSpan and giveList combo)
     * @prop {Array<Number>} [giveSpan] - Span of randomness for give
     * @prop {Object} [giveList] - List to draw from for give
     * @prop {Function} [unlock] - Return an array of unlocked action for this person
     * @prop {Function} [lock] - Return an array of locked action for this person
     * @prop {Function} [build] - Return an array of built buildings id
     * @prop {Number|Function} [time=0] - In game time to do
     * @prop {Number} [timeDelta=0] - Added randomness to time (from -x to +x)
     * @prop {Number} [timeBonus=0] - From 0 to 1, a ratio for action duration (set to 1 and action time is 0)
     * @prop {Number|Function} [energy=time*5] - Energy taken to do
     * @prop {String} log - A log string to display when done
     */
    /**
     * @typedef {Object} BuildingData
     * @extends ActionData
     * @prop {Function} [unlock] - Return an array of unlocked action for all people
     * @prop {Function} [lock] - Return an array of locked action for all people
     * @prop {Function} [upgrade] - Return a building ID to upgrade
     * @prop {String} asset - Id of the graphical asset
     */
    /**
     * @typedef {Object} EventData
     * @extends ActionData
     * @prop {String} asset - Id of the graphical asset
     * @prop {Number} dropRate - Chance of getting it
     */
    /**
     * @typedef {Object} PerkData
     * @extends UniqueData
     * @prop {Function} actions - Return the list of actions
     * @prop {Number} [iteration=0] - Number of time it take to have a 100% chance to get the perk
     * @prop {Function} [effect] -
     */

    var data = {
        resources: {
            gatherables: {
                common: {},
                uncommon: {},
                rare: {},
                special: {}
            },
            craftables: {
                basic: {},
                complex: {},
                advanced: {}
            }
        },
        buildings: {
            small: {},
            medium: {},
            big: {},
            special: {}
        },
        actions: {},
        locations: {
            near: {},
            far: {},
            epic: {}
        },
        events: {
            easy: {},
            medium: {},
            hard: {}
        },
        perks: {}
    };

    /* eslint-disable valid-jsdoc */

    data.resources.room = {
        id: "rom",
        name: "room",
        desc: "A place for someone in the camp.",
        icon: "person",
        order: 0
    };

    /** GATHERABLES COMMON **/

    data.resources.gatherables.common.water = {
        id: "wtr",
        name: "water",
        desc: "Water is definitely important to survive in this harsh environment.",
        icon: "water-bottle",
        dropRate: 100,
        order: 10
    };
    data.resources.gatherables.common.food = {
        id: "fod",
        name: "food",
        desc: "Everyone need food to keep his strength.",
        icon: "foodcan",
        dropRate: 90,
        order: 20
    };
    data.resources.gatherables.common.rock = {
        id: "rck",
        name: "rock",
        desc: "\"There's rocks everywhere ! Why would you bring this back ?\"",
        icon: "rock",
        dropRate: 100,
        order: 30
    };
    data.resources.gatherables.common.scrap = {
        id: "scp",
        name: "scrap metal",
        desc: "An old rusty piece of metal.",
        icon: "metal-scraps",
        dropRate: 90,
        order: 40
    };

    data.people = {
        id: "plp",
        name: "people",
        desc: "The workforce and the bane of you camp.",
        needs: [
            [1.2 / time.day, data.resources.gatherables.common.water, "thirsty"],
            [1 / time.day, data.resources.gatherables.common.food, "starving"]
        ],
        dropRate: 0.1
    };

    /** GATHERABLES UNCOMMON **/

    data.resources.gatherables.uncommon.bolts = {
        id: "blt",
        name: "nuts and bolts",
        desc: "Little metal nuts and bolts to fasten anything in place.",
        icon: "nuts-and-bolts",
        dropRate: 70,
        order: 50
    };
    data.resources.gatherables.uncommon.sand = {
        id: "snd",
        name: "sand",
        desc: "Just pure fine sand.",
        icon: "sand-pile",
        dropRate: 40,
        order: 55
    };
    data.resources.gatherables.uncommon.oil = {
        id: "oil",
        name: "fuel",
        desc: "About a liter of gas-oil.",
        icon: "jerrycan",
        dropRate: 10,
        order: 60
    };

    /** GATHERABLES RARE **/

    data.resources.gatherables.rare.medication = {
        id: "mct",
        name: "medication",
        desc: "An unlabeled medication, hope it's still good.",
        icon: "medications",
        dropRate: 7,
        order: 70
    };
    data.resources.gatherables.rare.electronic = {
        id: "elc",
        name: "electronics",
        desc: "Some basic micro-electronics components.",
        icon: "electronic-parts",
        dropRate: 10,
        order: 75
    };

    /** GATHERABLES SPECIAL **/

    data.resources.gatherables.special.ruins = {
        id: "run",
        name: "location",
        desc: "Directions to a point of interest we found earlier.",
        icon: "map",
        order: 80,
        dropRate: 0.6
    };
    data.resources.gatherables.special.quartz = {
        id: "qtz",
        name: "quartz cristal",
        desc: "A rough uncut gem of quartz. Quite valuable.",
        icon: "gem",
        dropRate: 0.1,
        order: 77
    };

    data.resources.craftables.basic.component = {
        id: "cmp",
        name: "component",
        desc: "Some mechanical parts for others craftables.",
        icon: "pipes-large",
        consume: [
            [2, data.resources.gatherables.common.scrap],
            [2, data.resources.gatherables.uncommon.bolts]
        ],
        dropRate: 120,
        order: 110
    };


    /** BUILDINGS SPECIAL **/

    data.buildings.special.wreckage = {
        id: "wrk",
        name: "wreckage",
        desc: "Remainings of space-ships.",
        asset: "wreckage"
    };

    /***** ACTIONS *****/

    data.actions.launch = {
        id: "lnc",
        name: "launch",
        desc: "Finally set off this module to get out of that damn wasteland.",
        time: 12,
        energy: 30,
        isOut: 1,
        unique: true,
        consume: [
            [10, data.resources.gatherables.uncommon.oil]
        ],
        effect: function () {
            MessageBus.notify(MessageBus.MSG_TYPES.WIN, this.getSettledTime());
        },
        log: function () {
            return "After " + this.getSurvivalDuration() + ", you finally leave this damn crash-site.<br/>" +
                "You have to leave everyone behind. You make a promise to yourself to come back " +
                "as soon as you can.";
        },
        order: 15
    };
    data.actions.exchange = {
        id: "exc",
        name: "exchange",
        desc: "Caravan passing by carry lots of useful stuff, let's see what's possible to trade.",
        time: 7,
        energy: 20,
        consume: [
            [2, data.resources.craftables.complex.jewelry]
        ],
        giveSpan: [2, 3],
        giveList: {
            basic: data.resources.craftables.basic,
            complex: data.resources.craftables.complex
        },
        log: "@people.name manage to trade a couple of jewelries for @give.",
        order: 10
    };
    data.actions.nurse = {
        id: "nrs",
        name: "nurse",
        desc: "Look after the health of the most needed one.",
        time: 2,
        energy: 1,
        consume: [
            [2, data.resources.gatherables.rare.medication]
        ],
        effect: function (actio, option, effect) {
            var lowest = null;
            this.people.forEach(function (p) {
                if (!lowest || p.life < lowest.life) {
                    lowest = p;
                }
            });
            lowest.updateLife(99);
            effect.cured = lowest;
        },
        log: "Thanks to @people.name, @cured.name feel better.",
        order: 7
    };
    data.actions.heal = {
        id: "hel",
        name: "heal",
        desc: "\"I really hope those pills are still good.\"",
        time: 2,
        energy: 1,
        consume: [
            [2, data.resources.gatherables.rare.medication]
        ],
        effect: function (action, option, effect) {
            var lifeChange = 99;
            var hasPharma = this.buildings.has(data.buildings.small.pharmacy.id);
            var isHealer = action.owner.hasPerk(data.perks.healer.id);
            if (!hasPharma && !isHealer && random() < 2 / 5) {
                lifeChange = -10;
                // remember for log
                effect.wasBad = true;
            }
            action.owner.updateLife(lifeChange);
        },
        log: function (effect) {
            if (effect.wasBad) {
                return "After feeling not so well, @people.name realise taking these pills" +
                    "took a hit on his health.";
            }
            else {
                return "This time, it actually improve @people.name's health.";
            }
        },
        order: 6
    };
    data.actions.sleep = {
        id: "slp",
        name: "sleep",
        desc: "Get some rest to restore energy.",
        time: 7,
        energy: 0,
        effect: function (action) {
            action.owner.updateEnergy(99);
        },
        unlock: [
            data.actions.heal
        ],
        log: "@people.name feels well rested now.",
        order: 5
    };
    data.actions.harvestPlot = {
        id: "hrp",
        name: "harvest crops",
        desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
        time: 4,
        consume: [
            [2, data.resources.gatherables.common.water]
        ],
        giveSpan: [1.5, 2],
        giveList: data.resources.gatherables.common.food,
        log: "Our crops produce @give.",
        order: 70
    };
    data.actions.harvestField = {
        id: "hrf",
        name: "harvest crops",
        desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
        time: 6,
        lock: [
            data.actions.harvestPlot
        ],
        consume: [
            [3, data.resources.gatherables.common.water]
        ],
        giveSpan: [3, 4],
        giveList: data.resources.gatherables.common.food,
        log: "Our crops produce @give.",
        order: 70
    },
    data.actions.drawFromWell = {
        id: "dfw",
        name: "draw water",
        desc: "Get some water from our well.",
        time: 2,
        energy: 15,
        giveSpan: [1, 3],
        giveList: data.resources.gatherables.common.water,
        log: "Using our well, @people.name get @give.",
        order: 60
    };
    data.actions.drawFromRiver = {
        id: "dfr",
        name: "draw water",
        desc: "Get some water from the river.",
        time: 8,
        energy: 50,
        isOut: 1,
        condition: function (action) {
            return !action.owner.actions.has(data.actions.drawFromWell.id);
        },
        giveSpan: [2, 6],
        giveList: data.resources.gatherables.common.water,
        log: "Coming back from the river, @people.name brings @give with @people.accusative.",
        order: 60
    };
    data.actions.build = {
        id: "bui",
        name: "build",
        desc: "Put together some materials to come up with what looks like a building.",
        build: function (action, option) {
            return option;
        },
        options: function () {
            return this.possibleBuildings();
        },
        order: 50
    };
    data.actions.craft = {
        id: "crf",
        name: "craft",
        desc: "Use some resources to tinker something useful.",
        time: function () {
            return this.buildings.has(data.buildings.big.workshop.id) ? 4 : 5;
        },
        options: function () {
            return this.unlockedCraftables();
        },
        give: function (action, option) {
            return [
                [1, option]
            ];
        },
        unlock: [
            data.actions.build
        ],
        log: function () {
            return "@people.name succeeds to craft @give.";
        },
        order: 30
    };
    data.actions.explore = {
        id: "xpl",
        name: "explore",
        desc: "Remember that location we saw the other day ? Let's see what we can find there.",
        time: time.day + 4 * time.hour,
        energy: 100,
        isOut: 1,
        consume: [
            [3, data.resources.gatherables.common.water],
            [1, data.resources.gatherables.common.food],
            [1, data.resources.gatherables.special.ruins]
        ],
        options: function () {
            return this.knownLocations;
        },
        giveSpan: [7, 10],
        give: function (action, option, effect) {
            // remember it for log
            effect.location = option;
            var give = randomizeMultiple(option.give, action.data.giveSpan);
            var quartz = data.resources.gatherables.special.quartz;
            if (random() < quartz.dropRate) {
                give.push([1, quartz]);
            }
            return give;
        },
        log: function (effect) {
            // log using location's data
            var log = effect.location.log || "";
            return isFunction(log) ? log(effect, action) : log;
        },
        order: 20
    };
    data.actions.scour = {
        id: "scr",
        name: "scour",
        desc: "Knowledge of the area allows for better findings.",
        time: 5,
        isOut: 1,
        consume: [
            [1, data.resources.gatherables.common.water]
        ],
        giveSpan: [2, 4],
        give: function (action, option, effect) {
            var give = randomize(data.resources.gatherables, action.data.giveSpan);
            // Add 50% chance for ruins (or 100% if explorer)
            var baseDropRate = data.resources.gatherables.special.ruins.dropRate;
            var isExplorer = action.owner.hasPerk(data.perks.explorer.id);
            var modifier = isExplorer ? 1 : 0.5;
            if (random() < (baseDropRate + (1 - baseDropRate) * modifier)) {
                give.push([1, data.resources.gatherables.special.ruins]);
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
            effect.direction = directions.random();
            return log;
        },
        order: 10
    };
    data.actions.roam = {
        id: "ram",
        name: "roam",
        desc: "Explore the surroundings hoping to find something interesting.",
        time: 6,
        isOut: 1,
        consume: [
            [1, data.resources.gatherables.common.water]
        ],
        condition: function (action) {
            return !action.owner.actions.has(data.actions.scour.id);
        },
        unlock: function (action) {
            var unlock = [
                data.actions.explore
            ];
            if (action.repeated > 9) {
                unlock.push(data.actions.scour);
            }
            return unlock;
        },
        giveSpan: [1, 3],
        give: function (action, option, effect) {
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
    };
    data.actions.gather = {
        id: "gtr",
        name: "gather resources",
        desc: "Go out to bring back resources, that's the best you can do.",
        time: 3,
        isOut: 1,
        unlock: [
            data.actions.roam,
            data.actions.craft
        ],
        giveSpan: [3, 6],
        giveList: data.resources.gatherables,
        log: "@people.name comes back with @give.",
        order: 1
    };
    data.buildings.special.forum = {
        id: "fr0",
        name: "forum",
        desc: "The center and start of our settlement.",
        unlock: [
            data.actions.sleep
        ],
        upgrade: data.buildings.special.wreckage,
        give: [
            [1, data.resources.room]
        ],
        asset: "forum"
    };
    data.actions.settle = {
        id: "stl",
        name: "settle here",
        desc: "Ok, let's settle right there !",
        time: 2,
        energy: 0,
        effect: function () {
            this.flags.settled = true;
        },
        unlock: [
            data.actions.gather
        ],
        build: data.buildings.special.forum,
        log: "@people.name installs @build inside a ship-wreck with @give to sleep in.",
        order: 0,
        unique: true
    };
    data.actions.look = {
        id: "lok",
        name: "look around",
        desc: "What am I doing here ?",
        time: 1,
        energy: 0,
        effect: function () {
            TimerManager.timeout(function () {
                MessageBus.notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, "We need a shelter.");
            }, 1500);
        },
        give: [
            [10, data.resources.gatherables.common.water],
            [8, data.resources.gatherables.common.food],
            [2, data.resources.craftables.basic.component]
        ],
        unlock: [
            data.actions.settle
        ],
        log: "After some thinking, @people.name remembers the attack. " +
        "@people.nominative grabs @give laying around.",
        order: 0,
        unique: true
    };
    data.actions.wakeUp = {
        id: "wku",
        name: "wake up",
        unlock: [
            data.actions.look
        ],
        effect: function (action) {
            action.owner.updateEnergy(100);
            action.owner.updateLife(100);
        },
        log: "@people.name gets up painfully.",
        order: 0,
        unique: true
    };

    /** BUILDINGS SMALL **/

    data.buildings.small.furnace = {
        id: "frn",
        name: "furnace",
        desc: "Survival require to craft as much as to gather things.",
        time: 7,
        consume: [
            [8, data.resources.gatherables.common.rock],
            [2, data.resources.gatherables.uncommon.oil]
        ],
        asset: "furnace",
        log: "A simple furnace that can smelt small things like sand or little electronics."
    };
    data.buildings.small.forum1 = {
        id: "fr1",
        name: "forum+1",
        desc: "Add one room.",
        time: 2,
        condition: function () {
            var done = this.buildings;
            return !(done.has(data.buildings.medium.forum2) || done.has(data.buildings.medium.forum3));
        },
        upgrade: data.buildings.special.forum,
        consume: [
            [6, data.resources.gatherables.uncommon.bolts],
            [4, data.resources.gatherables.common.scrap]
        ],
        give: [
            [1, data.resources.room]
        ],
        asset: "forum+1",
        log: "It'll be nice to have someone else helping."
    };
    data.buildings.small.plot = {
        id: "plt",
        name: "farm plot",
        desc: "A little arranged plot of soil to grow some food.",
        time: 9,
        condition: function () {
            return !this.buildings.has(data.buildings.medium.plot1);
        },
        consume: [
            [5, data.resources.gatherables.common.food],
            [10, data.resources.gatherables.uncommon.sand]
        ],
        unlock: [
            data.actions.harvestPlot
        ],
        asset: "plot",
        log: "More crops required more care but that's going to help us keeping a constant stock of food."
    };
    data.buildings.small.pharmacy = {
        id: "phr",
        name: "pharmacy",
        desc: "\"Maybe we should avoid letting medications rot in plain sunlight ?!\"",
        time: 6,
        consume: [
            [5, data.resources.gatherables.rare.medication],
            [4, data.resources.craftables.basic.component]
        ],
        asset: "pharmacy",
        log: "Sorting our medications should prevent further mistakes and bad reaction."
    };
    data.buildings.small.well = {
        id: "wel",
        name: "well",
        desc: "Just a large hole into the ground.",
        time: 16,
        condition: function () {
            return !this.buildings.has(data.buildings.big.pump.id);
        },
        consume: [
            [10, data.resources.craftables.basic.stone],
            [3, data.resources.craftables.basic.tool]
        ],
        give: [
            [5, data.resources.gatherables.common.water]
        ],
        unlock: [
            data.actions.drawFromWell
        ],
        lock: [
            data.actions.drawFromRiver.id
        ],
        asset: "well",
        log: "Drawing water from the ground should allow to further polish stone into bricks."
    };

    /** CRAFTABLES BASIC **/

    data.resources.craftables.basic.stone = {
        id: "stn",
        name: "smooth stone",
        desc: "A round and well polish stone.",
        icon: "stone",
        consume: [
            [3, data.resources.gatherables.common.rock]
        ],
        dropRate: 100,
        order: 90
    };
    data.resources.craftables.basic.glass = {
        id: "gls",
        name: "glass pane",
        desc: "A see-through building component.",
        icon: "glass-pane",
        ifHas: data.buildings.small.furnace.id,
        consume: [
            [4, data.resources.gatherables.uncommon.sand]
        ],
        dropRate: 60,
        order: 100
    };
    data.resources.craftables.basic.tool = {
        id: "tol",
        name: "tool",
        desc: "The base for any tinkerer.",
        icon: "tools",
        consume: [
            [1, data.resources.craftables.basic.component],
            [2, data.resources.gatherables.common.rock]
        ],
        dropRate: 90,
        order: 111
    };

    /** BUILDINGS MEDIUM **/

    data.buildings.medium.forum2 = {
        id: "fr2",
        name: "forum+2",
        desc: "Add one room.",
        time: 5,
        condition: function () {
            return !this.buildings.has(data.buildings.big.forum3);
        },
        consume: [
            [10, data.resources.gatherables.uncommon.sand],
            [2, data.resources.craftables.basic.stone],
            [3, data.resources.craftables.basic.glass]
        ],
        upgrade: data.buildings.small.forum1,
        give: [
            [1, data.resources.room]
        ],
        asset: "forum+2",
        log: "Another room for someone to join. So far, so good."
    };
    data.buildings.medium.plot1 = {
        id: "fil",
        name: "field",
        desc: "A larger crop field to produce more food.",
        time: 10,
        unlock: [
            data.actions.harvestPlot
        ],
        consume: [
            [20, data.resources.gatherables.common.food],
            [5, data.resources.gatherables.uncommon.sand],
            [3, data.resources.gatherables.rare.medication]
        ],
        upgrade: data.buildings.small.plot,
        asset: "plot+1",
        log: "This should be enough to provide food for our small encampment."
    };
    data.buildings.medium.forge = {
        id: "frg",
        name: "forge",
        desc: "A good upgrade to the furnace.",
        time: 10,
        consume: [
            [10, data.resources.craftables.basic.stone],
            [6, data.resources.gatherables.uncommon.oil],
            [2, data.resources.craftables.basic.tool]
        ],
        upgrade: data.buildings.small.furnace,
        asset: "furnace+1",
        log: "We can now work metal better and make more complex part."
    };

    /** CRAFTABLES COMPLEX **/

    data.resources.craftables.complex.brick = {
        id: "brk",
        name: "brick",
        desc: "Bricks will give walls for larger constructions.",
        icon: "brick",
        ifHas: data.buildings.small.well.id,
        consume: [
            [1, data.resources.craftables.basic.stone],
            [1, data.resources.craftables.basic.tool]
        ],
        dropRate: 80,
        order: 112
    };
    data.resources.craftables.complex.circuit = {
        id: "cir",
        name: "circuit",
        desc: "That's a little rough, but it's actually a functioning circuit board.",
        icon: "electronic-circuit-board",
        consume: [
            [1, data.resources.gatherables.common.scrap],
            [2, data.resources.craftables.basic.component],
            [3, data.resources.gatherables.rare.electronic]
        ],
        dropRate: 60,
        order: 114
    };
    data.resources.craftables.complex.metalPipe = {
        id: "mtp",
        name: "metal pipe",
        desc: "Pipes that you forge from junk metal.",
        icon: "pipes-small",
        ifHas: data.buildings.medium.forge.id,
        consume: [
            [4, data.resources.gatherables.common.scrap],
            [1, data.resources.craftables.basic.tool]
        ],
        dropRate: 80,
        order: 115
    };
    data.resources.craftables.complex.furniture = {
        id: "fnt",
        name: "furniture",
        desc: "A proper settlement needs better than pile of trash for table and seats.",
        icon: "glass-table",
        consume: [
            [2, data.resources.craftables.basic.glass],
            [2, data.resources.craftables.complex.metalPipe]
        ],
        dropRate: 40,
        order: 116
    };

    /** CRAFTABLES ADVANCED **/

    data.resources.craftables.advanced.jewelry = {
        id: "jwl",
        name: "jewelry",
        desc: "A really beautiful ornament you could use for trading.",
        icon: "jewelry",
        condition: function () {
            return this.buildings.has(data.buildings.small.furnace.id);
        },
        consume: [
            [4, data.resources.gatherables.rare.electronic],
            [3, data.resources.gatherables.special.quartz]
        ],
        dropRate: 40,
        order: 117
    };
    data.resources.craftables.advanced.engine = {
        id: "egn",
        name: "engine",
        desc: "Amazing what you manage to do with all those scraps !",
        icon: "engine",
        condition: function () {
            return this.buildings.has(data.buildings.big.workshop.id);
        },
        consume: [
            [10, data.resources.gatherables.uncommon.oil],
            [5, data.resources.craftables.basic.tool],
            [5, data.resources.craftables.complex.metalPipe]
        ],
        dropRate: 30,
        order: 120
    };
    data.resources.craftables.advanced.computer = {
        id: "cmt",
        name: "computer",
        desc: "Well, Internet is down since 2136 but it can still be useful.",
        icon: "computer",
        condition: function () {
            return this.buildings.has(data.buildings.big.workshop.id);
        },
        consume: [
            [10, data.resources.craftables.basic.component],
            [7, data.resources.craftables.basic.tool],
            [3, data.resources.craftables.complex.circuit]
        ],
        dropRate: 20,
        order: 130
    };

    /** BUILDINGS BIG **/

    data.buildings.big.forum3 = {
        id: "fr3",
        name: "forum+3",
        desc: "Add two rooms.",
        time: 6,
        consume: [
            [10, data.resources.craftables.complex.brick],
            [2, data.resources.craftables.complex.furniture],
            [6, data.resources.craftables.basic.glass]
        ],
        upgrade: data.buildings.medium.forum2,
        give: [
            [2, data.resources.room]
        ],
        asset: "forum+3",
        log: "All the forum space is now used for sleeping place."
    };
    data.buildings.big.workshop = {
        id: "wrs",
        name: "workshop",
        desc: "Organizing your workforce make them more efficient at crafting.",
        time: 3 * time.day,
        energy: 90,
        ifHas: data.buildings.small.furnace.id,
        consume: [
            [6, data.resources.gatherables.common.scrap],
            [5, data.resources.craftables.basic.glass],
            [10, data.resources.craftables.basic.tool],
            [15, data.resources.craftables.complex.brick]
        ],
        asset: "workshop",
        log: "Good organisation allow you to prepare project and do much more complex crafting."
    };
    data.buildings.big.radio = {
        id: "rdo",
        name: "radio-station",
        desc: "Broadcasting could finally bring us some help.",
        time: 6,
        ifHas: data.buildings.big.workshop.id,
        consume: [
            [4, data.resources.craftables.complex.circuit],
            [1, data.resources.craftables.advanced.computer]
        ],
        asset: "radio",
        log: "\"Message received. We thought no one survive the crash. Glad you still have the cube." +
        "Unfortunately we can't risk being located, bring it to sent position. Over.\""
    };
    data.buildings.big.pump = {
        id: "pmp",
        name: "water pump",
        desc: "A buried contraption that collect water from the earth moisture.",
        time: 3 * time.day,
        energy: 120,
        consume: [
            [20, data.resources.craftables.basic.stone],
            [5, data.resources.craftables.complex.metalPipe],
            [1, data.resources.craftables.advanced.engine]
        ],
        upgrade: data.buildings.small.well,
        unlock: [
            data.actions.drawFromWell
        ],
        asset: "pump",
        log: "A big upgrade to your well ! Now we have a continuous flow of water coming."
    };
    data.buildings.big.trading = {
        id: "trd",
        name: "trading post",
        desc: "Since the radio station bring a handful of merchant, better take advantage of it.",
        time: time.day,
        energy: 70,
        ifHas: data.buildings.big.radio.id,
        consume: [
            [2, data.resources.craftables.basic.glass],
            [10, data.resources.craftables.complex.brick],
            [2, data.resources.craftables.complex.furniture]
        ],
        unlock: [
            data.actions.exchange
        ],
        asset: "trading",
        log: "Arranging some space allow us to trade with merchant caravan passing by."
    };
    data.buildings.big.module = {
        id: "mdl",
        name: "module",
        desc: "With that, we can finally deliver the cube to security.",
        time: time.week,
        energy: 100,
        ifHas: data.buildings.big.radio.id,
        consume: [
            [15, data.resources.gatherables.uncommon.oil],
            [3, data.resources.craftables.complex.furniture],
            [1, data.resources.craftables.advanced.computer],
            [2, data.resources.craftables.advanced.engine]
        ],
        unlock: [
            data.actions.launch
        ],
        asset: "module",
        log: "What a journey, but there we are. We build so many things and explore lots of places.<br/>" +
        "Now it's time to end it all !"
    };

    /***** LOCATIONS *****/

    /** NEAR **/

    data.locations.near.mountain = {
        id: "mnt",
        name: "mountain",
        desc: "A nearby mountain that may contains some basic building resources",
        give: [
            data.resources.gatherables.common.rock,
            data.resources.gatherables.common.scrap,
            data.resources.craftables.basic.component
        ],
        log: "That was hard to climb those mountains, but at least @people find @give.",
        dropRate: 90
    };
    data.locations.near.desert = {
        id: "dst",
        name: "desert",
        desc: "Not much to find in a desert, but that's for sure the best place to get sand.",
        give: [
            data.resources.gatherables.common.scrap,
            data.resources.gatherables.uncommon.oil,
            data.resources.gatherables.uncommon.sand
        ],
        log: "Dunes everywhere give a felling of hopelessness. Anyway, here's @give for the stock.",
        dropRate: 100
    };
    data.locations.near.supermarket = {
        id: "hng",
        name: "hangar",
        desc: "A huge hangar. It was certainly raided before by others, but you may grab something",
        give: [
            data.resources.gatherables.common.food,
            data.resources.gatherables.rare.medication,
            data.resources.craftables.basic.glass
        ],
        log: "Quite easy to loot, but full of dangers too. Hopefully, @people.name return safely and got @give.",
        dropRate: 80
    };

    /** FAR **/

    data.locations.far.river = {
        id: "rvr",
        name: "river",
        desc: "Quite rare to find water around here. This is a valuable location to find.",
        unlock: [
            data.actions.drawFromRiver
        ],
        give: [
            data.resources.gatherables.common.water,
            data.resources.gatherables.uncommon.bolts,
            data.resources.craftables.basic.stone
        ],
        log: "It's nice by the river, @people.name found @give.",
        dropRate: 40
    };
    data.locations.far.ruin = {
        id: "orn",
        name: "old ruin",
        desc: "This is a huge underground network of rooms linked by narrow hallways. " +
        "This should have provided shelter a long time ago.",
        give: [
            data.resources.gatherables.rare.electronic,
            data.resources.craftables.basic.component,
            data.resources.craftables.basic.tool
        ],
        log: "Amazing no-one get lost in those caves to get @give.",
        dropRate: 60
    };

    /** EPIC **/

    data.locations.epic.building = {
        id: "bld",
        name: "buried building",
        desc: "By digging up this building, you uncover stuff preserved from looting and environment.",
        give: [
            data.resources.gatherables.rare.medication,
            data.resources.craftables.basic.glass,
            data.resources.craftables.complex.circuit
        ],
        log: "No-one could guess what that building was, but it sure was interesting. " +
        "@people.name find @give.",
        dropRate: 30
    };
    data.locations.epic.spaceship = {
        id: "swr",
        name: "spaceship wreck",
        desc: "This wreckage seems to be in a fairly good shape and allow you to find useful part inside.",
        give: [
            data.resources.gatherables.rare.electronic,
            data.resources.craftables.basic.tool,
            data.resources.craftables.complex.furniture
        ],
        log: "What a chance to find a wreckage with not melted stuff inside. It was possible to get @give.",
        dropRate: 20
    };

    /***** EVENTS *****/

    data.events.dropRate = 0.01;

    /** EASY **/

    data.events.easy.sandstorm = {
        id: "ssm",
        name: "sandstorm",
        desc: "The wind is blowing hard, impossible to go out for now.",
        time: 20,
        timeDelta: 4,
        effect: function (isOn) {
            this.flags.cantGoOut = isOn;
        },
        dropRate: 100,
        log: "A sandstorm has started and prevent anyone from leaving the camp."
    };

    /** MEDUIM **/

    /** HARD **/

    data.events.hard.drought = {
        id: "drg",
        name: "drought",
        desc: "The climate is so hot, we consume more water.",
        time: 3 * time.day,
        timeDelta: 10,
        effect: function (isOn) {
            this.flags.drought = isOn;
        },
        dropRate: 10,
        log: "A harsh drought has fall, water will be more important than ever."
    };

    /***** PERKS *****/

    data.perks.first = {
        id: "fso",
        name: "first-one",
        desc: "The very first one to install the settlement.",
        actions: [
            data.actions.settle.id
        ],
        iteration: 0
    };
    data.perks.rookie = {
        id: "rki",
        name: "rookie",
        desc: "All group has a rookie, all @people.nominative want is to prove @people.nominative's efficient.",
        condition: function () {
            return this.people.length > 2;
        },
        effect: function (actionData) {
            actionData.timeBonus = 0.9;
        }
    };
    data.perks.explorer = {
        id: "xpr",
        name: "gadabout",
        desc: "The veteran of the camp and leader of the exploration. " +
        "@people.nominative knows the best spot of resources.",
        actions: [
            data.actions.roam.id,
            data.actions.scour.id,
            data.actions.explore.id
        ],
        iteration: 30,
        effect: function (actionData) {
            // Always find epic locations
            // And get an extras when exploring
            if (actionData.id === data.actions.explore.id) {
                var extra = 2;
                actionData.giveSpan = actionData.giveSpan.map(function (value) {
                    return value + extra;
                });
            }
        }
    };
    data.perks.tinkerer = {
        id: "tnr",
        name: "tinkerer",
        desc: "Everyone is amazed by how quickly @people.nominative can put together any contraption.",
        actions: [
            data.actions.craft.id,
            data.actions.build.id
        ],
        iteration: 30,
        effect: function (actionData) {
            actionData.timeBonus = 0.5;
        }
    };
    data.perks.healer = {
        id: "hlr",
        name: "doctor",
        desc: "Knowing enough about medicine make @people.accusative confident to heal others.",
        actions: [
            data.actions.heal.id
        ],
        ifHas: data.buildings.small.pharmacy.id,
        iteration: 5,
        unlock: [
            data.actions.nurse
        ]
    };
    data.perks.harvester = {
        id: "hvt",
        name: "harvester",
        desc: "A real eagle eye that can spot goods twice as fast as anyone.",
        actions: [
            data.actions.gather.id,
            data.actions.harvestField.id,
            data.actions.harvestPlot.id,
            data.actions.drawFromRiver.id,
            data.actions.drawFromWell.id
        ],
        iteration: 40,
        effect: function (actionData) {
            var ratio = 1.5;
            actionData.giveSpan = actionData.giveSpan.map(function (value) {
                return value * ratio;
            });
        }
    };
    data.perks.lounger = {
        id: "lng",
        name: "lounger",
        desc: "Doing nothing all day's not gonna make things done.",
        actions: [
            data.actions.sleep
        ],
        condition: function (person) {
            return person.stats.idle > (3 * time.day);
        },
        effect: function (actionData) {
            // Won't use energy while idle
            // Sleep longer
            actionData.timeBonus = -0.2;
        }
    };
    data.perks.merchant = {
        id: "mrc",
        name: "merchant",
        desc: "The ancient art of trading have been one of the most important skill you could have.",
        action: [
            data.actions.exchange
        ],
        iteration: 10,
        effect: function (actionData) {
            // Consume only 1 jewel per trade
            actionData.consume[0] = 1;
        }
    };
    /* eslint-enable valid-jsdoc */

    return /** @lends DataManager */ {
        time: time,
        data: data
    };
})();

