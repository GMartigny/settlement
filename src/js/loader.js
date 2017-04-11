"use strict";
/* global IS_DEV, performance */

/**
 * Loader
 */
(function () {
    console.groupCollapsed("Loading");

    var _assetsURL = "dist/img/assets.png";
    var _assetsDataURL = "dist/js/assets.json";

    loadAsync([
        "dist/img/icons.png",
        _assetsURL,
        _assetsDataURL
    ], function (percent, file) {
        console.log(file + " : " + percent.toFixed(1) + "% - " + round(performance.now()));
    }).then(function (media) {
        console.groupEnd();
        try {
            var Game = new GameController(document.body, {
                images: media[sanitize(_assetsURL)],
                data: media[sanitize(_assetsDataURL)]
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
