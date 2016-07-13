"use strict";
var str = "",
    noop = function() {},
    nodef = undefined;

/**
 * Add a tooltip to an HTMLElement
 * @param html The element
 * @param data Some data for the tooltip
 * @returns {Object} Some functions
 */
function tooltip(html, data) {
    var box = wrap("tooltip");

    box.appendChild(wrap("title", data.name));
    if (data.desc) {
        box.appendChild(wrap("description", data.desc));
    }
    if (data.time) {
        box.appendChild(wrap("time", formatTime(data.time)));
    }
    if (data.consume) {
        var resourcesContainer = wrap("consumption"),
            resourcesMapper = {},
            item;
        data.consume.forEach(function(r) {
            item = wrap("resource not-enough", r[0] + " " + r[1].name);
            resourcesMapper[r[1].id] = item;
            resourcesContainer.appendChild(item);
        });
        box.appendChild(resourcesContainer);
    }

    html.classList.add("tooltiped");
    html.onmouseover = function() {
        document.body.appendChild(box);
    };
    html.onmousemove = function(e) {
        var left = (e.clientX + 10);
        if(left + 255 > document.body.offsetWidth) {
            left = document.body.offsetWidth - 255;
        }
        box.style.left = left + "px";
        box.style.top = (e.clientY + 10) + "px";
    };
    html.onmouseout = function() {
        box.remove();
    };

    return {
        refresh: function(resources, consume) {
            if (resourcesContainer) {
                var id;
                consume.forEach(function(data) {
                    id = data[1].id;
                    if (resources[id] && resources[id].has(data[0])) {
                        resourcesMapper[id].classList.remove("not-enough");
                    }
                    else {
                        resourcesMapper[id].classList.add("not-enough");
                    }
                });
            }
        },
        remove: function() {
            box.remove();
        }
    };
}
/**
 * Wrap some text content with html tag
 * @param text
 * @param classe
 * @returns {string}
 */
function wrap(classe, text) {
    var html = document.createElement("div");
    if (classe) {
        html.classList.add.apply(html.classList, classe.split(" "));
    }
    if (text) {
        html.textContent = text;
    }

    return html;
}
/**
 * Format a time with multiple units
 * @param time Number of hour
 * @returns {string}
 */
function formatTime(time) {
    var units = ["year", "month", "day", "hour"];
    var res = [];

    units.forEach(function(unit) {
        if (time >= Game.time[unit]) {
            var y = time / Game.time[unit] << 0;
            time = time % Game.time[unit];
            res.push(y + " " + pluralize(unit, y));
        }
    });

    return res.join(", ");
}
/**
 * Add "s" when plural
 * @param string Origin string
 * @param number How many
 * @returns {string}
 */
function pluralize(string, number) {
    return string + (number > 1 ? "s" : "");
}
/**
 *
 * @param string
 */
function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
}
/**
 * Pick a random item from nested array
 * @param list A potentially nested array
 * @param amount Interval for random "-" separated (0 can be omited)
 * @returns {array}
 */
function randomize(list, amount) {
    if (!list) {
        throw "Can't pick from empty list";
    }
    var all = {},
        dropRateScale = [],
        dropRateSum = 0;
    deepBrowse(list, function(item) {
        if (item.dropRate) {
            dropRateSum += item.dropRate;
            dropRateScale.push(dropRateSum);
            all[dropRateSum] = item;
        }
    });
    var pick = floor(random(dropRateSum));
    dropRateScale.sort();

    for (var i = 0, l = dropRateScale.length; i < l; ++i) {
        if (dropRateScale[i] > pick) {
            pick = dropRateScale[i];
            break;
        }
    }

    if (amount) {
        return [round(random.apply(null, amount.split("-"))), all[pick]];
    }
    else{
        return all[pick];
    }
}
/**
 * Display log while in dev
 * @param message Any message
 */
function log(message) {
    if (Game.flags.isDev) {
        console.log(message);
    }
}
/**
 * Browse all item in a nested tree
 * @param tree A tree of object
 * @param action A function for each item
 * @returns {object}
 */
function deepBrowse(tree, action) {
    for (var item in tree) {
        if (tree.hasOwnProperty(item)) {
            if (tree[item].name) {
                action(tree[item]);
            }
            else {
                deepBrowse(tree[item], action);
            }
        }
    }
    return tree;
}
/**
 * Give a random unique ID wihtout collision
 * @returns {string}
 */
function pickID() {
    var ID = "------".replace(/-/g, function() {
        return round(random(36)).toString(36);
    });
    if (pickID.IDS.indexOf(ID) < 0) {
        pickID.IDS.push(ID);
        return ID;
    }
    else {
        return pickID();
    }
}
pickID.IDS = [];
/**
 * Handle an associative array
 * @constructor
 */
function Collection() {
    this.items = {};
    this.length = 0;
}
Collection.prototype = {
    push: function(id, item) {
        this.items[id] = item;
        return ++this.length;
    },
    pop: function(id) {
        var item = this.items[id];
        delete this.items[id];
        this.length--;
        return item;
    },
    has: function(id) {
        return !!this.items[id];
    },
    get: function(id) {
        if(!this.has(id)){
            throw "Unknown ID in Collection";
        }
        return this.items[id];
    },
    set: function(id, value) {
        if(!this.has(id)){
            throw "Unknown ID in Collection";
        }
        return this.items[id] = value;
    },
    forEach: function(action) {
        for (var id in this.items) {
            if (this.items.hasOwnProperty(id)) {
                action(this.items[id], id);
            }
        }
        return this;
    },
    filter: function(action) {
        var kept = new Collection();
        this.forEach(function(item, id) {
            if (action(item, id)) {
                kept.push(id, item);
            }
        });
        return kept;
    }
};
/**
 * Test if is a function
 * @param func Anything to test
 * @returns {boolean}
 */
function isFunction(func) {
    return func instanceof Function;
}
/**
 * Test if is an array
 * @param array Anything to test
 * @return {boolean}
 */
function isArray(array) {
    return array instanceof Array;
}
/**
 * Make a string usable everywhere
 * @param str Any string
 * @return {string}
 */
function sanitize(str) {
    return str.toLowerCase().replace(/(\W)+/g, "_");
}
/**
 * Add "a" or "an" according to the following word
 * @param word Any word
 * @return {string}
 */
function an(word) {
    var vowels = "aeiou".split("");
    return (vowels.indexOf(word[0]) < 0 ? "a" : "an") + " " + word;
}