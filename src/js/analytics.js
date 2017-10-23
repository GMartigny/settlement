/* exported sendEvent */

/**
 * Send an event hit to Analytics
 * @param {String} category - The type of event
 * @param {String} label - Some infos about the event
 * @param {Number} [value] - Any value
 */
var sendEvent = (function iife () {
    if (!IS_DEV) {
        var scope = {};
        (function iife (scope, globalName) {
            scope.GoogleAnalyticsObject = globalName;
            scope[globalName] = scope[globalName] || function () {
                (scope[globalName].q = scope[globalName].q || []).push(arguments);
            };
            scope[globalName].l = +new Date();
            var tag = document.createElement("script");
            var firstTag = document.getElementsByTagName("script")[0];
            tag.async = 1;
            tag.src = "https://www.google-analytics.com/analytics.js";
            firstTag.parentNode.insertBefore(tag, firstTag);
        })(scope, "ga");

        scope.ga("create", "UA-99773946-1", "auto");
        scope.ga("send", "pageview");

        return function sendEvent (category, label, value) {
            scope.ga("send", "event", "Game", category, label, value);
        };
    }
    else {
        return Utils.noop;
    }
})();
