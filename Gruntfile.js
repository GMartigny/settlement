/**
 * Define Grunt
 * @param grunt
 */
module.exports = function (grunt) {

    // Load all libs
    require("jit-grunt")(grunt, {
        sprite: "grunt-spritesmith"
    });

    var versionStr = "window.VERSION = 'v<%= version %>';";

    grunt.initConfig({
        version: grunt.file.readJSON('package.json').version,


        sprite: {
            all: {
                src: "src/img/*.png",
                dest: "dist/img/icons.png",
                destCss: "src/css/sprites.less"
            }
        },

        less: {
            dev: {
                options: {
                },
                files: {
                    "dist/css/style.css": "src/css/*.less"
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    "dist/css/style.css": "src/css/*.less"
                }
            }
        },

        uglify: {
            dev: {
                options: {
                    mangle: false,
                    beautify: true,
                    sourceMap: true,
                    banner: versionStr,
                    compress: {
                        drop_debugger: false
                    }
                },
                files: {
                    "dist/js/script.js": ["src/js/*.js"]
                }
            },
            prod: {
                options: {
                    preserveComments: false,
                    banner: versionStr,
                    enclose: {}
                },
                files: {
                    "dist/js/script.js": ["src/js/*.js"]
                }
            }
        },

        watch: {
            less2css: {
                files: ["src/css/*.less"],
                tasks: ["css"]
            },
            jsbuild: {
                files: ["src/js/*.js"],
                tasks: ["js"]
            }
        },

        jscs: {
            src: "src/js/*.js"
        },
        lesslint: {
            src: "src/css/*.less",
            options: {
                csslint: {
                    csslintrc: ".csslintrc"
                }
            }
        },

        bump: {
            options: {
                pushTo: "origin",
                globalReplace: true,
                tagMessage: "Release of the version %VERSION%.",
                prereleaseName: "beta"
            }
        },
        "gh-pages": {
            src: ["index.html", "dist/**/*"],
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
