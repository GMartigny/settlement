function peopleFactory(amount) {
    return new Promise(function(resolve, reject) {
        People.randomName(amount).then(function(data) {
            try {
                var results = JSON.parse(data.target.response).results;
                var people = [];
                results.forEach(function(res) {
                    people.push(new People(capitalize(res.name.first + " " + capitalize(res.name.last))));
                });
                resolve(people);
            }
            catch (e) {
                reject(e);
            }
        })
    });
}

function People(name) {
    log(name + " join the community");
    this.name = name;
    this.actions = new Collection();

    this.busy = false;
    this.life = 100;
    this.energy = 100;

    this.plan = false;

    this.html = this.toHTML();
}
People.prototype = {
    toHTML: function() {
        var html = wrap("people");
        html.appendChild(wrap("name", this.name));
        this.lifeBar = wrap("bar life");
        tooltip(this.lifeBar, {name: "Health", desc: "The first thing you want is a good health."});
        html.appendChild(this.lifeBar);
        this.energyBar = wrap("bar energy");
        tooltip(this.energyBar, {name: "Energy", desc: "Drained faster when busy or hungry."});
        html.appendChild(this.energyBar);
        this.actionList = wrap("actionList");
        html.appendChild(this.actionList);

        return html;
    },
    refresh: function(resources, elapse, settled) {
        this.actions.forEach(function(a) {
            a.refresh(resources);
        });
        var ratio = 2;
        if (this.busy) {
            ratio = 4;
            if(this.busy.relaxing){
                ratio *= this.busy.relaxing;
            }
        }
        if (settled) {
            this.updateEnergy(-elapse * ratio);
        }
    },
    setBusy: function(action) {
        this.busy = !!action ? action : false;
        this.html.classList.toggle("busy", !!action);
    },
    updateEnergy: function(amount) {
        if (!this.busy || !this.busy.relaxing) {
            this.energy += amount;

            if (this.energy > 100) {
                this.energy = 100;
            }
            else if (this.energy < 0) {
                this.updateLife(this.energy);
                this.energy = 0;
            }

            this.energyBar.style.width = this.energy + "%";
        }
        return this.energy;
    },
    isTired: function() {
        return this.energy <= 0;
    },
    updateLife: function(amount) {
        this.life += amount;
        if (this.life > 100) {
            this.life = 100;
        }
        else if (this.life < 0) {
            this.die();
        }
        this.lifeBar.style.width = this.life + "%";
        this.lifeBar.classList[this.life < 25 ? "add" : "remove"]("warning");
        return this.life;
    },
    planBuilding: function(building) {
        log("\"We'll do " + an(building.name) + "\"");
        this.plan = building;
    },
    addAction: function(data) {
        if (data.length) {
            for (var i = 0, l = data.length; i < l; ++i) {
                this.addAction(data[i]);
            }
        }
        else {
            if (this.actions.has(data.id)) {
                this.actions.get(data.id).init(data);
            }
            else {
                var action = new Action(this, data);
                this.actionList.appendChild(action.html);
                this.actions.push(data.id, action);
            }
        }
    },
    lockAction: function(data) {
        if (data.length) {
            for (var i = 0, l = data.length; i < l; ++i) {
                this.lockAction(data[i]);
            }
        }
        else {
            this.actions.pop(data.id).lock();
        }
    },
    die: function() {
        MessageBus.getInstance().notifyAll(MessageBus.MSG_TYPES.LOOSE_SOMEONE, this);
        this.html.classList.add("dead");
        setTimeout(function() {
            this.html.remove();
        }.bind(this), 1000);
    }
};
People.LST_ID = "peopleList";
People.randomName = function(amount) {
    return new Promise(function(resolve, reject) {
        get("https://randomuser.me/api?inc=gender,name&nat=AU,BR,CA,CH,DE,DK,ES,FI,FR,GB,IE,NL,NZ,TR,US&noinfo&results=" + amount, resolve, reject);
    });
};