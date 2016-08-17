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
     * @param id ID of the item
     * @param item The item to insert
     * @return {number} Collection length
     */
    push: function (id, item) {
        ++this.length;
        if (isUndefined(item)) {
            item = id;
            id = item.id || this.length;
        }
        this.items[id] = item;
        return this.length;
    },
    /**
     * Remove and return an item from the collection
     * @param id ID of the item
     * @return {*} The corresponding item
     */
    pop: function (id) {
        var item = this.items[id];
        delete this.items[id];
        --this.length;
        return item;
    },
    /**
     * Check for the ID presence
     * @param id ID of an item
     * @return {boolean}
     */
    has: function (id) {
        return !!this.items[id];
    },
    /**
     * Return an item from the collection
     * @param id ID of the item
     * @return {*} The corresponding item
     */
    get: function (id) {
        if (!this.has(id)) {
            throw "Unknown ID (" + id + ") in Collection (" + this + ")";
        }
        return this.items[id];
    },
    /**
     * Set an existing item from the collection
     * @param id ID of the item
     * @param value It's new value
     * @return {*} The inserted value
     */
    set: function (id, value) {
        if (!this.has(id)) {
            throw "Unknown ID (" + id + ") in Collection (" + this + ")";
        }
        return this.items[id] = value;
    },
    /**
     * Execute a function for each item
     * @param action A callback function called on each item<br/>
     * Will get (item, id, collection) as params
     * @return {Collection} Itself
     */
    forEach: function (action) {
        if (this.length > 0) {
            for (var id in this.items) {
                if (this.items.hasOwnProperty(id)) {
                    action(this.items[id], id, this.items);
                }
            }
        }
        return this;
    },
    /**
     * Filter out item with a function
     * @param action A callback function called on each item<br/>
     * Should return true to keep items
     * @return {Collection} A new Collection instance
     */
    filter: function (action) {
        var kept = new Collection();
        this.forEach(function (item, id) {
            if (action(item, id)) {
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
        return "[" + Object.keys(this.items).join(", ") + "]";
    }
};
