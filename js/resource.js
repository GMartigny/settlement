function Resource(data, count) {
    this.init(data);

    this.count = 0;
    if (count) {
        this.update(+count);
    }
}
Resource.prototype = {
    init: function(data) {
        this.data = data;
        this.consolidateData();

        this.html = this.toHTML();
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.tooltip = tooltip(this.html, data);
    },
    toHTML: function() {
        return wrap("resource get-more", floor(this.count));
    },
    consolidateData: function() {
        var data = this.data;
        if (isFunction(data.consume)) {
            data.consume = data.consume(this);
        }
    },
    refresh: function(resources) {
        this.html.textContent = floor(this.count);
        if (resources && isArray(this.data.consume)) {
            this.tooltip.refresh(resources, this.data.consume);
        }
    },
    update: function(amount) {
        this.set(this.count + amount);

        var cb = false;
        if (amount > 0 && !this.html.classList.contains("more")) {
            this.html.classList.add("more");
            cb = function() {
                this.html.classList.remove("more");
            }.bind(this);
        }
        else if (amount < 0 && !this.html.classList.contains("less")) {
            this.html.classList.add("less");
            cb = function() {
                this.html.classList.remove("less");
            }.bind(this);
        }
        if (cb) {
            setTimeout(cb, 700);
        }
    },
    get: function() {
        return this.count;
    },
    set: function(value) {
        this.count = value;
        if (this.count < 0) {
            throw "Resources count can't be negative"
        }
        this.refresh();
    },
    has: function(amount) {
        return this.count >= amount;
    }
};
Resource.LST_ID = "resourceList";