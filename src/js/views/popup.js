"use strict";
/* exported popup */

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
 * @returns {Object} Some functions
 */
function popup (data, buttons, CSSClasses) {
    var holder = document.body;

    CSSClasses = "popup" + (CSSClasses ? " " + CSSClasses : "");
    var box = Utils.wrap(CSSClasses);

    box.appendChild(Utils.wrap("title", Utils.capitalize(data.name)));
    box.appendChild(Utils.wrap("description", data.desc));

    var api = {
        /**
         * Remove popup from DOM
         */
        remove: function () {
            box.remove();
            holder.classList.remove("backdrop");
        }
    };

    buttons = buttons || {};
    var yesButton = Utils.wrap("yes clickable", (buttons.yes && buttons.yes.name) || "Ok");
    var onYes = (buttons.yes && buttons.yes.action) || Utils.noop;
    yesButton.addEventListener("click", function () {
        onYes();
        api.remove();
    }, true);
    box.appendChild(yesButton);

    if (buttons.no) {
        var noButton = Utils.wrap("no clickable", buttons.no.name || "Cancel");
        var onNo = buttons.no.action || Utils.noop;
        noButton.addEventListener("click", function () {
            onNo();
            api.remove();
        }, true);
        box.appendChild(noButton);
    }

    holder.classList.add("backdrop");
    holder.appendChild(box);

    box.style.top = MathUtils.floor((holder.offsetHeight - box.offsetHeight) / 2) + "px";

    return api;
}
