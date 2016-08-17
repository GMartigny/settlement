/**
 * Define Grunt
 * @param grunt
 */
module.exports = function (grunt) {

    // Load all libs
    require("jit-grunt")(grunt);

    var env = "dev";

    grunt.initConfig({
        bump: {
            options: {
                tagMessage: "Release of the version %VERSION%.",
                prereleaseName: "beta"
            }
        },

        less: {
            dev: {
                options: {
                },
                files: {
                    "css/style.css": "css/src/*.less"
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    "css/style.css": "css/src/*.less"
                }
            }
        },

        watch: {
            less2css: {
                files: ["css/src/*.less"],
                tasks: ["css"],
                options: {
                    interrupt: true
                }
            },
            jsbuild: {
                files: ["js/src/*.js"],
                tasks: ["build"],
                options: {
                    interrupt: true
                }
            }
        },

        uglify: {
            dev: {
                options: {
                    mangle: false,
                    sourceMap: true
                },
                files: {
                    "js/script.js": ["js/src/*.js"]
                }
            },
            prod: {
                options: {
                    preserveComments: false
                },
                files: {
                    "js/script.js": ["js/src/*.js"]
                }
            }
        },

        jscs: {
            src: "js/src/*.js"
        },
        lesslint: {
            src: "css/src/*.less",
            options: {
                csslint: {
                    csslintrc: ".csslintrc"
                }
            }
        },
        csslint: {
            src: "css/src/*.less"
        }
    });

    // JS linting
    grunt.registerTask("check", ["jscs"/*, "lesslint"*/]); // need update from lesslint

    // Sources building
    grunt.registerTask("css", ["less:" + env]);
    grunt.registerTask("js", ["uglify:" + env]);
    grunt.registerTask("build", ["js", "css"]);

    grunt.registerTask("default", ["css", "build", "watch"]);
};
