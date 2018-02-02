module.exports = function (grunt) {

    var maxmin = require("maxmin");

    grunt.registerMultiTask("jsonify", "Minify JSON files and copy them to prod directory.", function () {

        var options = this.options({
            indent: 0
        });

        this.files.forEach(function (target) {
            var destFolder = target.dest;

            target.src.forEach(function (filePath) {
                var name = filePath.substr(filePath.lastIndexOf("/") + 1);
                var srcContent = grunt.file.read(filePath);
                try {
                    var json = JSON.parse(srcContent);
                    var sizeBefore = srcContent.length;
                    var result = JSON.stringify(json, null, options.indent);
                    var sizeAfter = result.length;
                    var dest = destFolder + name;
                    grunt.file.write(dest, result);
                    grunt.log.ok(`Successfully wrote ${dest} ${maxmin(sizeBefore, sizeAfter)}`);
                }
                catch (e) {
                    grunt.log.warn(`The file ${filePath} is not a valid JSON.`);
                }
            });
        });
    });
};
