describe("Test all general helper", function utilsDescribe () {

    it("noop", function utilsNoop () {

        expect(Utils.noop instanceof Function).toBe(true);

    });

    it("wrap", function utilsWrap () {

        var html = Utils.wrap();
        expect(html.tagName).toEqual("DIV");
        html = Utils.wrap("class", "inner");
        expect(html.className).toEqual("class");
        expect(html.innerHTML).toEqual("inner");

    });

    it("formatJoin", function utilsFormatJoin () {

        expect(Utils.formatJoin([])).toEqual("");
        var array = [1];
        expect(Utils.formatJoin(array)).toEqual("1");
        array = [1, 2, 3];
        expect(Utils.formatJoin(array)).toEqual("1, 2 and 3");
        expect(Utils.formatJoin(array, "or")).toEqual("1, 2 or 3");

    });

    it("formatArray", function utilsFormatArray () {

        var plotId = DataManager.ids.buildings.small.plot;
        var wellId = DataManager.ids.buildings.small.well;
        var plotName = DataManager.get(plotId).name;
        var wellName = DataManager.get(wellId).name;
        var array = [[2, plotId]];
        expect(Utils.formatArray(array)).toEqual("2 " + plotName + "s");
        array.push([1, wellId]);
        expect(Utils.formatArray(array)).toEqual("2 " + plotName + "s and 1 " + wellName);

        // TODO: test with icons

    });

    it("formatTime", function utilsformatTime () {

        expect(Utils.formatTime(0)).toEqual("0 hour");
        expect(Utils.formatTime(0.5)).toEqual("30 minutes");
        expect(Utils.formatTime(1)).toEqual("1 hour");
        expect(Utils.formatTime(1 + 6 / 60)).toEqual("1 hour and 6 minutes");
        expect(Utils.formatTime(5)).toEqual("5 hours");
        expect(Utils.formatTime(24 + 5)).toEqual("1 day and 5 hours");
        expect(Utils.formatTime(5 * 24)).toEqual("5 days");
        expect(Utils.formatTime(30 * 24 + 24 + 5)).toEqual("1 month, 1 day and 5 hours");
        expect(Utils.formatTime(5 * 30 * 24)).toEqual("5 months");
        expect(Utils.formatTime(365 * 24 + 5 * 30 * 24 + 24 + 5)).toEqual("1 year, 5 months, 1 day and 5 hours");
        expect(Utils.formatTime(5 * 365 * 24)).toEqual("5 years");

    });

    it("pluralize", function utilsPluralize () {

        expect(Utils.pluralize("apple", 2)).toEqual("apples");
        expect(Utils.pluralize("peach", 1)).toEqual("peach");
        expect(Utils.pluralize("ananas", 5)).toEqual("ananas");

    });

    it("capitalize", function utilsCapitalize () {

        expect(Utils.capitalize("")).toEqual("");
        expect(Utils.capitalize("!")).toEqual("!");
        expect(Utils.capitalize("word")).toEqual("Word");
        expect(Utils.capitalize("two sentences. one test !")).toEqual("Two sentences. One test !");

    });

    it("randomize", function utilsRandomize () {

        expect(Utils.randomize).toThrow();

        var rock = DataManager.ids.resources.gatherables.common.rock;
        var water = DataManager.ids.resources.gatherables.common.water;
        var tool = DataManager.ids.resources.craftables.basic.tool;
        var list = {
            sub: {
                rock: rock
            },
            tool: tool,
            sub2: {
                water: water
            }
        };
        var possibilities = [rock, water, tool];

        var pick = Utils.randomize(list);
        expect(possibilities).toContain(pick);

        function run (list, amount) {
            var res = {
                min: Infinity,
                max: 0
            };

            for (var i = 0; i < 666; ++i) {
                pick = Utils.randomize(list, amount);
                expect(possibilities).toContain(pick[1]);
                var x = pick[0];
                if (x < res.min) {
                    res.min = x;
                }
                if (x > res.max) {
                    res.max = x;
                }
            }

            return res;
        }

        var res = run(list, 10);
        expect(res.min >= 0).toBe(true);
        expect(res.max <= 10).toBe(true);

        res = run(list, [5, 15]);
        expect(res.min >= 5).toBe(true);
        expect(res.max <= 15).toBe(true);

        res = run(list, "42-55");
        expect(res.min >= 42).toBe(true);
        expect(res.max <= 55).toBe(true);

    });

    xit("randomizeMultiple", function utilsRandomizeMultiple () {
    });

    xit("log", function utilsLog () {
    });

    it("randomStr", function utilsRandomStr () {

        expect(Utils.randomStr()).toMatch(/\w{6}/);
        for (var i = 0; i < 999; ++i) {
            expect(Utils.randomStr(3)).toMatch(/\w{3}/);
        }

    });

    it("pickUniqueID", function utilsPickUniqueID () {

        var drawn = [];
        for (var i = 0; i < 999; ++i) {
            var pick = Utils.pickUniqueID();
            expect(pick).toBeDefined();
            expect(drawn.includes(pick)).toBe(false);
            drawn.push(pick);
        }

    });

    it("isFunction", function utilsIsFunction () {

        expect(Utils.isFunction(false)).toBe(false);
        expect(Utils.isFunction(5)).toBe(false);
        expect(Utils.isFunction("5")).toBe(false);
        expect(Utils.isFunction(null)).toBe(false);
        expect(Utils.isFunction(undefined)).toBe(false);
        expect(Utils.isFunction([1, 2, 3])).toBe(false);
        expect(Utils.isFunction({key: "prop"})).toBe(false);
        expect(Utils.isFunction(function noop () {
            return true;
        })).toBe(true);

    });

    it("isArray", function utilsIsArray () {

        expect(Utils.isArray(false)).toBe(false);
        expect(Utils.isArray(5)).toBe(false);
        expect(Utils.isArray("5")).toBe(false);
        expect(Utils.isArray(null)).toBe(false);
        expect(Utils.isArray(undefined)).toBe(false);
        expect(Utils.isArray([1, 2, 3])).toBe(true);
        expect(Utils.isArray({key: "prop"})).toBe(false);
        expect(Utils.isArray(function noop () {
            return true;
        })).toBe(false);

    });

    it("isString", function utilsIsString () {

        expect(Utils.isString(false)).toBe(false);
        expect(Utils.isString(5)).toBe(false);
        expect(Utils.isString("5")).toBe(true);
        expect(Utils.isString(null)).toBe(false);
        expect(Utils.isString(undefined)).toBe(false);
        expect(Utils.isString([1, 2, 3])).toBe(false);
        expect(Utils.isString({key: "prop"})).toBe(false);
        expect(Utils.isString(function noop () {
            return true;
        })).toBe(false);

    });

    it("isNumber", function utilsIsNumber () {

        expect(Utils.isNumber(false)).toBe(false);
        expect(Utils.isNumber(5)).toBe(true);
        expect(Utils.isNumber("5")).toBe(false);
        expect(Utils.isNumber(null)).toBe(false);
        expect(Utils.isNumber(undefined)).toBe(false);
        expect(Utils.isNumber([1, 2, 3])).toBe(false);
        expect(Utils.isNumber({key: "prop"})).toBe(false);
        expect(Utils.isNumber(function noop () {
            return true;
        })).toBe(false);

    });

    it("isUndefined", function utilsIsUndefined () {

        expect(Utils.isUndefined(undefined)).toBe(true);
        var obj = {};
        expect(Utils.isUndefined(obj.prop)).toBe(true);
        expect(Utils.isUndefined(obj)).toBe(false);
        expect(Utils.isUndefined(null)).toBe(false);

    });

    it("sanitize", function utilsSanitize () {

        expect(Utils.sanitize("")).toEqual("");
        expect(Utils.sanitize("- A sentence, to test !")).toEqual("a_sentence_to_test");

    });

    it("camelize", function utilsCamelize () {

        expect(Utils.camelize("")).toEqual("");
        expect(Utils.camelize("- A sentence, to test !")).toEqual("aSentenceToTest");

    });

    it("an", function utilsAn () {

        expect(Utils.an("")).toEqual("");
        expect(Utils.an("word")).toEqual("a word");
        expect(Utils.an("essay")).toEqual("an essay");

    });

    it("compactResources", function utilsCompactResources () {

        expect(Utils.compactResources([])).toEqual([]);
        var resources = [[1, "test"], [5, "lines"], [2, "test"], [0, "fail"]];
        expect(Utils.compactResources(resources)).toEqual([[3, "test"], [5, "lines"]]);

    });

    it("getNow", function utilsGetNow (done) {

        var now = Utils.getNow();
        expect(typeof now === "number").toBe(true);
        expect(now).toBeGreaterThan(0);

        setTimeout(function getNowTimeout () {

            var now2 = Utils.getNow();
            expect(now2).toBeGreaterThan(now);

            done();

        }, 1);

    });

    xit("loadAsync", function utilsLoadAsync (done) { // fetch not available in node

        var url = "tests/res/testLoad.js";
        Utils.loadAsync([url], function loadAsyncCb (percentage, path) {

            expect(percentage).toBeLessThan(1);
            expect(path).toEqual(url);

        }).catch(function loadAsyncCatch () {

            fail("Loading promise has failed");

        }).then(function loadAsyncSuccess (object) {

            expect(object[url].isLoaded).toBe(true);
            done();

        });

    });

});
