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
 * @prop {ButtonData} [yes={name: "Ok"}] - The validate button data (right)
 * @prop {ButtonData} [no] - The cancel button data (left)
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

        html.appendChild(Utils.wrap("title", Utils.capitalize(this.data.name)));
        html.appendChild(Utils.wrap("description", this.data.desc));

        var self = this;

        var onYes = (this.data.yes && this.data.yes.action) || Utils.noop;
        var yesButton = new Clickable("yes", (this.data.yes && this.data.yes.name) || "Ok", function () {
            onYes();
            self.remove();
        });
        html.appendChild(yesButton.html);

        if (this.data.no) {
            var onNo = this.data.no.action || Utils.noop;
            var noButton = new Clickable("no", this.data.no.name || "Cancel", function () {
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

        this.html.style.top = MathUtils.floor((Popup.holder.offsetHeight - this.html.offsetHeight) / 2) + "px";
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
