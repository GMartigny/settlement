/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} container - The element
 * @param {Object} data - Some data for the tooltip
 * @returns {Object} Some functions
 */
function Tooltip (container, data) {
    this.container = container;
    this.nodes = {};
    this.box = this.toHTML(data);
    this._addEvents();

    this.resourcesMapper = {};
}
Tooltip.prototype = {
    bodyWidth: document.body.offsetWidth,
    bodyHeight: document.body.offsetHeight,
    /**
     * Position the tooltip
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @private
     */
    _setPosition: function (x, y) {
        var left = constrain(x + 10, 0, this.bodyWidth - 305);
        var top = constrain(y + 10, 0, this.bodyHeight);
        this.box.style.left = left + "px";
        this.box.style.top = top + "px";
    },
    /**
     * Handle mouse over event
     * @private
     */
    _mouseOver: function () {
        document.body.appendChild(this.box);
    },
    /**
     * Handle mouse out event
     * @private
     */
    _mouseOut: function () {
        this.box.remove();
    },
    /**
     *
     * @param event
     * @private
     */
    _mouseMove: function (event) {
        this._setPosition(event.clientX, event.clientY);
    },
    /**
     * Add all events listener
     * @private
     */
    _addEvents: function () {
        this.container.classList.add("tooltiped");

        this.container.addEventListener("mouseenter", this._mouseOver.bind(this));
        this.container.addEventListener("mousemove", this._mouseMove.bind(this));
        this.container.addEventListener("mouseout", this._mouseOut.bind(this));
    },
    /**
     * Remove all events listener
     * @private
     */
    _removeEvents: function () {
        this.container.classList.remove("tooltiped");

        this.container.removeEventListener("mouseenter", this._mouseOver);
        this.container.removeEventListener("mousemove", this._mouseMove);
        this.container.removeEventListener("mouseout", this._mouseOut);
    },
    /**
     * Update tooltip content
     * @param data
     */
    toHTML: function (data) {
        var html = wrap("tooltip");

        var name = wrap("title", capitalize(data.name));
        html.appendChild(name);
        this.nodes.name = name;
        if (data.desc) {
            var desc = wrap("description", data.desc);
            html.appendChild(desc);
            this.nodes.desc = desc;
        }
        if (data.time) {
            var time = wrap("time", formatTime(data.time));
            html.appendChild(time);
            this.nodes.time = time;
        }
        if (isArray(data.consume)) {
            var resourcesContainer = wrap("consumption");
            var item;
            for (var i = 0, l = data.consume.length; i < l; ++i) {
                item = wrap("resource not-enough", r[0] + " " + r[1].name);
                this.resourcesMapper[r[1].id] = item;
                resourcesContainer.appendChild(item);
            }
            html.appendChild(resourcesContainer);
        }
        return html;
    },
    /**
     * Update consumption on tooltip
     * @param {Collection} resources - The game's resources
     * @param {Data} data
     */
    refresh: function (resources, data) {
        this.nodes.name = data.name;
        if (data.desc) {
            this.nodes.desc.textContent = data.desc;
        }
        if (data.time) {
            this.nodes.time.textContent = formatTime(data.time);
        }
        if (isArray(data.consume)) {
            var id;
            var hasEnougth;
            for (var i = 0, l = data.consume.length; i < l; ++i) {
                id = data.consume[i][1].id;
                hasEnougth = resources.has(id) && resources.get(id).has(data[0]);
                this.resourcesMapper[id].classList.toggle("not-enougth", !hasEnougth);
            }
        }
    },
    /**
     * Remove tooltip from DOM
     */
    remove: function () {
        this.box.remove();
    }
};
