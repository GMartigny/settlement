"use strict";
/* exported Particle */

/**
 *
 * @param {String|Particle} icon - Icon name
 * @param {Action} [from] - Element to start from
 * @param {Resource} [to] - Element to go to
 * @constructor
 */
function Particle (icon, from, to) {
    if (icon instanceof Particle) {
        this.html = icon.html.cloneNode();
        this.distance = icon.distance;
    }
    else {
        this.super("icon icon-small-" + icon, from, to);
    }
}

Particle.extends(View, "Particle", /** @lends Particle.prototype */ {
    distance: null,
    toHTML: function () {
        var html = this._toHTML();
        html.style.transitionDuration = Particle.transitionDuration + "ms";
        return html;
    },
    init: function (from, to) {
        this.hide();

        var startMeasure = from.html.getBoundingClientRect();
        var startMiddle = {
            left: startMeasure.left + startMeasure.width / 2,
            top: startMeasure.top + startMeasure.height / 2
        };
        this.html.style.left = startMiddle.left + "px";
        this.html.style.top = startMiddle.top + "px";

        var destinationMeasure = to.html.getBoundingClientRect();
        var destinationMiddle = {
            left: destinationMeasure.left + destinationMeasure.width / 2,
            top: destinationMeasure.top + destinationMeasure.height / 2
        };

        setTimeout(function () {
            to.animate("more");
        }, Particle.transitionDuration * 2);

        this.distance = {
            left: destinationMiddle.left - startMiddle.left,
            top: destinationMiddle.top - startMiddle.top
        };
    },
    animate: function (distance, timing) {
        this.html.style.transform = "translate3d(" + distance.left + "px, " + distance.top + "px, 0)";
        this.html.style.transitionTimingFunction = timing || "";
    }
});

Particle.static( /** @lends Particle */{
    /**
     * Time for the transition (ms)
     * @type {Number}
     */
    transitionDuration: 600,
    /**
     * Time particles wait floating (ms)
     * @type {Number}
     */
    transitionWait: 150,
    /**
     * Distance particles fly away from source element (px)
     */
    flyingDistance: 40,
    /**
     * Run a batch of particles
     * @param {Array<Particle>} particles -
     */
    batch: function (particles) {
        particles.forEach(function (part) {
            part.show();
            var rand = MathsUtils.random(MathsUtils.PI2);
            part.animate({
                left: MathsUtils.cos(rand) * Particle.flyingDistance,
                top: MathsUtils.sin(rand) * Particle.flyingDistance
            }, "cubic-bezier(.2,.5,.5,1)");
        });

        setTimeout(function () {
            particles.forEach(function (part) {
                part.animate(part.distance, "cubic-bezier(.5,0,.8,.5)");
            });

            setTimeout(function () {
                particles.forEach(function (part) {
                    part.remove();
                });
            }, Particle.transitionDuration);

        }, Particle.transitionDuration + Particle.transitionWait);
    }
});
