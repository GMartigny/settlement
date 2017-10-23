/**
 * @licence Settlement Copyright 2017 Guillaume Martigny
 * Licensed under the Apache License, Version 2.0
 */
"use strict";

/* exported starter */

/**
 * Main loader
 * @param {Object} globalScope - A scope to put the game controller object (DEV only)
 */
function starter (globalScope) {
    console.groupCollapsed("Loading");

    var _assetsURL = "dist/img/assets.png";
    var _assetsDataURL = "dist/json/assets.json";
    var _buildingsDataURL = "dist/json/buildingsData.json";

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
        var Game = new GameController(document.body, {
            images: media[Utils.sanitize(_assetsURL)],
            data: {
                assets: media[Utils.sanitize(_assetsDataURL)],
                positions: media[Utils.sanitize(_buildingsDataURL)]
            }
        });
        if (IS_DEV) {
            globalScope.G = Game;
        }
    }).catch(function (error) {
        console.warn("Fail to load game : " + error.message, error.stack);
    });
}
