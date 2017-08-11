"use strict";
/* exported Perk */

/**
 * Class for perks
 * @param {ID} id - The perk's id
 * @param {People} owner - The person having this perk
 * @constructor
 */
function Perk (id, owner) {
    var data = DataManager.get(id);
    data.desc = LogManager.personify(data.desc, {
        people: owner
    });
    this.owner = owner;
    Perk.usedId.push(id);

    this.super(data);
}
Perk.usedId = [];
Perk.isUsed = function (perkId) {
    return Perk.usedId.includes(perkId);
};
Perk.extends(Model, "Perk", /** @lends Perk.prototype */ {
    init: function () {
        new Tooltip(this.html, this.data);

        if (isArray(this.data.unlock)) {
            this.owner.addAction(this.data.unlock);
        }
        if (isArray(this.data.lock)) {
            this.owner.lockAction(this.data.lock);
        }
    },
    toHTML: function () {
        var html = this._toHTML();
        html.textContent = "the \"" + capitalize(this.data.name) + "\"";
        return html;
    }
});
