var GraphicManager = (function () {

    var _combinedImage;
    var _imageData;

    var _buildingsLayer;
    var _buildingsList = [];
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

            var busInstance = MessageBus.getInstance();
            // watch for new buildings
            busInstance.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
                if (building.asset) {
                    _buildingsList.push(new Asset(_imageData[building.asset.image], building.asset));
                    _buildingsList.sort(function (a, b) {
                        return a.compare(b);
                    });
                }
            }.bind(this));

            // watch for new events
            _eventsList = new Collection();
            busInstance.observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
                if (event.asset) {
                    _eventsList.push(event.id, new Asset(_imageData[event.asset.image], event.asset));
                }
            });
            busInstance.observe(MessageBus.MSG_TYPES.EVENT_END, function (event) {
                if (_eventsList.has(event.id)) {
                    _eventsList.pop(event.id);
                }
            });

            // watch for food and water level
            busInstance.observe([MessageBus.MSG_TYPES.USE, MessageBus.MSG_TYPES.REFRESH], function (resource) {
                switch (resource.id) {
                    case DataManager.data.resources.gatherable.common.water:
                        break;
                    case DataManager.data.resources.gatherable.common.food:
                        break;
                }
            });

            this.render();
        },
        /**
         * Draw everything
         */
        render: function () {
            requestAnimationFrame(this.render.bind(this));

            if (_buildingsList.length) {
                _buildingsLayer.clear();
                _buildingsList.forEach(function (asset) {
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
    this.animationState = 0;
    this.animationSteps = destData.animationSteps || 1;
    this.size = {
        width: sourceData.width / this.animationSteps,
        height: sourceData.height
    };
    this.origin = {
        x: sourceData.x,
        y: sourceData.y,
        width: sourceData.width / this.animationSteps,
        height: sourceData.height
    };

    this.destination = {
        width: this.origin.width * Asset.ENLARGE,
        height: this.origin.height * Asset.ENLARGE
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
    else {
        this.destination.x = 50;
        this.destination.y = 50;
    }
}
Asset.ANIMATION_INC = 2 / 60; // 2 animations per seconds at 60fps
Asset.ENLARGE = 4; // 4 times bigger
Asset.prototype = {
    /**
     * Draw this asset into a context
     * @param {HTMLImageElement} image - A combined image
     * @param {CanvasRenderingContext2D} layer - A layer to draw into
     */
    render: function (image, layer) {
        this.animationState = (this.animationState + Asset.ANIMATION_INC) % this.animationSteps;
        var animationShift = floor(floor(this.animationState) * this.size.width);
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
