"use strict";

/**
 * Loader
 */
(function () {
    console.groupCollapsed("Loading");

    var _assetsURL = "dist/img/assets.png";
    var _assetsDataURL = "dist/js/assets.json";
    var _buildingsDataURL = "dist/js/buildingsData.json";

    var loadStart = Utils.getNow();
    Utils.loadAsync([
        "dist/img/icons.png", // just preload
        _assetsURL,
        _assetsDataURL,
        _buildingsDataURL
    ], function (percent, file) {
        console.log(file + " : " + percent.toFixed(1) + "% - " + (Utils.getNow() - loadStart));
    }).then(function (media) {
        console.groupEnd();
        try {
            var Game = new GameController(document.body, {
                images: media[Utils.sanitize(_assetsURL)],
                data: {
                    assets: media[Utils.sanitize(_assetsDataURL)],
                    positions: media[Utils.sanitize(_buildingsDataURL)]
                }
            });
            if (IS_DEV) {
                window.G = Game;
            }
        }
        catch (error) {
            console.warn("Fail to load game : " + error.message, error.stack);
        }
    }).catch(function (error) {
        console.warn(error.message, e.stack);
    });
})();
