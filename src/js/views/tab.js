/* exported Tab */

/**
 * Class for tab content
 * @param {String} CSSClass - Some CSS classes
 * @param {Function} onChange - Function to call when change selected tab
 * @constructor
 * @extends View
 */
function Tab (CSSClass, onChange) {
    this.super(CSSClass);

    this.tabs = new Map();
    this.onChange = onChange;
    this.selected = null;
}

Tab.extends(View, "Tab", /** @lends Tab.prototype */ {
    /**
     * Add a model to the tab list
     * @param {Model} model - Any model
     */
    add (model) {
        const modelClickable = new Clickable("tab", model.data.name, this.switch.bind(this, model));

        this.html.appendChild(modelClickable.html);

        this.tabs.push(model.getId(), {
            clickable: modelClickable,
            model,
        });
    },

    /**
     * Remove a model from the list
     * @param {Model} model - Any model
     */
    remove (model) {
        const tab = this.tabs.delete(model.getId());
        tab.clickable.html.remove();
    },

    /**
     * Change the selected model
     * @param {Model} model - Any model
     */
    switch (model) {
        if (this.selected) {
            this.selected.clickable.html.classList.remove("selected");
        }
        this.selected = this.tabs.get(model.getId());
        this.selected.clickable.html.classList.add("selected");
        this.onChange(model);
    },
});
