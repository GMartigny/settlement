"use strict";
function Building(data) {
    this.data = data;
    this.consolidateData();
    
    this.number = 1;
    
    this.html = this.toHTML();
    tooltip(this.html, data);
}
Building.prototype = {
    toHTML: function() {
        return wrap("building");
    },
    consolidateData: function() {
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
    add: function(number) {
        this.number += number;
    }
};
Building.LST_ID = "buildingsList";