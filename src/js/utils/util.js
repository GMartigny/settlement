/* exported Utils */

const Utils = {
    noop: new Function(),

    /**
     * Wrap some text content with html tag
     * @param {String} [CSSClasses] - A string of CSS classes separated by spaces
     * @param {String} [innerHTML] - An string of inside content
     * @param {HTMLElement} [holder] - A parent to insert the newly created element into
     * @return {HTMLElement}
     */
    wrap (CSSClasses, innerHTML, holder) {
        const html = document.createElement("div");
        if (CSSClasses) {
            html.className = CSSClasses;
        }
        if (innerHTML) {
            html.html = innerHTML;
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
    formatJoin (array, final = "and") {
        if (array.length > 1) {
            return `${array.slice(0, -1).join(", ")} ${final} ${array.last()}`;
        }
        else if (array.length) {
            return String(array[0]);
        }

        return "";
    },

    /**
     * Format an array of resources for human reading
     * @param {Array<[Number, ID]>} array - An array of resources consumption
     * @return {String}
     */
    formatArray (array) {
        // View.enableHTML = false;
        const str = Utils.formatJoin(array.map(item => Resource.toString(DataManager.get(item[1]), item[0])));
        // View.enableHTML = true;
        return str;
    },

    /**
     * Format a time with multiple units
     * @param {Number} time - Number of hour
     * @return {String}
     */
    formatTime (time) {
        if (!time) {
            return "0 hour";
        }

        const units = ["year", "month", "day", "hour", "minute"];
        const res = [];
        const timeMatch = DataManager.time;
        let remain = time;

        units.forEach((unit) => {
            if (remain >= timeMatch[unit]) {
                const y = MathsUtils.floor(remain / timeMatch[unit]);
                remain %= timeMatch[unit];
                res.push(`${y} ${Utils.pluralize(unit, y)}`);
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
    pluralize (string, number) {
        return string + (number > 1 && string[string.length - 1] !== "s" ? "s" : "");
    },

    /**
     * Start every sentence with a capital letter
     * @param {String} string - Origin string
     * @return {String}
     */
    capitalize (string) {
        if (string) {
            const result = string
                .replace(/([.!?])\s([a-z])/g, (match, punctuation, letter) => `${punctuation} ${letter.toUpperCase()}`);
            return result[0].toUpperCase() + result.slice(1);
        }

        return "";
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
    randomize (list, amount) {
        if (!list || !list.values().length) {
            throw new TypeError("Can't pick from empty list");
        }
        const all = {};
        const dropRateScale = [];
        let dropRateSum = 0;
        list.deepBrowse((id) => {
            const item = DataManager.get(id);
            if (item && item.dropRate) {
                dropRateSum += item.dropRate;
                dropRateScale.push(dropRateSum);
                all[dropRateSum] = id;
            }
        });
        let pick = MathsUtils.floor(MathsUtils.random(dropRateSum));
        dropRateScale.sort();

        for (let i = 0, l = dropRateScale.length; i < l; ++i) {
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
                    amount = [amount];
                }
            }
            return [MathsUtils.round(MathsUtils.random(...amount)), all[pick]];
        }

        return all[pick];
    },

    /**
     * Return a random amount of random items
     * @param {Object<ID>|Array<ID>} list - A potentially nested object or array
     * @param {String|Array|Number} amount - Interval for random "-" separated or array
     * @see randomize
     * @return {Array}
     */
    randomizeMultiple (list, amount) {
        if (!amount) {
            throw new TypeError("Need an amount");
        }
        const res = [];

        // Fixme: should be factorized with "randomize"
        if (!Utils.isArray(amount)) {
            if (Utils.isString(amount)) {
                amount = amount.split("-");
            }
            else {
                amount = [amount];
            }
        }
        const total = MathsUtils.round(MathsUtils.random(...amount));
        let sum = 0;

        while (sum++ < total) {
            res.push([1, Utils.randomize(list)]);
        }

        return Utils.compactResources(res);
    },

    /**
     * Display log while in dev
     * @param {...*} [params] - Any message
     */
    log (...params) {
        if (IS_DEV) {
            console.log(...params);
        }
    },

    /**
     * Return a random string
     * @param {Number} [length=6] - The string's length
     * @return {String}
     */
    randomStr (length = 6) {
        const alpha = MathsUtils.RADIX.ALPHA;
        return (new Array(length)).fill("-").join("")
            .replace(/-/g, () => MathsUtils.floor(MathsUtils.random(alpha)).toString(alpha));
    },

    /**
     * Give a random unique ID without collision
     * @return {String}
     */
    pickUniqueID () {
        return new String("");
    },

    /**
     * Test if is a function
     * @param {*} func - Anything to test
     * @return {Boolean}
     */
    isFunction (func) {
        return func instanceof Function;
    },

    /**
     * Test if is an array
     * @param {*} array - Anything to test
     * @return {Boolean}
     */
    isArray (array) {
        return Array.isArray(array);
    },

    /**
     * Test if is a string
     * @param {*} string - Anything to test
     * @return {Boolean}
     */
    isString (string) {
        return typeof string === "string";
    },

    /**
     * Test if is a number
     * @param {*} number - Anything to test
     * @return {Boolean}
     */
    isNumber (number) {
        return typeof number === "number";
    },

    /**
     * Test if is undefined
     * @param {*} value - Anything to test
     * @return {Boolean}
     */
    isUndefined (value) {
        return value === undefined;
    },

    /**
     * Make a string usable everywhere
     * @param {String} str - Any string
     * @return {String}
     */
    sanitize (str) {
        return str.replace(/^\W+|\W+$/g, "").replace(/\W+/g, "_").toLowerCase();
    },

    /**
     * Format a string using camel-case
     * @param {String} str - Any string
     * @return {String}
     */
    camelize (str) {
        return str.replace(/^\W+/, "").toLowerCase()
            .replace(/\W+(\w?)/g, (match, capture) => capture && capture[0].toUpperCase() + capture.slice(1));
    },

    /**
     * Add "a" or "an" according to the following word
     * @param {String} word - Any word
     * @return {String}
     */
    an (word) {
        if (!word.length) {
            return "";
        }

        const vowels = "aeiou".split("");
        const prefix = vowels.includes(word[0]) ? "an" : "a";
        return `${prefix} ${word}`;
    },

    /**
     * Compact resources to one item per each
     * @param {Array<[Number, ID]>} resources - An array of resource with amount
     * @example
     * [ [1, "wtr"], [2, "wtr"] ] => [ [3, "wtr"] ]
     * @return {Array}
     */
    compactResources (resources) {
        return resources.reduce((reduced, item) => {
            const known = reduced.find(entry => entry[1] === item[1]);
            if (known) {
                known[0] += item[0];
            }
            else if (item[0] > 0) {
                reduced.push(item);
            }
            return reduced;
        }, []).sort((a, b) => b[0] - a[0]);
    },

    /**
     * Get a precise timestamp (it's not now)
     * @return {Number}
     */
    getNow () {
        return MathsUtils.floor(performance.now());
    },

    /**
     * Load some image with a promise
     * @param {Object} urls - Set of urls to load with name as key
     * @param {Function} action - A function called with each loading
     * @return {Promise}
     */
    loadAsync (urls, action) {
        const loaded = {};
        let loadCount = 0;
        const keys = Object.keys(urls);
        const toLoad = keys.length;
        return Promise.all(keys.map((key) => {
            const url = urls[key];
            let promise = fetch(url).then((response) => {
                if (response.ok) {
                    return response;
                }

                throw new URIError(`[${response.status}] ${url} ${response.statusText}`);
            });
            const format = url.substr(url.lastIndexOf(".") + 1);
            switch (format) {
                case "png":
                    promise = promise.then((response) => {
                        const img = new Image();
                        return response.blob().then((blob) => {
                            img.src = URL.createObjectURL(blob);
                            return img;
                        });
                    });
                    break;
                case "json":
                    promise = promise.then(response => response.json());
                    break;
                case "woff":
                case "woff2":
                case "ttf":
                    promise = promise.then(() => {
                        const style = document.createElement("style");
                        style.html = `@font-face {
                            font-family: ${key};
                            src: url(${url}) format("${format}");
                        }`;
                        return style;
                    });
                    break;
            }
            return promise.then((file) => {
                // Each step
                loaded[key] = file;
                action((++loadCount / toLoad) * 100, key);
            });
        })).then(() => loaded);
    },
};
