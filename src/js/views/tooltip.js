"use strict";
/* exported Tooltip */

/**
 * @typedef {Object} TooltipData
 * @extends Data
 * @prop {Number} [time] - Time in game hour
 * @prop {Array<[Number, String]>} [consume] - An array of resources consumption
 */

/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} container - The element
 * @param {TooltipData} data - Some data for the tooltip
 */
function Tooltip (container, data) {
    this.container = container;
    this.nodes = {};
    this.resourcesMapper = {};
    this.box = this.toHTML(data);
    this._mouseOver(); //  add to DOM
    this.width = this.box.offsetWidth;
    this.height = this.box.offsetHeight;
    this._mouseOut(); // Clear from DOM
    this._addEvents();
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
        var left = MathUtils.constrain(x + 10, 0, this.bodyWidth - this.width);
        var top = MathUtils.constrain(y + 10, 0, this.bodyHeight - this.height);
        this.box.style.left = left + "px";
        this.box.style.top = top + "px";
    },
    /**
     * Handle mouse over events
     * @private
     */
    _mouseOver: function () {
        document.body.appendChild(this.box);
    },
    /**
     * Handle mouse out events
     * @private
     */
    _mouseOut: function () {
        this.box.remove();
    },
    /**
     * Handle mouse move events
     * @param {MouseEvent} event - The associated event data
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

        this.container.addEventListener("mouseover", this._mouseOver.bind(this));
        this.container.addEventListener("mousemove", this._mouseMove.bind(this));
        this.container.addEventListener("mouseout", this._mouseOut.bind(this));
    },
    /**
     * Remove all events listener
     * @private
     */
    _removeEvents: function () {
        this.container.classList.remove("tooltiped");

        this.container.removeEventListener("mouseover", this._mouseOver);
        this.container.removeEventListener("mousemove", this._mouseMove);
        this.container.removeEventListener("mouseout", this._mouseOut);
    },
    /**
     * Update tooltip content
     * @param {TooltipData} data - Data to build the tooltip
     * @return {HTMLElement}
     */
    toHTML: function (data) {
        var html = Utils.wrap("tooltip");

        var nameNode = Utils.wrap("title", Utils.capitalize(data.name));
        html.appendChild(nameNode);
        this.nodes.name = nameNode;
        if (data.desc) {
            var descNode = Utils.wrap("description", data.desc);
            html.appendChild(descNode);
            this.nodes.desc = descNode;
        }
        if (data.time) {
            var timeNode = Utils.wrap("time", Utils.formatTime(data.time));
            html.appendChild(timeNode);
            this.nodes.time = timeNode;
        }
        if (Utils.isArray(data.consume)) {
            var resourcesContainer = Utils.wrap("consumption");
            data.consume.forEach(function (resource) {
                var name = DataManager.get(resource[1]).name;
                var resourceNode = Utils.wrap("resource not-enough", resource[0] + " " + name);
                this.resourcesMapper[resource[1]] = resourceNode;
                resourcesContainer.appendChild(resourceNode);
            }, this);
            html.appendChild(resourcesContainer);
        }
        return html;
    },
    /**
     * Update consumption on tooltip
     * @param {Map} resources - The game's resources
     * @param {TooltipData} data - Data to update the tooltip (unchanged can be ignored)
     */
    refresh: function (resources, data) {
        this.nodes.name.textContent = Utils.capitalize(data.name);
        if (data.desc) {
            this.nodes.desc.textContent = data.desc;
        }
        if (data.time) {
            this.nodes.time.textContent = Utils.formatTime(data.time);
        }
        if (Utils.isArray(data.consume)) {
            data.consume.forEach(function (resource) {
                var id = resource[1];
                var hasEnougth = resources.has(id) && resources.get(id).has(resource[0]);
                this.resourcesMapper[id].classList.toggle("not-enough", !hasEnougth);
            }, this);
        }
    },
    /**
     * Remove tooltip from DOM
     */
    remove: function () {
        this.box.remove();
    }
};
