module.exports = function (grunt) {

    var audiosprite = require("audiosprite");

    grunt.registerMultiTask("audiosprite", "Combine audio files into one audiosprite.", function () {

        var done = this.async();
        var options = this.options({
            json: "./"
        });
        delete options.output; // prevent options from overriding destination
        var promise = Promise.resolve();
        var data = {};

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

                        Object.assign(data, json.spritemap);
                        grunt.log.oklns("Audiosprite " + target.dest + " created.");

                        resolve();
                    });
                });
            });
        });

        promise.then(function () {
            grunt.file.write(options.json, JSON.stringify(data, null, 4));
            grunt.log.oklns("JSON file written in " + options.json);
            done();
        }).catch(function (error) {
            grunt.log.warn("Oups", error);
        });
    });
};
