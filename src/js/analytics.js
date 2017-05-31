/* exported sendEvent */

if (!IS_DEV) {
    (function (i, s, o, g, r, a, m) {
        i.GoogleAnalyticsObject = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
        };
        i[r].l = +new Date();
        a = s.createElement(o);
        m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");

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
    if (ga) {
        ga("send", "event", "Game", category, label, value);
    }
}
