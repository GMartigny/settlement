/**
 * Display a popup with choice buttons
 * @param {Object} data - Text for the popup
 * @param {Function} [onYes] - Action to do on validate
 * @param {String} [CSSClasses] - Additional classes for the popup
 * @returns {Object} Some functions
 */
function popup (data, onYes, CSSClasses) {
    onYes = onYes || noop;

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

    var yesButton = wrap("yes clickable", data.yes || "Ok");
    yesButton.addEventListener("click", function () {
        onYes();
        api.remove();
    });
    box.appendChild(yesButton);

    if (data.no) {
        var noButton = wrap("no clickable", data.no);
        noButton.addEventListener("click", api.remove);
        box.appendChild(noButton);
    }

    holder.appendChild(box);
    holder.classList.add("backdrop");

    box.style.top = floor((holder.offsetHeight - box.offsetHeight) / 2) + "px";

    return api;
}
