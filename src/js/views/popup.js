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
    toHTML () {
        const html = this._toHTML();

        Utils.wrap("title", Utils.capitalize(this.data.name), html);
        Utils.wrap("description", this.data.desc, html);

        const { yes, no } = this.data;

        const onYes = (yes && yes.action) || Utils.noop;
        const yesText = (yes && yes.name) || (Utils.isString(yes) && yes) || "Ok";
        const yesButton = new Clickable("yes", yesText, this.hide.bind(this, onYes));
        html.appendChild(yesButton.html);

        if (no) {
            const onNo = no.action || Utils.noop;
            const noText = no.name || (Utils.isString(no) && no) || "Cancel";
            const noButton = new Clickable("no", noText, this.hide.bind(this, onNo));
            html.appendChild(noButton.html);
        }

        html.hide();

        return html;
    },
    /**
     * Display the popup
     * @param {Function} [afterShow] - Callback to call after show transition's done
     */
    show (afterShow) {
        Popup.OPENED = true;
        Popup.HOLDER.classList.add("backdrop");
        Popup.HOLDER.appendChild(this.html);

        const top = MathsUtils.floor((Popup.HOLDER.offsetHeight - this.html.offsetHeight) / 2);
        this.html.style.top = `${top}px`;

        this._show(afterShow);
    },
    /**
     * Hide the popup
     * @param {Function} [afterHide] - Callback to call after hide transition's done
     */
    hide (afterHide) {
        Popup.OPENED = false;
        this.remove();

        this._hide(afterHide);
    },
    /**
     * Remove popup from DOM
     */
    remove () {
        this._remove();
        Popup.HOLDER.classList.remove("backdrop");
    },
});

Popup.static({
    HOLDER: document.body,
    OPENED: false,
});
