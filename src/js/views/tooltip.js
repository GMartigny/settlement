"use strict";
/* exported Tooltip */

/**
 * @typedef {Object} TooltipData
 * @extends ActionData
 * @prop {Number} [time] - Time in game hour
 * @prop {Array<[Number, String]>} [consume] - An array of resources consumption
 */

/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} container - The element
 * @param {TooltipData} data - Some data for the tooltip
 * @constructor
 * @extends View
 */
function Tooltip (container, data) {
    this.container = container;
    this.nodes = {};
    this.resourcesMapper = {};

    this.super(null, data);
}
Tooltip.extends(View, "Tooltip", /** @lends Tooltip.prototype */ {
    _holderWidth: null,
    _holderHeight: null,
    init: function (data) {
        this.refresh(new Map(), data);

        // Save body size to avoid overflow
        if (!(this._holderWidth && this._holderHeight)) {
            Tooltip._holder = GameController.holder; // meh
            var holderMeasures = Tooltip._holder.getBoundingClientRect();
            this._holderWidth = holderMeasures.width;
            this._holderHeight = holderMeasures.height;
        }

        // Measure the box
        this._mouseOver(); //  add to DOM
        var htmlMeasures = this.html.getBoundingClientRect();
        this.width = htmlMeasures.width;
        this.height = htmlMeasures.height;
        this._mouseOut(); // Clear from DOM

        this._addEvents();
    },
    /**
     * Position the tooltip
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @private
     */
    _setPosition: function (x, y) {
        var left = MathsUtils.constrain(x + 10, 0, this._holderWidth - this.width);
        var top = MathsUtils.constrain(y + 10, 0, this._holderHeight - this.height);
        this.html.style.left = left + "px";
        this.html.style.top = top + "px";
    },
    /**
     * Handle mouse over events
     * @private
     */
    _mouseOver: function () {
        Tooltip._holder.appendChild(this.html);
    },
    /**
     * Handle mouse out events
     * @private
     */
    _mouseOut: function () {
        this.remove();
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
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        this.nodes.name = Utils.wrap("title", null, html);

        // Description
        this.nodes.desc = Utils.wrap("description", null, html);

        // Time
        this.nodes.time = Utils.wrap("time", null, html);

        // Consume
        this.nodes.resourcesContainer = Utils.wrap("consumption", null, html);

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
        else {
            this.nodes.desc.remove();
        }

        if (data.time) {
            this.nodes.time.textContent = Utils.formatTime(data.time);
        }
        else {
            this.nodes.time.remove();
        }

        if (Utils.isArray(data.consume)) {
            data.consume.forEach(function (resource) {
                var id = resource[1];
                var resourceNodes = this.resourcesMapper[id];
                if (!resourceNodes) {
                    var data = DataManager.get(id);
                    var wrapperNode = Utils.wrap("resource not-enough", null, this.nodes.resourcesContainer);
                    wrapperNode.style.order = data.order;
                    var counterNode = Utils.wrap("counter", null, wrapperNode);
                    Utils.wrap(null, resource[0] + " " + data.name, wrapperNode);
                    resourceNodes = {
                        node: wrapperNode,
                        counter: counterNode
                    };
                    this.resourcesMapper[id] = resourceNodes;
                }
                var count = (resources.has(id) || 0) && resources.get(id).get();
                var notEnough = count < resource[0];
                resourceNodes.counter.textContent = notEnough ? count + "/" : "";
                resourceNodes.node.classList.toggle("not-enough", notEnough);
            }, this);
        }
        else {
            this.nodes.resourcesContainer.remove();
        }
    },
    /**
     * Remove tooltip from DOM
     */
    remove: function () {
        this.html.remove();
    }
});
