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
            _buildingsList = [];
            MessageBus.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
                if (building.asset) {
                    if (!_buildingsList[building.id]) {
                        _buildingsList[building.id] = [];
                    }
                    _buildingsList[building.id].push(new Asset(_imageData[building.asset.image], building.asset));
                    _buildingsList[building.id].sort(function (a, b) {
                        return a.compare(b);
                    });
                }
            }.bind(this));
            // watch for upgrade of buildings
            MessageBus.observe(MessageBus.MSG_TYPES.UPGRADE, function (upgrade) {
                var target;
                // select an asset to upgrade
                if (_buildingsList[upgrade.from.id] && _buildingsList[upgrade.from.id].length) {
                    var randomIndex = random(_buildingsList[upgrade.from.id].length - 1);
                    target = _buildingsList[upgrade.from.id].splice(randomIndex, 1)[0];
                }
                if (upgrade.to.asset) {
                    var assetData = upgrade.to.asset;
                    if (target) {
                        target.defineData(assetData, {
                            position: target.destination
                        });
                    }
                    else {
                        _buildingsList[upgrade.to.id].push(new Asset(_imageData[assetData.image], assetData));
                        _buildingsList[upgrade.to.id].sort(function (a, b) {
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

    this.defineData(sourceData, destData);
}
Asset.ANIMATION_INC = 2 / 60; // 2 animations per seconds at 60fps
Asset.ENLARGE = 4; // 4 times bigger !!§!
Asset.prototype = {
    /**
     * Define data for asset
     * @param sourceData
     * @param destData
     */
    defineData: function (sourceData, destData) {
        this.animationSteps = destData.animationSteps || 1;
        this.origin = {
            x: sourceData.x,
            y: sourceData.y,
            width: floor(sourceData.width / this.animationSteps),
            height: sourceData.height
        };

        this.destination = {
            width: this.origin.width * Asset.ENLARGE,
            height: this.origin.height * Asset.ENLARGE,
            x: 50,
            y: 50
        };
        if (destData.position) {
            if (destData.position.x.includes("-")) {
                this.destination.x = random.apply(null, (destData.position.x + "").split("-"));
            }
            else {
                this.destination.x = +destData.position.x;
            }
            if (destData.position.y.includes("-")) {
                this.destination.y = random.apply(null, (destData.position.y + "").split("-"));
            }
            else {
                this.destination.y = +destData.position.y;
            }
        }
    },
    /**
     * Draw this asset into a context
     * @param {HTMLImageElement} image - A combined image
     * @param {CanvasRenderingContext2D} layer - A layer to draw into
     */
    render: function (image, layer) {
        this.animationState = (this.animationState + Asset.ANIMATION_INC) % this.animationSteps;
        var animationShift = floor(floor(this.animationState) * this.origin.width);
        var posX = floor(layer.canvas.width * (this.destination.x / 100) - (this.destination.width / 2));
        var posY = floor(layer.canvas.height * (this.destination.y / 100) - (this.destination.height / 2));
        layer.drawImage(image,
            this.origin.x + animationShift, this.origin.y, this.origin.width, this.origin.height,
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
     * @param {Asset} another - Another asset
     * @return {Number}
     */
    compare: function (another) {
        return this.getDepth() - another.getDepth();
    }
};
