/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} container - The element
 * @param {Object} data - Some data for the tooltip
 * @returns {Object} Some functions
 */
function Tooltip (container, data) {
    this.nodes = {};
    this.box = this.toHTML(data);
    this._addEvents(container);

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
    _mouseOver: function () {
        document.body.appendChild(this.box);
    },
    _mouseOut: function () {
        this.box.remove();
    },
    _mouseMove: function (event) {
        this._setPosition(event.clientX, event.clientY);
    },
    _addEvents: function (container){
        container.classList.add("tooltiped");

        container.addEventListener("mouseenter", this._mouseOver.bind(this));
        container.addEventListener("mousemove", this._mouseMove.bind(this));
        container.addEventListener("mouseout", this._mouseOut.bind(this));
    },
    _removeEvents: function (container) {
        container.classList.remove("tooltiped");

        container.removeEventListener("mouseenter", this._mouseOver);
        container.removeEventListener("mousemove", this._mouseMove);
        container.removeEventListener("mouseout", this._mouseOut);
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
           this.nodes.time;
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
    * @param {Collection} resources
    * @param {Array} consume
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
       this._removeEvents();
       this.box.remove();
   }
};
