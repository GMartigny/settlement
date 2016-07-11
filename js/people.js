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
        return wrap("people", this.name)
    },
    refresh: function(resources, elapse) {
        this.actions.forEach(function(a) {
            a.refresh(resources);
        });
        this.updateEnergy(elapse * 2);
    },
    setBusy: function(busy) {
        this.busy = busy;
        this.html.classList.toggle("busy", busy);
    },
    updateEnergy: function(amount) {
        this.energy += amount;
        if (this.energy > 100) {
            this.energy = 100;
        }
        else if (this.energy < 0) {
            this.energy = 0;
        }
    },
    isTired: function() {
        return this.energy == 0;
    },
    updateLife: function(amount) {
        this.life += amount;
        if (this.life > 100) {
            this.life = 100;
            return this.life;
        }
        else if (this.life < 0) {
            this.die();
            return 0;
        }
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
                this.get(data.id).init(data);
            }
            else{
                var action = new Action(this, data);
                this.html.appendChild(action.html);
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
        this.html.remove();
    }
};
People.LST_ID = "peopleList";
People.randomName = function(amount) {
    return new Promise(function(resolve, reject) {
        get("https://randomuser.me/api?inc=gender,name&nat=AU,BR,CA,CH,DE,DK,ES,FI,FR,GB,IE,NL,NZ,TR,US&noinfo&results=" + amount, resolve, reject);
    });
};