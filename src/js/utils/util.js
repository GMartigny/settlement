/* exported Utils */

var Utils = {
    noop: new Function(),

    /**
     * Wrap some text content with html tag
     * @param {String} [CSSClasses] - A string of CSS classes separated by spaces
     * @param {String} [innerHTML] - An string of inside content
     * @param {HTMLElement} [holder] - A parent to insert the newly created element into
     * @return {HTMLElement}
     */
    wrap: function (CSSClasses, innerHTML, holder) {
        var html = document.createElement("div");
        if (CSSClasses) {
            html.className = CSSClasses;
        }
        if (innerHTML) {
            html.innerHTML = innerHTML;
        }
        if (holder) {
            holder.appendChild(html);
        }

        return html;
    },

    /**
     * Join an array for human reading
     * @param {Array<String>} array - Any array of strings
     * @param {String} [final="and"] - The last joiner of the list
     * @return {String}
     */
    formatJoin: function (array, final) {
        if (array.length > 1) {
            return (array.slice(0, array.length - 1)).join(", ") + " " + (final || "and") + " " + array.last();
        }
        else if (array.length) {
            return "" + array[0];
        }
        else {
            return "";
        }
    },

    /**
     * Format an array of resources for human reading
     * @param {Array<[Number, ID]>} array - An array of resources consumption
     * @return {String}
     */
    formatArray: function (array) {
        View.enableHTML = false;
        var str = Utils.formatJoin(array.map(function (item) {
            return Resource.toString(DataManager.get(item[1]), item[0]);
        }));
        View.enableHTML = true;
        return str;
    },

    /**
     * Format a time with multiple units
     * @param {Number} time - Number of hour
     * @return {String}
     */
    formatTime: function (time) {
        if (!time) {
            return "0 hour";
        }

        var units = ["year", "month", "day", "hour", "minute"],
            res = [],
            timeMatch = DataManager.time;

        units.forEach(function (unit) {
            if (time >= timeMatch[unit]) {
                var y = MathsUtils.floor(time / timeMatch[unit]);
                time = time % timeMatch[unit];
                res.push(y + " " + Utils.pluralize(unit, y));
            }
        });

        return Utils.formatJoin(res);
    },

    /**
     * Add "s" when plural
     * @param {String} string - Origin string
     * @param {Number} number - How many
     * @return {String}
     */
    pluralize: function (string, number) {
        return string + (number > 1 && string[string.length - 1] !== "s" ? "s" : "");
    },

    /**
     * Start every sentence with a capital letter
     * @param {String} string - Origin string
     * @return {String}
     */
    capitalize: function (string) {
        if (string) {
            string = string.replace(/([.!?])\s([a-z])/g, function (match, punctuation, letter) {
                return punctuation + " " + letter.toUpperCase();
            });
            return string[0].toUpperCase() + string.slice(1);
        }
        else {
            return "";
        }
    },

    /**
     * Pick a random item from nested object
     * @param {Object<ID>} list - A potentially nested object
     * @param {String|Array|Number} [amount=1] - Interval for random "-" separated or array
     * @example
     * Utils.randomize(data, "2-5") // between 2 and 5
     * Utils.randomize(data, [2, 5]) // between 2 and 5
     * Utils.randomize(data, 5) // between 0 and 5
     * Utils.randomize(data) // 1 result
     * @return {Array|ID} An array of Object or one Object if no amount requested
     */
    randomize: function (list, amount) {
        if (!list || !list.values().length) {
            throw new TypeError("Can't pick from empty list");
        }
        var all = {},
            dropRateScale = [],
            dropRateSum = 0;
        list.deepBrowse(function (id) {
            var item = DataManager.get(id);
            if (item && item.dropRate) {
                dropRateSum += item.dropRate;
                dropRateScale.push(dropRateSum);
                all[dropRateSum] = id;
            }
        });
        var pick = MathsUtils.floor(MathsUtils.random(dropRateSum));
        dropRateScale.sort(function (a, b) {
            return a - b;
        });

        for (var i = 0, l = dropRateScale.length; i < l; ++i) {
            if (dropRateScale[i] > pick) {
                pick = dropRateScale[i];
                break;
            }
        }

        if (amount) {
            if (!Utils.isArray(amount)) {
                if (Utils.isString(amount)) {
                    amount = amount.split("-");
                }
                else {
                    amount = [+amount];
                }
            }
            return [MathsUtils.round(MathsUtils.random.apply(null, amount)), all[pick]];
        }
        else {
            return all[pick];
        }
    },

    /**
     * Return a random amount of random items
     * @param {Object<ID>} list - A potentially nested object
     * @param {String|Array|Number} amount - Interval for random "-" separated or array
     * @see randomize
     * @return {Array}
     */
    randomizeMultiple: function (list, amount) {
        if (!amount) {
            throw new TypeError("Need an amount");
        }
        var res = [];

        if (!Utils.isArray(amount)) {
            if (Utils.isString(amount)) {
                amount = amount.split("-");
            }
            else {
                amount = [+amount];
            }
        }
        var total = MathsUtils.round(MathsUtils.random.apply(null, amount));
        var sum = 0;

        while (sum++ < total) {
            res.push([1, Utils.randomize(list)]);
        }

        return Utils.compactResources(res);
    },

    /**
     * Display log while in dev
     * @param {...String} [message] - Any message
     */
    log: function () {
        if (IS_DEV) {
            console.log.apply(console, arguments);
        }
    },

    /**
     * Return a random string
     * @param {Number} [length=6] - The string's length
     * @return {String}
     */
    randomStr: function (length) {
        length = length || 6;
        return (new Array(length)).fill("-").join("").replace(/-/g, function () {
            return MathsUtils.floor(MathsUtils.random(36)).toString(36);
        });
    },

    /**
     * Give a random unique ID without collision
     * @return {String}
     */
    pickUniqueID: function () {
        return new String("");
    },

    /**
     * Test if is a function
     * @param {*} func - Anything to test
     * @return {Boolean}
     */
    isFunction: function (func) {
        return func instanceof Function;
    },

    /**
     * Test if is an array
     * @param {*} array - Anything to test
     * @return {Boolean}
     */
    isArray: function (array) {
        return Array.isArray(array);
    },

    /**
     * Test if is a string
     * @param {*} string - Anything to test
     * @return {Boolean}
     */
    isString: function (string) {
        return typeof string === "string";
    },

    /**
     * Test if is a number
     * @param {*} number - Anything to test
     * @return {Boolean}
     */
    isNumber: function (number) {
        return typeof number === "number";
    },

    /**
     * Test if is undefined
     * @param {*} value - Anything to test
     * @return {Boolean}
     */
    isUndefined: function (value) {
        return value === undefined;
    },

    /**
     * Make a string usable everywhere
     * @param {String} str - Any string
     * @return {String}
     */
    sanitize: function (str) {
        return str.replace(/^\W+|\W+$/g, "").replace(/\W+/g, "_").toLowerCase();
    },

    /**
     * Format a string using camel-case
     * @param {String} str - Any string
     * @return {String}
     */
    camelize: function (str) {
        return str.replace(/^\W+/, "").toLowerCase().replace(/\W+(\w?)/g, function (match, capture) {
            return capture && capture[0].toUpperCase() + capture.slice(1);
        });
    },

    /**
     * Add "a" or "an" according to the following word
     * @param {String} word - Any word
     * @return {String}
     */
    an: function an (word) {
        if (!word.length) {
            return "";
        }

        var vowels = "aeiou".split("");
        return (vowels.includes(word[0]) ? "an" : "a") + " " + word;
    },

    /**
     * Compact resources to one item per each
     * @param {Array<[Number, ID]>} resources - An array of resource with amount
     * @example
     * [ [1, "wtr"], [2, "wtr"] ] => [ [3, "wtr"] ]
     * @return {Array}
     */
    compactResources: function (resources) {
        return resources.reduce(function (reduced, item) {
            var known = reduced.find(function (entry) {
                return entry[1] === item[1];
            });
            if (known) {
                known[0] += item[0];
            }
            else if (item[0] > 0) {
                reduced.push(item);
            }
            return reduced;
        }, []).sort(function (a, b) {
            return b[0] - a[0];
        });
    },

    /**
     * Get a precise timestamp (it's not now)
     * @return {Number}
     */
    getNow: function getNow () {
        return MathsUtils.floor(performance.now());
    },

    /**
     * Load some image with a promise
     * @param {Object} urls - Set of urls to load with name as key
     * @param {Function} action - A function called with each loading
     * @return {Promise}
     */
    loadAsync: function loadAsync (urls, action) {
        var loaded = {};
        var loadCount = 0;
        var keys = Object.keys(urls);
        var toLoad = keys.length;
        return Promise.all(keys.map(function (key) {
            var url = urls[key];
            var promise = fetch(url).then(function (response) {
                if (response.ok) {
                    return response;
                }
                else {
                    throw new URIError("[" + response.status + "] " + url + " " + response.statusText);
                }
            });
            var format = url.substr(url.lastIndexOf(".") + 1);
            switch (format) {
                case "png":
                    promise = promise.then(function (response) {
                        var img = new Image();
                        return response.blob().then(function (blob) {
                            img.src = URL.createObjectURL(blob);
                            return img;
                        });
                    });
                    break;
                case "json":
                    promise = promise.then(function (response) {
                        return response.json();
                    });
                    break;
                case "woff":
                case "woff2":
                case "ttf":
                    promise = promise.then(function () {
                        var style = document.createElement("style");
                        style.innerHTML = "@font-face {\n" +
                            "    font-family: " + key + ";\n" +
                            "    src: url(" + url + ") format('" + format + "');\n" +
                            "}";
                        return style;
                    });
                    break;
            }
            return promise.then(function (file) {
                // Each step
                loaded[key] = file;
                action(++loadCount / toLoad * 100, key);
            });
        })).then(function () {
            return loaded;
        });
    }
};
