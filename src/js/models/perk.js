/* exported Perk */

/**
 * Class for perks
 * @param {ID} id - The perk's id
 * @param {People} owner - The person having this perk
 * @constructor
 * @extends Model
 */
function Perk (id, owner) {
    if (Perk.usedId.includes(id)) {
        throw new RangeError(`This perk is already used [${id}]`);
    }
    Perk.usedId.push(id);
    this.owner = owner;

    this.super(id);
}
Perk.extends(Model, "Perk", /** @lends Perk.prototype */ {
    /**
     * Initialize object
     * @private
     */
    init () {
        this.data.desc = LogManager.personify(this.data.desc, {
            people: this.owner,
        });

        new Tooltip(this.html, this.data);

        if (Utils.isArray(this.data.unlock)) {
            this.owner.addAction(this.data.unlock);
        }
        if (Utils.isArray(this.data.lock)) {
            this.owner.lockAction(this.data.lock);
        }
    },
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();
        html.textContent = `the "${Utils.capitalize(this.data.name)}"`;
        return html;
    },
});

Perk.static(/** @lends Perk */{
    usedId: [],
    /**
     * Tell if this perk has already been used
     * @param {ID} perkId - Any perk ID
     * @return {Boolean}
     */
    isUsed (perkId) {
        return Perk.usedId.includes(perkId);
    },
});
