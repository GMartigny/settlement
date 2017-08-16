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

    var ids = {
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

    var db = {};

    /**
     * Add a new object to the database
     * @param {Data} data - Any data
     * @returns {ID}
     */
    function insert (data) {
        var id = btoa(data.id);
        if (IS_DEV) {
            if (!data.id) {
                console.warn("Item with no id ", item);
            }
            if (db[id]) {
                console.warn("Two items have the same id ", item);
            }
        }
        data.id = id;

        db[id] = data;

        return id;
    }

    /* eslint-disable valid-jsdoc */

    ids.option = "opt";

    ids.resources.room = insert({
        id: "rom",
        name: "room",
        desc: "A place for someone in the camp.",
        icon: "person",
        order: 0
    });

    /** GATHERABLES COMMON **/

    ids.resources.gatherables.common.water = insert({
        id: "wtr",
        name: "water",
        desc: "Water is definitely important to survive in this harsh environment.",
        icon: "water-bottle",
        dropRate: 100,
        order: 10
    });
    ids.resources.gatherables.common.food = insert({
        id: "fod",
        name: "food",
        desc: "Everyone need food to keep his strength.",
        icon: "foodcan",
        dropRate: 90,
        order: 20
    });
    ids.resources.gatherables.common.rock = insert({
        id: "rck",
        name: "rock",
        desc: "\"There's rocks everywhere ! Why would you bring this back ?\"",
        icon: "rock",
        dropRate: 100,
        order: 30
    });
    ids.resources.gatherables.common.scrap = insert({
        id: "scp",
        name: "scrap metal",
        desc: "An old rusty piece of metal.",
        icon: "metal-scraps",
        dropRate: 90,
        order: 40
    });

    ids.people = insert({
        id: "plp",
        name: "people",
        desc: "The workforce and the bane of you camp.",
        needs: [
            [1.2 / time.day, ids.resources.gatherables.common.water, "thirsty"],
            [1 / time.day, ids.resources.gatherables.common.food, "starving"]
        ],
        dropRate: 0.1
    });

    /** GATHERABLES UNCOMMON **/

    ids.resources.gatherables.uncommon.bolts = insert({
        id: "blt",
        name: "nuts and bolts",
        desc: "Little metal nuts and bolts to fasten anything in place.",
        icon: "nuts-and-bolts",
        dropRate: 70,
        order: 50
    });
    ids.resources.gatherables.uncommon.sand = insert({
        id: "snd",
        name: "sand",
        desc: "Just pure fine sand.",
        icon: "sand-pile",
        dropRate: 40,
        order: 55
    });
    ids.resources.gatherables.uncommon.oil = insert({
        id: "oil",
        name: "fuel",
        desc: "About a liter of gas-oil.",
        icon: "jerrycan",
        dropRate: 10,
        order: 60
    });

    /** GATHERABLES RARE **/

    ids.resources.gatherables.rare.medication = insert({
        id: "mct",
        name: "medication",
        desc: "An unlabeled medication, hope it's still good.",
        icon: "medications",
        dropRate: 7,
        order: 70
    });
    ids.resources.gatherables.rare.electronic = insert({
        id: "elc",
        name: "electronics",
        desc: "Some basic micro-electronics components.",
        icon: "electronic-parts",
        dropRate: 10,
        order: 75
    });

    /** GATHERABLES SPECIAL **/

    ids.resources.gatherables.special.ruins = insert({
        id: "run",
        name: "location",
        desc: "Directions to a point of interest we found earlier.",
        icon: "map",
        order: 80,
        dropRate: 0.6
    });
    ids.resources.gatherables.special.quartz = insert({
        id: "qtz",
        name: "quartz cristal",
        desc: "A rough uncut gem of quartz. Quite valuable.",
        icon: "gem",
        dropRate: 0.1,
        order: 77
    });

    ids.resources.craftables.basic.component = insert({
        id: "cmp",
        name: "component",
        desc: "Some mechanical parts for others craftables.",
        icon: "pipes-large",
        consume: [
            [2, ids.resources.gatherables.common.scrap],
            [2, ids.resources.gatherables.uncommon.bolts]
        ],
        dropRate: 120,
        order: 110
    });


    /** BUILDINGS SPECIAL **/

    ids.buildings.special.wreckage = insert({
        id: "wrk",
        name: "wreckage",
        desc: "Remainings of space-ships.",
        asset: "wreckage"
    });

    /***** ACTIONS *****/

    ids.actions.launch = insert({
        id: "lnc",
        name: "launch",
        desc: "Finally set off this module to get out of that damn wasteland.",
        time: 12,
        energy: 30,
        isOut: 1,
        unique: true,
        consume: [
            [10, ids.resources.gatherables.uncommon.oil]
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
    });
    ids.actions.exchange = insert({
        id: "exc",
        name: "exchange",
        desc: "Caravan passing by carry lots of useful stuff, let's see what's possible to trade.",
        time: 7,
        energy: 20,
        consume: [
            [2, ids.resources.craftables.complex.jewelry]
        ],
        giveSpan: [2, 3],
        giveList: {
            basic: ids.resources.craftables.basic,
            complex: ids.resources.craftables.complex
        },
        log: "@people.name manage to trade a couple of jewelries for @give.",
        order: 10
    });
    ids.actions.nurse = insert({
        id: "nrs",
        name: "nurse",
        desc: "Look after the health of the most needed one.",
        time: 2,
        energy: 1,
        consume: [
            [2, ids.resources.gatherables.rare.medication]
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
    });
    ids.actions.heal = insert({
        id: "hel",
        name: "heal",
        desc: "\"I really hope those pills are still good.\"",
        time: 2,
        energy: 1,
        consume: [
            [2, ids.resources.gatherables.rare.medication]
        ],
        effect: function (action, option, effect) {
            var lifeChange = 99;
            var hasPharma = this.buildings.has(ids.buildings.small.pharmacy.id);
            var isHealer = action.owner.hasPerk(ids.perks.healer.id);
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
    });
    ids.actions.sleep = insert({
        id: "slp",
        name: "sleep",
        desc: "Get some rest to restore energy.",
        time: 7,
        energy: 0,
        effect: function (action) {
            action.owner.updateEnergy(99);
        },
        unlock: [
            ids.actions.heal
        ],
        log: "@people.name feels well rested now.",
        order: 5
    });
    ids.actions.harvestPlot = insert({
        id: "hrp",
        name: "harvest crops",
        desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
        time: 4,
        consume: [
            [2, ids.resources.gatherables.common.water]
        ],
        giveSpan: [1.5, 2],
        giveList: ids.resources.gatherables.common.food,
        log: "Our crops produce @give.",
        order: 70
    });
    ids.actions.harvestField = insert({
        id: "hrf",
        name: "harvest crops",
        desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
        time: 6,
        lock: [
            ids.actions.harvestPlot
        ],
        consume: [
            [3, ids.resources.gatherables.common.water]
        ],
        giveSpan: [3, 4],
        giveList: ids.resources.gatherables.common.food,
        log: "Our crops produce @give.",
        order: 70
    });
    ids.actions.drawFromWell = insert({
        id: "dfw",
        name: "draw water",
        desc: "Get some water from our well.",
        time: 2,
        energy: 15,
        giveSpan: [1, 3],
        giveList: ids.resources.gatherables.common.water,
        log: "Using our well, @people.name get @give.",
        order: 60
    });
    ids.actions.drawFromRiver = insert({
        id: "dfr",
        name: "draw water",
        desc: "Get some water from the river.",
        time: 8,
        energy: 50,
        isOut: 1,
        condition: function (action) {
            return !action.owner.actions.has(ids.actions.drawFromWell.id);
        },
        giveSpan: [2, 6],
        giveList: ids.resources.gatherables.common.water,
        log: "Coming back from the river, @people.name brings @give with @people.accusative.",
        order: 60
    });
    ids.actions.build = insert({
        id: "bui",
        name: "build",
        desc: "Put together some materials to come up with what looks like a building.",
        build: ids.option,
        options: function () {
            return this.possibleBuildings();
        },
        order: 50
    });
    ids.actions.craft = insert({
        id: "crf",
        name: "craft",
        desc: "Use some resources to tinker something useful.",
        time: function () {
            return this.buildings.has(ids.buildings.big.workshop.id) ? 4 : 5;
        },
        options: function () {
            return this.unlockedCraftables();
        },
        give: [
            [1, ids.option]
        ],
        unlock: [
            ids.actions.build
        ],
        log: function () {
            return "@people.name succeeds to craft @give.";
        },
        order: 30
    });
    ids.actions.explore = insert({
        id: "xpl",
        name: "explore",
        desc: "Remember that location we saw the other day ? Let's see what we can find there.",
        time: time.day + 4 * time.hour,
        energy: 100,
        isOut: 1,
        consume: [
            [3, ids.resources.gatherables.common.water],
            [1, ids.resources.gatherables.common.food],
            [1, ids.resources.gatherables.special.ruins]
        ],
        options: function () {
            return this.knownLocations;
        },
        giveSpan: [7, 10],
        give: function (action, option, effect) {
            // remember it for log
            effect.location = option;
            var give = randomizeMultiple(option.give, action.data.giveSpan);
            var quartz = ids.resources.gatherables.special.quartz;
            if (random() < quartz.dropRate) {
                give.push([1, quartz]);
            }
            return give;
        },
        log: "All locations should have own log",
        order: 20
    });
    ids.actions.scour = insert({
        id: "scr",
        name: "scour",
        desc: "Knowledge of the area allows for better findings.",
        time: 5,
        isOut: 1,
        consume: [
            [1, ids.resources.gatherables.common.water]
        ],
        giveSpan: [2, 4],
        give: function (action, option, effect) {
            var give = randomize(ids.resources.gatherables, action.data.giveSpan);
            // Add 50% chance for ruins (or 100% if explorer)
            var baseDropRate = ids.resources.gatherables.special.ruins.dropRate;
            var isExplorer = action.owner.hasPerk(ids.perks.explorer.id);
            var modifier = isExplorer ? 1 : 0.5;
            if (random() < (baseDropRate + (1 - baseDropRate) * modifier)) {
                give.push([1, ids.resources.gatherables.special.ruins]);
                var location = randomize(isExplorer ? ids.locations.epic : ids.locations.far);
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
    });
    ids.actions.roam = insert({
        id: "ram",
        name: "roam",
        desc: "Explore the surroundings hoping to find something interesting.",
        time: 6,
        isOut: 1,
        consume: [
            [1, ids.resources.gatherables.common.water]
        ],
        condition: function (action) {
            return !action.owner.actions.has(ids.actions.scour.id);
        },
        unlock: [
            ids.actions.explore
        ],
        unlockAfter: [
            [9, ids.actions.scour]
        ],
        giveSpan: [ids.resources.gatherables.special.ruins.dropRate, 1],
        giveList: ids.resources.gatherables.special.ruins,
        log: function (effect) {
            var log;
            if (effect.give) {
                this.knownLocations.push(location);
                log = "Heading @direction, @people.name spots @location.";
            }
            else {
                log = "@people.name found nothing special towards @direction.";
            }
            effect.direction = directions.random();
            return log;
        },
        order: 10
    });
    ids.actions.gather = insert({
        id: "gtr",
        name: "gather resources",
        desc: "Go out to bring back resources, that's the best you can do.",
        time: 3,
        isOut: 1,
        unlock: [
            ids.actions.roam,
            ids.actions.craft
        ],
        giveSpan: [3, 6],
        giveList: ids.resources.gatherables,
        log: "@people.name comes back with @give.",
        order: 1
    });
    ids.buildings.special.forum = insert({
        id: "fr0",
        name: "forum",
        desc: "The center and start of our settlement.",
        unlock: [
            ids.actions.sleep
        ],
        upgrade: ids.buildings.special.wreckage,
        give: [
            [1, ids.resources.room]
        ],
        asset: "forum"
    });
    ids.actions.settle = insert({
        id: "stl",
        name: "settle here",
        desc: "Ok, let's settle right there !",
        time: 2,
        energy: 0,
        effect: function () {
            this.flags.settled = true;
        },
        unlock: [
            ids.actions.gather
        ],
        build: ids.buildings.special.forum,
        log: "@people.name installs @build inside a ship-wreck with @give to sleep in.",
        order: 0,
        unique: true
    });
    ids.actions.look = insert({
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
            [10, ids.resources.gatherables.common.water],
            [8, ids.resources.gatherables.common.food],
            [2, ids.resources.craftables.basic.component]
        ],
        unlock: [
            ids.actions.settle
        ],
        log: "After some thinking, @people.name remembers the attack. " +
        "@people.nominative grabs @give laying around.",
        order: 0,
        unique: true
    });
    ids.actions.wakeUp = insert({
        id: "wku",
        name: "wake up",
        unlock: [
            ids.actions.look
        ],
        effect: function (action) {
            action.owner.updateEnergy(100);
            action.owner.updateLife(100);
        },
        log: "@people.name gets up painfully.",
        order: 0,
        unique: true
    });

    /** BUILDINGS SMALL **/

    ids.buildings.small.furnace = insert({
        id: "frn",
        name: "furnace",
        desc: "Survival require to craft as much as to gather things.",
        time: 7,
        consume: [
            [8, ids.resources.gatherables.common.rock],
            [2, ids.resources.gatherables.uncommon.oil]
        ],
        asset: "furnace",
        log: "A simple furnace that can smelt small things like sand or little electronics."
    });
    ids.buildings.small.forum1 = insert({
        id: "fr1",
        name: "forum+1",
        desc: "Add one room.",
        time: 2,
        condition: function () {
            var done = this.buildings;
            return !(done.has(ids.buildings.medium.forum2) || done.has(ids.buildings.medium.forum3));
        },
        upgrade: ids.buildings.special.forum,
        consume: [
            [6, ids.resources.gatherables.uncommon.bolts],
            [4, ids.resources.gatherables.common.scrap]
        ],
        give: [
            [1, ids.resources.room]
        ],
        asset: "forum+1",
        log: "It'll be nice to have someone else helping."
    });
    ids.buildings.small.plot = insert({
        id: "plt",
        name: "farm plot",
        desc: "A little arranged plot of soil to grow some food.",
        time: 9,
        condition: function () {
            return !this.buildings.has(ids.buildings.medium.plot1);
        },
        consume: [
            [5, ids.resources.gatherables.common.food],
            [10, ids.resources.gatherables.uncommon.sand]
        ],
        unlock: [
            ids.actions.harvestPlot
        ],
        asset: "plot",
        log: "More crops required more care but that's going to help us keeping a constant stock of food."
    });
    ids.buildings.small.pharmacy = insert({
        id: "phr",
        name: "pharmacy",
        desc: "\"Maybe we should avoid letting medications rot in plain sunlight ?!\"",
        time: 6,
        consume: [
            [5, ids.resources.gatherables.rare.medication],
            [4, ids.resources.craftables.basic.component]
        ],
        asset: "pharmacy",
        log: "Sorting our medications should prevent further mistakes and bad reaction."
    });
    ids.buildings.small.well = insert({
        id: "wel",
        name: "well",
        desc: "Just a large hole into the ground.",
        time: 16,
        condition: function () {
            return !this.buildings.has(ids.buildings.big.pump.id);
        },
        consume: [
            [10, ids.resources.craftables.basic.stone],
            [3, ids.resources.craftables.basic.tool]
        ],
        give: [
            [5, ids.resources.gatherables.common.water]
        ],
        unlock: [
            ids.actions.drawFromWell
        ],
        lock: [
            ids.actions.drawFromRiver.id
        ],
        asset: "well",
        log: "Drawing water from the ground should allow to further polish stone into bricks."
    });

    /** CRAFTABLES BASIC **/

    ids.resources.craftables.basic.stone = insert({
        id: "stn",
        name: "smooth stone",
        desc: "A round and well polish stone.",
        icon: "stone",
        consume: [
            [3, ids.resources.gatherables.common.rock]
        ],
        dropRate: 100,
        order: 90
    });
    ids.resources.craftables.basic.glass = insert({
        id: "gls",
        name: "glass pane",
        desc: "A see-through building component.",
        icon: "glass-pane",
        ifHas: ids.buildings.small.furnace.id,
        consume: [
            [4, ids.resources.gatherables.uncommon.sand]
        ],
        dropRate: 60,
        order: 100
    });
    ids.resources.craftables.basic.tool = insert({
        id: "tol",
        name: "tool",
        desc: "The base for any tinkerer.",
        icon: "tools",
        consume: [
            [1, ids.resources.craftables.basic.component],
            [2, ids.resources.gatherables.common.rock]
        ],
        dropRate: 90,
        order: 111
    });

    /** BUILDINGS MEDIUM **/

    ids.buildings.medium.forum2 = insert({
        id: "fr2",
        name: "forum+2",
        desc: "Add one room.",
        time: 5,
        condition: function () {
            return !this.buildings.has(ids.buildings.big.forum3);
        },
        consume: [
            [10, ids.resources.gatherables.uncommon.sand],
            [2, ids.resources.craftables.basic.stone],
            [3, ids.resources.craftables.basic.glass]
        ],
        upgrade: ids.buildings.small.forum1,
        give: [
            [1, ids.resources.room]
        ],
        asset: "forum+2",
        log: "Another room for someone to join. So far, so good."
    });
    ids.buildings.medium.plot1 = insert({
        id: "fil",
        name: "field",
        desc: "A larger crop field to produce more food.",
        time: 10,
        unlock: [
            ids.actions.harvestPlot
        ],
        consume: [
            [20, ids.resources.gatherables.common.food],
            [5, ids.resources.gatherables.uncommon.sand],
            [3, ids.resources.gatherables.rare.medication]
        ],
        upgrade: ids.buildings.small.plot,
        asset: "plot+1",
        log: "This should be enough to provide food for our small encampment."
    });
    ids.buildings.medium.forge = insert({
        id: "frg",
        name: "forge",
        desc: "A good upgrade to the furnace.",
        time: 10,
        consume: [
            [10, ids.resources.craftables.basic.stone],
            [6, ids.resources.gatherables.uncommon.oil],
            [2, ids.resources.craftables.basic.tool]
        ],
        upgrade: ids.buildings.small.furnace,
        asset: "furnace+1",
        log: "We can now work metal better and make more complex part."
    });

    /** CRAFTABLES COMPLEX **/

    ids.resources.craftables.complex.brick = insert({
        id: "brk",
        name: "brick",
        desc: "Bricks will give walls for larger constructions.",
        icon: "brick",
        ifHas: ids.buildings.small.well.id,
        consume: [
            [1, ids.resources.craftables.basic.stone],
            [1, ids.resources.craftables.basic.tool]
        ],
        dropRate: 80,
        order: 112
    });
    ids.resources.craftables.complex.circuit = insert({
        id: "cir",
        name: "circuit",
        desc: "That's a little rough, but it's actually a functioning circuit board.",
        icon: "electronic-circuit-board",
        consume: [
            [1, ids.resources.gatherables.common.scrap],
            [2, ids.resources.craftables.basic.component],
            [3, ids.resources.gatherables.rare.electronic]
        ],
        dropRate: 60,
        order: 114
    });
    ids.resources.craftables.complex.metalPipe = insert({
        id: "mtp",
        name: "metal pipe",
        desc: "Pipes that you forge from junk metal.",
        icon: "pipes-small",
        ifHas: ids.buildings.medium.forge.id,
        consume: [
            [4, ids.resources.gatherables.common.scrap],
            [1, ids.resources.craftables.basic.tool]
        ],
        dropRate: 80,
        order: 115
    });
    ids.resources.craftables.complex.furniture = insert({
        id: "fnt",
        name: "furniture",
        desc: "A proper settlement needs better than pile of trash for table and seats.",
        icon: "glass-table",
        consume: [
            [2, ids.resources.craftables.basic.glass],
            [2, ids.resources.craftables.complex.metalPipe]
        ],
        dropRate: 40,
        order: 116
    });

    /** CRAFTABLES ADVANCED **/

    ids.resources.craftables.advanced.jewelry = insert({
        id: "jwl",
        name: "jewelry",
        desc: "A really beautiful ornament you could use for trading.",
        icon: "jewelry",
        condition: function () {
            return this.buildings.has(ids.buildings.small.furnace.id);
        },
        consume: [
            [4, ids.resources.gatherables.rare.electronic],
            [3, ids.resources.gatherables.special.quartz]
        ],
        dropRate: 40,
        order: 117
    });
    ids.resources.craftables.advanced.engine = insert({
        id: "egn",
        name: "engine",
        desc: "Amazing what you manage to do with all those scraps !",
        icon: "engine",
        condition: function () {
            return this.buildings.has(ids.buildings.big.workshop.id);
        },
        consume: [
            [10, ids.resources.gatherables.uncommon.oil],
            [5, ids.resources.craftables.basic.tool],
            [5, ids.resources.craftables.complex.metalPipe]
        ],
        dropRate: 30,
        order: 120
    });
    ids.resources.craftables.advanced.computer = insert({
        id: "cmt",
        name: "computer",
        desc: "Well, Internet is down since 2136 but it can still be useful.",
        icon: "computer",
        condition: function () {
            return this.buildings.has(ids.buildings.big.workshop.id);
        },
        consume: [
            [10, ids.resources.craftables.basic.component],
            [7, ids.resources.craftables.basic.tool],
            [3, ids.resources.craftables.complex.circuit]
        ],
        dropRate: 20,
        order: 130
    });

    /** BUILDINGS BIG **/

    ids.buildings.big.forum3 = insert({
        id: "fr3",
        name: "forum+3",
        desc: "Add two rooms.",
        time: 6,
        consume: [
            [10, ids.resources.craftables.complex.brick],
            [2, ids.resources.craftables.complex.furniture],
            [6, ids.resources.craftables.basic.glass]
        ],
        upgrade: ids.buildings.medium.forum2,
        give: [
            [2, ids.resources.room]
        ],
        asset: "forum+3",
        log: "All the forum space is now used for sleeping place."
    });
    ids.buildings.big.workshop = insert({
        id: "wrs",
        name: "workshop",
        desc: "Organizing your workforce make them more efficient at crafting.",
        time: 3 * time.day,
        energy: 90,
        ifHas: ids.buildings.small.furnace.id,
        consume: [
            [6, ids.resources.gatherables.common.scrap],
            [5, ids.resources.craftables.basic.glass],
            [10, ids.resources.craftables.basic.tool],
            [15, ids.resources.craftables.complex.brick]
        ],
        asset: "workshop",
        log: "Good organisation allow you to prepare project and do much more complex crafting."
    });
    ids.buildings.big.radio = insert({
        id: "rdo",
        name: "radio-station",
        desc: "Broadcasting could finally bring us some help.",
        time: 6,
        ifHas: ids.buildings.big.workshop.id,
        consume: [
            [4, ids.resources.craftables.complex.circuit],
            [1, ids.resources.craftables.advanced.computer]
        ],
        asset: "radio",
        log: "\"Message received. We thought no one survive the crash. Glad you still have the cube." +
        "Unfortunately we can't risk being located, bring it to sent position. Over.\""
    });
    ids.buildings.big.pump = insert({
        id: "pmp",
        name: "water pump",
        desc: "A buried contraption that collect water from the earth moisture.",
        time: 3 * time.day,
        energy: 120,
        consume: [
            [20, ids.resources.craftables.basic.stone],
            [5, ids.resources.craftables.complex.metalPipe],
            [1, ids.resources.craftables.advanced.engine]
        ],
        upgrade: ids.buildings.small.well,
        unlock: [
            ids.actions.drawFromWell
        ],
        asset: "pump",
        log: "A big upgrade to your well ! Now we have a continuous flow of water coming."
    });
    ids.buildings.big.trading = insert({
        id: "trd",
        name: "trading post",
        desc: "Since the radio station bring a handful of merchant, better take advantage of it.",
        time: time.day,
        energy: 70,
        ifHas: ids.buildings.big.radio.id,
        consume: [
            [2, ids.resources.craftables.basic.glass],
            [10, ids.resources.craftables.complex.brick],
            [2, ids.resources.craftables.complex.furniture]
        ],
        unlock: [
            ids.actions.exchange
        ],
        asset: "trading",
        log: "Arranging some space allow us to trade with merchant caravan passing by."
    });
    ids.buildings.big.module = insert({
        id: "mdl",
        name: "module",
        desc: "With that, we can finally deliver the cube to security.",
        time: time.week,
        energy: 100,
        ifHas: ids.buildings.big.radio.id,
        consume: [
            [15, ids.resources.gatherables.uncommon.oil],
            [3, ids.resources.craftables.complex.furniture],
            [1, ids.resources.craftables.advanced.computer],
            [2, ids.resources.craftables.advanced.engine]
        ],
        unlock: [
            ids.actions.launch
        ],
        asset: "module",
        log: "What a journey, but there we are. We build so many things and explore lots of places.<br/>" +
        "Now it's time to end it all !"
    });

    /***** LOCATIONS *****/

    /** NEAR **/

    ids.locations.near.mountain = insert({
        id: "mnt",
        name: "mountain",
        desc: "A nearby mountain that may contains some basic building resources",
        give: [
            ids.resources.gatherables.common.rock,
            ids.resources.gatherables.common.scrap,
            ids.resources.craftables.basic.component
        ],
        log: "That was hard to climb those mountains, but at least @people find @give.",
        dropRate: 90
    });
    ids.locations.near.desert = insert({
        id: "dst",
        name: "desert",
        desc: "Not much to find in a desert, but that's for sure the best place to get sand.",
        give: [
            ids.resources.gatherables.common.scrap,
            ids.resources.gatherables.uncommon.oil,
            ids.resources.gatherables.uncommon.sand
        ],
        log: "Dunes everywhere give a felling of hopelessness. Anyway, here's @give for the stock.",
        dropRate: 100
    });
    ids.locations.near.supermarket = insert({
        id: "hng",
        name: "hangar",
        desc: "A huge hangar. It was certainly raided before by others, but you may grab something",
        give: [
            ids.resources.gatherables.common.food,
            ids.resources.gatherables.rare.medication,
            ids.resources.craftables.basic.glass
        ],
        log: "Quite easy to loot, but full of dangers too. Hopefully, @people.name return safely and got @give.",
        dropRate: 80
    });

    /** FAR **/

    ids.locations.far.river = insert({
        id: "rvr",
        name: "river",
        desc: "Quite rare to find water around here. This is a valuable location to find.",
        unlock: [
            ids.actions.drawFromRiver
        ],
        give: [
            ids.resources.gatherables.common.water,
            ids.resources.gatherables.uncommon.bolts,
            ids.resources.craftables.basic.stone
        ],
        log: "It's nice by the river, @people.name found @give.",
        dropRate: 40
    });
    ids.locations.far.ruin = insert({
        id: "orn",
        name: "old ruin",
        desc: "This is a huge underground network of rooms linked by narrow hallways. " +
        "This should have provided shelter a long time ago.",
        give: [
            ids.resources.gatherables.rare.electronic,
            ids.resources.craftables.basic.component,
            ids.resources.craftables.basic.tool
        ],
        log: "Amazing no-one get lost in those caves to get @give.",
        dropRate: 60
    });

    /** EPIC **/

    ids.locations.epic.building = insert({
        id: "bld",
        name: "buried building",
        desc: "By digging up this building, you uncover stuff preserved from looting and environment.",
        give: [
            ids.resources.gatherables.rare.medication,
            ids.resources.craftables.basic.glass,
            ids.resources.craftables.complex.circuit
        ],
        log: "No-one could guess what that building was, but it sure was interesting. " +
        "@people.name find @give.",
        dropRate: 30
    });
    ids.locations.epic.spaceship = insert({
        id: "swr",
        name: "spaceship wreck",
        desc: "This wreckage seems to be in a fairly good shape and allow you to find useful part inside.",
        give: [
            ids.resources.gatherables.rare.electronic,
            ids.resources.craftables.basic.tool,
            ids.resources.craftables.complex.furniture
        ],
        log: "What a chance to find a wreckage with not melted stuff inside. It was possible to get @give.",
        dropRate: 20
    });

    /***** EVENTS *****/

    /** EASY **/

    ids.events.easy.sandstorm = insert({
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
    });

    /** MEDUIM **/

    /** HARD **/

    ids.events.hard.drought = insert({
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
    });

    /***** PERKS *****/

    ids.perks.first = insert({
        id: "fso",
        name: "first-one",
        desc: "The very first one to install the settlement.",
        actions: [
            ids.actions.settle.id
        ],
        iteration: 0
    });
    ids.perks.rookie = insert({
        id: "rki",
        name: "rookie",
        desc: "All group has a rookie, all @people.nominative want is to prove @people.nominative's efficient.",
        condition: function () {
            return this.people.length > 2;
        },
        effect: function (actionData) {
            actionData.timeBonus = 0.9;
        }
    });
    ids.perks.explorer = insert({
        id: "xpr",
        name: "gadabout",
        desc: "The veteran of the camp and leader of the exploration. " +
        "@people.nominative knows the best spot of resources.",
        actions: [
            ids.actions.roam.id,
            ids.actions.scour.id,
            ids.actions.explore.id
        ],
        iteration: 30,
        effect: function (actionData) {
            // Always find epic locations
            // And get an extras when exploring
            if (actionData.id === ids.actions.explore.id) {
                var extra = 2;
                actionData.giveSpan = actionData.giveSpan.map(function (value) {
                    return value + extra;
                });
            }
        }
    });
    ids.perks.tinkerer = insert({
        id: "tnr",
        name: "tinkerer",
        desc: "Everyone is amazed by how quickly @people.nominative can put together any contraption.",
        actions: [
            ids.actions.craft.id,
            ids.actions.build.id
        ],
        iteration: 30,
        effect: function (actionData) {
            actionData.timeBonus = 0.5;
        }
    });
    ids.perks.healer = ({
        id: "hlr",
        name: "doctor",
        desc: "Knowing enough about medicine make @people.accusative confident to heal others.",
        actions: [
            ids.actions.heal.id
        ],
        ifHas: ids.buildings.small.pharmacy.id,
        iteration: 5,
        unlock: [
            ids.actions.nurse
        ]
    });
    ids.perks.harvester = insert({
        id: "hvt",
        name: "harvester",
        desc: "A real eagle eye that can spot goods twice as fast as anyone.",
        actions: [
            ids.actions.gather.id,
            ids.actions.harvestField.id,
            ids.actions.harvestPlot.id,
            ids.actions.drawFromRiver.id,
            ids.actions.drawFromWell.id
        ],
        iteration: 40,
        effect: function (actionData) {
            var ratio = 1.5;
            actionData.giveSpan = actionData.giveSpan.map(function (value) {
                return value * ratio;
            });
        }
    });
    ids.perks.lounger = insert({
        id: "lng",
        name: "lounger",
        desc: "Doing nothing all day's not gonna make things done.",
        actions: [
            ids.actions.sleep
        ],
        condition: function (person) {
            return person.stats.idle > (3 * time.day);
        },
        effect: function (actionData) {
            // Won't use energy while idle
            // Sleep longer
            actionData.timeBonus = -0.2;
        }
    });
    ids.perks.merchant = insert({
        id: "mrc",
        name: "merchant",
        desc: "The ancient art of trading have been one of the most important skill you could have.",
        action: [
            ids.actions.exchange
        ],
        iteration: 10,
        effect: function (actionData) {
            // Consume only 1 jewel per trade
            actionData.consume[0] = 1;
        }
    });
    /* eslint-enable valid-jsdoc */

    return /** @lends DataManager */ {
        time: time,
        ids: ids,
        /**
         * Get some data from the database
         * @param {ID} id - An id
         * @returns {Data}
         */
        get: function (id) {
            return db[id];
        },
        bindAll: function (context) {
            db.browse(function (data) {
                data.browse(function (field, key) {
                    if (isFunction(field)) {
                        data[key] = field.bind(context);
                    }
                });
            });
        }
    };
})();

