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
 * @param {PopupData} buttons - Text for the popup
 * @param {String} [CSSClasses] - Additional classes for the popup
 * @returns {Object} Some functions
 */
function popup (data, buttons, CSSClasses) {
    var holder = document.body;

    CSSClasses = "popup" + (CSSClasses ? " " + CSSClasses : "");
    var box = wrap(CSSClasses);

    box.appendChild(wrap("title", capitalize(data.name)));
    box.appendChild(wrap("description", data.desc));

    var api = {
        /**
         * Remove popup from DOM
         */
        remove: function () {
            box.remove();
            holder.classList.remove("backdrop");
        }
    };

    var yesButton = wrap("yes clickable", (buttons.yes && buttons.yes.name) || "Ok");
    var onYes = (buttons.yes && buttons.yes.action) || noop;
    yesButton.addEventListener("click", function () {
        onYes();
        api.remove();
    }, true);
    box.appendChild(yesButton);

    if (buttons.no) {
        var noButton = wrap("no clickable", buttons.no.name || "Cancel");
        var onNo = buttons.no.action || noop;
        noButton.addEventListener("click", function () {
            onNo();
            api.remove();
        }, true);
        box.appendChild(noButton);
    }

    holder.classList.add("backdrop");
    holder.appendChild(box);

    box.style.top = floor((holder.offsetHeight - box.offsetHeight) / 2) + "px";

    return api;
}
