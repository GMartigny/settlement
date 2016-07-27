"use strict";
function Building (data) {
    this.data = data;
    this.consolidateData();

    this.number = 0;

    this.html = this.toHTML();
    tooltip(this.html, data);

    this.add(1);
}
Building.prototype = {
    toHTML: function () {
        this.counter = wrap("counter");
        var html = wrap("building", this.data.name);
        html.appendChild(this.counter);
        return html;
    },
    consolidateData: function () {
        var data = this.data;
        if (isFunction(data.name)) {
            data.name = data.name(this);
        }
        if (isFunction(data.desc)) {
            data.desc = data.desc(this);
        }
        if (isFunction(data.time)) {
            data.time = data.time(this);
        }
        if (isFunction(data.consume)) {
            data.consume = data.consume(this);
        }
    },
    add: function (number) {
        this.number += number;
        this.counter.textContent = this.number;
    }
};
Building.LST_ID = "buildingsList";