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

    this.show.defer(this);
}
Popup.extends(View, "Popup", /** @lends Popup.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML: function () {
        var html = this._toHTML();

        Utils.wrap("title", Utils.capitalize(this.data.name), html);
        Utils.wrap("description", this.data.desc, html);

        var onYes = (this.data.yes && this.data.yes.action) || Utils.noop;
        var yesText = (this.data.yes && this.data.yes.name) || (Utils.isString(this.data.yes) && this.data.yes) || "Ok";
        var yesButton = new Clickable("yes", yesText, this.hide.bind(this, onYes));
        html.appendChild(yesButton.html);

        if (this.data.no) {
            var onNo = this.data.no.action || Utils.noop;
            var noText = this.data.no.name || (Utils.isString(this.data.no) && this.data.no) || "Cancel";
            var noButton = new Clickable("no", noText, this.hide.bind(this, onNo));
            html.appendChild(noButton.html);
        }

        html.hide();

        return html;
    },
    /**
     * Display the popup
     * @param {Function} [afterShow] - Callback to call after show transition's done
     */
    show: function (afterShow) {
        Popup.OPENED = true;
        Popup.HOLDER.classList.add("backdrop");
        Popup.HOLDER.appendChild(this.html);

        this.html.style.top = MathsUtils.floor((Popup.HOLDER.offsetHeight - this.html.offsetHeight) / 2) + "px";

        this._show(afterShow);
    },
    /**
     * Hide the popup
     * @param {Function} [afterHide] - Callback to call after hide transition's done
     */
    hide: function (afterHide) {
        Popup.OPENED = false;
        this.remove();

        this._hide(afterHide);
    },
    /**
     * Remove popup from DOM
     */
    remove: function () {
        this._remove();
        Popup.HOLDER.classList.remove("backdrop");
    }
});

Popup.static({
    HOLDER: document.body,
    OPENED: false
});
