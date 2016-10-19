"use strict";

function GameController(holder, media) {
    this.holder = holder;
    this.media = media;
    this.resources = new Collection();
    this.buildings = new Collection();
    this.events = new Collection();
    this.collects = [];
    this.people = [];
    this.initialActions = new Collection();
    this.knownLocations = new Collection();
    this.flags = {
        ready: !1,
        paused: !1,
        settled: !1,
        survived: 0,
        popup: !1,
        productivity: 1
    };
    this.lastTick = performance.now();
    this._init();
    this.refresh();
}

function Asset(image, position) {
    this.image = image;
    this.position = {
        x: random.apply(null, (position.x + "").split("-")),
        y: random.apply(null, (position.y + "").split("-"))
    };
}

function MessageBus() {
    if (MessageBus.instance) throw new ReferenceError("An instance already exists.");
    this.observers = {};
}

function Action(owner, data) {
    this.locked = !0;
    this.running = !1;
    this.owner = owner;
    this.repeated = 0;
    this.data = {};
    this.location = !1;
    this.html = this.toHTML(data);
    this._init(data);
}

function Building(data) {
    this.number = 0;
    this._init(data);
    this.add(1);
}

function Event(data) {
    this.data = {};
    this.timer = null;
    this.html = this.toHTML();
    this._init(data);
}

function peopleFactory(amount) {
    amount = amount || 1;
    if (window.isDev) {
        var code = "Bot-" + random().toString(36).substr(-round(random(2, 22)), 3).toUpperCase();
        return Promise.resolve(new Array(amount).fill(new People(code)));
    }
    return People.randomName(amount).then(function(response) {
        var people = [];
        response.results.forEach(function(data) {
            var name = capitalize(data.name.first + ""), person = new People(name, data.gender);
            people.push(person);
        });
        return people;
    });
}

function People(name, gender) {
    this.name = name;
    this.gender = gender || "other";
    this.setPronouns();
    this.actions = new Collection();
    this.busy = !1;
    this.energy = 100;
    this.starving = !1;
    this.life = 100;
    this.thirsty = !1;
    this.stats = {
        actionsDone: {},
        idle: 0,
        age: 0
    };
    this.perk = null;
    this.plan = null;
    this.project = null;
    this.html = this.toHTML();
}

function Resource(data, count) {
    this.data = {};
    this.html = this.toHTML(data);
    this._init(data);
    this.count = 0;
    count && this.update(+count);
    this.warnLack = !1;
}

function prepareCanvas(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return {
        cnv: canvas,
        ctx: canvas.getContext("2d")
    };
}

function Collection() {
    this.items = {};
    this.length = 0;
}

function floor(x) {
    return x << 0;
}

function round(x) {
    return floor(x + .5);
}

function ceil(x) {
    return floor(x + 1);
}

function popup(data, onYes, CSSClasses) {
    if (!isFunction(onYes)) throw new TypeError("Popup need a confirm function");
    var holder = document.getElementById("main");
    CSSClasses = "popup" + (CSSClasses ? " " + CSSClasses : "");
    var box = wrap(CSSClasses);
    box.appendChild(wrap("title", capitalize(data.name)));
    box.appendChild(wrap("description", data.desc));
    var api = {
        remove: function() {
            box.remove();
            holder.classList.remove("backdrop");
        }
    }, yesButton = wrap("yes clickable", data.yes || "Ok");
    yesButton.addEventListener("click", function() {
        onYes();
        api.remove();
    });
    box.appendChild(yesButton);
    if (data.no) {
        var noButton = wrap("no clickable", data.no);
        noButton.addEventListener("click", api.remove);
        box.appendChild(noButton);
    }
    holder.appendChild(box);
    holder.classList.add("backdrop");
    box.style.top = floor((holder.offsetHeight - box.offsetHeight) / 2) + "px";
    return api;
}

function tooltip(html, data) {
    function _position(x, y) {
        var left = x + 10;
        left + tooltipWidth > bodyWidth && (left = bodyWidth - tooltipWidth);
        box.style.left = left + "px";
        box.style.top = y + 10 + "px";
    }
    var box = null, bodyWidth = document.body.offsetWidth, tooltipWidth = 305;
    html.classList.add("tooltiped");
    html.addEventListener("mouseover", function() {
        document.body.appendChild(box);
    });
    html.addEventListener("mouenter", function() {
        document.body.appendChild(box);
    });
    html.addEventListener("mousemove", function(event) {
        _position(event.clientX, event.clientY);
    });
    html.addEventListener("mouseout", function() {
        box.remove();
    });
    var resourcesMapper = {}, api = {
        update: function(data) {
            box = wrap("tooltip");
            box.appendChild(wrap("title", capitalize(data.name)));
            data.desc && box.appendChild(wrap("description", data.desc));
            data.time && box.appendChild(wrap("time", formatTime(data.time)));
            if (data.consume) {
                var item, resourcesContainer = wrap("consumption");
                data.consume.forEach(function(r) {
                    item = wrap("resource not-enough", r[0] + " " + r[1].name);
                    resourcesMapper[r[1].id] = item;
                    resourcesContainer.appendChild(item);
                });
                box.appendChild(resourcesContainer);
            }
            return api;
        },
        refresh: function(resources, consume) {
            if (data.consume) {
                var id;
                consume.forEach(function(data) {
                    id = data[1].id;
                    resources.has(id) && resources.get(id).has(data[0]) ? resourcesMapper[id].classList.remove("not-enough") : resourcesMapper[id].classList.add("not-enough");
                });
            }
            return api;
        },
        remove: function() {
            box.remove();
            return api;
        }
    };
    api.update(data);
    return api;
}

function wrap(CSSClasses, text) {
    var html = document.createElement("div");
    CSSClasses && html.classList.add.apply(html.classList, CSSClasses.split(" "));
    text && (html.innerHTML = text);
    return html;
}

function formatTime(time) {
    var units = [ "year", "month", "day", "hour", "minute" ], res = [], timeMatch = DataManager.time;
    units.forEach(function(unit) {
        if (time >= timeMatch[unit]) {
            var y = floor(time / timeMatch[unit]);
            time %= timeMatch[unit];
            res.push(y + " " + pluralize(unit, y));
        }
    });
    return formatJoin(res);
}

function formatArray(array) {
    var res = [];
    array.forEach(function(item) {
        var name = pluralize(item[1].name, item[0]);
        item[1].icon && (name += " " + wrap("icon icon-" + item[1].icon).outerHTML);
        res.push(item[0] + " " + name);
    });
    return formatJoin(res);
}

function formatJoin(array, final) {
    final = final || "and";
    if (array.length > 1) {
        array[array.length - 2] += " " + final + " " + array.pop();
        return array.join(", ");
    }
    return array.length ? array[0] : "";
}

function pluralize(string, number) {
    return string + (number > 1 ? "s" : "");
}

function capitalize(string) {
    if (string) {
        string = string.replace(/([\.!\?]) ([a-z])/g, function(match, punctuation, letter) {
            return punctuation + " " + letter.toUpperCase();
        });
        return string[0].toUpperCase() + string.slice(1);
    }
    return "";
}

function randomize(list, amount) {
    if (!list.values().length) throw new TypeError("Can't pick from empty list");
    var all = {}, dropRateScale = [], dropRateSum = 0;
    deepBrowse(list, function(item) {
        if (item.dropRate) {
            dropRateSum += item.dropRate;
            dropRateScale.push(dropRateSum);
            all[dropRateSum] = item;
        }
    });
    var pick = round(random(dropRateSum));
    dropRateScale.sort();
    for (var i = 0, l = dropRateScale.length; i < l; ++i) if (dropRateScale[i] > pick) {
        pick = dropRateScale[i];
        break;
    }
    return amount ? [ round(random.apply(null, (amount + "").split("-"))), all[pick] ] : all[pick];
}

function randomizeMultiple(list, amount) {
    if (!amount) throw new TypeError("Need an amount");
    for (var res = [], total = round(random.apply(null, (amount + "").split("-"))), sum = 0; sum + 1 <= total; ) {
        var pick = round(random(1, total - sum));
        res.push([ pick, randomize(list) ]);
        sum += pick;
    }
    return res;
}

function log(message) {
    window.isDev && console.log(message);
}

function deepBrowse(tree, action) {
    for (var item in tree) tree.hasOwnProperty(item) && (tree[item].name ? action(tree[item], tree) : deepBrowse(tree[item], action));
    return tree;
}

function clone(obj) {
    return Object.assign({}, obj);
}

function consolidateData(context, object, fields) {
    fields = fields || Object.keys(object);
    var data = clone(object);
    fields.forEach(function(field) {
        data[field] && isFunction(data[field]) && (data[field] = data[field](context));
    });
    return data;
}

function isFunction(func) {
    return func instanceof Function;
}

function isArray(array) {
    return Array.isArray(array);
}

function isUndefined(value) {
    return void 0 === value;
}

function sanitize(str) {
    return str.toLowerCase().replace(/(\W)+/g, "_");
}

function an(word) {
    var vowels = "aeiou".split("");
    return (vowels.includes(word[0]) ? "an" : "a") + " " + word;
}

function compactResources(resources) {
    return resources.reduce(function(reduced, item) {
        var known = reduced.find(function(entry) {
            return entry[1].id === item[1].id;
        });
        known ? known[0] += item[0] : item[0] > 0 && reduced.push(item);
        return reduced;
    }, []);
}

function loadAsync(urls, action) {
    var loaded = {}, loadCount = 0, toLoad = urls.length;
    return Promise.all(urls.map(function(url) {
        var promise;
        switch (url.substr(url.lastIndexOf(".") + 1)) {
          case "png":
          case "jpg":
          case "gif":
            promise = new Promise(function(resolve, reject) {
                var img = new Image();
                img.onload = resolve.bind(null, img);
                img.onerror = reject;
                img.src = url;
            });
            break;

          case "json":
            promise = new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open("get", url);
                xhr.responseType = "json";
                xhr.onload = function() {
                    resolve(this.response);
                };
                xhr.onerror = reject;
                xhr.send();
            });
            break;

          default:
            promise = Promise.resolve();
        }
        return promise.then(function(file) {
            loaded[sanitize(url)] = file;
            action(++loadCount / toLoad * 100, url);
        }).catch(function() {
            console.log("Can't load " + url);
        });
    })).then(function() {
        return loaded;
    });
}

console.groupCollapsed("Loading");

loadAsync([ "dist/img/icons.png", "dist/img/assets.png", "dist/js/assets.json" ], function(percent, file) {
    console.log(file + " : " + percent + "%");
}).then(function(media) {
    console.groupEnd();
    try {
        var Game = new GameController(document.getElementById("main"), media);
        window.isDev && (window.G = Game);
    } catch (e) {
        console.warn("Fail to load game : " + e.message, e.stack);
    }
});

GameController.tickLength = 2e3;

GameController.prototype = {
    _init: function() {
        console.log("Starting " + window.VERSION);
        var game = this;
        deepBrowse(DataManager.data, function(item) {
            item.id = pickID();
            for (var attr in item) item.hasOwnProperty(attr) && isFunction(item[attr]) && (item[attr] = item[attr].bind(game));
        });
        this.initialActions.push(DataManager.data.actions.wakeUp);
        KeyManager.attach(KeyManager.KEYS.SPACE, this.togglePause.bind(this));
        this.resourcesList = wrap();
        this.resourcesList.id = Resource.LST_ID;
        this.holder.appendChild(this.resourcesList);
        this.peopleList = wrap();
        this.peopleList.id = People.LST_ID;
        this.holder.appendChild(this.peopleList);
        this.visualPane = wrap();
        this.visualPane.id = "visualPane";
        this.holder.appendChild(this.visualPane);
        this.eventsList = wrap();
        this.eventsList.id = Event.LST_ID;
        this.holder.appendChild(this.eventsList);
        this.logsList = wrap();
        this.logsList.id = "logs";
        this.holder.appendChild(this.logsList);
        GraphicManager.start(this.visualPane, this.media);
        LogManager.start(this.logsList);
        TimerManager.start();
        TimerManager.timeout(this.welcome.bind(this, 1, !0), 500);
        var busInstance = MessageBus.getInstance();
        busInstance.observe(MessageBus.MSG_TYPES.GIVE, function(given) {
            isArray(given) && given.forEach(function(r) {
                game.earn.apply(game, r);
            });
        });
        busInstance.observe(MessageBus.MSG_TYPES.COLLECT, function(collected) {
            isArray(collected) && compactResources(game.collects.concat(collected));
        });
        busInstance.observe(MessageBus.MSG_TYPES.USE, function(use) {
            isArray(use) && compactResources(use).forEach(function(resource) {
                game.consume.apply(game, resource);
            });
        });
        busInstance.observe(MessageBus.MSG_TYPES.BUILD, function(building) {
            building && game.build(building);
        });
        busInstance.observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function(person) {
            game.people.out(person);
            if (game.people.length <= 0) {
                MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOOSE, game.getSurvivalDuration());
                game.flags.paused = !0;
            }
        });
        busInstance.observe(MessageBus.MSG_TYPES.EVENT_START, function(event) {
            game.events.push(event.data.id, event);
        });
        busInstance.observe(MessageBus.MSG_TYPES.EVENT_END, function(event) {
            game.events.pop(event.data.id);
        });
        busInstance.observe(MessageBus.MSG_TYPES.LOCK, function(actions) {
            game.removeFromInitialActions(actions);
        });
        busInstance.observe(MessageBus.MSG_TYPES.UNLOCK, function(actions) {
            game.addToInitialActions(actions);
        });
        busInstance.observe(MessageBus.MSG_TYPES.WIN, function() {
            this.flags.paused = !0;
        });
        window.isDev || popup({
            name: "Early access",
            desc: "You'll see a very early stage of the game. It may be broken, it may not be balanced ...<br/>If you want to report a bug or anything to improve the game, go to <a href='https://github.com/GMartigny/settlement'>the repo</a>.<br/><br/>Thanks for playing !"
        }, function() {
            this.flags.ready = !0;
        }.bind(this));
    },
    addToInitialActions: function(actions) {
        isArray(actions) || (actions = [ actions ]);
        actions.forEach(function(action) {
            this.initialActions.push(action);
        }.bind(this));
        this.people.forEach(function(people) {
            people.addAction(actions);
        });
    },
    removeFromInitialActions: function(actions) {
        isArray(actions) || (actions = [ actions ]);
        actions.forEach(function(action) {
            this.initialActions.pop(action.id);
        }.bind(this));
        this.people.forEach(function(people) {
            people.lockAction(actions);
        });
    },
    getSettledTime: function() {
        return this.flags.settled ? this.flags.survived / GameController.tickLength : 0;
    },
    getSurvivalDuration: function() {
        return formatTime(this.getSettledTime());
    },
    togglePause: function() {
        this.flags.paused = !this.flags.paused;
        this.holder.classList.toggle("paused", this.flags.paused);
        this.flags.paused ? TimerManager.stopAll() : TimerManager.restartAll();
    },
    refresh: function() {
        var now = performance.now(), elapse = floor((now - this.lastTick) / GameController.tickLength);
        this.lastTick += elapse * GameController.tickLength;
        this.flags.paused && (elapse = 0);
        setTimeout(this.refresh.bind(this), GameController.tickLength / 3);
        if (elapse > 0) {
            if (this.flags.settled) {
                this.flags.survived += elapse * GameController.tickLength;
                var needs = DataManager.data.people.need();
                needs.forEach(function(need) {
                    var waterId = DataManager.data.resources.gatherable.common.water.id, state = need[1].id === waterId ? "thirsty" : "starving";
                    this.consume(need[0] * this.people.length, need[1], function(number) {
                        this.people.forEach(function(person, index, list) {
                            person[state] = number / list.length;
                        });
                    });
                }.bind(this));
                this.canSomeoneArrive() && this.welcome();
                if (!this.flags.popup && random() < DataManager.data.events.dropRate) {
                    var eventData = this.getRandomEvent();
                    if (eventData) {
                        var event = new Event(eventData);
                        this.flags.popup = event.start(function(event) {
                            event.data.time && this.eventsList.appendChild(event.html);
                            this.flags.popup = !1;
                        }.bind(this));
                    }
                }
            }
            this.resources.forEach(function(resource, id, list) {
                resource.refresh(list);
            });
            this.people.forEach(function(people) {
                people.refresh(this.resources, elapse, this.flags);
            }.bind(this));
        }
    },
    hasEnough: function(id, amount) {
        return this.resources.get(id).has(amount);
    },
    consume: function(amount, resource, lack) {
        if (amount) {
            var instance = this.resources.get(resource.id);
            if (instance && instance.has(amount)) {
                instance.update(-amount);
                instance.warnLack = !1;
            } else if (isFunction(lack)) {
                var diff = amount - instance.get();
                instance.set(0);
                lack.call(this, diff, resource);
                if (!instance.warnLack) {
                    instance.warnLack = !0;
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.RUNS_OUT, resource.name);
                }
            }
        }
    },
    earn: function(amount, resource) {
        var id = resource.id;
        if (this.resources.has(id)) this.resources.get(id).update(amount); else {
            var res = new Resource(resource, amount);
            this.resources.push(id, res);
            this.resourcesList.appendChild(res.html);
        }
    },
    welcome: function(amount, first) {
        peopleFactory(amount).then(function(persons) {
            persons.forEach(function(person) {
                person.addAction(this.initialActions.values());
                this.people.push(person);
                this.peopleList.appendChild(person.html);
                if (first) {
                    person.life = 0;
                    person.energy = 0;
                    person.updateLife(0);
                    person.updateEnergy(0);
                } else {
                    person.html.offsetHeight;
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.ARRIVAL, person.name);
                    2 === this.people.length && TimerManager.timeout(function() {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, person.name + " say that there's other desert-walkers ready to join you if there's room for them.");
                    }.bind(this), 2e3);
                }
                person.html.classList.add("arrived");
            }.bind(this));
        }.bind(this));
    },
    build: function(building) {
        var id = building.id;
        if (this.buildings.has(id)) this.buildings.get(id).add(1); else {
            var bld = new Building(building);
            this.buildings.push(id, bld);
            isFunction(building.lock) && this.removeFromInitialActions(building.lock(bld));
            isFunction(building.unlock) && this.addToInitialActions(building.unlock(bld));
        }
    },
    unlockedCraftables: function() {
        var craftables = [];
        deepBrowse(DataManager.data.resources.craftable, function(craft) {
            (!craft.condition || isFunction(craft.condition) && craft.condition()) && craftables.push(craft);
        });
        return craftables;
    },
    possibleCraftables: function() {
        var resources = this.resources.items;
        return this.unlockedCraftables().filter(function(craft) {
            var keep = !0;
            isFunction(craft.consume) && craft.consume(craft).forEach(function(res) {
                keep = keep && resources[res[1].id] && resources[res[1].id].has(res[0]);
            });
            return keep;
        });
    },
    possibleBuildings: function() {
        var buildings = [], done = this.buildings;
        deepBrowse(DataManager.data.buildings, function(build) {
            (!build.unique || build.unique && !done.has(build.id)) && isFunction(build.condition) && build.condition() && buildings.push(build);
        });
        return buildings;
    },
    canSomeoneArrive: function() {
        return this.hasEnough(DataManager.data.resources.room.id, this.people.length + 1) && random() < DataManager.data.people.dropRate && this.getSettledTime() / DataManager.time.day > 2;
    },
    getRandomEvent: function() {
        var list = [], time = this.getSettledTime() / DataManager.time.week;
        if (time > 1) {
            list.push.apply(list, DataManager.data.events.easy.values());
            if (time > 2) {
                list.push.apply(list, DataManager.data.events.medium.values());
                time > 5 && list.push.apply(list, DataManager.data.events.hard.values());
            }
        }
        list = list.filter(function(event) {
            return !this.events.has(event.id) && (!event.condition || isFunction(event.condition) && event.condition(event));
        }.bind(this));
        return !!list.length && randomize(list);
    }
};

window.isDev && (GameController.prototype.debug = {
    oneOfEach: function() {
        deepBrowse(DataManager.data.resources, function(resource) {
            this.earn(1, resource);
        }.bind(this));
        deepBrowse(DataManager.data.buildings, function(build) {
            this.build(build);
        }.bind(this));
        return this;
    }
});

var DataManager = function() {
    var time = {
        minute: 1 / 60,
        hour: 1,
        day: 24,
        week: 168,
        month: 720,
        year: 8640
    }, directions = [ "north", "south", "east", "west", "north-east", "north-west", "south-east", "south-west" ], data = {
        resources: {
            gatherable: {
                common: {
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
                        desc: '"There\'s rocks everywhere ! Why would you bring this back ?"',
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
                uncommon: {
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
                rare: {
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
                        dropRate: .6
                    },
                    quartz: {
                        name: "quartz cristal",
                        desc: "",
                        icon: "",
                        dropRate: .1,
                        order: 77
                    }
                }
            },
            craftable: {
                basic: {
                    stone: {
                        name: "smooth stone",
                        desc: "A well polish and round stone.",
                        icon: "stone",
                        consume: function() {
                            return [ [ 3, data.resources.gatherable.common.rock ] ];
                        },
                        dropRate: 100,
                        order: 90
                    },
                    glass: {
                        name: "glass pane",
                        desc: "",
                        icon: "glass-pane",
                        condition: function() {
                            return this.buildings.has(data.buildings.small.furnace.id);
                        },
                        consume: function() {
                            return [ [ 4, data.resources.gatherable.uncommon.sand ] ];
                        },
                        dropRate: 60,
                        order: 100
                    },
                    component: {
                        name: "component",
                        desc: "Some mechanical parts for others craftables.",
                        icon: "pipe-large",
                        consume: function() {
                            return [ [ 2, data.resources.gatherable.common.scrap ], [ 2, data.resources.gatherable.uncommon.plastic ] ];
                        },
                        dropRate: 120,
                        order: 110
                    },
                    tool: {
                        name: "tool",
                        desc: "The base of any tinkerer.",
                        icon: "tool",
                        consume: function() {
                            return [ [ 1, data.resources.craftable.basic.component ], [ 2, data.resources.gatherable.common.rock ] ];
                        },
                        dropRate: 90,
                        order: 111
                    }
                },
                complex: {
                    brick: {
                        name: "brick",
                        desc: "Bricks will give wall to larger constructions.",
                        icon: "brick",
                        condition: function() {
                            return this.buildings.has(data.buildings.small.well.id);
                        },
                        consume: function() {
                            return [ [ 1, data.resources.craftable.basic.stone ], [ 1, data.resources.craftable.basic.tool ] ];
                        },
                        dropRate: 80,
                        order: 112
                    },
                    circuit: {
                        name: "circuit",
                        desc: "That's a little rough, but it's actually a functioning circuit board.",
                        icon: "circuit-board",
                        consume: function() {
                            return [ [ 1, data.resources.gatherable.common.scrap ], [ 2, data.resources.craftable.basic.component ], [ 3, data.resources.gatherable.rare.electronic ] ];
                        },
                        dropRate: 60,
                        order: 114
                    },
                    metalPipe: {
                        name: "metal pipe",
                        desc: "Simple pipes that you forge from junk metal.",
                        icon: "pipe-small",
                        condition: function() {
                            return this.buildings.has(data.buildings.medium.forge.id);
                        },
                        consume: function() {
                            return [ [ 4, data.resources.gatherable.common.scrap ], [ 1, data.resources.craftable.basic.tool ] ];
                        },
                        dropRate: 80,
                        order: 115
                    },
                    furniture: {
                        name: "furniture",
                        desc: "",
                        icon: "",
                        consume: function() {
                            return [ [ 2, data.resources.craftable.basic.glass ], [ 2, data.resources.craftable.complex.metalPipe ] ];
                        },
                        dropRate: 40,
                        order: 116
                    },
                    jewelry: {
                        name: "jewelry",
                        desc: "",
                        icon: "",
                        condition: function() {
                            return this.buildings.has(data.buildings.small.furnace.id);
                        },
                        consume: function() {
                            return [ [ 4, data.resources.gatherable.rare.electronic ], [ 3, data.resources.gatherable.special.quartz ] ];
                        },
                        dropRate: 40,
                        order: 117
                    }
                },
                advanced: {
                    engine: {
                        name: "engine",
                        desc: "Amazing what you manage to do with all those scraps !",
                        icon: "engine",
                        condition: function() {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        consume: function() {
                            return [ [ 10, data.resources.gatherable.uncommon.oil ], [ 5, data.resources.craftable.basic.tool ], [ 5, data.resources.craftable.complex.metalPipe ] ];
                        },
                        dropRate: 30,
                        order: 120
                    },
                    computer: {
                        name: "computer",
                        desc: "Well, Internet is down since 2136 but it can still be useful.",
                        icon: "computer",
                        condition: function() {
                            return this.buildings.has(data.buildings.big.workshop.id);
                        },
                        consume: function() {
                            return [ [ 10, data.resources.craftable.basic.component ], [ 7, data.resources.craftable.basic.tool ], [ 3, data.resources.craftable.complex.circuit ] ];
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
            need: function() {
                return [ [ 1.5 / time.day, data.resources.gatherable.common.food ], [ 1 / time.day, data.resources.gatherable.common.water ] ];
            },
            dropRate: .005
        },
        buildings: {
            small: {
                tent: {
                    name: "tent",
                    desc: "Allow someone to rejoin your colony.",
                    time: 4,
                    consume: function() {
                        return [ [ 7, data.resources.gatherable.common.scrap ], [ 5, data.resources.gatherable.common.rock ] ];
                    },
                    give: function() {
                        return [ [ 1, data.resources.room ] ];
                    },
                    log: "That's small and ugly, but someone can sleep safely in here.",
                    dropRate: 100,
                    asset: {
                        image: "tent",
                        position: {
                            color: "#909090",
                            x: "60-100",
                            y: "25-75"
                        }
                    }
                },
                furnace: {
                    name: "furnace",
                    desc: "",
                    time: 7,
                    consume: function() {
                        return [ [ 8, data.resources.gatherable.common.rock ], [ 3, data.resources.gatherable.uncommon.oil ] ];
                    },
                    log: "A small furnace can smelt small things like sand or little electronic.",
                    unique: !0,
                    dropRate: 90
                },
                plot: {
                    name: "farm plot",
                    desc: "A little arranged plot of earth to grow some food.",
                    time: 12,
                    consume: function() {
                        return [ [ 5, data.resources.gatherable.common.food ], [ 10, data.resources.gatherable.uncommon.sand ] ];
                    },
                    unlock: function() {
                        return [ data.actions.harvest ];
                    },
                    log: "More crops required more care but that's going to help us keeping a constant stock of food.",
                    dropRate: 80
                },
                pharmacy: {
                    name: "pharmacy",
                    desc: "",
                    time: 6,
                    consume: function() {
                        return [ [ 5, data.resources.gatherable.rare.medication ], [ 4, data.resources.craftable.basic.component ] ];
                    },
                    log: "Sorting our medications should prevent further mistakes and bad reaction.",
                    unique: !0,
                    dropRate: 70
                },
                well: {
                    name: "well",
                    desc: "Just a large hole into the ground.",
                    time: 16,
                    energy: 80,
                    condition: function() {
                        return !this.buildings.has(data.buildings.big.pump.id);
                    },
                    consume: function() {
                        return [ [ 10, data.resources.craftable.basic.stone ], [ 3, data.resources.craftable.basic.tool ] ];
                    },
                    give: function() {
                        return [ [ 5, data.resources.gatherable.common.water ] ];
                    },
                    unlock: function() {
                        return [ data.actions.drawFrom.well ];
                    },
                    lock: function() {
                        return [ data.actions.drawFrom.river ];
                    },
                    log: "We find out that it's possible to draw some water from the ground and use it to make bricks.",
                    unique: !0,
                    dropRate: 80
                }
            },
            medium: {
                forge: {
                    name: "forge",
                    desc: "A good upgrade to our little furnace.",
                    time: 10,
                    condition: function() {
                        this.buildings.has(data.buildings.small.furnace.id);
                    },
                    consume: function() {
                        return [ [ 5, data.resources.gatherable.uncommon.oil ], [ 10, data.resources.craftable.basic.stone ], [ 2, data.resources.craftable.basic.tool ] ];
                    },
                    unlock: function() {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.UNBUILD, data.buildings.small.well.furnace);
                        return [];
                    },
                    log: "We can now work metal better and make more complex part.",
                    unique: !0,
                    dropRate: 60
                },
                house: {
                    name: "house",
                    desc: "",
                    time: 13,
                    condition: function() {
                        this.buildings.has(data.buildings.small.tent.id);
                    },
                    consume: function() {
                        return [ [ 7, data.resources.gatherable.common.rock ], [ 1, data.resources.craftable.complex.furniture ] ];
                    },
                    give: function() {
                        return [ round(random(2, 3)), data.resources.room ];
                    },
                    log: "Better than a simple tent, it provide @give.",
                    dropRate: 50
                }
            },
            big: {
                barrack: {
                    name: "barrack",
                    desc: "Some place to sleep for a few people.",
                    time: 2 * time.day,
                    energy: 110,
                    condition: function() {
                        return this.buildings.has(data.buildings.medium.house.id) && !1;
                    },
                    consume: function() {
                        return [ [ 5, data.resources.gatherable.uncommon.sand ], [ 8, data.resources.craftable.complex.brick ], [ 1, data.resources.craftable.complex.furniture ] ];
                    },
                    give: function() {
                        return [ round(random(3, 4)), data.resources.room ];
                    },
                    log: "That's a lots of space to welcome wanderers.",
                    dropRate: 0
                },
                workshop: {
                    name: "workshop",
                    desc: "Organizing your workforce make them more efficient at crafting.",
                    time: 3 * time.day,
                    energy: 90,
                    unique: !0,
                    condition: function() {
                        return this.buildings.has(data.buildings.small.furnace.id);
                    },
                    consume: function() {
                        return [ [ 6, data.resources.gatherable.common.scrap ], [ 5, data.resources.craftable.basic.glass ], [ 10, data.resources.craftable.basic.tool ], [ 15, data.resources.craftable.complex.brick ] ];
                    },
                    give: function() {
                        return [];
                    },
                    unlock: function() {
                        return [ data.actions.project ];
                    },
                    log: "Good organisation allow you to prepare project and do much more complex crafting.",
                    dropRate: 30
                },
                radio: {
                    name: "radio-station",
                    desc: "",
                    time: 6,
                    energy: 60,
                    unique: !0,
                    condition: function() {
                        return this.buildings.has(data.buildings.big.workshop.id);
                    },
                    consume: function() {
                        return [ [ 4, data.resources.craftable.complex.circuit ], [ 1, data.resources.craftable.advanced.computer ] ];
                    },
                    log: '"Message received. We thought no one survive the crash. Unfortunately we can\'t risk being located, come to sent position."',
                    dropRate: 20
                },
                pump: {
                    name: "water pump",
                    desc: "A buried contraption that collect water from the earth moisture.",
                    time: 3 * time.day,
                    energy: 120,
                    unique: !0,
                    condition: function() {
                        return this.buildings.has(data.buildings.small.well.id);
                    },
                    consume: function() {
                        return [ [ 20, data.resources.craftable.basic.stone ], [ 5, data.resources.craftable.complex.metalPipe ], [ 1, data.resources.craftable.advanced.engine ] ];
                    },
                    unlock: function() {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.UNBUILD, data.buildings.small.well.id);
                        return [ data.actions.drawFrom.well ];
                    },
                    collect: function() {
                        return [ [ 2 / time.day, data.resources.gatherable.common.water ] ];
                    },
                    log: "A big upgrade to your well ! Now we have a continuous flow of water soming.",
                    dropRate: 10
                },
                trading: {
                    name: "trading post",
                    desc: "",
                    time: time.day,
                    energy: 70,
                    unique: !0,
                    condition: function() {
                        return this.buildings.has(data.buildings.big.radio.id);
                    },
                    consume: function() {
                        return [ [ 2, data.resources.craftable.basic.glass ], [ 10, data.resources.craftable.complex.brick ], [ 2, data.resources.craftable.complex.furniture ] ];
                    },
                    unlock: function() {
                        return [ data.actions.exchange ];
                    },
                    log: "Arranging some space allow us to trade with merchant caravan passing by.",
                    dropRate: 10
                },
                module: {
                    name: "module",
                    desc: "With that, we can finally go seek for help.",
                    time: time.week,
                    energy: 100,
                    unique: !0,
                    condition: function() {
                        return this.buildings.has(data.buildings.big.radio.id);
                    },
                    consume: function() {
                        return [ [ 15, data.resources.gatherable.uncommon.oil ], [ 3, data.resources.craftable.complex.furniture ], [ 1, data.resources.craftable.advanced.computer ], [ 2, data.resources.craftable.advanced.engine ] ];
                    },
                    unlock: function() {
                        return [ data.actions.launch ];
                    },
                    log: "What a journey, but there we are. We build so many things and explore lots of places.<br/>Now we can end this all !",
                    dropRate: 5
                }
            },
            special: {
                forum: {
                    name: "forum",
                    desc: "The center and start of our settlement.",
                    unlock: function() {
                        return [ data.actions.sleep ];
                    },
                    give: function() {
                        return [ [ 2, data.resources.room ] ];
                    },
                    unique: !0
                }
            }
        },
        actions: {
            wakeUp: {
                name: "wake up",
                energy: 0,
                unlock: function(action) {
                    action.owner.updateEnergy(100);
                    action.owner.updateLife(100);
                    return [ data.actions.look ];
                },
                log: "@people.name gets up painfully.",
                order: 0,
                unique: !0
            },
            look: {
                name: "look around",
                desc: "What am I doing here ?",
                time: 2,
                energy: 0,
                give: function() {
                    MessageBus.MSG_TYPES.LOGS.FLAVOR;
                    TimerManager.timeout(function() {
                        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOGS.FLAVOR, "We need a shelter.");
                    }, 1e3);
                    return [ , [ 10, data.resources.gatherable.common.water ], [ 8, data.resources.gatherable.common.food ], [ 2, data.resources.craftable.basic.component ] ];
                },
                unlock: function() {
                    return [ data.actions.settle ];
                },
                log: "After some thinking, @people.name remembers the attack. @people.nominative grabs @give laying around.",
                order: 0,
                unique: !0
            },
            settle: {
                name: "settle here",
                desc: "Ok, let's settle right there !",
                time: 3,
                energy: 0,
                unlock: function() {
                    this.flags.settled = !0;
                    return [ data.actions.gather ];
                },
                build: function() {
                    return data.buildings.special.forum;
                },
                log: "@people.name installs @build inside a ship-wreck with @give to sleep in.",
                order: 0,
                unique: !0
            },
            gather: {
                name: "gather resources",
                desc: "Go out to bring back resources, that's the best you can do.",
                time: 3,
                isOut: 1,
                unlock: function() {
                    return [ data.actions.roam ];
                },
                give: function() {
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
                consume: function() {
                    return [ [ 2, data.resources.gatherable.common.water ] ];
                },
                condition: function(action) {
                    return !action.owner.actions.has(data.actions.scour.id);
                },
                unlock: function(action) {
                    var unlock = [ data.actions.explore, data.actions.craft ];
                    action.repeated > 10 && unlock.push(data.actions.scour);
                    return unlock;
                },
                lock: function(action) {
                    return action.repeated > 10 ? [ action.data ] : [];
                },
                give: function(action, effet) {
                    var give = randomizeMultiple(data.resources.gatherable, "1-3");
                    if (random() < data.resources.gatherable.special.ruins.dropRate) {
                        give.push([ 1, data.resources.gatherable.special.ruins ]);
                        var location = randomize(Object.assign({}, data.locations.near));
                        this.knownLocations.push(location);
                        effet.location = an(location.name);
                    }
                    return give;
                },
                log: function(effect) {
                    var log;
                    log = effect.location ? "Heading @direction, @people.name spots @location, so @people.nominative brings back @give." : "Despite nothing special found towards @direction, @people.name brings back @give.";
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
                consume: function() {
                    return [ [ 2, data.resources.gatherable.common.water ] ];
                },
                give: function(action, effect) {
                    var give = randomize(data.resources.gatherable, "2-4"), baseDropRate = data.resources.gatherable.special.ruins.dropRate;
                    if (random() < baseDropRate + .5 * (1 - baseDropRate)) {
                        give.push([ 1, data.resources.gatherable.special.ruins ]);
                        var location = randomize(data.locations);
                        this.knownLocations.push(location);
                        effect.location = an(location.name);
                    }
                    return give;
                },
                log: function(effect) {
                    var log;
                    log = effect.location ? "@people.name knew @people.nominative could find @location towards @direction, so @people.nominative comes back with @give." : "No special location towards @direction, but @people.name find @give.";
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
                consume: function() {
                    return [ [ 4, data.resources.gatherable.common.water ], [ 1, data.resources.gatherable.common.food ], [ 1, data.resources.gatherable.special.ruins ] ];
                },
                give: function(action) {
                    var location = this.knownLocations.random();
                    action.location = location;
                    return randomizeMultiple(location.give(), "5-9");
                },
                log: function(effect, action) {
                    var log = action.location.log || "";
                    return isFunction(log) ? log(effect, action) : log;
                },
                order: 20
            },
            craft: {
                name: "craft something",
                desc: "Use some resources to tinker something useful.",
                time: function() {
                    return this.buildings.has(data.buildings.big.workshop.id) ? 4 : 5;
                },
                unlock: function() {
                    return [ data.actions.plan ];
                },
                give: function() {
                    var possible = this.possibleCraftables();
                    if (possible.length) {
                        var pick = randomize(possible);
                        isFunction(pick.consume) && MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, pick.consume(this));
                        return [ [ 1, pick ] ];
                    }
                    return [];
                },
                log: function(effect) {
                    if (effect.give) return "@people.name succeeds to craft @give.";
                    effect.logType = MessageBus.MSG_TYPES.LOGS.WARN;
                    return "Nothing could be made with what you have right now.";
                },
                order: 30
            },
            plan: {
                name: "plan a building",
                desc: "Prepare blueprint and space for a new building.",
                time: 8,
                energy: 20,
                consume: function() {
                    return [ [ 1, data.resources.gatherable.common.water ], [ 1, data.resources.gatherable.common.food ], [ 1, data.resources.craftable.basic.tool ] ];
                },
                give: function(action) {
                    action.owner.planBuilding(randomize(this.possibleBuildings()));
                    return [];
                },
                unlock: function() {
                    return [ data.actions.build ];
                },
                log: "Everything's ready to build @plan",
                order: 40
            },
            build: {
                name: function(action) {
                    return "build " + an(action.owner.plan.name);
                },
                desc: function(action) {
                    return action.owner.plan.desc;
                },
                time: function(action) {
                    return action.owner.plan.time;
                },
                energy: function(action) {
                    return action.owner.plan.energy;
                },
                consume: function(action) {
                    var consume = [ [ 2, data.resources.gatherable.common.water ], [ 1, data.resources.gatherable.common.food ] ];
                    isFunction(action.owner.plan.consume) && consume.push.apply(consume, action.owner.plan.consume(action));
                    return consume;
                },
                lock: function(action) {
                    var lock = [ action.data ];
                    isFunction(action.owner.plan.lock) && lock.push.apply(lock, action.owner.plan.lock(action));
                    return lock;
                },
                unlock: function(action) {
                    var unlock = [];
                    isFunction(action.owner.plan.unlock) && unlock.push.apply(unlock, action.owner.plan.unlock(action));
                    return unlock;
                },
                build: function(action) {
                    return action.owner.plan;
                },
                log: function(effect, action) {
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
                    condition: function(action) {
                        return !action.owner.actions.has(data.actions.drawFrom.well.id);
                    },
                    give: function() {
                        return [ [ round(random(2, 6)), data.resources.gatherable.common.water ] ];
                    },
                    log: "Coming back from the river, @people.name brings back @give.",
                    order: 60
                },
                well: {
                    name: "draw water",
                    desc: "Get some water from our well.",
                    time: 2,
                    energy: 15,
                    give: function() {
                        var draw = 0;
                        this.buildings.has(data.buildings.small.well.id) ? draw = random(1, 3) : this.buildings.has(data.buildings.big.pump.id) && (draw = random(5, 7));
                        return [ [ round(draw), data.resources.gatherable.common.water ] ];
                    },
                    log: "Using our well, @people.name get @give.",
                    order: 60
                }
            },
            harvest: {
                name: "harvest crops",
                desc: "It's not the biggest vegetables, but it'll fill our stomachs.",
                time: function() {
                    var nbCrops = this.buildings.get(data.buildings.small.plot.id).number;
                    return 4 + nbCrops;
                },
                consume: function() {
                    return [ [ 1, data.resources.gatherable.common.water ] ];
                },
                give: function() {
                    var nbCrops = this.buildings.get(data.buildings.small.plot.id).number;
                    return [ [ round(random(1.5 * nbCrops, 2 * nbCrops)), data.resources.gatherable.common.food ] ];
                },
                log: "Our crops produce @give.",
                order: 70
            },
            sleep: {
                name: "sleep",
                desc: "Get some rest to restore energy.",
                time: 9,
                energy: 0,
                give: function(action) {
                    action.owner.updateEnergy(100);
                    return [];
                },
                unlock: function() {
                    return [ data.actions.heal ];
                },
                log: "@people.name feels well rested now.",
                order: 5
            },
            heal: {
                name: "heal",
                desc: '"I really hope those pills are still good."',
                time: 2,
                energy: 1,
                consume: function() {
                    return [ [ 2, data.resources.gatherable.rare.medication ] ];
                },
                give: function(action, effect) {
                    var lifeChange = 99;
                    if (!this.buildings.has(data.buildings.small.pharmacy.id) && random() < .4) {
                        lifeChange = -15;
                        effect.wasBad = !0;
                    }
                    action.owner.updateLife(lifeChange);
                    return [];
                },
                log: function(effect) {
                    return effect.wasBad ? "After feeling not so well, @people.name realise taking these pillstook a hit on his health." : "This time, it actually improve @people's health.";
                },
                order: 6
            },
            project: {
                name: "project",
                desc: "Prepare in order to craft an object.",
                time: 2,
                energy: 20,
                give: function(action) {
                    action.owner.prepareProject(randomize(this.unlockedCraftables()));
                    return [];
                },
                unlock: function() {
                    return [ data.actions.make ];
                }
            },
            make: {
                name: function(action) {
                    return "make " + an(action.owner.project.name);
                },
                desc: "Now that all is ready, craft what we need.",
                time: function() {
                    var time = data.actions.craft.time;
                    return isFunction(time) ? time() : time;
                },
                consume: function(action) {
                    var consume = [];
                    isFunction(action.owner.project.consume) && consume.push.apply(consume, action.owner.project.consume(action));
                    return consume;
                },
                lock: function(action) {
                    var lock = [ action.data ];
                    isFunction(action.owner.project.lock) && lock.push.apply(lock, action.owner.project.lock(action));
                    return lock;
                },
                unlock: function(action) {
                    var unlock = [];
                    isFunction(action.owner.project.unlock) && unlock.push.apply(unlock, action.owner.project.unlock(action));
                    return unlock;
                },
                log: "@people.name successfully made @give."
            },
            exchange: {
                name: "exchange",
                desc: "",
                time: 7,
                energy: 20,
                consume: function() {
                    return [ [ 2, data.resources.craftable.complex.jewelry ] ];
                },
                give: function() {
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
                consume: function() {
                    return [ [ 10, data.resources.gatherable.uncommon.oil ] ];
                },
                give: function() {
                    MessageBus.getInstance().notify(MessageBus.MSG_TYPES.WIN);
                    return [];
                }
            }
        },
        locations: {
            near: {
                mountain: {
                    name: "mountain",
                    give: function() {
                        return [ data.resources.gatherable.common.rock, data.resources.gatherable.common.scrap, data.resources.craftable.basic.component ];
                    },
                    log: "That was hard to climb those mountains, but at least @people find @give.",
                    dropRate: 90
                },
                desert: {
                    name: "desert",
                    give: function() {
                        return [ data.resources.gatherable.common.scrap, data.resources.gatherable.uncommon.oil, data.resources.gatherable.uncommon.sand ];
                    },
                    log: "",
                    dropRate: 100
                },
                supermarket: {
                    name: "supermarket",
                    give: function() {
                        return [ data.resources.gatherable.common.food, data.resources.gatherable.rare.medication, data.resources.craftable.basic.glass ];
                    },
                    log: "",
                    dropRate: 80
                }
            },
            far: {
                river: {
                    name: "river",
                    unlock: function() {
                        return [ data.actions.drawFrom.river ];
                    },
                    give: function() {
                        return [ data.resources.gatherable.common.water, data.resources.gatherable.uncommon.plastic, data.resources.craftable.basic.stone ];
                    },
                    log: "",
                    dropRate: 40
                },
                ruin: {
                    name: "old ruin",
                    give: function() {
                        return [ data.resources.gatherable.rare.electronic, data.resources.craftable.basic.component, data.resources.craftable.basic.tool ];
                    },
                    log: "",
                    dropRate: 60
                }
            },
            epic: {
                building: {
                    name: "abandoned building",
                    give: function() {
                        return [ data.resources.gatherable.rare.medication, data.resources.craftable.basic.glass, data.resources.craftable.complex.circuit ];
                    },
                    log: "",
                    dropRate: 30
                }
            }
        },
        events: {
            dropRate: .01,
            easy: {
                sandstorm: {
                    name: "sandstorm",
                    desc: "The wind is blowing hard, impossible to go out for now.",
                    time: 20,
                    deltaTime: 4,
                    effect: function(isOn) {
                        this.flags.cantGoOut = isOn;
                    },
                    dropRate: 100,
                    log: "A sandstorm has started and prevent anyone from leaving the camp."
                }
            },
            medium: {},
            hard: {
                drought: {
                    name: "drought",
                    desc: "The climate is so hot, we consume more water.",
                    time: 3 * time.day,
                    timeDelta: 10,
                    effect: function(isOn) {
                        this.flags.drought = isOn;
                    },
                    dropRate: 6,
                    log: "A harsh drought fall on us, water will be more important than ever."
                }
            }
        },
        perks: {
            dropRate: .1,
            first: {
                name: "first-one",
                desc: "The very first one to install the settlement.",
                actions: function() {
                    return [ data.actions.settle.id ];
                },
                iteration: 0
            },
            rookie: {
                name: "rookie",
                desc: "All group has a rookie, all @people.nominative want is to prove @people.nominative's efficient.",
                condition: function() {
                    return this.people.length > 2;
                },
                effect: function(action) {
                    action.time = .95 * (isFunction(action.time) ? action.time() : action.time);
                }
            },
            explorer: {
                name: "gadabout",
                desc: "",
                actions: function() {
                    return [ data.actions.roam.id, data.actions.scour.id, data.actions.explore.id ];
                },
                iteration: 50,
                effect: function(action) {
                    var give = isFunction(action.give) && action.give();
                    give.push(randomize(data.resources.gatherable, "1-2"));
                }
            },
            tinkerer: {
                name: "tinkerer",
                desc: "",
                actions: function() {
                    return [ data.actions.craft.id, data.actions.build.id, data.actions.make.id ];
                },
                iteration: 50,
                effect: function(action) {}
            },
            healer: {
                name: "doctor",
                desc: "Knowing enough about medecine make @people.accusative confident to heal others.",
                actions: function() {
                    return [ data.actions.heal.id ];
                },
                condition: function() {
                    return this.buildings.has(data.buildings.small.pharmacy.id);
                },
                iteration: 5,
                effect: function(action) {
                    var people = this.people;
                    action.give = function() {
                        var lowest = null;
                        people.forEach(function(p) {
                            (!lowest || p.life < lowest.life) && (lowest = p);
                        });
                        lowest.updateLife(99);
                        return [];
                    };
                }
            },
            harvester: {
                name: "harvester",
                desc: "",
                actions: function() {
                    return [ data.actions.gather.id, data.actions.harvest.id, data.actions.drawFrom.river.id, data.actions.drawFrom.well.id ];
                },
                iteration: 70,
                effect: function() {}
            },
            lounger: {
                name: "lounger",
                desc: "",
                actions: function() {
                    return [ data.actions.sleep ];
                },
                condition: function(person) {
                    return person.stats.idle / time.week;
                },
                effect: function() {}
            },
            merchant: {
                name: "merchant",
                desc: "",
                action: function() {
                    return [ data.actions.exchange ];
                },
                iteration: 10,
                effect: function(action) {
                    action.consume = function() {
                        return [ [ 1, data.resources.craftable.complex.jewelry ] ];
                    };
                }
            }
        }
    };
    return {
        time: time,
        data: data
    };
}(), GraphicManager = function() {
    var context, images, assets = [];
    return {
        start: function(wrapper, media) {
            images = media;
            var prep = prepareCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
            context = prep.ctx;
            prep.cnv.classList.add("layer");
            wrapper.appendChild(prep.cnv);
            var busInstance = MessageBus.getInstance();
            busInstance.observe(MessageBus.MSG_TYPES.BUILD, function(building) {
                building.asset && assets.push(new Asset(images[building.asset.image], building.asset.position));
            });
        },
        render: function() {
            context.clear();
            assets.sort(function(a, b) {
                return a.position.y - b.position.y;
            });
            assets.forEach(function(asset) {
                asset.render(context);
            });
        }
    };
}();

Asset.prototype = {
    render: function(context) {
        context.drawImage(this.image, this.position.x, this.position.y);
    }
};

var KeyManager = function() {
    var _attachedMap = {};
    window.addEventListener("keyup", function(event) {
        log(event.keyCode);
        var action = _attachedMap[event.keyCode];
        isFunction(action) && action();
    });
    return {
        KEYS: {
            SPACE: 32,
            ENTER: 13,
            ESCAPE: 27,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            LEFT: 37,
            CTRL: 17,
            SHIFT: 16,
            BACK: 8,
            ONE: 49,
            TWO: 50,
            THREE: 51,
            FOUR: 52,
            FIVE: 53,
            SIX: 54,
            SEVEN: 55,
            EIGHT: 56,
            NINE: 57,
            ZERO: 48
        },
        attach: function(keyCode, action) {
            _attachedMap[keyCode] = action;
        },
        detach: function(keyCode) {
            _attachedMap[keyCode] = null;
        }
    };
}(), LogManager = function() {
    var logTypes = {
        0: "info",
        1: "warning",
        2: "flavor",
        3: "event"
    }, wrapper = null, self = {
        LOG_TYPES: {
            INFO: 0,
            WARN: 1,
            FLAVOR: 2,
            EVENT: 3
        },
        maxLog: 50,
        start: function(logWrapper) {
            wrapper = logWrapper;
            var messageBusInstance = MessageBus.getInstance();
            messageBusInstance.observe(self.LOG_TYPES.values(), function(message, type) {
                self.log(message, type);
            });
            messageBusInstance.observe(MessageBus.MSG_TYPES.ARRIVAL, function(name) {
                self.log(name + " has arrived.", MessageBus.MSG_TYPES.LOGS.EVENT);
            });
            messageBusInstance.observe(MessageBus.MSG_TYPES.LOOSE_SOMEONE, function(person) {
                var message = "We lost " + person.name + ".";
                self.log(message, self.LOG_TYPES.WARN);
            });
            messageBusInstance.observe(MessageBus.MSG_TYPES.LOOSE, function(survivalDuration) {
                var message = "We held up for " + survivalDuration + ", but all is lost now.";
                self.log(message, self.LOG_TYPES.FLAVOR);
            });
            messageBusInstance.observe(MessageBus.MSG_TYPES.RUNS_OUT, function(resourceName) {
                var message = "We run out of " + resourceName + ", we need to do something.";
                self.log(message, self.LOG_TYPES.WARN);
            });
            messageBusInstance.observe(MessageBus.MSG_TYPES.GAIN_PERK, function(people) {
                var message = people.name + ' is now known as the "' + capitalize(people.perk.name) + '".';
                self.log(message, self.LOG_TYPES.EVENT);
            });
        },
        log: function(message, type) {
            if (message.length) {
                type = type || 0;
                wrapper.insertBefore(wrap("log " + logTypes[type], message), wrapper.firstChild);
                var logs = Array.prototype.slice.call(wrapper.children);
                logs.length > LogManager.maxLog && logs.last().remove();
            }
        },
        personify: function(string, data) {
            return string.replace(/@([\w\.]+)(?=.)/gi, function(match, capture) {
                var replace = "";
                capture.split(".").forEach(function(part) {
                    replace = data[part];
                });
                return replace || "";
            });
        }
    };
    return self;
}();

MessageBus.prototype = {
    observe: function(type, action) {
        isArray(type) || (type = [ type ]);
        for (var i = 0, l = type.length; i < l; ++i) {
            this.observers[type[i]] || (this.observers[type[i]] = []);
            this.observers[type[i]].push(action);
        }
        return this;
    },
    notify: function(type, message) {
        if (this.observers[type]) for (var i = 0, l = this.observers[type].length; i < l; ++i) this.observers[type][i](message, type);
        return this;
    }
};

MessageBus.instance = !1;

MessageBus.getInstance = function() {
    MessageBus.instance || (MessageBus.instance = new MessageBus());
    return MessageBus.instance;
};

MessageBus.MSG_TYPES = {
    LOGS: LogManager.LOG_TYPES,
    CLICK: 10,
    REFRESH: 20,
    GIVE: 30,
    FIND_LOCATION: 31,
    COLLECT: 32,
    ARRIVAL: 33,
    USE: 35,
    RUNS_OUT: 36,
    LOOSE_RESOURCE: 38,
    LOOSE_SOMEONE: 39,
    UNLOCK: 40,
    GAIN_PERK: 45,
    LOCK: 50,
    BUILD: 60,
    UNBUILD: 61,
    EVENT_START: 70,
    EVENT_CANCEL: 71,
    EVENT_END: 72,
    LOOSE: 80,
    WIN: 85
};

var TimerManager = function() {
    function Timer(action, time) {
        this.startTime = performance.now();
        this.action = action;
        this.time = time;
        this.isRunning = !0;
        this.timeout = this.setTimeout();
    }
    Timer.prototype = {
        setTimeout: function() {
            return setTimeout(this.action, this.time);
        },
        getElapsed: function() {
            return performance.now() - this.startTime;
        },
        getRemaining: function() {
            return this.time - this.getElapsed();
        },
        stop: function() {
            if (this.isRunning) {
                this.isRunning = !1;
                this.time = this.getRemaining();
                clearTimeout(this.timeout);
                return this.time;
            }
            return !1;
        },
        restart: function(now) {
            if (this.isRunning) return !1;
            this.isRunning = !0;
            this.startTime = now;
            this.timeout = this.setTimeout();
            return this.time;
        }
    };
    var _timers = null;
    return {
        start: function() {
            _timers = new Collection();
        },
        timeout: function(action, time) {
            var timerId, func = function() {
                _timers.pop(timerId);
                action();
            };
            timerId = _timers.push(new Timer(func, time));
            return timerId;
        },
        stop: function(timerId) {
            return _timers.get(timerId).stop();
        },
        stopAll: function() {
            _timers.forEach(function(timer) {
                timer.stop();
            });
            return this;
        },
        restart: function(timerId) {
            return _timers.get(timerId).restart(performance.now());
        },
        restartAll: function() {
            var now = performance.now();
            _timers.forEach(function(timer) {
                timer.restart(now);
            });
            return this;
        },
        clear: function(timerId) {
            return _timers.pop(timerId).stop();
        },
        clearAll: function() {
            _timers.forEach(function(timer) {
                timer.clear();
            });
            return this;
        },
        getRemaining: function(timerId) {
            return getTimers().get(timerId).getRemaining();
        }
    };
}();

Action.prototype = {
    _init: function(data) {
        this.data = consolidateData(this, data, [ "name", "desc", "time", "energy", "consume" ]);
        isUndefined(this.data.energy) && (this.data.energy = 5 * this.data.time);
        this.html.textContent = capitalize(this.data.name);
        this.tooltip ? this.tooltip.remove().update(this.data) : this.tooltip = tooltip(this.html, this.data);
        return this;
    },
    toHTML: function(data) {
        var html = wrap("action clickable disabled animated");
        html.addEventListener("click", function() {
            this.locked || this.running || this.owner.busy || this.click.call(this);
        }.bind(this));
        html.style.order = data.order;
        return html;
    },
    refresh: function(resources, flags) {
        this.locked = this.owner.isTired() && this.data.energy > 0 || this.data.isOut && flags.cantGoOut;
        if (isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
            this.locked || this.data.consume.forEach(function(r) {
                var id = r[1].id;
                resources.has(id) && resources.get(id).has(r[0]) || (this.locked = !0);
            }.bind(this));
        }
        this.locked ? this.html.classList.add("disabled") : this.html.classList.remove("disabled");
        return this;
    },
    click: function() {
        if (this.owner.busy || this.locked) return !1;
        isArray(this.data.consume) && MessageBus.getInstance().notify(MessageBus.MSG_TYPES.USE, this.data.consume);
        ++this.repeated;
        this.owner.setBusy(this.data);
        var duration = (this.data.time || 0) * GameController.tickLength;
        this.data.deltaTime && (duration += random(-this.data.deltaTime, this.data.deltaTime));
        this.html.style.animationDuration = duration + "ms";
        this.html.classList.add("cooldown");
        this.timeout = TimerManager.timeout(this.end.bind(this), duration);
        return !0;
    },
    end: function() {
        this.timeout = 0;
        this.html.classList.remove("cooldown");
        var effect = {
            name: this.data.name,
            people: this.owner
        };
        if (isFunction(this.data.build)) {
            var build = this.data.build(this);
            effect.build = an(build.name);
        }
        var give = [];
        isFunction(this.data.give) && (give = this.data.give(this, effect));
        build && isFunction(build.give) && (give = give.concat(build.give(this)));
        give = compactResources(give);
        if (give.length) {
            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GIVE, give);
            effect.give = formatArray(give);
        }
        var collect = [];
        isFunction(this.data.collect) && (collect = this.data.collect(this));
        build && isFunction(build.collect) && (collect = collect.concat(build.collect(this)));
        collect = compactResources(collect);
        if (collect.length) {
            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.COLLECT, collect);
            effect.collect = formatArray(collect);
        }
        if (isFunction(this.data.unlock)) {
            var unlock = this.data.unlock(this).filter(function(action) {
                return !action.condition || action.condition && action.condition(this);
            }.bind(this));
            this.data.unique ? MessageBus.getInstance().notify(MessageBus.MSG_TYPES.UNLOCK, unlock) : this.owner.addAction(unlock);
        }
        if (isFunction(this.data.lock)) {
            var lock = this.data.lock(this);
            this.owner.lockAction(lock);
        }
        this.data.unique && MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOCK, this.data);
        build && MessageBus.getInstance().notify(MessageBus.MSG_TYPES.BUILD, build);
        var rawLog = "";
        isFunction(this.data.log) ? rawLog = this.data.log(effect, this) : this.data.log && (rawLog = this.data.log);
        var log = LogManager.personify(rawLog, effect);
        MessageBus.getInstance().notify(effect.logType || MessageBus.MSG_TYPES.LOGS.INFO, capitalize(log));
        this.owner.finishAction();
    },
    applyEffect: function(effect) {
        if (isFunction(effect)) {
            effect(this.data);
            this._init(this.data);
        }
        return this;
    },
    lock: function() {
        this.cancel();
        this.html.remove();
        this.tooltip.remove();
        return this;
    },
    cancel: function() {
        if (this.timeout) {
            TimerManager.clear(this.timeout);
            this.owner.setBusy(!1);
            this.html.classList.remove("cooldown");
        }
        return this;
    }
};

Building.prototype = {
    _init: function(data) {
        this.data = consolidateData(this, data, [ "name", "desc", "time", "consume" ]);
        this.html = this.toHTML();
        this.tooltip && this.tooltip.remove();
        tooltip(this.html, this.data);
        return this;
    },
    toHTML: function() {
        this.counter = wrap("counter");
        var html = wrap("building", capitalize(this.data.name));
        html.appendChild(this.counter);
        return html;
    },
    add: function(number) {
        this.number += number;
        this.counter.textContent = this.number;
        return this;
    }
};

Event.prototype = {
    _init: function(data) {
        this.data = consolidateData(this, data, [ "name", "desc", "time", "consume" ]);
        this.nameNode.textContent = this.data.name;
        this.tooltip && this.tooltip.remove();
        this.tooltip = tooltip(this.html, this.data);
        return this;
    },
    toHTML: function() {
        var html = wrap("event");
        this.nameNode = wrap("name");
        html.appendChild(this.nameNode);
        this.progressBar = wrap("animated bar");
        html.appendChild(this.progressBar);
        return html;
    },
    start: function(callback) {
        popup(this.data, function() {
            this.data.effect(!0);
            if (this.data.time) {
                MessageBus.getInstance().notify(MessageBus.MSG_TYPES.EVENT_START, this);
                var duration = this.data.time * GameController.tickLength;
                this.data.deltaTime && (duration += random(-this.data.deltaTime, this.data.deltaTime));
                this.progressBar.style.animationDuration = duration + "ms";
                this.html.classList.add("ongoing");
                this.timer = TimerManager.timeout(this.end.bind(this), duration);
            }
            callback && callback(this);
        }.bind(this), "event");
        return !!this.data.time;
    },
    end: function() {
        this.data.effect(!1);
        this.timer = null;
        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.EVENT_END, this);
        this.html.remove();
    }
};

Event.LST_ID = "eventList";

People.prototype = {
    toHTML: function() {
        var html = wrap("people"), nameNode = wrap("name", this.name);
        this.perkNode = wrap("perk");
        nameNode.appendChild(this.perkNode);
        html.appendChild(nameNode);
        this.lifeBar = wrap("bar life");
        tooltip(this.lifeBar, {
            name: "Health",
            desc: "The first thing you want is a good health."
        });
        html.appendChild(this.lifeBar);
        this.energyBar = wrap("bar energy");
        tooltip(this.energyBar, {
            name: "Energy",
            desc: "Drained faster when busy or hungry."
        });
        html.appendChild(this.energyBar);
        this.actionList = wrap("actionList");
        html.appendChild(this.actionList);
        return html;
    },
    refresh: function(resources, elapse, flags) {
        this.actions.forEach(function(action) {
            action.refresh(resources, flags);
        });
        if (flags.settled) {
            this.stats.age += elapse;
            this.stats.idle += elapse;
            var ratio = .7;
            this.busy && (ratio = (this.busy.energy || 0) / this.busy.time);
            this.updateEnergy(-elapse * ratio - 30 * this.starving);
            this.thirsty ? this.updateLife(-elapse * this.thirsty * 30) : this.energy > 80 && !this.starving && !this.thirsty && this.updateLife(.5 * elapse);
        }
        this.starving = 0;
        this.thirsty = 0;
        return this;
    },
    setPronouns: function() {
        switch (this.gender) {
          case "female":
            this.nominative = "she";
            this.accusative = "her";
            this.possessive = "her";
            this.reflexive = "herself";

          case "male":
            this.nominative = "he";
            this.accusative = "him";
            this.possessive = "his";
            this.reflexive = "hisself";

          default:
            this.nominative = "it";
            this.accusative = "it";
            this.possessive = "it";
            this.reflexive = "itself";
        }
    },
    setBusy: function(action) {
        action && action.id !== DataManager.data.actions.sleep.id && (this.stats.idle = 0);
        this.busy = !!action && action;
        this.html.classList.toggle("busy", !!action);
        return this;
    },
    finishAction: function() {
        this.stats.actionsDone[this.busy.id] ? ++this.stats.actionsDone[this.busy.id] : this.stats.actionsDone[this.busy.id] = 1;
        this.rollForPerk(this.busy);
        this.setBusy(null);
    },
    updateEnergy: function(amount) {
        this.energy += amount;
        if (this.energy > 100) this.energy = 100; else if (this.energy < 0) {
            this.updateLife(this.energy);
            this.energy = 0;
        }
        this.energyBar.style.width = this.energy + "%";
        return this.energy;
    },
    isTired: function() {
        return this.energy <= 0;
    },
    updateLife: function(amount) {
        this.life += amount;
        this.life > 100 ? this.life = 100 : this.life < 0 && this.die();
        this.lifeBar.style.width = this.life + "%";
        this.lifeBar.classList[this.life < 25 ? "add" : "remove"]("warning");
        return this.life;
    },
    planBuilding: function(building) {
        this.plan = building;
        return this;
    },
    prepareProject: function(craftable) {
        this.project = craftable;
        return this;
    },
    addAction: function(actions) {
        if (isArray(actions)) for (var i = 0, l = actions.length; i < l; ++i) this.addAction(actions[i]); else if (this.actions.has(actions.id)) this.actions.get(actions.id)._init(actions); else {
            var action = new Action(this, actions);
            this.perk && isFunction(this.perk.effect) && (this.perk.actions && !this.perk.actions().includes(actions.id) || action.applyEffect(this.perk.effect));
            this.actions.push(actions.id, action);
            this.actionList.appendChild(action.html);
        }
        return this;
    },
    lockAction: function(actions) {
        if (isArray(actions)) for (var i = 0, l = actions.length; i < l; ++i) this.lockAction(actions[i]); else this.actions.pop(actions.id).lock();
        return this;
    },
    rollForPerk: function(action) {
        if (!this.perk) {
            var self = this, perksList = DataManager.data.perks;
            deepBrowse(perksList, function(perk) {
                var actionsIds = isFunction(perk.actions) && perk.actions();
                if ((!actionsIds || actionsIds.includes(action.id)) && (!isFunction(perk.condition) || perk.condition(action))) {
                    var done = 0;
                    done = actionsIds ? actionsIds.reduce(function(sum, id) {
                        return sum + (self.stats.actionsDone[id] || 0);
                    }, 0) / (perk.iteration || 0) : 1 / (perk.iteration || 0);
                    done = done < 1 ? 0 : done;
                    done && random() < perksList.dropRate * done && self.gainPerk.call(self, perk);
                }
            });
        }
    },
    gainPerk: function(perk) {
        perk.desc = LogManager.personify(perk.desc, this);
        this.perk = perk;
        this.perkNode.textContent = 'the "' + capitalize(perk.name) + '"';
        tooltip(this.perkNode, perk);
        MessageBus.getInstance().notify(MessageBus.MSG_TYPES.GAIN_PERK, this);
        if (isFunction(perk.effect)) {
            var actionsIds = isFunction(perk.actions) && perk.actions();
            this.actions.filter(function(action) {
                return !actionsIds || actionsIds.includes(action.data.id);
            }).forEach(function(action) {
                action.applyEffect(perk.effect);
            });
        }
        isFunction(perk.unlock) && this.addAction(perk.unlock());
        isFunction(perk.lock) && this.lockAction(perk.lock());
    },
    die: function() {
        if (this.html.classList.contains("arrived")) {
            MessageBus.getInstance().notify(MessageBus.MSG_TYPES.LOOSE_SOMEONE, this);
            this.html.classList.remove("arrived");
            this.actions.forEach(function(action) {
                action.cancel();
                action.tooltip.remove();
            });
            TimerManager.timeout(function() {
                this.html.remove();
            }.bind(this), 400);
        }
        return this;
    }
};

People.LST_ID = "peopleList";

People.randomName = function(amount) {
    return new Promise(function(resolve, reject) {
        var baseUrl = "https://randomuser.me/api?inc=gender,name", countries = [ "AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR", "GB", "IE", "NL", "NZ", "TR", "US" ], url = baseUrl + "&nat=" + countries.join(",") + "&noinfo&results=" + amount, xhr = new XMLHttpRequest();
        xhr.open("get", url);
        xhr.responseType = "json";
        xhr.onload = function() {
            resolve(this.response);
        };
        xhr.onerror = reject;
        xhr.send();
    });
};

Resource.prototype = {
    _init: function(data) {
        this.data = consolidateData(this, data, [ "name", "desc", "consume" ]);
        this.tooltip && this.tooltip.remove();
        this.tooltip = tooltip(this.html, this.data);
        return this;
    },
    toHTML: function(data) {
        var html = wrap("resource get-more");
        this.counter = wrap("counter", "1");
        html.appendChild(this.counter);
        var icon = wrap("icon icon-" + data.icon);
        html.appendChild(icon);
        html.style.order = data.order;
        return html;
    },
    refresh: function(resources) {
        this.counter.textContent = floor(this.count);
        resources && isArray(this.data.consume) && this.tooltip.refresh(resources, this.data.consume);
        return this;
    },
    update: function(amount) {
        this.set(this.count + amount);
        var cb;
        if (amount > 0 && !this.html.classList.contains("more")) {
            this.html.classList.add("more");
            cb = function() {
                this.html.classList.remove("more");
            }.bind(this);
        } else if (amount < 0 && !this.html.classList.contains("less")) {
            this.html.classList.add("less");
            cb = function() {
                this.html.classList.remove("less");
            }.bind(this);
        }
        isFunction(cb) && TimerManager.timeout(cb, 700);
        return this;
    },
    get: function() {
        return 0 | this.count;
    },
    set: function(value) {
        this.count = value;
        if (this.count < 0) throw new RangeError("Resources count can't be negative");
        return this.refresh();
    },
    has: function(amount) {
        return this.count >= amount;
    }
};

Resource.LST_ID = "resourceList";

CanvasRenderingContext2D.prototype.clear = function() {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

Collection.prototype = {
    push: function(id, item) {
        if (isUndefined(item)) {
            item = id;
            id = item.id || this.length + 1;
        }
        if (this.has(id)) return !1;
        this.items[id] = item;
        return ++this.length;
    },
    pop: function(id) {
        var item = this.items[id];
        if (item) {
            delete this.items[id];
            --this.length;
            return item;
        }
        return !1;
    },
    has: function(id) {
        return !!this.items[id];
    },
    get: function(id) {
        if (!this.has(id)) throw new RangeError("Unknown ID (" + id + ") in Collection (" + this + ")");
        return this.items[id];
    },
    set: function(id, value) {
        if (!this.has(id)) throw new RangeError("Unknown ID (" + id + ") in Collection (" + this + ")");
        return this.items[id] = value;
    },
    forEach: function(action) {
        if (this.length > 0) for (var id in this.items) this.items.hasOwnProperty(id) && action(this.items[id], id, this);
        return this;
    },
    filter: function(action) {
        var kept = new Collection();
        this.forEach(function(item, id, collection) {
            action(item, id, collection) && kept.push(id, item);
        });
        return kept;
    },
    values: function() {
        return this.items.values();
    },
    keys: function() {
        return Object.keys(this.items);
    },
    random: function() {
        return this.values().random();
    },
    clear: function() {
        this.items = {};
        this.length = 0;
        return this;
    },
    toString: function() {
        return "[" + this.keys().join(", ") + "]";
    }
};

var random = function() {
    var RAND = Math.random;
    return function(from, to) {
        from = +from || 0;
        if (void 0 === to) {
            to = 0 === from ? 1 : from;
            from = 0;
        } else to = +to;
        return RAND() * (to - from) + from;
    };
}(), str = "", noop = new Function(), pickID = function() {
    var IDS = [];
    return function() {
        var ID = "------".replace(/-/g, function() {
            return round(random(36)).toString(36);
        });
        if (IDS.includes(ID)) return pickID();
        IDS.push(ID);
        return ID;
    };
}();

Array.prototype.last = function() {
    return this[this.length - 1];
};

Array.prototype.random = function() {
    return this[floor(random(0, this.length))];
};

Array.prototype.out = function(item) {
    this.splice(this.indexOf(item), 1);
    return this.length;
};

Object.prototype.values = function() {
    var values = [];
    for (var key in this) this.hasOwnProperty(key) && values.push(this[key]);
    return values;
};
//# sourceMappingURL=script.js.map
window.VERSION='v0.1.5';
window.isDev=true;