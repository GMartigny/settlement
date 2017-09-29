describe("Test functions added to Number prototype", function numberDescribe () {

    it("equals", function numberEquals () {

        expect((5).equals).toBeDefined();
        expect((0).equals(Number.EPSILON)).toBe(true);
        expect((0.1 + 0.2).equals(0.3)).toBe(true);
        expect((1 / 3).equals(0.3)).toBe(false);

    });

});

describe("Test functions added to Array prototype", function arrayDescribe () {

    it("last", function arrayLast () {

        expect([].last()).not.toBeDefined();
        expect(["test"].last()).toEqual("test");
        expect([1, 2, 3].last()).toBe(3);

    });

    it("random", function arrayRandom () {

        var array = [1, 2, 3, 4, 5, 6];
        for (var i = 0; i < 999; ++i) {
            var pick = array.random();
            expect(array).toContain(pick);
        }

    });

    it("out", function arrayOut () {

        var array = [1, 2, 3, 4];
        expect(array.out(2)).toBe(array.length);
        expect(array).toEqual([1, 3, 4]);
        expect(array.out(5)).toBe(array.length);
        expect(array).toEqual([1, 3, 4]);

    });

    it("insert", function arrayInsert () {

        var array = [1, 2, 3];
        expect(array.insert([4, 5])).toBe(array.length);
        expect(array).toEqual([1, 2, 3, 4, 5]);

    });

});

describe("Test functions added to Map prototype", function mapDescribe () {

    it("push", function mapPush () {

        var map = new Map();
        var askedKey = "key";
        var value = "value";
        var returnedKey = map.push(askedKey, value); // key + value
        expect(returnedKey).toEqual(askedKey);
        expect(map.get(returnedKey)).toEqual(value);

        returnedKey = map.push(value); // only value
        expect(returnedKey).toBeDefined();
        expect(map.get(returnedKey)).toEqual(value);

        value = {
            id: askedKey,
            data: "ok"
        };
        returnedKey = map.push(value); // value with id prop
        expect(returnedKey).toEqual(askedKey);
        expect(map.get(returnedKey)).toEqual(value);

    });

    it("getValues", function mapGetValues () {

        var map = new Map();
        var values = [true, 2, "3", [4]];
        values.forEach(function mapGetValuesForEach (value) {
            map.set(Math.random(), value);
        });
        expect(map.getValues()).toEqual(values);

    });

});

describe("Test functions added to Object prototype", function objectDescribe () {

    it("browse", function objectBrowse () {

        var obj = {
            k1: 1,
            k2: 2,
            k3: 3
        };
        var iteration = 0;
        obj.browse(function browse (value, key, obj) {
            expect(obj[key]).toBe(value);
            iteration++;
        });
        expect(iteration).toBe(3);

    });

    it("values", function objectValues () {

        var obj = {
            k1: 1,
            k2: 2,
            k3: 3
        };
        expect(obj.values()).toEqual([1, 2, 3]);
        expect(({}).values()).toEqual([]);

    });

    it("deepBrowse", function objectDeepBrowse () {

        var obj = {
            k1: 1,
            sub: {
                s1: 2,
                s2: 3
            },
            k3: 4
        };
        var iteration = 0;
        obj.deepBrowse(function deepBrowse (value) {
            expect(value).toBeDefined();
            expect(Utils.isNumber(value)).toBe(true);
            iteration++;
        });
        expect(iteration).toBe(4);

    });

    it("swap", function objectSwap () {

        var obj = {
            key: "value",
            1: 2
        };
        expect(obj.swap()).toEqual({
            value: "key",
            2: "1"
        });

    });

    it("clone", function objectClone () {

        var values = [true, 55, 5.5, "coucou", [1, 2, 3], {a: 42}];
        values.forEach(function objectCloneForEach (value) {
            var clone = value.clone();
            expect(clone).toEqual(value);
            clone.someRandomProp = true;
            expect(value.someRandomProp).not.toBeDefined();
        });

    });

});
