/* exported ControlModule */

/**
 * Class for the control module
 * @constructor
 * @extends View
 */
function ControlModule () {
    this.super();
}

ControlModule.extends(View, "ControlModule", /** @lends ControlModule.prototype */ {
    toHTML () {
        const html = this._toHTML();

        this.resourcesList = Utils.wrap("resources", null, html);

        this.peopleSwitcher = new Tab("people", this.setPeopleData);
        html.appendChild(this.peopleSwitcher.html);

        this.peopleData = Utils.wrap("data", null, html);

        return html;
    },

    setPeopleData (person) {
    },
});
