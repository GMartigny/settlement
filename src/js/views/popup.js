"use strict";
/* exported Popup */

/**
 * @typedef {Object} ButtonData
 * @prop {String} name - Text of the button
 * @para {Function} [action] - A function to call
 */
/**
 * @typedef {Object} PopupData
 * @prop {ButtonData} [yes={name: "Ok"}] - The validate button data
 * @prop {ButtonData} [no] - The cancel button data
 */


/**
 * Display a popup with choice buttons
 * @param {Data} data - Text for the popup
 * @param {PopupData} [buttons={}] - Text for the popup
 * @param {String} [CSSClasses] - Additional classes for the popup
 * @constructor
 */
function Popup (data, buttons, CSSClasses) {
    this.data = data;
    this.buttons = buttons || {};

    this.super(CSSClasses);

    this.show();
}
Popup.holder = document.body;
Popup.extends(View, "Popup", /** @lends Popup.prototype */ {
    toHTML: function () {
        var html = this._toHTML();

        html.appendChild(Utils.wrap("title", Utils.capitalize(this.data.name)));
        html.appendChild(Utils.wrap("description", this.data.desc));

        var self = this;

        var onYes = (this.buttons.yes && this.buttons.yes.action) || Utils.noop;
        var yesButton = new Clickable("yes", (this.buttons.yes && this.buttons.yes.name) || "Ok", function () {
            onYes();
            self.remove();
        });
        html.appendChild(yesButton.html);

        if (this.buttons.no) {
            var onNo = this.buttons.no.action || Utils.noop;
            var noButton = new Clickable("no", this.buttons.no.name || "Cancel", function () {
                onNo();
                self.remove();
            });
            html.appendChild(noButton.html);
        }

        return html;
    },
    show: function () {
        Popup.holder.classList.add("backdrop");
        Popup.holder.appendChild(this.html);

        var top = MathUtils.floor((Popup.holder.offsetHeight - this.html.offsetHeight) / 2) + "px";
        this.html.style.top = top;
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
