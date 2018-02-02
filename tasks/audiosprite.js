module.exports = function (grunt) {

    var audiosprite = require("audiosprite");

    grunt.registerMultiTask("audiosprite", "Combine audio files into one audiosprite.", function () {

        var done = this.async();
        var options = this.options();
        delete options.output;
        var promise = Promise.resolve();

        this.files.forEach(function (target) {

            var taskOptions = Object.assign({
                output: target.dest
            }, options);

            promise = promise.then(function () {
                return new Promise(function (resolve, reject) {
                    audiosprite(target.src, taskOptions, function (err, json) {
                        if (err) {
                            reject(err);
                        }

                        console.log(json);
                        resolve(json);
                    });
                });
            });
        });

        promise.then(function (res) {
            done();
        }).catch(function (error) {
            grunt.log.warn("Oups", error);
        });
    });
};
