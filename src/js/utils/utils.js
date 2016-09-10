"use strict";

var str = "",
    noop = new Function();

/**
 * Wrap some text content with html tag
 * @param {String} [CSSClasses]
 * @param {String} [text]
 * @returns {HTMLElement}
 */
function wrap (CSSClasses, text) {
    var html = document.createElement("div");
    if (CSSClasses) {
        html.classList.add.apply(html.classList, CSSClasses.split(" "));
    }
    if (text) {
        html.innerHTML = text;
    }

    return html;
}

/**
 * Format a time with multiple units
 * @param {Number} time - Number of hour
 * @returns {string}
 */
function formatTime (time) {
    var units = ["year", "month", "day", "hour", "minute"],
        res = [],
        timeMatch = DataManager.time;

    units.forEach(function (unit) {
        if (time >= timeMatch[unit]) {
            var y = floor(time / timeMatch[unit]);
            time = time % timeMatch[unit];
            res.push(y + " " + pluralize(unit, y));
        }
    });

    return formatJoin(res);
}

/**
 * Format an array for human reading
 * @param {Array} array
 * @return {String}
 */
function formatArray (array) {
    var res = [];

    array.forEach(function (item) {
        var name = pluralize(item[1].name, item[0]);
        if (item[1].icon) {
            name += " " + wrap("icon icon-" + item[1].icon).outerHTML;
        }
        res.push(item[0] + " " + name);
    });

    return formatJoin(res);
}

/**
 * Join an array for human reading
 * @param {Array} array
 * @param {String} [final="and"] - The last joiner of the list
 * @return {String}
 */
function formatJoin (array, final) {
    final = final || "and";
    if (array.length > 1) {
        array[array.length - 2] += " " + final + " " + array.pop();
        return array.join(", ");
    }
    else if (array.length) {
        return array[0];
    }
    else {
        return "";
    }
}

/**
 * Add "s" when plural
 * @param {String} string - Origin string
 * @param {Number} number - How many
 * @returns {string}
 */
function pluralize (string, number) {
    return string + (number > 1 ? "s" : "");
}

/**
 * Start every sentence with a capital letter
 * @param {String} string
 */
function capitalize (string) {
    string = string.replace(/([\.!\?]) ([a-z])/g, function (match, punctuation, letter) {
        return punctuation + " " + letter.toUpperCase();
    });
    return string[0].toUpperCase() + string.slice(1);
}

/**
 * Pick a random item from nested object
 * @param {Object} list - A potentially nested object
 * @param {String} [amount=1] - Interval for random "-" separated (0 can be omitted)
 * @example
 * randomize(data, "2-5") // between 2 and 5
 * randomize(data, "5") // between 0 and 5
 * randomize(data) // 1 result
 * @returns {Array|Object} An array of Object or one Object if no amount requested
 */
function randomize (list, amount) {
    if (!list.values().length) {
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
 *
 * @param {Object} list
 * @param {String} amount
 * @return {Array}
 */
function randomizeMultiple (list, amount) {
    var res = [];
    var cutAmount = amount.split("-");
    var min = cutAmount[0];
    var max = cutAmount[1];

    for (var i = 0, l = round(random(1, min)); i < l; ++i) {
        res.push([floor(random(min / l, max / l)), randomize(list)]);
    }

    return res;
}

/**
 * Display log while in dev
 * @param {String} message - Any message
 */
function log (message) {
    if (window.isDev) {
        console.log(message);
    }
}

/**
 * Browse all item in a nested tree
 * @param {Object} tree - A tree of object
 * @param {Function} action - A function for each item
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
 * @param {Object} obj - Any object
 * @return {Object}
 */
function clone (obj) {
    return Object.assign({}, obj);
}

/**
 * Transform data function to their values
 * @param {Function} context - A context passed to each functions
 * @param {Object} object - A collection of functions
 * @param {Array} [fields] - The object's field to consolidate
 * @return {*}
 */
function consolidateData (context, object, fields) {
    fields = fields || Object.keys(object);

    var data = clone(object);
    fields.forEach(function (field) {
        if (data[field] && isFunction(data[field])) {
            data[field] = data[field](context);
        }
    });
    return data;
}

/**
 * Give a random unique ID without collision
 * @returns {string}
 */
function pickID () {
    var ID = "------".replace(/-/g, function () {
        return round(random(36)).toString(36);
    });
    if (!pickID.IDS.includes(ID)) {
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
 * @param {*} func - Anything to test
 * @returns {Boolean}
 */
function isFunction (func) {
    return func instanceof Function;
}

/**
 * Test if is an array
 * @param {*} array - Anything to test
 * @return {Boolean}
 */
function isArray (array) {
    return Array.isArray(array);
}

/**
 * Test if is undefined
 * @param {*} value - Anything to test
 * @return {Boolean}
 */
function isUndefined (value) {
    return value === undefined;
}

/**
 * Make a string usable everywhere
 * @param {String} str - Any string
 * @return {String}
 */
function sanitize (str) {
    return str.toLowerCase().replace(/(\W)+/g, "_");
}

/**
 * Add "a" or "an" according to the following word
 * @param {String} word - Any word
 * @return {String}
 */
function an (word) {
    var vowels = "aeiou".split("");
    return (vowels.includes(word[0]) ? "an" : "a") + " " + word;
}

/**
 * Compact resources to one item per each
 * @param {Array} resources - An array of resource with amount
 * @example
 * [ [1, {water}], [2, {water}] ] => [ [3, {water}] ]
 * @return {Array}
 */
function compactResources (resources) {
    return resources.reduce(function (reduced, item) {
        var known = reduced.find(function (entry) {
            return entry[1].id === item[1].id;
        });
        if (known) {
            known[0] += item[0];
        }
        else if (item[0] > 0) {
            reduced.push(item);
        }
        return reduced;
    }, []);
}

/**
 * Return the last item of the array
 * @return {*}
 */
Array.prototype.last = function () {
    return this[this.length - 1];
};

/**
 * Get a random item from an array
 * @return {*}
 */
Array.prototype.random = function () {
    return this[floor(random(0, this.length))];
};

/**
 * Remove an item from an array
 * @param {*} item - Any item of the array
 * @return {Number} The array length
 */
Array.prototype.out = function (item) {
    this.splice(this.indexOf(item), 1);
    return this.length;
};

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

/**
 * Load some image with a promise
 * @param {Array} images - An array of url string
 * @param {Function} action - A function called with each loading
 * @return {Promise}
 */
function preloadImages (images, action) {
    var loaded = 0;
    return Promise.all(images.map(function (url) {
        return (new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = resolve.bind(null, img);
            img.onerror = reject;
            img.src = url;
        })).then(function (img) {
            action(++loaded / images.length * 100, url);
            return img;
        }).catch(function () {
            console.log("Can't load " + url);
        });
    }));
}
