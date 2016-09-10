/**
 * Add a tooltip to an HTMLElement
 * @param {HTMLElement} html - The element
 * @param {Object} data - Some data for the tooltip
 * @returns {Object} Some functions
 */
function tooltip (html, data) {
    var box = wrap("tooltip");

    box.appendChild(wrap("title", capitalize(data.name)));
    if (data.desc) {
        box.appendChild(wrap("description", data.desc));
    }
    if (data.time) {
        box.appendChild(wrap("time", formatTime(data.time)));
    }
    if (data.consume) {
        var resourcesContainer = wrap("consumption"),
            resourcesMapper = {},
            item;
        data.consume.forEach(function (r) {
            item = wrap("resource not-enough", r[0] + " " + r[1].name);
            resourcesMapper[r[1].id] = item;
            resourcesContainer.appendChild(item);
        });
        box.appendChild(resourcesContainer);
    }

    /**
     * Position the tooltip
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @private
     */
    function _position (x, y) {
        var left = x + 10;
        if (left + 255 > document.body.offsetWidth) {
            left = document.body.offsetWidth - 255;
        }
        box.style.left = left + "px";
        box.style.top = (y + 10) + "px";
    }

    html.classList.add("tooltiped");
    html.addEventListener("mouseover", function (event) {
        document.body.appendChild(box);
        _position(event.clientX, event.clientY);
    });
    html.addEventListener("mousemove", function (event) {
        _position(event.clientX, event.clientY);
    });
    html.addEventListener("mouseout", function () {
        box.remove();
    });

    return {
        /**
         * Update tooltip
         * @param {Collection} resources
         * @param {Array} consume
         */
        refresh: function (resources, consume) {
            if (resourcesContainer) {
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
        },
        /**
         * Remove tooltip from DOM
         */
        remove: function () {
            box.remove();
        }
    };
}
