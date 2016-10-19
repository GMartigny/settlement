var GraphicManager = (function () {

    var combinedImage;
    var drawingContext;
    var buildings = [];

    return {
        /**
         * Initialize the manager
         * @param {HTMLElement} wrapper - The DOM holder
         * @param {HTMLImageElement} image - Combined image for assets
         * @param {Object} data - Data of position inside the image
         */
        start: function (wrapper, image, data) {
            combinedImage = image;
            var prep = prepareCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
            drawingContext = prep.ctx;
            prep.cnv.classList.add("layer");
            wrapper.appendChild(prep.cnv);

            var busInstance = MessageBus.getInstance();
            // watch for new buildings
            busInstance.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
                if (building.asset) {
                    buildings.push(new Asset(data[building.asset.image], building.asset));
                    buildings.sort(function (a, b) {
                        return a.position.y - b.position.y;
                    });
                }
            }.bind(this));

            // watch for new events
            busInstance.observe(MessageBus.MSG_TYPES.EVENT_START, function (event) {
                if (event.asset) {
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

            drawingContext.clear();

            buildings.forEach(function (asset) {
                asset.render(combinedImage, drawingContext);
            });
        }
    };
})();

/**
 * A class for assets
 * @param {Object} sourceData -
 * @param {Object} destData -
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
        y: sourceData.y
    };

    this.position = {};
    if (destData.position.x.includes("-")) {
        this.position.x = random.apply(null, (destData.position.x + "").split("-"));
    }
    else {
        this.position.x = +destData.position.x;
    }
    if (destData.position.y.includes("-")) {
        this.position.y = random.apply(null, (destData.position.y + "").split("-"));
    }
    else {
        this.position.y = +destData.position.y;
    }
}
Asset.ANIMATION_INC = 2 / 60; // 2 animations per seconds at 60fps
Asset.prototype = {
    /**
     * Draw this asset into a context
     * @param {HTMLImageElement} image - A combined image
     * @param {CanvasRenderingContext2D} layer -
     */
    render: function (image, layer) {
        this.animationState = (this.animationState + Asset.ANIMATION_INC) % this.animationSteps;
        var animationShift = floor(floor(this.animationState) * this.size.width);
        var posX = floor(layer.canvas.width * (this.position.x / 100) - (this.size.width / 2));
        var posY = floor(layer.canvas.height * (this.position.y / 100) - (this.size.height / 2));
        layer.drawImage(image,
            this.origin.x + animationShift, this.origin.y, this.size.width, this.size.height,
            posX, posY, this.size.width, this.size.height);
    }
};
