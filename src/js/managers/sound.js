"use strict";
/* exported SoundManager */

var SoundManager = (function () {

    var audioContainer = new Audio();

    return {
        load: function (url) {
            fetch(url).then(function (response) {
                if (response.ok) {
                    return response.blob();
                }
                else {
                    throw new URIError("[" + response.status + "] " + url + " " + response.statusText);
                }
            }).then(function (blob) {

            });
        },
        play: function (spriteName) {
        },
        loop: function (spriteName) {
        }
    };
})();
