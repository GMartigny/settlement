/**
 * @licence Settlement Copyright 2017 Guillaume Martigny
 * Licensed under the Apache License, Version 2.0
 */

/* exported starter */

/**
 * Main loader
 * @param {Object} globalScope - A scope to put the game controller object (DEV only)
 */
function starter (globalScope) {
    const container = document.body;
    container.classList.add("loading");
    if (IS_DEV) {
        console.groupCollapsed("Loading");
    }

    const loadStart = Utils.getNow();
    // Preload
    const distUrl = "dist/";
    Utils.loadAsync({
        Dosis: "https://fonts.gstatic.com/s/dosis/v7/xIAtSaglM8LZOYdGmG1JqQ.woff",
        icons: `${distUrl}img/icons.png`,
        assets: `${distUrl}img/assets.png`,
        assetsData: `${distUrl}json/assets.json`,
        buildingsData: `${distUrl}json/buildingsData.json`,
    }, (percent, name) => {
        Utils.log(`${name} : ${percent.toFixed(1)}% - ${Utils.getNow() - loadStart}ms`);
    }).then((media) => {
        if (IS_DEV) {
            console.groupEnd();
        }
        container.classList.remove("loading");
        document.head.appendChild(media.Dosis);
        container.innerHTML = "";
        const Game = new GameController(container, media);
        if (IS_DEV) {
            globalScope.G = Game;
        }
    }).catch(error => console.warn(`Fail to load game : ${error.message}`, error.stack));
}

if (!IS_DEV) {
    exports.starter = starter;
}
