/* exported GraphicManager */

const GraphicManager = (function iife () {
    let combinedImage;
    let imageData;

    let buildingsPosition;

    let buildingsLayer;
    let buildingsList;

    /**
     * A class for assets
     * @param {Object} sourceData - Data for source image
     * @param {Object} destData - Data for drawing destination
     * @constructor
     */
    function Asset (sourceData, destData) {
        if (!destData) {
            throw new TypeError(`Can't draw asset ${sourceData.source_image} without destination`);
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
            height: sourceData.height,
        };
        this.destination.width = this.source.width * Asset.SCALE;
        this.destination.height = this.source.height * Asset.SCALE;

        this.destination.x = MathsUtils.floor(destData.x * Asset.SCALE);
        this.destination.y = MathsUtils.floor(destData.y * Asset.SCALE);

        this.zIndex = ((destData.index || 1) * 1e4) + this.destination.y + this.destination.height;
    }
    Asset.SCALE = 4; // 4 times bigger !!§!
    Asset.FPS = 60;
    Asset.prototype = {
        /**
         * Draw this asset into a context
         * @param {HTMLImageElement} image - A combined image
         * @param {CanvasRenderingContext2D} layer - A layer to draw into
         */
        render (image, layer) {
            this.animationState = (this.animationState + this.animationSpeed) % this.animationSteps;
            const animationShift = MathsUtils.floor(this.animationState) * this.source.width;
            const posX = this.destination.x;
            const posY = this.destination.y;
            layer.drawImage(
                image,
                this.source.x + animationShift, this.source.y, this.source.width, this.source.height,
                posX, posY, this.destination.width, this.destination.height,
            );
        },
    };

    return /** @lends GraphicManager */ {
        /**
         * Initialize the manager
         * @param {HTMLElement} wrapper - The DOM holder
         * @param {HTMLImageElement} image - Combined image for assets
         * @param {{assets, positions}} data - Data of position inside the image and position onto the destination
         */
        start (wrapper, image, data) {
            combinedImage = image;
            imageData = data.assets;
            buildingsPosition = data.positions;

            const width = 800;
            const height = 300;
            const layer = CanvasUtils.prepareCanvas(width, height);
            buildingsLayer = layer.ctx;
            buildingsLayer.imageSmoothingEnabled = 0;
            layer.cnv.classList.add("layer", "buildings");
            wrapper.appendChild(layer.cnv);

            if (IS_DEV) {
                const tools = new Clickable("debug", "Edit", () => location.href += "tools/buildingsPlanner/");
                wrapper.appendChild(tools.html);
            }

            // watch for new buildings
            buildingsList = new Map();
            MessageBus
                .observe(MessageBus.MSG_TYPES.BUILD, (id) => {
                    const building = DataManager.get(id);
                    if (building && building.asset && imageData[building.asset]) {
                        const asset = new Asset(imageData[building.asset], buildingsPosition[building.asset]);
                        if (building.upgrade) {
                            buildingsList.delete(building.upgrade);
                        }
                        buildingsList.push(building.id, asset);
                    }
                })
                .observe(MessageBus.MSG_TYPES.UNBUILD, (id) => {
                    const building = DataManager.get(id);
                    if (building && buildingsList.has(id)) {
                        buildingsList.delete(id);
                    }
                });

            // start loopdy loop
            this.render();
        },
        /**
         * Draw everything
         */
        render () {
            requestAnimationFrame(this.render.bind(this));

            if (buildingsList.size) {
                buildingsLayer.clear();
                const ordered = [];
                buildingsList.forEach((asset) => {
                    let index = asset.zIndex;
                    while (ordered[index]) {
                        index++;
                    }
                    ordered[index] = asset;
                });
                ordered.forEach(asset => asset.render(combinedImage, buildingsLayer));
            }
        },
    };
})();

