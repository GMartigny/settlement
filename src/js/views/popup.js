"use strict";
/* exported Popup */

/**
 * @typedef {Object} ButtonData
 * @prop {String} name - Text of the button
 * @para {Function} [action] - A function to call
 */
/**
 * @typedef {Object} PopupData
 * @extends Data
 * @prop {ButtonData|String} [yes="Ok"] - The validate button data (right)
 * @prop {ButtonData|String} [no] - The cancel button data (left)
 */


/**
 * Display a popup with choice buttons
 * @param {PopupData} data - Text and action for the popup
 * @param {String} [CSSClasses] - Additional classes for the popup
 * @constructor
 * @extends View
 */
function Popup (data, CSSClasses) {
    this.data = data;

    this.super(CSSClasses);

    this.show();
}
Popup.holder = document.body;
Popup.extends(View, "Popup", /** @lends Popup.prototype */ {
    toHTML: function () {
        var html = this._toHTML();

        Utils.wrap("title", Utils.capitalize(this.data.name), html);
        Utils.wrap("description", this.data.desc, html);

        var self = this;

        var onYes = (this.data.yes && this.data.yes.action) || Utils.noop;
        var yesText = (this.data.yes && this.data.yes.name) || (Utils.isString(this.data.yes) && this.data.yes) || "Ok";
        var yesButton = new Clickable("yes", yesText, function () {
            self.remove();
            onYes();
        });
        html.appendChild(yesButton.html);

        if (this.data.no) {
            var onNo = this.data.no.action || Utils.noop;
            var noText = this.data.no.name || (Utils.isString(this.data.no) && this.data.no) || "Cancel";
            var noButton = new Clickable("no", noText, function () {
                self.remove();
                onNo();
            });
            html.appendChild(noButton.html);
        }

        return html;
    },
    show: function () {
        Popup.holder.classList.add("backdrop");
        Popup.holder.appendChild(this.html);

        this.html.style.top = MathsUtils.floor((Popup.holder.offsetHeight - this.html.offsetHeight) / 2) + "px";
        this.html.style.transform = "scale3d(1, 1, 1)";
        this.html.style.opacity = "1";
    },
    /**
     * Remove popup from DOM
     */
    remove: function () {
        this.html.remove();
        Popup.holder.classList.remove("backdrop");
    }
});
