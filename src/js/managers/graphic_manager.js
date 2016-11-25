var GraphicManager = (function () {

    var _combinedImage;
    var _imageData;

    var _buildingsLayer;
    var _buildingsList;
    var _eventsLayer;
    var _eventsList;

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

            var layer = prepareCanvas(Math.min(wrapper.offsetWidth, 800), Math.min(wrapper.offsetHeight, 200));
            _buildingsLayer = layer.ctx;
            _buildingsLayer.imageSmoothingEnabled = 0;
            layer.cnv.classList.add("layer");
            wrapper.appendChild(layer.cnv);

            layer = prepareCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
            _eventsLayer = layer.ctx;
            layer.cnv.classList.add("layer");
            wrapper.appendChild(layer.cnv);

            // watch for new buildings
            _buildingsList = new Collection();
            MessageBus.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
                if (building.asset) {
                    if (!_buildingsList.has(building.id)) {
                        _buildingsList.push(building.id, []);
                    }
                    var ref = _buildingsList.get(building.id);
                    ref.push(new Asset(_imageData[building.asset.image], building.asset));
                    ref.sort(function (a, b) {
                        return a.compare(b);
                    });
                }
            }.bind(this));
            // watch for upgrade of buildings
            MessageBus.observe(MessageBus.MSG_TYPES.UPGRADE, function (upgrade) {
                if (upgrade.to.asset) {
                    var target = null;
                    // select an asset to upgrade
                    if (_buildingsList.has(upgrade.from)) {
                        var ref = _buildingsList.get(upgrade.from)
                        target = ref[floor(random(ref.length - 1))];
                    }
                    var assetData = upgrade.to.asset;
                    if (target) {
                        target.defineSource(_imageData[assetData.image]);
                    }
                    else {
                        if (!_buildingsList.has(upgrade.to.id)) {
                            _buildingsList.push(upgrade.to.id, []);
                        }
                        var ref = _buildingsList.get(upgrade.to.id);
                        ref.push(new Asset(_imageData[assetData.image], assetData));
                        ref.sort(function (a, b) {
                            return a.compare(b);
                        });
                    }
                }
            });

            // watch for new events
            _eventsList = new Collection();
            MessageBus.observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
                if (event.asset) {
                    _eventsList.push(event.id, new Asset(_imageData[event.asset.image], event.asset));
                }
            });
            MessageBus.observe(MessageBus.MSG_TYPES.EVENT_END, function (event) {
                if (_eventsList.has(event.id)) {
                    _eventsList.pop(event.id);
                }
            });

            // watch for food and water level
            MessageBus.observe([MessageBus.MSG_TYPES.USE, MessageBus.MSG_TYPES.GIVE], function (resource) {
                switch (resource.id) {
                    case DataManager.data.resources.gatherable.common.water:
                        break;
                    case DataManager.data.resources.gatherable.common.food:
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
                _buildingsList.forEach(function (assetType) {
                    assetType.forEach(function (asset) {
                        asset.render(_combinedImage, _buildingsLayer);
                    });
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
    this.animationState = 0;
    this.animationSteps = destData.animationSteps || 1;

    this.source = {
        x: sourceData.x,
        y: sourceData.y,
        width: floor(sourceData.width / this.animationSteps),
        height: sourceData.height
    };

    this.destination = {
        width: this.source.width * Asset.ENLARGE,
        height: this.source.height * Asset.ENLARGE,
        x: 50,
        y: 50
    };
    if (destData.position) {
        var pos = destData.position;
        if (pos.x.includes("-")) {
            this.destination.x = random.apply(null, (pos.x + "").split("-"));
        }
        else {
            this.destination.x = +pos.x;
        }
        if (pos.y.includes("-")) {
            this.destination.y = random.apply(null, (pos.y + "").split("-"));
        }
        else {
            this.destination.y = +pos.y;
        }
    }
    else {
        throw new TypeError("Can't draw asset without destination");
    }
}
Asset.ANIMATION_INC = 2 / 60; // 2 animations per seconds at 60fps
Asset.ENLARGE = 4; // 4 times bigger !!§!
Asset.prototype = {
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
        var posX = round(layer.canvas.width * (this.destination.x / 100) - (this.destination.width / 2));
        var posY = round(layer.canvas.height * (this.destination.y / 100) - (this.destination.height / 2));
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
        return (this.destination.y - other.destination.y) + (this.destination.height - other.destination.height);
    },
    /**
     * Define a new position to draw this asset
     * @param {Number} x
     * @param {Number} y
     * @returns {Asset} Itself
     */
    setPosition: function (x, y){
        this.destination.x = +x;
        this.destination.y = +y;
        return this;
    }
};
