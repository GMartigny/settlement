"use strict";
// TODO: could be better to have managers than basic global functions

var str = "",
    noop = new Function(),
    undef = undefined;

/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} html - The element
 * @param {Object} data - Some data for the tooltip
 * @returns {Object} Some functions
 */
function tooltip (html, data) {
    var box = wrap("tooltip");

    box.appendChild(wrap("title", capitalize(data.name)));
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

    /**
     * Position the tooltip
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @private
     */
    function _position (x, y) {
        var left = x + 10;
        if (left + 255 > document.body.offsetWidth) {
            left = document.body.offsetWidth - 255;
        }
        box.style.left = left + "px";
        box.style.top = (y + 10) + "px";
    }

    html.classList.add("tooltiped");
    html.addEvent("mouseover", function (event) {
        document.body.appendChild(box);
        _position(event.clientX, event.clientY);
    });
    html.addEvent("mousemove", function (event) {
        _position(event.clientX, event.clientY);
    });
    html.addEvent("mouseout", function () {
        box.remove();
    });

    return {
        /**
         * Update tooltip
         * @param {Collection} resources
         * @param {Array} consume
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
 * @param {Object} data - Text for the popup
 * @param {Function} onYes - Action to do on validate
 * @param {String} [CSSClasses] - Additional classes for the popup
 * @returns {Object} Some functions
 */
function popup (data, onYes, CSSClasses) {
    if (!isFunction(onYes)) {
        throw "Popup need a confirm function";
    }

    // FIXME: maybe
    var holder = document.getElementById("main");

    CSSClasses = "popup" + (CSSClasses ? " " + CSSClasses : "");
    var box = wrap(CSSClasses);

    box.appendChild(wrap("title", capitalize(data.name)));
    box.appendChild(wrap("description", data.desc));

    var api = {
        /**
         * Remove popup from DOM
         */
        remove: function () {
            box.remove();
            holder.classList.remove("backdrop");
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

    holder.appendChild(box);
    holder.classList.add("backdrop");

    box.style.top = floor((holder.offsetHeight - box.offsetHeight) / 2) + "px";

    return api;
}

/**
 * Wrap some text content with html tag
 * @param {String} CSSClasses
 * @param {String} text
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
    if (Game.isDev) {
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
 * @returns {boolean}
 */
function isFunction (func) {
    return func instanceof Function;
}

/**
 * Test if is an array
 * @param {*} array - Anything to test
 * @return {boolean}
 */
function isArray (array) {
    return Array.isArray(array);
}

/**
 * Test if is undefined
 * @param {*} value - Anything to test
 * @return {boolean}
 */
function isUndefined (value) {
    return value === undef;
}

/**
 * Make a string usable everywhere
 * @param {String} str - Any string
 * @return {string}
 */
function sanitize (str) {
    return str.toLowerCase().replace(/(\W)+/g, "_");
}

/**
 * Add "a" or "an" according to the following word
 * @param {String} word - Any word
 * @return {string}
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
