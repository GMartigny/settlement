/**
 * Handle an associative array
 * @constructor
 */
function Collection () {
    this.items = {};
    this.length = 0;
}
Collection.prototype = {
    /**
     * Add an item
     * @param {String} [id] - ID of the item
     * @param {*} item - The item to insert
     * @return {number|Boolean} Collection length or false if already included
     */
    push: function (id, item) {
        if (isUndefined(item)) {
            item = id;
            id = item.id || this.length + 1;
        }

        if (!this.has(id)) {
            this.items[id] = item;
            return ++this.length;
        }
        else {
            return false;
        }
    },
    /**
     * Remove and return an item from the collection
     * @param {String} id - ID of the item
     * @return {*} The corresponding item
     */
    pop: function (id) {
        var item = this.items[id];
        if (item) {
            delete this.items[id];
            --this.length;
            return item;
        }
        else {
            return false;
        }
    },
    /**
     * Check for the ID presence
     * @param {String} id - ID of an item
     * @return {boolean}
     */
    has: function (id) {
        return !!this.items[id];
    },
    /**
     * Return an item from the collection
     * @param {String} id - ID of the item
     * @return {*} The corresponding item
     */
    get: function (id) {
        if (!this.has(id)) {
            throw new RangeError("Unknown ID (" + id + ") in Collection (" + this + ")");
        }
        return this.items[id];
    },
    /**
     * Set an existing item from the collection
     * @param {String} id - ID of the item
     * @param {*} value - It's new value
     * @return {*} The inserted value
     */
    set: function (id, value) {
        if (!this.has(id)) {
            throw new RangeError("Unknown ID (" + id + ") in Collection (" + this + ")");
        }
        return this.items[id] = value;
    },
    /**
     * The callback executed on Collection
     * @callback collectionCallback
     * @param {*} item - The current item
     * @param {String} id - The current ID
     * @param {Collection} collection - The whole collection
     */
    /**
     * Execute a function for each item
     * @param {collectionCallback} action - A callback function called on each item
     * @return {Collection} Itself
     */
    forEach: function (action) {
        if (this.length > 0) {
            for (var id in this.items) {
                if (this.items.hasOwnProperty(id)) {
                    action(this.items[id], id, this);
                }
            }
        }
        return this;
    },
    /**
     * Filter out item with a function
     * @param {collectionCallback} action - A callback function called on each item
     * Should return true to keep items
     * @return {Collection} A new Collection instance
     */
    filter: function (action) {
        var kept = new Collection();
        this.forEach(function (item, id, collection) {
            if (action(item, id, collection)) {
                kept.push(id, item);
            }
        });
        return kept;
    },
    /**
     * Return values in the collection
     * @return {Array}
     */
    values: function () {
        return this.items.values();
    },
    /**
     * Return all keys in the collection
     * @return {Array}
     */
    keys: function () {
        return Object.keys(this.items);
    },
    /**
     * Return a random item
     * @returns {*}
     */
    random: function () {
        return this.values().random();
    },
    /**
     * Empty the collection
     * @return {Collection} Itself
     */
    clear: function () {
        this.items = {};
        this.length = 0;
        return this;
    },
    /**
     * Convert collection to string
     * @return {string}
     */
    toString: function () {
        return "[" + this.keys().join(", ") + "]";
    }
};
