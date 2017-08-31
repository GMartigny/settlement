"use strict";
/* exported Perk */

/**
 * Class for perks
 * @param {ID} id - The perk's id
 * @param {People} owner - The person having this perk
 * @constructor
 */
function Perk (id, owner) {
    this.owner = owner;
    Perk.usedId.push(id);

    this.super(id);
}
Perk.usedId = [];
Perk.isUsed = function (perkId) {
    return Perk.usedId.includes(perkId);
};
Perk.extends(Model, "Perk", /** @lends Perk.prototype */ {
    init: function () {
        this.data.desc = LogManager.personify(this.data.desc, {
            people: this.owner
        });

        new Tooltip(this.html, this.data);

        if (Utils.isArray(this.data.unlock)) {
            this.owner.addAction(this.data.unlock);
        }
        if (Utils.isArray(this.data.lock)) {
            this.owner.lockAction(this.data.lock);
        }
    },
    toHTML: function () {
        var html = this._toHTML();
        html.textContent = "the \"" + Utils.capitalize(this.data.name) + "\"";
        return html;
    }
});
