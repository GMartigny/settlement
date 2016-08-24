/**
 * Define Grunt
 * @param grunt
 */
module.exports = function (grunt) {

    // Load all libs
    require("jit-grunt")(grunt, {
        sprite: "grunt-spritesmith"
    });

    var iconPath = "img/icons.png";

    grunt.initConfig({
        sprite: {
            all: {
                src: "img/src/*.png",
                dest: iconPath,
                destCss: "css/src/sprites.less",
                cssFormat: "css",
                imgPath: "../" + iconPath
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

        uglify: {
            dev: {
                options: {
                    mangle: false,
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
                    preserveComments: false,
                    enclose: {}
                },
                files: {
                    "js/script.js": ["js/src/*.js"]
                }
            }
        },

        watch: {
            less2css: {
                files: ["css/src/*.less"],
                tasks: ["css"]
            },
            jsbuild: {
                files: ["js/src/*.js"],
                tasks: ["js"]
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
                commitFiles: ["package.json", "index.html"],
                globalReplace: true,
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
    grunt.registerTask("icon", ["sprite:all"]);
    grunt.registerTask("css", ["less:dev"]);
    grunt.registerTask("js", ["uglify:dev"]);
    grunt.registerTask("build", ["js", "icon", "css"]);

    grunt.registerTask("default", ["build", "watch"]);

    grunt.registerTask("patch", ["bump:patch"]);

    grunt.registerTask("pushtoprod", ["uglify:prod", "icon", "less:prod", "gh-pages", "build"]);
    grunt.registerTask("release", ["bump:minor", "pushtoprod"]);
};
