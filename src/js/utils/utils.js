/* exported noop wrap formatTime formatArray formatJoin pluralize capitalize randomize randomizeMultiple log
            consolidateData pickID isFunction isArray isString isUndefined sanitize camelize an compactResources
            getNow loadAsync */

// TODO: put all utils in a single object

var noop = new Function();

/**
 * Wrap some text content with html tag
 * @param {String} [CSSClasses] - A string of CSS classes separated by spaces
 * @param {String} [innerHTML] - An string of inside content
 * @returns {HTMLElement}
 */
function wrap (CSSClasses, innerHTML) {
    var html = document.createElement("div");
    if (CSSClasses) {
        html.className = CSSClasses;
    }
    if (innerHTML) {
        html.innerHTML = innerHTML;
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
 * @param {Array<[Number, String]>} array - An array of resources consumption
 * @return {String}
 */
function formatArray (array) {
    var res = [];

    array.forEach(function (item) {
        var name = pluralize(item[1].name, item[0]);
        if (item[1].icon) {
            name += " " + Resource.iconAsString(item[1].icon);
        }
        res.push(item[0] + " " + name);
    });

    return formatJoin(res);
}

/**
 * Join an array for human reading
 * @param {Array<String>} array - Any array of strings
 * @param {String} [final="and"] - The last joiner of the list
 * @return {String}
 */
function formatJoin (array, final) {
    if (array.length > 1) {
        array[array.length - 2] += " " + (final || "and") + " " + array.pop();
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
    return string + (number > 1 && string[string.length - 1] !== "s" ? "s" : "");
}

/**
 * Start every sentence with a capital letter
 * @param {String} string - Origin string
 * @returns {String}
 */
function capitalize (string) {
    if (string) {
        string = string.replace(/([.!?]) ([a-z])/g, function (match, punctuation, letter) {
            return punctuation + " " + letter.toUpperCase();
        });
        return string[0].toUpperCase() + string.slice(1);
    }
    else {
        return "";
    }
}

/**
 * Pick a random item from nested object
 * @param {Object} list - A potentially nested object
 * @param {String|Array} [amount=1] - Interval for random "-" separated or array
 * @example
 * randomize(data, "2-5") // between 2 and 5
 * randomize(data, [2, 5]) // between 2 and 5
 * randomize(data, "5") // between 0 and 5
 * randomize(data) // 1 result
 * @returns {Array|Object} An array of Object or one Object if no amount requested
 */
function randomize (list, amount) {
    if (!list.values().length) {
        throw new TypeError("Can't pick from empty list");
    }
    var all = {},
        dropRateScale = [],
        dropRateSum = 0;
    list.deepBrowse(function (item) {
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
        if (!isArray(amount)) {
            if (isString(amount)) {
                amount = amount.split("-");
            }
            else {
                amount = [+amount];
            }
        }
        return [round(random.apply(null, amount)), all[pick]];
    }
    else {
        return all[pick];
    }
}

/**
 * Return a random amount of random items
 * @param {Object} list - A list draw from
 * @param {String|Array<Number>} amount - Interval for randomness separated by "-" or array
 * @see randomize
 * @return {Array}
 */
function randomizeMultiple (list, amount) {
    if (!amount) {
        throw new TypeError("Need an amount");
    }
    var res = [];

    if (!isArray(amount)) {
        if (isString(amount)) {
            amount = amount.split("-");
        }
        else {
            amount = [+amount];
        }
    }
    var total = round(random.apply(null, amount));
    var sum = 0;

    while (sum < total) { // can add 1
        var pick = round(random(1, total - sum));
        res.push([pick, randomize(list)]);
        sum += pick;
    }

    return res;
}

/**
 * Display log while in dev
 * @param {...String} [message] - Any message
 */
function log () {
    if (IS_DEV) {
        console.log.apply(console, arguments);
    }
}

/**
 * Transform data function to their values
 * @param {Array} params - A list of params for each functions
 * @param {Object} object - A collection of functions
 * @param {Array<String>} [fields] - The object's field to consolidate (all of object's by default)
 * @return {*}
 */
function consolidateData (params, object, fields) {
    fields = fields || Object.keys(object);

    var data = object.clone();
    fields.forEach(function (field) {
        if (data[field] && isFunction(data[field])) {
            data[field] = data[field].apply(null, params);
        }
    });
    return data;
}

/**
 * Return a random string
 * @param {Number} [length=6] - The string's length
 * @return {String}
 */
function randomStr (length) {
    length = length || 6;
    return (new Array(length)).fill("-").join("").replace(/-/g, function () {
        return floor(random(37)).toString(36);
    });
}

/**
 * Give a random unique ID without collision
 * @returns {string}
 */
var pickUniqueID = (function () {
    var IDS = [];

    return function () {
        var ID = randomStr();
        if (!IDS.includes(ID)) {
            IDS.push(ID);
            return ID;
        }
        else {
            return pickUniqueID();
        }
    };
})();

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
 * Test if is a string
 * @param {*} string - Anything to test
 * @return {Boolean}
 */
function isString (string) {
    return typeof string === "string";
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
 * Format a string using camel-case
 * @param {String} str - Any string
 * @return {String}
 */
function camelize (str) {
    return str.toLowerCase().replace(/\W+(\w?)/g, function (match, capture) {
        return capture && capture[0].toUpperCase() + capture.slice(1);
    });
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
 * [ [1, {water}], [2, {water}] ] => [ [3, {water}] ]
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
 * Get a precise timestamp (it's not now)
 * @return {Number}
 */
function getNow () {
    return floor(performance.now());
}

/**
 * Load some image with a promise
 * @param {Array<String>} urls - An array of url string
 * @param {Function} action - A function called with each loading
 * @return {Promise}
 */
function loadAsync (urls, action) {
    var loaded = {};
    var loadCount = 0;
    var toLoad = urls.length;
    return Promise.all(urls.map(function (url) {
        var request = fetch(url).then(function (response) {
            if (response.ok) {
                return response;
            }
            else {
                throw new URIError("[" + response.status + "] " + url + " " + response.statusText);
            }
        });
        var promise;
        switch (url.substr(url.lastIndexOf(".") + 1)) {
            case "png":
            case "jpg":
            case "gif":
                promise = request.then(function (response) {
                    var img = new Image();
                    return response.blob().then(function (blob) {
                        img.src = URL.createObjectURL(blob);
                        return img;
                    });
                });
                break;
            case "json":
                promise = request.then(function (response) {
                    return response.json();
                });
                break;
            default :
                promise = Promise.resolve();
        }
        return promise.then(function (file) {
            // Each step
            loaded[sanitize(url)] = file;
            action(++loadCount / toLoad * 100, url);
        });
    })).then(function () {
        return loaded;
    });
}
