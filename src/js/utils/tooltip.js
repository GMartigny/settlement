/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} html - The element
 * @param {Object} data - Some data for the tooltip
 * @returns {Object} Some functions
 */
function tooltip (html, data) {
    var box = null;

    var bodyWidth = document.body.offsetWidth;
    /**
     * Position the tooltip
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @private
     */
    function _position (x, y) {
        // may be sub-optimal, but looks better
        document.body.appendChild(box);

        var left = x + 10;
        if (left + 255 > bodyWidth) {
            left = bodyWidth - 255;
        }
        box.style.left = left + "px";
        box.style.top = (y + 10) + "px";
    }

    html.classList.add("tooltiped");
    html.addEventListener("mouseover", function (event) {
        _position(event.clientX, event.clientY);
    });
    html.addEventListener("mousemove", function (event) {
        _position(event.clientX, event.clientY);
    });
    html.addEventListener("mouseout", function () {
        box.remove();
    });

    var resourcesMapper = {};

    var api = {
        /**
         * Update tooltip content
         * @param data
         * @return {Object} Itself
         */
        update: function (data) {
            box = wrap("tooltip");

            box.appendChild(wrap("title", capitalize(data.name)));
            if (data.desc) {
                box.appendChild(wrap("description", data.desc));
            }
            if (data.time) {
                box.appendChild(wrap("time", formatTime(data.time)));
            }
            if (data.consume) {
                var resourcesContainer = wrap("consumption");
                var item;
                data.consume.forEach(function (r) {
                    item = wrap("resource not-enough", r[0] + " " + r[1].name);
                    resourcesMapper[r[1].id] = item;
                    resourcesContainer.appendChild(item);
                });
                box.appendChild(resourcesContainer);
            }
            return api;
        },
        /**
         * Update consumption on tooltip
         * @param {Collection} resources
         * @param {Array} consume
         * @return {Object} Itself
         */
        refresh: function (resources, consume) {
            if (data.consume) {
                var id;
                consume.forEach(function (data) {
                    id = data[1].id;
                    if (resources.has(id) && resources.get(id).has(data[0])) {
                        resourcesMapper[id].classList.remove("not-enough");
                    }
                    else {
                        resourcesMapper[id].classList.add("not-enough");
                    }
                });
            }
            return api;
        },
        /**
         * Remove tooltip from DOM
         * @return {Object} Itself
         */
        remove: function () {
            box.remove();
            return api;
        }
    };
    api.update(data);

    return api;
}
