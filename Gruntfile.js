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
        js: ["src/js/utils/**/*.js", "src/js/**/*.js"], // Load utils before
        css: "src/css/**/*.less",
        img: {
            icons: "src/img/icons/**/*.png",
            assets: "src/img/assets/**/*.png"
        }
    };
    var VERSION = "v<%= version %>";

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
                    compress: {
                        sequences: false,
                        drop_debugger: false,
                        global_defs: {
                            IS_DEV: true,
                            VERSION: VERSION
                        }
                    }
                },
                files: {
                    "dist/js/script.js": [sourceDir.js]
                }
            },
            prod: {
                options: {
                    wrap: "G",
                    compress: {
                        global_defs: {
                            IS_DEV: false,
                            VERSION: VERSION
                        }
                    }
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
            src: ["index.html", "favicon.png", "dist/**/*"],
            options: {
                message: "Auto-commit: push to prod."
            }
        }
    });

    // JS linting
    grunt.registerTask("check", ["jscs", "lesslint"]);

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
