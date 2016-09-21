/**
 * Define Grunt
 * @param grunt
 */
module.exports = function (grunt) {

    // Load all libs
    require("jit-grunt")(grunt, {
        sprite: "grunt-spritesmith",
        "bump-only": "grunt-bump",
        "bump-commit": "grunt-bump"
    });

    var sourceDir = {
        js: "src/js/**/*.js",
        css: "src/css/**/*.less",
        img: "src/img/**/*.png"
    };
    var versionStr = "window.VERSION='v<%= version %>';";

    grunt.initConfig({
        version: grunt.file.readJSON('package.json').version,


        sprite: {
            all: {
                src: sourceDir.img,
                dest: "dist/img/icons.png",
                destCss: "src/css/sprites.less"
            }
        },

        less: {
            dev: {
                options: {
                },
                files: {
                    "dist/css/style.css": sourceDir.css
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    "dist/css/style.css": sourceDir.css
                }
            }
        },

        uglify: {
            dev: {
                options: {
                    mangle: false,
                    beautify: true,
                    sourceMap: true,
                    banner: versionStr + "\nwindow.isDev=true;",
                    compress: {
                        drop_debugger: false
                    }
                },
                files: {
                    "dist/js/script.js": [sourceDir.js]
                }
            },
            prod: {
                options: {
                    preserveComments: false,
                    banner: versionStr,
                    enclose: {}
                },
                files: {
                    "dist/js/script.js": [sourceDir.js]
                }
            }
        },

        watch: {
            sprite: {
                files: [sourceDir.img],
                tasks: ["icon"]
            },
            less2css: {
                files: [sourceDir.css],
                tasks: ["css"]
            },
            jsbuild: {
                files: [sourceDir.js],
                tasks: ["js"]
            }
        },

        jscs: {
            src: sourceDir.js
        },
        lesslint: {
            src: sourceDir.css,
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
    grunt.registerTask("js", ["uglify:dev"]);
    grunt.registerTask("css", ["less:dev"]);

    grunt.registerTask("build", ["icon", "js", "css"]);
    grunt.registerTask("build:prod", ["icon", "uglify:prod", "less:prod"]);

    grunt.registerTask("default", ["build", "watch"]);

    grunt.registerTask("patch", ["bump:patch"]);

    grunt.registerTask("pushtoprod", ["build:prod", "gh-pages", "build"]);
    grunt.registerTask("release", ["bump:minor", "pushtoprod"]);
};
