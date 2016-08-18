/**
 * Define Grunt
 * @param grunt
 */
module.exports = function (grunt) {

    // Load all libs
    require("jit-grunt")(grunt);

    grunt.initConfig({
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

        uglify: {
            dev: {
                options: {
                    beautify: true,
                    sourceMap: true,
                    banner: "// jscs:disable"
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

        bump: {
            options: {
                pushTo: "origin",
                commitFiles: ["-a"],
                tagMessage: "Release of the version %VERSION%.",
                prereleaseName: "beta"
            }
        },
        "gh-pages": {
            src: ["index.html", "js/script.js", "css/style.css", "img/icons.png"],
            options: {
                message: "Auto-commit: push to prod."
            }
        }
    });

    // JS linting
    grunt.registerTask("check", ["jscs"/*, "lesslint"*/]); // need update from lesslint

    // Sources building
    grunt.registerTask("css", ["less:dev"]);
    grunt.registerTask("js", ["uglify:dev"]);
    grunt.registerTask("build", ["js", "css"]);

    grunt.registerTask("default", ["build", "watch"]);

    grunt.registerTask("patch", ["bump:patch"]);

    grunt.registerTask("pushtoprod", ["less:prod", "uglify:prod", "gh-pages", "build"]);
    grunt.registerTask("release", ["bump:minor", "pushtoprod"]);
};
