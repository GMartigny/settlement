var GraphicManager = (function () {

    var _combinedImage;
    var _imageData;

    var _buildingsPosition = {
        "forum+1": {
            "x": 89,
            "y": 32
        },
        "forum+2": {
            "x": 89,
            "y": 32
        },
        "forum+3": {
            "x": 89,
            "y": 32
        },
        "forum": {
            "x": 89,
            "y": 32
        },
        "furnace+1": {
            "x": 89,
            "y": 5
        },
        "furnace": {
            "x": 89,
            "y": 5
        },
        "module": {
            "x": 159,
            "y": 50
        },
        "pharmacy": {
            "x": 95,
            "y": 37
        },
        "plot+1": {
            "x": 44,
            "y": 14
        },
        "plot": {
            "x": 52,
            "y": 19
        },
        "pump": {
            "x": 107,
            "y": 53
        },
        "radio": {
            "x": 59,
            "y": 54
        },
        "trading": {
            "x": 25,
            "y": 50
        },
        "well": {
            "x": 119,
            "y": 55
        },
        "workshop": {
            "x": 135,
            "y": 19
        },
        "wreckage": {
            "x": 89,
            "y": 32
        }
    };

    var _buildingsLayer;
    var _buildingsList;
    var _eventsLayer;
    var _eventsList;

    var _waterLevel = 0;
    var _foodLevel = 0;

    return {
        /**
         * Initialize the manager
         * @param {HTMLElement} wrapper - The DOM holder
         * @param {HTMLImageElement} image - Combined image for assets
         * @param {Object} data - Data of position inside the image
         */
        start: function (wrapper, image, data) {
            _combinedImage = image;
            _imageData = data;

            var layer = prepareCanvas(800, 300);
            _buildingsLayer = layer.ctx;
            _buildingsLayer.imageSmoothingEnabled = 0;
            layer.cnv.classList.add("layer", "buildings");
            wrapper.appendChild(layer.cnv);

            layer = prepareCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
            _eventsLayer = layer.ctx;
            layer.cnv.classList.add("layer", "events");
            wrapper.appendChild(layer.cnv);

            // watch for new buildings
            _buildingsList = new Collection();
            MessageBus.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
                if (building.asset) {
                    var asset = new Asset(_imageData[building.asset], _buildingsPosition[building.asset]);
                    _buildingsList.push(building.id, asset);
                }
            }.bind(this));
            // watch for upgrade of existing buildings
            MessageBus.observe(MessageBus.MSG_TYPES.UPGRADE, function (upgrade) {
                if (_buildingsList.has(upgrade.from) && upgrade.to.asset) {
                    // select an asset to upgrade
                    var asset = new Asset(_imageData[upgrade.to.asset], _buildingsPosition[upgrade.to.asset]);
                    _buildingsList.set(upgrade.from, asset);
                }
            });
            MessageBus.observe(MessageBus.MSG_TYPES.UNBUILD, function (building) {
                _buildingsList.pop(building.id);
            });

            // watch for new events
            _eventsList = new Collection();
            MessageBus.observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
                if (event.asset) {
                    _eventsList.push(event.id, new Asset(_imageData[event.asset], event.asset)); // FIXME
                }
            });
            MessageBus.observe(MessageBus.MSG_TYPES.EVENT_END, function (event) {
                _eventsList.pop(event.id);
            });

            // watch for food and water level
            MessageBus.observe([MessageBus.MSG_TYPES.USE, MessageBus.MSG_TYPES.GIVE], function (resource) {
                switch (resource.id) {
                    case DataManager.data.resources.gatherables.common.water:
                        _waterLevel = resource.get();
                        break;
                    case DataManager.data.resources.gatherables.common.food:
                        _foodLevel = resource.get();
                        break;
                }
            });

            // start loopdy loop
            this.render();
        },
        /**
         * Draw everything
         */
        render: function () {
            requestAnimationFrame(this.render.bind(this));

            if (_buildingsList.length) {
                _buildingsLayer.clear();
                // TODO : optimize to not sort each loop
                _buildingsList.values().sort(function (a, b) {
                    return a.compare(b);
                }).forEach(function (asset) {
                    asset.render(_combinedImage, _buildingsLayer);
                });
            }

            if (_eventsList.length) {
                _eventsLayer.clear();
                _eventsList.forEach(function (asset) {
                    asset.render(_combinedImage, _eventsLayer);
                });
            }
        }
    };
})();

/**
 * A class for assets
 * @param {Object} sourceData - Data for source image
 * @param {Object} destData - Data for drawing destination
 * @constructor
 */
function Asset (sourceData, destData) {
    if (!destData) {
        throw new TypeError("Can't draw asset without destination");
    }
    this.animationState = 0;
    this.animationSteps = destData.animationSteps || 1;

    this.source = {};
    this.destination = {};
    this.defineSource(sourceData);

    this.destination.x = floor(+destData.x * Asset.ENLARGE);
    this.destination.y = floor(+destData.y * Asset.ENLARGE);
}
Asset.ANIMATION_INC = 2 / 60; // 2 animations per seconds at 60fps
Asset.ENLARGE = 4; // 4 times bigger !!§!
Asset.prototype = {
    /**
     * Define the source image of this asset
     * @param sourceData
     */
    defineSource: function (sourceData) {
        this.source = {
            x: sourceData.x,
            y: sourceData.y,
            width: floor(sourceData.width / this.animationSteps),
            height: sourceData.height
        };
        this.destination.width = this.source.width * Asset.ENLARGE;
        this.destination.height = this.source.height * Asset.ENLARGE;
    },
    /**
     * Draw this asset into a context
     * @param {HTMLImageElement} image - A combined image
     * @param {CanvasRenderingContext2D} layer - A layer to draw into
     */
    render: function (image, layer) {
        this.animationState = (this.animationState + Asset.ANIMATION_INC) % this.animationSteps;
        var animationShift = floor(floor(this.animationState) * this.source.width);
        var posX = this.destination.x;
        var posY = this.destination.y;
        layer.drawImage(image,
            this.source.x + animationShift, this.source.y, this.source.width, this.source.height,
            posX, posY, this.destination.width, this.destination.height);
    },
    /**
     * Return asset depth
     * @return {Number}
     */
    getDepth: function () {
        return this.destination.y;
    },
    /**
     * Compare with another asset to sort by depth
     * @param {Asset} other - Another asset
     * @return {Number}
     */
    compare: function (other) {
        return (other.destination.y + other.destination.height) - (this.destination.y + this.destination.height);
    },
    /**
     * Define a new position to draw this asset
     * @param {Number} x
     * @param {Number} y
     */
    setPosition: function (x, y) {
        this.destination.x = +x;
        this.destination.y = +y;
    }
};
