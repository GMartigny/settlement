"use strict";
/* exported CanvasUtils */

var CanvasUtils = {
    /**
     * Prepare a canvas with its context
     * @param {Number} width - The canvas width
     * @param {Number} height - The canvas height
     * @return {{cnv: HTMLElement, ctx: CanvasRenderingContext2D}}
     */
    prepareCanvas: function prepareCanvas (width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        return {
            cnv: canvas,
            ctx: canvas.getContext("2d")
        };
    }
};

/**
 * Clear a whole context
 */
CanvasRenderingContext2D.prototype.clear = function clear () {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};
