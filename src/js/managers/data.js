/* exported DataManager */

/**
 * Data holder
 */
const DataManager = (function iife () { // eslint-disable-line max-statements
    /* eslint-disable no-magic-numbers */

    const hoursPerDay = 24;
    const time = {
        minute: 1 / 60,
        hour: 1,
        day: 24,
        week: 7 * hoursPerDay,
        month: 30 * hoursPerDay,
        year: 365 * hoursPerDay,
    };

    const directions = [
        "north", "south", "east", "west",
        "north-east", "north-west", "south-east", "south-west",
    ];

    /**
     * @typedef {String} ID - A generated unique ID
     */
    /**
     * @typedef {Object} Data
     * @prop {String} name - The displayed name
     * @prop {String} [desc] - A description for tooltip
     */
    /**
     * @typedef {Object} UniqueData
     * @extends Data
     * @prop {ID} id - unique ID
     * @prop {Number} [order] - Order for display
     */
    /**
     * @typedef {Object} ConsumerData
     * @prop {Array<[Number, ID]>} consume - Return consumed resources
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
     * @prop {Array<[Number, ID]>} [give] - Return an array of given resources (can be replace by giveSpan and giveList combo)
     * @prop {Array<Number>} [giveSpan] - Span of randomness for give
     * @prop {Array} [giveList] - List to draw from for give
     * @prop {Array<ID>} [unlock] - Return an array of unlocked action for this person
     * @prop {Array<ID>} [lock] - Return an array of locked action for this person
     * @prop {Array<ID>} [unlockForAll] - Return an array of unlocked action for all
     * @prop {Array<ID>} [lockForAll] - Return an array of locked action for all
     * @prop {Function} [effect] - An effect to run
     * @prop {ID} [build] - Return an array of built buildings id
     * @prop {Number} [time=0] - In game time to do
     * @prop {Number} [timeDelta=0] - Added randomness to time (from -x to +x)
     * @prop {Number} [timeBonus=0] - From 0 to 1, a ratio for action duration (set to 1 and action time is 0)
     * @prop {Number} [energy=time*5] - Energy taken to do
     * @prop {Boolean} unique - This should only be done once
     * @prop {String} log - A log string to display when done
     */
    /**
     * @typedef {Object} BuildingData
     * @extends ActionData
     * @prop {Array<ID>} [unlock] - Return an array of unlocked action for all people
     * @prop {Array<ID>} [lock] - Return an array of locked action for all people
     * @prop {Array<ID>} [upgrade] - Return a building ID to upgrade
     * @prop {String} asset - Id of the graphical asset
     * @prop {Boolean} [shadow=false] - Building not accessible by player
     */
    /**
     * @typedef {Object} IncidentData
     * @extends ActionData
     * @prop {String} [yes="Ok"] - Text for the validate button
     * @prop {String} [no] - Text for the cancel button
     * @prop {Number} dropRate - Chance of getting it
     * @prop {Function} [onStart] - Function to execute on start (user validate popup)
     * @prop {Function} [onEnd] - Function to execute on end (The incident time run-out or instantly if no time)
     * @prop {String} [color] - The incident bar color (optional but recommended)
     */
    /**
     * @typedef {Object} PerkData
     * @extends UniqueData
     * @prop {Array<ID>} actions - Return the list of actions
     * @prop {Number} [iteration=0] - Number of time it take to have a 100% chance to get the perk
     */

    const ids = {
        resources: {
            gatherables: {
                common: {},
                uncommon: {},
                rare: {},
            },
            craftables: {
                basic: {},
                complex: {},
                advanced: {},
            },
            special: {},
        },
        buildings: {
            small: {},
            medium: {},
            big: {},
            special: {},
        },
        actions: {},
        locations: {
            near: {},
            far: {},
            epic: {},
        },
        incidents: {
            easy: {},
            medium: {},
            hard: {},
        },
        perks: {},
    };

    const db = {};

    /**
     * Add a new object to the database
     * @param {Data} data - Any data
     * @return {ID}
     */
    function insert (data) {
        const id = btoa(data.id);
        if (IS_DEV) {
            if (!data.id) {
                console.warn("Item with no id ", data);
            }
            if (db[id]) {
                console.warn("Two items have the same id ", data, db[id]);
            }
        }
        data.id = id;

        db[id] = data;

        return id;
    }

    /**
     * Return an HTML formated string for resources
     * @param {ID} id - Any resource ID
     * @param {Number} [amount] - Optional number of resources
     * @return {String}
     */
    function formatResource (id, amount) {
        return Resource.toString(db[id], amount);
    }

    /**
     * Surround a string with quote
     * @param {String} str - Any string
     * @return {String}
     */
    function quote (str) {
        return `<i class="quote">${str}</i>`;
    }

    /* eslint-disable valid-jsdoc */

    ids.option = "opt";

    ids.resources.room = insert({
        id: "rom",
        name: "room",
        desc: "A place for someone in the camp.",
        icon: "person",
        order: 0,
    });

    /* GATHERABLES COMMON */

    ids.resources.gatherables.common.water = insert({
        id: "wtr",
        name: "water",
        desc: "Water is definitely important to survive in this harsh environment.",
        icon: "water-bottle",
        dropRate: 100,
        order: 10,
    });
    ids.resources.gatherables.common.food = insert({
        id: "fod",
        name: "food",
        desc: "Everyone need food to keep his strength.",
        icon: "foodcan",
        dropRate: 90,
        order: 20,
    });
    ids.resources.gatherables.common.rock = insert({
        id: "rck",
        name: "rock",
        desc: quote("There's rocks everywhere ! Why would you bring this back ?"),
        icon: "rock",
        dropRate: 100,
        order: 30,
    });
    ids.resources.gatherables.common.scrap = insert({
        id: "scp",
        name: "scrap metal",
        desc: "An old rusty piece of metal.",
        icon: "metal-scraps",
        dropRate: 60,
        order: 40,
    });

    ids.people = insert({
        id: "plp",
        name: "people",
        desc: "The workforce and the bane of the camp.",
        needs: [
            [1 / time.day, ids.resources.gatherables.common.water, "thirsty"],
            [1 / time.day, ids.resources.gatherables.common.food, "starving"],
        ],
        dropRate: 0.001,
    });

    /* GATHERABLES UNCOMMON */

    ids.resources.gatherables.uncommon.bolts = insert({
        id: "blt",
        name: "nuts and bolts",
        desc: "Little metal nuts and bolts to fasten anything in place.",
        icon: "nuts-and-bolts",
        dropRate: 65,
        order: 50,
    });
    ids.resources.gatherables.uncommon.sand = insert({
        id: "snd",
        name: "sand",
        desc: "Just pure fine sand.",
        icon: "sand-pile",
        dropRate: 50,
        order: 55,
    });
    ids.resources.gatherables.uncommon.oil = insert({
        id: "oil",
        name: "fuel",
        desc: "About a liter of gas-oil.",
        icon: "jerrycan",
        dropRate: 20,
        order: 60,
    });

    /* GATHERABLES RARE */

    ids.resources.gatherables.rare.medication = insert({
        id: "mct",
        name: "medication",
        desc: "An unlabeled medication, hope it's still good.",
        icon: "medications",
        dropRate: 7,
        order: 70,
    });
    ids.resources.gatherables.rare.electronic = insert({
        id: "elc",
        name: "electronics",
        desc: "Some basic micro-electronics components.",
        icon: "electronic-parts",
        dropRate: 10,
        order: 75,
    });

    /* GATHERABLES SPECIAL */

    ids.resources.special.ruins = insert({
        id: "run",
        name: "location",
        desc: "Directions to a point of interest found earlier.",
        icon: "map",
        order: 80,
        dropRate: 0.6,
    });
    ids.resources.special.quartz = insert({
        id: "qtz",
        name: "quartz cristal",
        desc: "A rough uncut gem of quartz. Quite valuable.",
        icon: "gem",
        dropRate: 10,
        order: 77,
    });

    ids.resources.craftables.basic.component = insert({
        id: "cmp",
        name: "component",
        desc: "Some mechanical parts for others craftables.",
        icon: "pipes-large",
        consume: [
            [2, ids.resources.gatherables.common.scrap],
            [2, ids.resources.gatherables.uncommon.bolts],
        ],
        dropRate: 120,
        order: 110,
    });


    /* BUILDINGS SPECIAL */

    ids.buildings.special.wreckage = insert({
        id: "wrk",
        name: "wreckage",
        desc: "Remainings of a car.",
        asset: "wreckage",
        order: 0,
    });

    /* ACTIONS */

    ids.actions.launch = insert({
        id: "lnc",
        name: "start engine",
        desc: "Finally start the engine of the new vehicle.",
        time: 3,
        isOut: 1,
        unique: true,
        consume: [
            [10, ids.resources.gatherables.uncommon.oil],
        ],
        effect () {
            MessageBus.notify(MessageBus.MSG_TYPES.WIN);
        },
        log () {
            const duration = this.getSurvivalDuration();
            return `After ${duration}, it's finally possible to leave this damned crash-site.<br/>
                Everyone shove itself into the car and dream of the better life waiting at the end of the road.`;
        },
        order: 15,
    });
    ids.actions.exchange = insert({
        id: "exc",
        name: "exchange",
        desc: "Caravan passing by carry lots of useful stuff, let's see what's possible to trade.",
        time: 7,
        energy: 20,
        consume: [
            [2, ids.resources.craftables.complex.jewelry],
        ],
        giveSpan: [2, 3],
        giveList: [
            ids.resources.craftables.basic,
            ids.resources.craftables.complex,
        ],
        log: "@people.name manage to trade a couple of jewelries for @give.",
        order: 10,
    });
    ids.actions.nurse = insert({
        id: "nrs",
        name: "nurse",
        desc: "Look after the health of the most needed one.",
        time: 2,
        energy: 1,
        consume: [
            [2, ids.resources.gatherables.rare.medication],
        ],
        effect (actio, option, effect) {
            let lowest = null;
            this.people.forEach((person) => {
                if (!lowest || person.life < lowest.life) {
                    lowest = person;
                }
            });
            lowest.updateLife(99);
            effect.cured = lowest;
        },
        log: "Thanks to @people.name, @cured.name feel better.",
        order: 7,
    });
    ids.actions.heal = insert({
        id: "hel",
        name: "heal",
        desc: "\"I really hope those pills are still good.\"",
        time: 2,
        energy: 1,
        consume: [
            [2, ids.resources.gatherables.rare.medication],
        ],
        effect (action, option, effect) {
            let lifeChange = 99;
            const hasPharma = this.buildings.has(ids.buildings.small.pharmacy);
            const isHealer = action.owner.hasPerk(ids.perks.healer);
            if (!hasPharma && !isHealer && MathsUtils.random() < 2 / 5) {
                lifeChange = -10;
                // remember for log
                effect.wasBad = true;
            }
            action.owner.updateLife(lifeChange);
        },
        log (effect) {
            return effect.wasBad ?
                "After feeling not so well, @people.name realise taking these pills took a hit on his health." :
                "This time, it actually improve @people.name's health.";
        },
        order: 6,
    });
    ids.actions.sleep = insert({
        id: "slp",
        name: "sleep",
        desc: "Get some rest to restore energy.",
        time: 7,
        energy: 0,
        effect (action) {
            action.owner.setEnergy(this.incidents.has(ids.incidents.medium.fever) ? 40 : 100);
        },
        unlock: [
            ids.actions.heal,
        ],
        log: "@people.name feels well rested now.",
        order: 5,
    });
    ids.actions.harvestPlot = insert({
        id: "hrp",
        name: "harvest crops",
        desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
        time: 4,
        consume: [
            [1, ids.resources.gatherables.common.water],
        ],
        giveSpan: [1.5, 2],
        giveList: [
            ids.resources.gatherables.common.food,
        ],
        log: "Our crops produce @give.",
        order: 70,
    });
    ids.actions.harvestField = insert({
        id: "hrf",
        name: "harvest crops",
        desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
        time: 6,
        consume: [
            [2, ids.resources.gatherables.common.water],
        ],
        giveSpan: [4, 5],
        giveList: [
            ids.resources.gatherables.common.food,
        ],
        log: "Our crops produce @give.",
        order: 70,
    });
    ids.actions.drawFromRiver = insert({
        id: "dfr",
        name: "draw water",
        desc: `Get some ${formatResource(ids.resources.gatherables.common.water)} from the river.`,
        time: 8,
        energy: 50,
        isOut: 1,
        condition (action) {
            return !action.owner.actions.has(ids.actions.drawFromWell);
        },
        giveSpan: [2, 6],
        giveList: [
            ids.resources.gatherables.common.water,
        ],
        log: "Coming back from the river, @people.name brings @give with @people.accusative.",
        order: 60,
    });
    ids.actions.drawFromWell = insert({
        id: "dfw",
        name: "draw water",
        desc: `Get some ${formatResource(ids.resources.gatherables.common.water)} from our well.`,
        time: 2,
        energy: 15,
        giveSpan: [1, 3],
        giveList: [
            ids.resources.gatherables.common.water,
        ],
        log: "Using our well, @people.name draw @give.",
        order: 60,
    });
    ids.actions.drawFromPump = insert({
        id: "dfp",
        name: "draw water",
        desc: `Get some ${formatResource(ids.resources.gatherables.common.water)} at the pump.`,
        time: 2,
        giveSpan: [3, 3],
        giveList: [
            ids.resources.gatherables.common.water,
        ],
        log: "Using our pump, @people.name draw @give.",
        order: 60,
    });
    ids.actions.build = insert({
        id: "bui",
        name: "build",
        desc: "Put together some materials to come up with what looks like a building.",
        build: ids.option,
        options () {
            return this.possibleBuildings();
        },
        order: 50,
    });
    ids.actions.craft = insert({
        id: "crf",
        name: "craft",
        desc: "Use some resources to tinker something useful.",
        time: 4,
        energy: 10,
        options () {
            return this.unlockedCraftables();
        },
        give: [
            [1, ids.option],
        ],
        unlock: [
            ids.actions.build,
        ],
        log: "@people.name succeeds to craft @give.",
        order: 30,
    });
    ids.actions.explore = insert({
        id: "xpl",
        name: "explore",
        desc: `Remember that ${formatResource(ids.resources.special.ruins)} found the other day ?
            Let's see what can be gather there.`,
        time: time.day,
        energy: 100,
        isOut: 1,
        consume: [
            [2, ids.resources.gatherables.common.water],
            [1, ids.resources.gatherables.common.food],
            [1, ids.resources.special.ruins],
        ],
        options () {
            return this.knownLocations;
        },
        giveSpan: [8, 10],
        giveList: [
            ids.resources.special.quartz,
        ],
        log: "All locations should have own log",
        order: 20,
    });
    const ruinsDropRate = db[ids.resources.special.ruins].dropRate;
    ids.actions.scour = insert({
        id: "scr",
        name: "scour",
        desc: "Knowledge of the area allows for better findings.",
        time: 4,
        isOut: 1,
        consume: [
            [1, ids.resources.gatherables.common.water],
        ],
        giveSpan: [(ruinsDropRate * 1.5) / 2, ((ruinsDropRate * 1.5) + 1) / 2], // twice more ruin drop rate
        giveList: [
            ids.resources.special.ruins,
        ],
        log (effect) {
            let log;
            if (effect.give) {
                const location = Utils.randomize(ids.locations);
                if (!this.knownLocations.includes(location)) {
                    this.knownLocations.push(location);
                }
                effect.location = Utils.an(DataManager.get(location).name);
                log = "@people.name knew @people.nominative could find @location towards @direction.";
            }
            else {
                log = "No special location towards @direction.";
            }
            effect.direction = directions.random();
            return log;
        },
        order: 10,
    });
    ids.actions.roam = insert({
        id: "ram",
        name: "roam",
        desc: `Explore the surroundings hoping to find a ${formatResource(ids.resources.special.ruins)}.`,
        time: 5,
        isOut: 1,
        consume: [
            [1, ids.resources.gatherables.common.water],
        ],
        condition (action) {
            return !action.owner.actions.has(ids.actions.scour);
        },
        unlock: [
            ids.actions.explore,
        ],
        unlockAfter: [
            [9, ids.actions.scour],
        ],
        giveSpan: [ruinsDropRate / 2, (ruinsDropRate + 1) / 2],
        giveList: [
            ids.resources.special.ruins,
        ],
        log (effect) {
            let log;
            if (effect.give) {
                const location = Utils.randomize({
                    near: ids.locations.near,
                    far: ids.locations.far,
                });
                if (!this.knownLocations.includes(location)) {
                    this.knownLocations.push(location);
                }
                effect.location = Utils.an(DataManager.get(location).name);
                log = "Heading to the @direction, @people.name spots @location";
            }
            else {
                log = "@people.name found nothing special towards the @direction.";
            }
            effect.direction = Utils.capitalize(directions.random());
            return log;
        },
        order: 10,
    });
    ids.actions.gather = insert({
        id: "gtr",
        name: "gather resources",
        desc: "Go out to bring back resources, that's the best way to survive.",
        time: 3,
        isOut: 1,
        unlock: [
            ids.actions.roam,
            ids.actions.craft,
        ],
        giveSpan: [3, 6],
        giveList: ids.resources.gatherables.flatten(),
        log: "@people.name comes back with @give.",
        order: 1,
    });
    ids.buildings.special.firePit = insert({
        id: "fp1",
        name: "fire pit",
        asset: "fire",
        shadow: true,
    });
    ids.buildings.special.firePit2 = insert({
        id: "fp2",
        name: "fire pit",
        upgrade: ids.buildings.special.firePit,
        asset: "fire2",
        shadow: true,
    });
    ids.buildings.special.forum = insert({
        id: "fr0",
        name: "forum",
        desc: "The center and start of our settlement.",
        unlockForAll: [
            ids.actions.sleep,
        ],
        upgrade: ids.buildings.special.wreckage,
        give: [
            [1, ids.resources.room],
        ],
        build: ids.buildings.special.firePit,
        asset: "forum",
    });
    ids.actions.settle = insert({
        id: "stl",
        name: "settle here",
        desc: "Ok, let's settle right there !",
        time: 2,
        energy: 0,
        effect () {
            this.flags.settled = 1;
        },
        unlock: [
            ids.actions.gather,
        ],
        build: ids.buildings.special.forum,
        log: "Since the global war, the environment is rotten with radiations. " +
            "It won't be easy to survive in the middle of these wastelands, but there's no other choice now.",
        order: 0,
        unique: true,
    });
    ids.actions.look = insert({
        id: "lok",
        name: "look around",
        desc: quote("What am I doing here ?"),
        time: 1,
        energy: 0,
        effect () {
            TimerManager.timeout(() => {
                LogManager.log("I'll need a shelter.", MessageBus.MSG_TYPES.LOGS.QUOTE);
            }, GameController.TICK_LENGTH / 2);
        },
        give: [
            [8, ids.resources.gatherables.common.water],
            [6, ids.resources.gatherables.common.food],
            [2, ids.resources.craftables.basic.component],
        ],
        unlock: [
            ids.actions.settle,
        ],
        log: "After some reflexion, @people.name remembers the crash. " +
            "@people.nominative grabs @give from @people.possessive car trunk.",
        order: 0,
        unique: true,
    });
    ids.actions.wakeUp = insert({
        id: "wku",
        name: "wake up",
        unlock: [
            ids.actions.look,
        ],
        effect (action) {
            action.owner.updateEnergy(100);
            action.owner.updateLife(100);
        },
        log: "@people.name gets up painfully.",
        order: 0,
        unique: true,
    });

    /* CRAFTABLES BASIC */

    ids.resources.craftables.basic.stone = insert({
        id: "stn",
        name: "smooth stone",
        desc: "A round and well polish stone.",
        icon: "stone",
        consume: [
            [3, ids.resources.gatherables.common.rock],
        ],
        dropRate: 100,
        order: 90,
    });
    ids.resources.craftables.basic.tool = insert({
        id: "tol",
        name: "tool",
        desc: "The base for any tinkerer.",
        icon: "tools",
        consume: [
            [1, ids.resources.craftables.basic.component],
            [2, ids.resources.gatherables.common.rock],
        ],
        dropRate: 90,
        order: 111,
    });

    /* BUILDINGS SMALL */

    ids.buildings.small.furnace = insert({
        id: "frn",
        name: "furnace",
        desc: "Survival require to craft as much as to gather things.",
        time: 7,
        consume: [
            [8, ids.resources.gatherables.common.rock],
            [2, ids.resources.gatherables.uncommon.oil],
        ],
        asset: "",
        order: 15,
        log: `A simple furnace that can smelt small things
            like ${formatResource(ids.resources.gatherables.uncommon.sand)} or 
            ${formatResource(ids.resources.gatherables.rare.electronic)}.`,
    });
    ids.resources.craftables.basic.glass = insert({
        id: "gls",
        name: "glass pane",
        desc: "A see-through building component.",
        icon: "glass-pane",
        ifHas: ids.buildings.small.furnace,
        consume: [
            [4, ids.resources.gatherables.uncommon.sand],
        ],
        dropRate: 60,
        order: 100,
    });
    ids.buildings.small.forum1 = insert({
        id: "fr1",
        name: "forum+1",
        desc: `Add ${formatResource(ids.resources.room, 1)} to the forum.`,
        time: 2,
        upgrade: ids.buildings.special.forum,
        consume: [
            [6, ids.resources.gatherables.uncommon.bolts],
            [4, ids.resources.gatherables.common.scrap],
        ],
        give: [
            [1, ids.resources.room],
        ],
        asset: "forum1",
        order: 10,
        log: "More space to sleep means more people joining and helping.",
    });
    ids.buildings.small.plot = insert({
        id: "plt",
        name: "farm plot",
        desc: `A little arranged plot of soil to grow some ${formatResource(ids.resources.gatherables.common.food)}.`,
        time: 9,
        consume: [
            [5, ids.resources.gatherables.common.food],
            [10, ids.resources.gatherables.uncommon.sand],
        ],
        unlockForAll: [
            ids.actions.harvestPlot,
        ],
        asset: "plot",
        order: 12,
        log: `Crops required care but that's going to help keeping a constant stock of
            ${formatResource(ids.resources.gatherables.common.food)}.`,
    });
    ids.buildings.small.pharmacy = insert({
        id: "phr",
        name: "pharmacy",
        desc: quote(`Maybe we should avoid letting ${formatResource(ids.resources.gatherables.rare.medication)}s
            rot in plain sunlight !`),
        time: 6,
        consume: [
            [5, ids.resources.gatherables.rare.medication],
            [4, ids.resources.craftables.basic.component],
        ],
        asset: "pharmacy",
        order: 16,
        log: `Sorting the ${formatResource(ids.resources.gatherables.rare.medication)}s
            should prevent further mistakes and bad reaction.`,
    });
    ids.buildings.small.well = insert({
        id: "wel",
        name: "well",
        desc: "Just a large hole into the ground.",
        time: 16,
        consume: [
            [10, ids.resources.gatherables.common.rock],
            [4, ids.resources.craftables.basic.tool],
        ],
        give: [
            [5, ids.resources.gatherables.common.water],
        ],
        unlockForAll: [
            ids.actions.drawFromWell,
        ],
        lock: [
            ids.actions.drawFromRiver,
        ],
        asset: "",
        order: 13,
        log: `Drawing ${formatResource(ids.resources.gatherables.common.water)} from the ground
            should allow to further polish ${formatResource(ids.resources.gatherables.common.rock)}.`,
    });

    /* BUILDINGS MEDIUM */

    ids.buildings.medium.forum2 = insert({
        id: "fr2",
        name: "forum+2",
        desc: `Add ${formatResource(ids.resources.room, 1)} to the camp.`,
        time: 5,
        consume: [
            [10, ids.resources.gatherables.uncommon.sand],
            [2, ids.resources.craftables.basic.stone],
            [3, ids.resources.craftables.basic.glass],
        ],
        upgrade: ids.buildings.small.forum1,
        give: [
            [1, ids.resources.room],
        ],
        asset: "forum2",
        order: 20,
        log: "Another room for someone to join. So far, so good.",
    });
    ids.buildings.medium.plot1 = insert({
        id: "fil",
        name: "field",
        desc: `A larger crop field to produce more ${formatResource(ids.resources.gatherables.common.food)}.`,
        time: 10,
        lockForAll: [
            ids.actions.harvestPlot,
        ],
        unlockForAll: [
            ids.actions.harvestField,
        ],
        consume: [
            [20, ids.resources.gatherables.common.food],
            [5, ids.resources.craftables.basic.tool],
            [3, ids.resources.gatherables.rare.medication],
        ],
        upgrade: ids.buildings.small.plot,
        asset: "plot+1",
        order: 25,
        log: `This should be enough
            to provide ${formatResource(ids.resources.gatherables.common.food)} for our small encampment.`,
    });
    ids.buildings.medium.forge = insert({
        id: "frg",
        name: "forge",
        desc: "A good upgrade to the furnace.",
        time: 10,
        consume: [
            [10, ids.resources.craftables.basic.stone],
            [6, ids.resources.gatherables.uncommon.oil],
            [2, ids.resources.craftables.basic.tool],
        ],
        upgrade: ids.buildings.small.furnace,
        asset: "furnace+1",
        order: 27,
        log: "A big fire is now roaring in the forge. It should now be possible to forge more complex parts.",
    });

    /* CRAFTABLES COMPLEX */

    ids.resources.craftables.complex.brick = insert({
        id: "brk",
        name: "brick",
        desc: "Will give walls for larger constructions.",
        icon: "brick",
        ifHas: ids.buildings.small.well,
        consume: [
            [1, ids.resources.craftables.basic.stone],
            [1, ids.resources.craftables.basic.tool],
        ],
        dropRate: 80,
        order: 112,
    });
    ids.resources.craftables.complex.circuit = insert({
        id: "cir",
        name: "circuit",
        desc: "That's a little rough, but it's actually a functioning circuit board.",
        icon: "electronic-circuit-board",
        consume: [
            [2, ids.resources.gatherables.common.scrap],
            [2, ids.resources.craftables.basic.component],
            [3, ids.resources.gatherables.rare.electronic],
        ],
        dropRate: 60,
        order: 114,
    });
    ids.resources.craftables.complex.metalPipe = insert({
        id: "mtp",
        name: "metal pipe",
        desc: "Forged from junk metal.",
        icon: "pipes-small",
        ifHas: ids.buildings.medium.forge,
        consume: [
            [4, ids.resources.gatherables.common.scrap],
            [1, ids.resources.craftables.basic.tool],
        ],
        dropRate: 80,
        order: 115,
    });

    /* CRAFTABLES ADVANCED */

    ids.resources.craftables.advanced.jewelry = insert({
        id: "jwl",
        name: "jewelry",
        desc: "A really beautiful ornament useful for trading.",
        icon: "jewelry",
        ifHas: ids.buildings.small.furnace,
        consume: [
            [4, ids.resources.gatherables.rare.electronic],
            [2, ids.resources.special.quartz],
        ],
        dropRate: 40,
        order: 117,
    });

    /* BUILDINGS BIG */

    ids.buildings.big.workshop = insert({
        id: "wrs",
        name: "workshop",
        desc: "Having a dedicated place for the crafting work would allow to make more complex crafts.",
        time: 3 * time.day,
        energy: 90,
        ifHas: ids.buildings.medium.forge,
        consume: [
            [6, ids.resources.gatherables.common.scrap],
            [5, ids.resources.craftables.basic.glass],
            [10, ids.resources.craftables.basic.tool],
            [15, ids.resources.craftables.complex.brick],
        ],
        asset: "",
        order: 35,
        log: "Good organisation enable to put together new work.",
    });
    ids.resources.craftables.complex.furniture = insert({
        id: "fnt",
        name: "furniture",
        desc: "A proper settlement needs better than pile of trash for table and seats.",
        icon: "glass-table",
        ifHas: ids.buildings.big.workshop,
        consume: [
            [2, ids.resources.craftables.basic.glass],
            [2, ids.resources.craftables.complex.metalPipe],
        ],
        dropRate: 40,
        order: 116,
    });
    ids.buildings.big.forum3 = insert({
        id: "fr3",
        name: "forum+3",
        desc: `Add ${formatResource(ids.resources.room, 2)} to the camp.`,
        time: 6,
        consume: [
            [10, ids.resources.craftables.complex.brick],
            [2, ids.resources.craftables.complex.furniture],
            [6, ids.resources.craftables.basic.glass],
        ],
        upgrade: ids.buildings.medium.forum2,
        give: [
            [2, ids.resources.room],
        ],
        asset: "forum+3",
        order: 30,
        log: "All the forum space is now used for sleeping place.",
    });
    ids.resources.craftables.advanced.engine = insert({
        id: "egn",
        name: "engine",
        desc: "Amazing what can be done with all those scraps !",
        icon: "engine",
        ifHas: ids.buildings.big.workshop,
        consume: [
            [10, ids.resources.gatherables.uncommon.oil],
            [5, ids.resources.craftables.basic.tool],
            [5, ids.resources.craftables.complex.metalPipe],
        ],
        dropRate: 30,
        order: 120,
    });
    ids.resources.craftables.advanced.computer = insert({
        id: "cmt",
        name: "computer",
        desc: "Well, Internet is down since 2024 but it can still be useful.",
        icon: "computer",
        ifHas: ids.buildings.big.workshop,
        consume: [
            [10, ids.resources.craftables.basic.component],
            [7, ids.resources.craftables.basic.tool],
            [3, ids.resources.craftables.complex.circuit],
        ],
        dropRate: 20,
        order: 130,
    });
    ids.buildings.big.radio = insert({
        id: "rdo",
        name: "radio-station",
        desc: "Putting together a radio could allow to contact other people around the camp.",
        time: 6,
        ifHas: ids.buildings.big.workshop,
        consume: [
            [4, ids.resources.craftables.complex.circuit],
            [1, ids.resources.craftables.advanced.computer],
        ],
        effect () {
            DataManager.get(ids.people).dropRate = 1;
        },
        asset: "",
        order: 37,
        log: "Having a way to make contact should attract more people to the camp, either they want to join or trade.",
    });
    ids.buildings.big.pump = insert({
        id: "pmp",
        name: "water pump",
        desc: `A buried contraption that collect ${formatResource(ids.resources.gatherables.common.water)} from
            the earth moisture.`,
        time: 3 * time.day,
        energy: 120,
        consume: [
            [20, ids.resources.craftables.basic.stone],
            [5, ids.resources.craftables.complex.metalPipe],
            [1, ids.resources.craftables.advanced.engine],
        ],
        upgrade: ids.buildings.small.well,
        unlockForAll: [
            ids.actions.drawFromPump,
        ],
        lockForAll: [
            ids.actions.drawFromRiver,
            ids.actions.drawFromWell,
        ],
        asset: "",
        order: 36,
        log: `A big upgrade to the well !
            Now there's a continuous flow of ${formatResource(ids.resources.gatherables.common.water)} coming up.`,
    });
    ids.buildings.big.trading = insert({
        id: "trd",
        name: "trading post",
        desc: "Since the radio station bring a handful of merchant, better take advantage of it.",
        time: time.day,
        energy: 70,
        ifHas: ids.buildings.big.radio,
        consume: [
            [2, ids.resources.craftables.basic.glass],
            [10, ids.resources.craftables.complex.brick],
            [2, ids.resources.craftables.complex.furniture],
        ],
        unlockForAll: [
            ids.actions.exchange,
        ],
        asset: "",
        order: 38,
        log: "Arranging some space allow to trade with merchant caravan passing by.",
    });
    ids.buildings.big.module = insert({
        id: "mdl",
        name: "vehicle",
        desc: "This should be enough to hit the road and head towards a better place.",
        time: time.week,
        energy: 90,
        ifHas: ids.buildings.big.workshop,
        consume: [
            [15, ids.resources.gatherables.uncommon.oil],
            [5, ids.resources.craftables.complex.furniture],
            [1, ids.resources.craftables.advanced.computer],
            [2, ids.resources.craftables.advanced.engine],
        ],
        unlockForAll: [
            ids.actions.launch,
        ],
        asset: "",
        order: 40,
        log: "It don't looks so good, but sure thing it should runs well enough.",
    });

    /* NEAR LOCATIONS */

    ids.locations.near.mountain = insert({
        id: "mnt",
        name: "mountain",
        desc: "A nearby mountain that may contains some basic building resources",
        giveList: [
            ids.resources.gatherables.common.rock,
            ids.resources.gatherables.common.scrap,
            ids.resources.craftables.basic.component,
        ],
        log: "That was hard to climb those mountains, but at least @people.name find @give.",
        dropRate: 90,
    });
    ids.locations.near.desert = insert({
        id: "dst",
        name: "desert",
        desc: `Not much to find in a desert,
            but that's for sure the best place to get ${formatResource(ids.resources.gatherables.uncommon.sand)}.`,
        giveList: [
            ids.resources.gatherables.common.scrap,
            ids.resources.gatherables.uncommon.oil,
            ids.resources.gatherables.uncommon.sand,
        ],
        log: "Dunes everywhere give a felling of hopelessness. Here's @give for the stock.",
        dropRate: 100,
    });
    ids.locations.near.supermarket = insert({
        id: "hng",
        name: "hangar",
        desc: "A huge hangar. It was certainly raided before by others, but there may be something to grab.",
        giveList: [
            ids.resources.gatherables.common.food,
            ids.resources.gatherables.rare.medication,
            ids.resources.craftables.basic.glass,
        ],
        log: "Quite easy to loot, @people.name returns with @give.",
        dropRate: 80,
    });

    /* FAR LOCATIONS */

    ids.locations.far.river = insert({
        id: "rvr",
        name: "river",
        desc: `Quite rare to find ${formatResource(ids.resources.gatherables.common.water)} on those wastelands.
            This is a valuable location to find.`,
        unlockForAll: [
            ids.actions.drawFromRiver,
        ],
        giveList: [
            ids.resources.gatherables.common.water,
            ids.resources.gatherables.uncommon.bolts,
            ids.resources.craftables.basic.stone,
        ],
        log: "It's nice by the river, @people.name found @give.",
        dropRate: 30,
    });
    ids.locations.far.ruin = insert({
        id: "orn",
        name: "old ruin",
        desc: "This is a huge underground network of rooms linked by narrow hallways. " +
            "This should have provided shelter a long time ago.",
        giveList: [
            ids.resources.gatherables.rare.electronic,
            ids.resources.craftables.basic.component,
            ids.resources.craftables.basic.tool,
        ],
        log: "Amazing no-one get lost in those caves to get @give.",
        dropRate: 50,
    });

    /* EPIC LOCATIONS */

    ids.locations.epic.building = insert({
        id: "bld",
        name: "buried building",
        desc: "Digging up this building, uncover stuff preserved from looting and environment.",
        giveList: [
            ids.resources.gatherables.rare.medication,
            ids.resources.craftables.basic.glass,
            ids.resources.craftables.complex.circuit,
        ],
        log: "Impossible to guess what that building was, but it sure was interesting. @people.name find @give.",
        dropRate: 10,
    });
    ids.locations.epic.spaceship = insert({
        id: "swr",
        name: "old wreckage",
        desc: "This rusty vehicle remains was in good enough shape in order to allow to find useful parts inside.",
        giveList: [
            ids.resources.gatherables.rare.electronic,
            ids.resources.craftables.basic.tool,
            ids.resources.craftables.complex.furniture,
        ],
        log: "Tearing apart this wreckage allow to salvage @give.",
        dropRate: 5,
    });

    /* EASY INCIDENTS */

    ids.incidents.easy.chest = insert({
        id: "chs",
        name: "Strange old chest",
        desc: "While exploring, a rusty container was found in the middle of rubbles. " +
            "It might contains rare resources, but there's risks to fiddle with it ?",
        yes: "Open it up",
        no: "Leave it",
        onStart (incident, effect) {
            if (MathsUtils.random() < 0.7) {
                const give = Utils.randomize(ids.resources.craftables);
                this.earn(1, give);
                effect.give = Utils.formatArray([[1, give]]);
            }
            else {
                const person = this.people.getValues().random();
                const amount = MathsUtils.constrain(MathsUtils.random(10, 30), 0, person.life - 1);
                person.updateLife(-amount);
                effect.person = person;
                effect.lost = amount;
            }
        },
        dropRate: 30,
        log (effect) {
            let log;
            if (effect.give) {
                log = LogManager.personify("nothing to fear, @give was found inside the chest.", effect);
            }
            else if (effect.person) {
                let message = "a loud explosion blast @name away as soon as @nominative try to open the chest. ";
                if (effect.lost < 20) {
                    message += "thankfully, more scared than hurt, @name get out with some scratches.";
                }
                else {
                    message += "@name is badly hurt in the process.";
                }
                log = LogManager.personify(message, effect.person);
            }
            return log;
        },
    });
    ids.incidents.easy.fortune = insert({
        id: "frt",
        name: "an old woman approach",
        desc: "Someone point out to a silhouette in the distance. " +
            "What seams to be a very old woman is coming toward the camp.<br/>" +
            "As she get closer, she's visibly pointing her finger in a menacing manner " +
            "and mumble incomprehensible chatter. Her skin looks really badly burnt by radiation.",
        yes: "Listen to her",
        no: "Fend her away",
        onStart () {
            new Popup({
                name: "Fortune teller",
                desc: `After being calmly sit down, try to get what she's trying to say.<br/>
                    ${quote("Long path ahead, full of danger ... may do it ... but at what cost ?")}<br/>
                    ${quote("If mercy is shown, success will follow !")}`,
                yes: "Humm ... ok",
            }, "incident");
        },
        unique: true,
        dropRate: 70,
        log: "She then proceed on her lonely journey. " +
            "Listening to the fate that await can give chills. Does knowing the future is really helpful ?",
    });
    ids.incidents.easy.sandstorm = insert({
        id: "ssm",
        name: "sandstorm",
        desc: "The wind is blowing hard, carrying sand and dust. It will be impossible to go out until it end.",
        time: 16,
        timeDelta: 4,
        color: "#f7ed33",
        dropRate: 90,
        log: "A sandstorm has started and prevent anyone from leaving the camp.",
    });

    /* MEDUIM  INCIDENTS */

    ids.incidents.medium.acidRain = insert({
        id: "acr",
        name: "acid rain",
        desc: "A big dark cloud is coming from the North, " +
            "which means that it's going to rain acid droplet, like stingers from the sky.<br/>" +
            "Going out now will be dangerous.",
        time: time.day,
        timeDelta: time.day / 2,
        color: "#d351e8",
        dropRate: 50,
        lifeLose: 3,
        log: "Rain is pouring and it burn the skin pretty badly. A pretty good reason to stay inside for now.",
    });
    ids.incidents.medium.beggar = insert({
        id: "bgr",
        name: "strange beggar",
        desc: `A lone traveler has a deal to propose:
            Invest ${formatResource(ids.resources.special.quartz, 3)} now and
            ${quote("for sure")}, he'll return with more worth of goods.`,
        condition () {
            return this.resources.has(ids.resources.special.quartz) &&
                this.resources.get(ids.resources.special.quartz).has(4);
        },
        yes: "Acquiesce",
        no: "No way",
        consume: [
            [2, ids.resources.special.quartz],
        ],
        giveList: [
            ids.resources.gatherables,
            ids.resources.craftables.basic,
        ],
        giveSpan: [7, 8],
        onEnd (incident, effect) {
            if (MathsUtils.random() < 0.2) {
                effect.give = null;
                effect.log = "Looks like the beggar is not coming back this time.";
            }
            else {
                effect.log = "As promised, the beggar came back. He gratefully give back @give.";
            }
        },
        time: 8 * time.day,
        dropRate: 20,
        log: "Trusting a random stranger might just cost you some resources, but who knows ...",
    });
    ids.incidents.medium.fever = insert({
        id: "fvr",
        name: "fever rash",
        desc: "In few hours, everyone develop a very bad rash and extreme fever. " +
            "With cotton leg and heads about to explode, no one is willing to do much.",
        time: 2 * time.day,
        timeDelta: 6 * time.hour,
        color: "#9def39",
        dropRate: 50,
        log: "Illness spread out in no time and weaken everyone.",
    });
    ids.incidents.medium.harmonica = insert({
        id: "hrm",
        name: "a song into the wild",
        desc: "At night everyone gather around the camp-fire to alleviate the day's burden." +
            "Someone draw out a harmonica and a melody wander slowly into the night.",
        unique: true,
        yes: "Take some time to appreciate",
        dropRate: 40,
        log: "It's good to remember to relax from time to time.",
    });
    const strayConsume = [
        [3, ids.resources.gatherables.common.water],
        [3, ids.resources.gatherables.common.food],
    ];
    ids.incidents.medium.strayDog = insert({
        id: "std",
        name: "stray dog",
        desc: `Looks like a wild dog is lurking around the food stash.<br/>
            He seams really weakened by his hunger and thirst.
            Giving him ${Utils.formatJoin(strayConsume.map(item => formatResource(item[1], item[0])))} should
            make him stay.<br/>
            Does there's enough resources to have another mouth to feed ?`,
        unique: true,
        yes: "Give him some water and food",
        no: "Ignore him",
        consume: strayConsume,
        log: "With caution, he accept this offering. " +
            "He then proceed to hide in the forum's shadow and quickly falls asleep.",
    });

    /* HARD INCIDENTS */

    ids.incidents.hard.drought = insert({
        id: "drg",
        name: "drought",
        desc: `The climate is so hot, everyone needs more ${formatResource(ids.resources.gatherables.common.water)}.`,
        condition () {
            return this.hasEnough(ids.resources.gatherables.common.water, 5) &&
                this.isBuildingDone(ids.buildings.small.well);
        },
        time: 3 * time.day,
        timeDelta: 10,
        color: "#f73a18",
        dropRate: 10,
        multiplier: 3,
        log: `A harsh drought has fallen,
            ${formatResource(ids.resources.gatherables.common.water)} will be consumed faster as a result.`,
    });
    ids.incidents.hard.lookBack = insert({
        id: "lkb",
        name: "look back",
        desc: "It's been so long since this settlement start that it feel like a new life now.",
        unique: true,
        yes: "Remember",
        onStart (incident, effect) {
            effect.duration = this.getSurvivalDuration();
        },
        dropRate: 30,
        log: "The camp hold well for @duration in this harsh environment. Amazing !",
    });
    ids.incidents.hard.attack = insert({
        id: "atk",
        name: "attack on bandits",
        desc: "While exploring the surroundings, a bandits camp was found a few hours of walk away.<br/>" +
            "Setting a surprise attack can lead to loot their belongings.<br/>" +
            "They seams to be quite well fortified though.",
        condition () {
            let allNotBusy = true;
            // ensure someone's not busy
            this.people.forEach(person => allNotBusy = allNotBusy && !person.busy);
            return allNotBusy;
        },
        unique: true,
        time: 6,
        timeDelta: 1,
        color: "#7a848c",
        yes: "Let's do this",
        no: "Leave them be",
        onStart () {
            const energyDrain = 6;
            this.people.forEach((person) => {
                if (!person.busy) {
                    person.setBusy(ids.incidents.hard.attack, energyDrain);
                }
            });
        },
        giveList: [
            ids.resources.gatherables,
            ids.resources.craftables.basic,
            ids.resources.craftables.complex,
        ],
        giveSpan: [8, 11],
        onEnd () {
            this.people.forEach((person) => {
                const healthLose = MathsUtils.random(10, 20);
                person.updateLife(healthLose);
                person.setBusy();
            });
        },
        dropRate: 200,
        log: "They put up quite a fight and everyone got hurt in the process. At least @give were stolen.",
    });

    // Ideas :

    // Incident conditioned by if the player accept or not the dog
    // Someone come and don't talk english
    // conversation between people (no impact) TODO: find a good way to manage blab
    // raiders (fight[All loose health] or give-up resources[The more you give-up, the more they come])
    // raiders can come for revenge after "attack on bandits"

    /* PERKS */

    // TODO: Add slight effect to perks
    ids.perks.first = insert({
        id: "fso",
        name: "first-one",
        desc: "The very first one to install the settlement.",
        actions: [
            ids.actions.settle,
        ],
        iteration: 0,
    });
    ids.perks.rookie = insert({
        id: "rki",
        name: "rookie",
        desc: "All group has a rookie, all @people.nominative want is to prove @people.nominative's efficient.",
        condition () {
            return this.people.length > 2;
        },
    });
    ids.perks.explorer = insert({
        id: "xpr",
        name: "gadabout",
        desc: "The veteran of the camp and leader of the exploration. " +
            "@people.nominative knows the best spot of resources.",
        actions: [
            ids.actions.roam,
            ids.actions.scour,
            ids.actions.explore,
        ],
        iteration: 30,
    });
    ids.perks.tinkerer = insert({
        id: "tnr",
        name: "tinkerer",
        desc: "Everyone is amazed by how quickly @people.nominative can put together any contraption.",
        actions: [
            ids.actions.craft,
            ids.actions.build,
        ],
        iteration: 30,
    });
    ids.perks.healer = insert({
        id: "hlr",
        name: "doctor",
        desc: "Knowing enough about medicine make @people.accusative confident to heal others.",
        actions: [
            ids.actions.heal,
        ],
        condition () {
            this.buildings.has(ids.buildings.small.pharmacy);
        },
        iteration: 5,
        // unlock: [
        //     ids.actions.nurse
        // ]
    });
    ids.perks.harvester = insert({
        id: "hvt",
        name: "harvester",
        desc: "A real eagle eye that can spot goods twice as fast as anyone.",
        actions: [
            ids.actions.gather,
            ids.actions.harvestField,
            ids.actions.harvestPlot,
            ids.actions.drawFromRiver,
            ids.actions.drawFromWell,
        ],
        iteration: 40,
    });
    ids.perks.lounger = insert({
        id: "lng",
        name: "lounger",
        desc: "Doing nothing all day's not gonna make things done.",
        actions: [
            ids.actions.sleep,
        ],
        condition (person) {
            return person.stats.idle > (3 * time.day);
        },
    });
    ids.perks.merchant = insert({
        id: "mrc",
        name: "merchant",
        desc: "The ancient art of trading is a boon if used well.",
        action: [
            ids.actions.exchange,
        ],
        iteration: 10,
    });
    /* eslint-enable valid-jsdoc */

    return /** @lends DataManager */ {
        time,
        ids,
        /**
         * Get some data from the database
         * @param {ID} id - An id
         * @return {Data}
         */
        get (id) {
            return id ? db[id] : null;
        },
        bindAll (context) { // FIXME: not very good design
            db.browse((data) => {
                data.browse((field, key) => {
                    if (Utils.isFunction(field)) {
                        data[key] = field.bind(context);
                    }
                });
            });
        },
    };
})();

