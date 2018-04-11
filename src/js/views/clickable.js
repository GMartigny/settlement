/* @exported Clickable */

/**
 * A class for a clickable element
 * @param {String} CSSClass - A custom css class to add
 * @param {String} text - Text inside the element
 * @param {Function} [action] - A function to call when clicked
 * @constructor
 * @extends View
 */
function Clickable (CSSClass, text, action) {
    this.text = text;
    this.timeout = null;
    this.super(CSSClass);

    this.setAction(action);
}
Clickable.extends(View, "Clickable", /** @lends Clickable.prototype */ {
    /**
     * Return HTML for display
     * @return {HTMLElement}
     */
    toHTML () {
        const html = this._toHTML();

        html.textContent = this.text;
        html.tabIndex = 0;

        return html;
    },
    /**
     * Start a cool-down animation
     * @param {Number} duration - Total duration of the animation
     * @param {Number} consumed - Already consumed time in the animation
     * @param {Function} action - Function to call when reach timeout
     */
    startCoolDown (duration, consumed, action) {
        this.html.style.animationDuration = `${duration}ms`;
        this.html.style.animationDelay = `${-consumed}ms`;
        this.html.classList.add("cooldown");

        this.timeout = TimerManager.timeout(() => {
            this.endCoolDown();
            action();
        }, (duration - consumed));
    },
    /**
     * Define the action for the button
     * @param {Function} action - Any function to execute on click
     */
    setAction (action) {
        if (Utils.isFunction(action)) {
            this.html.addEventListener("click", action, true);
        }
    },
    /**
     * Tell if this clickable's cooldown is running
     * @return {Boolean}
     */
    isRunning () {
        return Boolean(this.timeout);
    },
    /**
     * End the cool-down animation
     */
    endCoolDown () {
        if (this.isRunning()) {
            TimerManager.clear(this.timeout);
            this.timeout = null;

            this.html.style.animationDuration = "";
            this.html.style.animationDelay = "";
            this.html.classList.remove("cooldown");
        }
    },
    /**
     * Toggle its disabled state
     * @param {Boolean} enable - Set to true to enable it and false to disable
     */
    toggle (enable) {
        this.html.classList.toggle("disabled", !enable);
        const tabIndexAccessible = 0;
        const tabIndexDisabled = -1;
        this.html.tabIndex = enable ? tabIndexAccessible : tabIndexDisabled;
    },
    /**
     * Change the clickable text
     * @param {String} text - Any string
     */
    setText (text) {
        this.text = text;
        this.html.textContent = text;
    },
    /**
     * Return elapsed time of the cooldown
     * @return {Number}
     */
    getElapsed () {
        return TimerManager.getElapsed(this.timeout);
    },
    /**
     * Return remaining time in the cooldown
     * @return {Number}
     */
    getRemaining () {
        return TimerManager.getRemaining(this.timeout);
    },
    /**
     * Define this clickable as a drop-down of other clickable
     * @param {Boolean} itIs - True to set it, false to reverse
     */
    setAsDropdown (itIs) {
        this.html.classList.toggle("dropdown", itIs);
    },
});
