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
    var container = document.body;
    container.classList.add("loading");
    if (IS_DEV) {
        console.groupCollapsed("Loading");
    }

    var loadStart = Utils.getNow();
    // Preload
    var distUrl = "dist/";
    Utils.loadAsync({
        Dosis: "https://fonts.gstatic.com/s/dosis/v7/xIAtSaglM8LZOYdGmG1JqQ.woff",
        icons: distUrl + "img/icons.png",
        assets: distUrl + "img/assets.png",
        assetsData: distUrl + "json/assets.json",
        buildingsData: distUrl + "json/buildingsData.json"
    }, function loadedFile (percent, name) {
        Utils.log(name + " : " + percent.toFixed(1) + "% - " + (Utils.getNow() - loadStart) + "ms");
    }).then(function allLoaded (media) {
        if (IS_DEV) {
            console.groupEnd();
        }
        container.classList.remove("loading");
        document.head.appendChild(media.Dosis);
        container.innerHTML = "";
        var Game = new GameController(container, media);
        if (IS_DEV) {
            globalScope.G = Game;
        }
    }).catch(function (error) {
        console.warn("Fail to load game : " + error.message, error.stack);
    });
}

if (!IS_DEV) {
    exports.starter = starter;
}
