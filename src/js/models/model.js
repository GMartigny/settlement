/* exported Model */

/**
 * A base model for all
 * @param {ID} id - The object's id
 * @param {...*} params - More params passed to View constructor
 * @constructor
 * @extends View
 */
function Model (id, ...params) {
    this.data = DataManager.get(id).clone();
    Model.prototype.super.call(this, null, ...params);
}
Model.extends(View, "Model", /** @lends Model.prototype */ {
    getId () {
        return this.data.id;
    },
    toJSON () {
        return {
            id: this.getId(),
        };
    },
});
