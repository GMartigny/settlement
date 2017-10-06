describe("Test save manager", function saveManagerDescribe () {

    var data = {
        key: "value",
        noise: 123456
    };

    it("!hasData before", function saveManagerHasDataBefore () {

        expect(SaveManager.hasData()).toBe(false);

    });

    it("persist", function saveManagerPersist () {

        SaveManager.persist(data);
        expect(localStorage.length).toBeGreaterThan(1);

    });

    it("hasData after", function saveManagerHasDataAfter () {

        expect(SaveManager.hasData()).toBe(true);

    });

    it("load", function saveManagerLoad () {

        expect(SaveManager.load().key).toEqual(data.key);

    });

    it("clear", function saveManagerClear () {

        SaveManager.clear();
        expect(SaveManager.hasData()).toBe(false);

    });

});
