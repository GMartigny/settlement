"use strict";
/* exported GraphicManager */

var GraphicManager = (function iife () {

    var _combinedImage;
    var _imageData;

    var _buildingsPosition;

    var _buildingsLayer;
    var _buildingsList;

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
        this.animationSteps = destData.steps || 1;
        this.animationSpeed = (destData.speed || 0) / Asset.FPS;

        this.source = {};
        this.destination = {};
        this.source = {
            x: MathsUtils.toNumber(sourceData.x),
            y: MathsUtils.toNumber(sourceData.y),
            width: MathsUtils.floor(sourceData.width / this.animationSteps),
            height: sourceData.height
        };
        this.destination.width = this.source.width * Asset.ENLARGE;
        this.destination.height = this.source.height * Asset.ENLARGE;

        this.destination.x = MathsUtils.floor(destData.x * Asset.ENLARGE);
        this.destination.y = MathsUtils.floor(destData.y * Asset.ENLARGE);
    }
    Asset.ENLARGE = 4; // 4 times bigger !!§!
    Asset.FPS = 60;
    Asset.prototype = {
        /**
         * Draw this asset into a context
         * @param {HTMLImageElement} image - A combined image
         * @param {CanvasRenderingContext2D} layer - A layer to draw into
         */
        render: function (image, layer) {
            this.animationState = (this.animationState + this.animationSpeed) % this.animationSteps;
            var animationShift = MathsUtils.floor(this.animationState) * this.source.width;
            var posX = this.destination.x;
            var posY = this.destination.y;
            layer.drawImage(image,
                this.source.x + animationShift, this.source.y, this.source.width, this.source.height,
                posX, posY, this.destination.width, this.destination.height);
        },
        /**
         * Return asset depth (lowest point to draw)
         * @return {Number}
         */
        getDepth: function () {
            return this.destination.y + this.destination.height;
        },
        /**
         * Compare with another asset to sort by depth
         * @param {Asset} other - Another asset
         * @return {Number}
         */
        compare: function (other) {
            return this.getDepth() - other.getDepth();
        },
        /**
         * Define a new position to draw this asset
         * @param {Number} x - A new horizontal position
         * @param {Number} y - A new vertical position
         */
        setPosition: function (x, y) {
            this.destination.x = MathsUtils.floor(x * Asset.ENLARGE);
            this.destination.y = MathsUtils.floor(y * Asset.ENLARGE);
        }
    };

    return /** @lends GraphicManager */ {
        /**
         * Initialize the manager
         * @param {HTMLElement} wrapper - The DOM holder
         * @param {HTMLImageElement} image - Combined image for assets
         * @param {{assets, positions}} data - Data of position inside the image and position onto the destination
         */
        start: function (wrapper, image, data) {
            _combinedImage = image;
            _imageData = data.assets;
            _buildingsPosition = data.positions;

            var width = 800;
            var height = 300;
            var layer = CanvasUtils.prepareCanvas(width, height);
            _buildingsLayer = layer.ctx;
            _buildingsLayer.imageSmoothingEnabled = 0;
            layer.cnv.classList.add("layer", "buildings");
            wrapper.appendChild(layer.cnv);

            if (IS_DEV) {
                var tools = new Clickable("debug", "Edit", function () {
                    location.href += "tools/buildingsPlanner/";
                });
                wrapper.appendChild(tools.html);
            }

            // watch for new buildings
            _buildingsList = new Map();
            MessageBus.observe(MessageBus.MSG_TYPES.BUILD, function (id) {
                var building = DataManager.get(id);
                if (building && building.asset && _imageData[building.asset]) {
                    var asset = new Asset(_imageData[building.asset], _buildingsPosition[building.asset]);
                    if (building.upgrade) {
                        _buildingsList.delete(building.upgrade);
                    }
                    _buildingsList.push(building.id, asset);
                }
            })
            .observe(MessageBus.MSG_TYPES.UNBUILD, function (id) {
                var building = DataManager.get(id);
                if (building && _buildingsList.has(id)) {
                    _buildingsList.delete(id);
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

            if (_buildingsList.size) {
                _buildingsLayer.clear();
                // TODO : optimize to not sort each loop
                _buildingsList.getValues().sort(function (a, b) {
                    return a.compare(b);
                }).forEach(function (asset) {
                    asset.render(_combinedImage, _buildingsLayer);
                });
            }
        }
    };
})();

