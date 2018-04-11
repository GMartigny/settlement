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
    /**
     * Initialise object
     * @param {TooltipData} data - Data for the tooltip
     * @private
     */
    init (data) {
        this.refresh(new Map(), data);

        // Measure the box
        GameController.holder.appendChild(this.html);
        const htmlMeasures = this.html.getBoundingClientRect();
        this.width = htmlMeasures.width;
        this.height = htmlMeasures.height;
        this.hide();
        this.html.remove();

        this._addEvents();
    },
    /**
     * Position the tooltip
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @private
     */
    _setPosition (x, y) {
        const wrapperSize = Tooltip.getWrapperSize();
        const mouseOffset = 10;
        const left = MathsUtils.constrain(x + mouseOffset, 0, wrapperSize.width - this.width);
        const top = MathsUtils.constrain(y + mouseOffset, 0, wrapperSize.height - this.height);
        this.html.style.left = `${left}px`;
        this.html.style.top = `${top}px`;
    },
    /**
     * Handle mouse over events
     * @private
     */
    _mouseOver () {
        GameController.holder.appendChild(this.html);
        this.show.defer(this);
    },
    /**
     * Handle mouse out events
     * @private
     */
    _mouseOut () {
        this.hide();
        this.html.remove.defer(this.html);
    },
    /**
     * Handle mouse move events
     * @param {MouseEvent} event - The associated event data
     * @private
     */
    _mouseMove (event) {
        this._setPosition(event.clientX, event.clientY);
    },
    /**
     * Add all events listener
     * @private
     */
    _addEvents () {
        this.container.classList.add("tooltiped");

        this.container.addEventListener("mouseenter", this._mouseOver.bind(this));
        this.container.addEventListener("mousemove", this._mouseMove.bind(this));
        this.container.addEventListener("mouseleave", this._mouseOut.bind(this));
    },
    /**
     * Remove all events listener
     * @private
     */
    _removeEvents () {
        this.container.classList.remove("tooltiped");

        this.container.removeEventListener("mouseenter", this._mouseOver);
        this.container.removeEventListener("mousemove", this._mouseMove);
        this.container.removeEventListener("mouseleave", this._mouseOut);
    },
    /**
     * Update tooltip content
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();
        const wrapper = Utils.wrap("wrapper", null, html);

        this.nodes.name = Utils.wrap("title", null, wrapper);

        // Description
        this.nodes.desc = Utils.wrap("description", null, wrapper);

        // Time
        this.nodes.time = Utils.wrap("time", null, wrapper);

        // Consume
        this.nodes.resourcesContainer = Utils.wrap("consumption", null, wrapper);

        return html;
    },
    /**
     * Update consumption on tooltip
     * @param {Map} resources - The game's resources
     * @param {TooltipData} data - Data to update the tooltip (unchanged can be ignored)
     */
    refresh (resources, data) {
        if (this.isShow) {
            this.nodes.name.textContent = Utils.capitalize(data.name);
            if (data.desc) {
                this.nodes.desc.html = data.desc;
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
                    const id = resource[1];
                    let resourceNodes = this.resourcesMapper[id];
                    if (!resourceNodes) {
                        const resourceData = DataManager.get(id);
                        const wrapperNode = Utils.wrap("resource not-enough", null, this.nodes.resourcesContainer);
                        wrapperNode.style.order = resourceData.order;
                        const counterNode = Utils.wrap("counter", null, wrapperNode);
                        Utils.wrap(null, Resource.toString(resourceData, resource[0]), wrapperNode);
                        resourceNodes = {
                            node: wrapperNode,
                            counter: counterNode,
                        };
                        this.resourcesMapper[id] = resourceNodes;
                    }
                    const count = (resources.has(id) || 0) && resources.get(id).get();
                    const notEnough = count < resource[0];
                    resourceNodes.counter.textContent = notEnough ? `${count}/` : "";
                    resourceNodes.node.classList.toggle("not-enough", notEnough);
                }, this);
            }
            else {
                this.nodes.resourcesContainer.remove();
            }
        }
    },
});

Tooltip.static(/** @lends Tooltip */ {
    wrapperSizeCache: null,
    /**
     * Return tooltips wrapper dimension
     * @return {{width: Number, height: Number}}
     */
    getWrapperSize () {
        if (!this.wrapperSizeCache) {
            const holderMeasures = GameController.holder.getBoundingClientRect();
            Tooltip.wrapperSizeCache = {
                width: holderMeasures.width,
                height: holderMeasures.height,
            };
        }
        return Tooltip.wrapperSizeCache;
    },
    resetCache () {
        Tooltip.wrapperSizeCache = null;
    },
});

/**
 * Reset wrapperSizeCache if the screen size is changed
 */
window.addEventListener("resize", Tooltip.resetCache);
