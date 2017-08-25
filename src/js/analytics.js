/* exported sendEvent */

window.ga = false;
if (!IS_DEV) {
    (function (scope, globalName, tag, firstTag) {
        scope.GoogleAnalyticsObject = globalName;
        scope[globalName] = scope[globalName] || function () {
            (scope[globalName].q = scope[globalName].q || []).push(arguments);
        };
        scope[globalName].l = +new Date();
        tag = document.createElement("script");
        firstTag = document.getElementsByTagName("script")[0];
        tag.async = 1;
        tag.src = "https://www.google-analytics.com/analytics.js";
        firstTag.parentNode.insertBefore(tag, firstTag);
    })(window, "ga");

    ga("create", "UA-99773946-1", "auto");
    ga("send", "pageview");
}
/**
 * Send an event hit to Analytics
 * @param {String} category - The type of event
 * @param {String} label - Some infos about the event
 * @param {Number} [value] - Any value
 */
function sendEvent (category, label, value) {
    if (isFunction(ga)) {
        ga("send", "event", "Game", category, label, value);
    }
}
