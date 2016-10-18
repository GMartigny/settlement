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
        img: {
            icons: "src/img/icons/**/*.png",
            assets: "src/img/assets/**/*.png"
        }
    };
    var versionStr = "window.VERSION='v<%= version %>';";

    grunt.initConfig({
        version: grunt.file.readJSON('package.json').version,


        sprite: {
            icons: {
                src: sourceDir.img.icons,
                dest: "dist/img/icons.png",
                destCss: "src/css/sprites.less"
            },
            assets: {
                src: sourceDir.img.assets,
                dest: "dist/img/assets.png",
                destCss: "dist/js/assets.json"
            }
        },

        imagemin: {
            // TODO
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
                    // banner: versionStr + "\nwindow.isDev=true;",
                    footer: "\n" + versionStr + "\nwindow.isDev=true;",
                    compress: {
                        sequences: false,
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
            iconsCSS: {
                files: [sourceDir.img.icons],
                tasks: ["icons"]
            },
            assetsJSON: {
                files: [sourceDir.img.assets],
                tasks: ["assets"]
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
    grunt.registerTask("icons", ["sprite:icons"]);
    grunt.registerTask("assets", ["sprite:assets"]);
    grunt.registerTask("images", ["icons", "assets"]);
    grunt.registerTask("js", ["uglify:dev"]);
    grunt.registerTask("css", ["less:dev"]);

    grunt.registerTask("build:dev", ["images", "js", "css"]);
    grunt.registerTask("build:prod", ["images", "uglify:prod", "less:prod"]);
    grunt.registerTask("build", ["build:dev"]); // (default)

    grunt.registerTask("default", ["build", "watch"]);

    grunt.registerTask("pushtoprod", ["build:prod", "gh-pages", "build"]);

    grunt.registerTask("patch", ["bump:patch", "pushtoprod"]);
    grunt.registerTask("release", ["bump:minor", "pushtoprod"]);
};
