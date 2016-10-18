var GraphicManager = (function () {

    var context;
    var images;

    var assets = [];

    return {
        /**
         * Initialize the manager
         * @param {HTMLElement} wrapper - The DOM holder
         * @param {Object} media - A set of loaded media
         */
        start: function (wrapper, media) {
            images = media;
            var prep = prepareCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
            context = prep.ctx;
            prep.cnv.classList.add("layer");
            wrapper.appendChild(prep.cnv);

            var busInstance = MessageBus.getInstance();
            busInstance.observe(MessageBus.MSG_TYPES.BUILD, function (building) {
                if (building.asset) {
                    assets.push(new Asset(images[building.asset.image], building.asset.position));
                }
            });
        },
        /**
         * Draw everything
         */
        render: function () {
            context.clear();

            assets.sort(function (a, b) {
                return a.position.y - b.position.y;
            });
            assets.forEach(function (asset) {
                asset.render(context);
            });
        }
    };
})();

/**
 * A class for assets
 * @param {HTMLImageElement} image -
 * @param {Object} position -
 * @constructor
 */
function Asset (image, position) {
    this.image = image;
    this.position = {
        x: random.apply(null, (position.x + "").split("-")),
        y: random.apply(null, (position.y + "").split("-"))
    };
}
Asset.prototype = {
    /**
     * Draw this asset into a context
     * @param {CanvasRenderingContext2D} context
     */
    render: function (context) {
        context.drawImage(this.image, this.position.x, this.position.y);
    }
};
