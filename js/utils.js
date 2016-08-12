"use strict";

var str = "",
    noop = new Function(),
    undef = undefined;

/**
 * Add a tooltip to an HTMLElement
 * @param html The element
 * @param data Some data for the tooltip
 * @returns {Object} Some functions
 */
function tooltip (html, data) {
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
        data.consume.forEach(function (r) {
            item = wrap("resource not-enough", r[0] + " " + r[1].name);
            resourcesMapper[r[1].id] = item;
            resourcesContainer.appendChild(item);
        });
        box.appendChild(resourcesContainer);
    }

    html.classList.add("tooltiped");
    html.addEvent("mouseover", function () {
        document.body.appendChild(box);
    });
    html.addEvent("mousemove", function (e) {
        var left = e.clientX + 10;
        if (left + 255 > document.body.offsetWidth) {
            left = document.body.offsetWidth - 255;
        }
        box.style.left = left + "px";
        box.style.top = `${e.clientY + 10}px`;
    });
    html.addEvent("mouseout", function () {
        box.remove();
    });

    return {
        /**
         * Update tooltip
         * @param resources
         * @param consume
         */
        refresh: function (resources, consume) {
            if (resourcesContainer) {
                var id;
                consume.forEach(function (data) {
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
        /**
         * Remove tooltip from DOM
         */
        remove: function () {
            box.remove();
        }
    };
}

/**
 * Display a popup with choice buttons
 * @param data Text for the popup
 * @param onYes Action to do on validate
 * @param classes Additional classes for the popup
 * @returns {Object} Some functions
 */
function popup (data, onYes, classes) {
    if (!isFunction(onYes)) {
        throw "Popup need a confirm function";
    }

    classes = "popup" + (classes ? " " + classes : "");
    var box = wrap(classes);

    box.appendChild(wrap("title", data.name));
    box.appendChild(wrap("description", data.desc));

    var api = {
        /**
         * Remove popup from DOM
         */
        remove: function () {
            box.remove();
            document.body.classList.remove("backdrop");
        }
    };

    var yesButton = wrap("yes clickable", data.yes || "Ok");
    yesButton.addEvent("click", function () {
        onYes();
        api.remove();
    });
    box.appendChild(yesButton);

    if (data.no) {
        var noButton = wrap("no clickable", data.no);
        noButton.addEvent("click", api.remove);
        box.appendChild(noButton);
    }

    document.body.appendChild(box);
    document.body.classList.add("backdrop");

    box.style.top = floor((document.body.offsetHeight - box.offsetHeight) / 2) + "px";

    return api;
}

/**
 * Wrap some text content with html tag
 * @param text
 * @param classe
 * @returns {HTMLElement}
 */
function wrap (classe, text) {
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
function formatTime (time) {
    var units = ["year", "month", "day", "hour"],
        res = [],
        timeMatch = dataManager.getTime();

    units.forEach(function (unit) {
        if (time >= timeMatch[unit]) {
            var y = floor(time / timeMatch[unit]);
            time = time % timeMatch[unit];
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
function pluralize (string, number) {
    return string + (number > 1 ? "s" : "");
}

/**
 * Start every word with a capital letter
 * @param string
 */
function capitalize (string) {
    return string.split(" ").map(function (word) {
        return word[0].toUpperCase() + word.slice(1);
    }).join(" ");
}

/**
 * Pick a random item from nested array
 * @param list A potentially nested array
 * @param amount Interval for random "-" separated (0 can be omitted)
 * @returns {Array|*}
 */
function randomize (list, amount) {
    if (!list) {
        throw "Can't pick from empty list";
    }
    var all = {},
        dropRateScale = [],
        dropRateSum = 0;
    deepBrowse(list, function (item) {
        if (item.dropRate) {
            dropRateSum += item.dropRate;
            dropRateScale.push(dropRateSum);
            all[dropRateSum] = item;
        }
    });
    var pick = round(random(dropRateSum));
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
    else {
        return all[pick];
    }
}

/**
 * Display log while in dev
 * @param message Any message
 */
function log (message) {
    if (Game.isDev) {
        console.log(message);
    }
}

/**
 * Browse all item in a nested tree
 * @param tree A tree of object
 * @param action A function for each item
 * @returns {object}
 */
function deepBrowse (tree, action) {
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
 * Return a new reference of an object
 * @param obj Any object
 * @return {*}
 */
function clone (obj) {
    return Object.assign({}, obj);
}

/**
 * Transform data function to their values
 * @param context
 * @param object
 * @param fields
 * @return {*}
 */
function consolidateData (context, object, fields) {
    if (isArray(fields)) {
        var data = clone(object);
        fields.forEach(function (field) {
            if (data[field] && isFunction(data[field])) {
                data[field] = data[field](context);
            }
        });
        return data;
    }
    else {
        throw "Field is undefined or not an array";
    }
}

/**
 * Give a random unique ID wihtout collision
 * @returns {string}
 */
function pickID () {
    var ID = "------".replace(/-/g, function () {
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
 * Test if is a function
 * @param func Anything to test
 * @returns {boolean}
 */
function isFunction (func) {
    return func instanceof Function;
}

/**
 * Test if is an array
 * @param array Anything to test
 * @return {boolean}
 */
function isArray (array) {
    return array instanceof Array;
}

/**
 * Test if is undefined
 * @param value Anything to test
 * @return {boolean}
 */
function isUndefined (value) {
    return value === undef;
}

/**
 * Make a string usable everywhere
 * @param str Any string
 * @return {string}
 */
function sanitize (str) {
    return str.toLowerCase().replace(/(\W)+/g, "_");
}

/**
 * Add "a" or "an" according to the following word
 * @param word Any word
 * @return {string}
 */
function an (word) {
    var vowels = "aeiou".split("");
    return (vowels.indexOf(word[0]) < 0 ? "a" : "an") + " " + word;
}

/**
 * Compact resources to one item per each
 * @example [ [1, {water}], [2, {water}] ] => [ [3, {water}] ]
 * @param array An array of resource with amount
 * @return {Array}
 */
function compactResources (array) {
    return array.reduce(function (reduced, item) {
        var known = reduced.find(function (entry) {
            return entry[1].id === item[1].id;
        });
        if (known) {
            known[0] += item[0];
        }
        else {
            reduced.push(item);
        }
        return reduced;
    }, []);
}

/**
 * Return all value of an object as array
 * @return {Array}
 */
Object.prototype.values = function () {
    var values = [];

    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            values.push(this[key]);
        }
    }

    return values;
};
