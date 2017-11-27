describe("Test all model's instantiations", function modelDescribe () {

    this.model = null;

    GameController.holder = document.body;

    afterEach(function modelAfterEach () {

        this.model = null;

    });

    describe("Action", function ActionDescribe () {

        var settleId = DataManager.ids.actions.settle;

        beforeEach(function ActionBeforeEach () {

            var owner = new People("test");
            this.model = new Action(settleId, owner);

        });

        it("instanciate", function ActionInstanciate () {

            expect(this.model instanceof Action).toBe(true);
            var settleData = DataManager.get(settleId);
            expect(this.model.data).toEqual(settleData);
            expect(this.model.html.classList.contains("Action")).toBe(true);

        });

        it("toJSON", function ActionToJSON () {

            expect(this.model.toJSON()).toEqual({
                id: settleId,
                repeated: 0
            });

        });

    });

});
