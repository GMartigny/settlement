"use strict";
/* exported prepareCanvas */

/**
 * Prepare a canvas with its context
 * @param {Number} width - The canvas width
 * @param {Number} height - The canvas height
 * @return {{cnv: HTMLElement, ctx: CanvasRenderingContext2D}}
 */
function prepareCanvas (width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    return {
        cnv: canvas,
        ctx: canvas.getContext("2d")
    };
}

/**
 * Clear a whole context
 */
CanvasRenderingContext2D.prototype.clear = function () {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};
