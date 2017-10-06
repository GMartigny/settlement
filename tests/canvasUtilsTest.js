describe("Test canvas helper", function canvasUtilsDescribe () {

    it("prepareCanvas", function canvasUtilsPrepareCanvas () {

        var width = 42;
        var height = 99;
        var obj = CanvasUtils.prepareCanvas(width, height);
        expect(obj.cnv.width).toBe(width);
        expect(obj.cnv.height).toBe(height);
        expect(obj.ctx instanceof CanvasRenderingContext2D).toBe(true);

    });

    it("clear", function canvasUtilsClear () {

        var ctx = CanvasUtils.prepareCanvas(1, 1).ctx;
        ctx.clear();
        expect(true).toBe(true); // Will succeed if nothing throws an error

    });

});
