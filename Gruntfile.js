/* eslint-disable */

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
    })({
        customTasksDir: "tasks/"
    });

    var srcBase = "src/";
    var sourceDir = {
        js: [srcBase + "js/utils/utils.js", srcBase + "js/utils/**/*.js",
            srcBase + "js/views/view.js", srcBase + "js/models/model.js",
            srcBase + "js/models/resource.js",
            srcBase + "js/**/*.js"], // Load in order
        json: [srcBase + "json/**/*.json"],
        css: [srcBase + "css/**/*.less"],
        img: {
            icons: [srcBase + "img/icons/**/*.png"],
            assets: [srcBase + "img/assets/**/*.png"]
        },
        audio: [srcBase + "audio/**/*.wav"]
    };
    var destBase = "dist/";
    var destDir = {
        js: destBase + "js/script.js",
        json: destBase + "json/",
        css: destBase + "css/style.css",
        img: {
            icons: destBase + "img/icons.png",
            assets: destBase + "img/assets.png"
        },
        audio: destBase + "audio/sprite"
    };
    var VERSION = "v" + grunt.file.readJSON('package.json').version;
    var IS_BETA = VERSION.includes("v0.");

    grunt.initConfig({
        // IMAGES
        sprite: {
            icons: {
                src: sourceDir.img.icons,
                dest: destDir.img.icons,
                destCss: "src/css/sprites.less"
            },
            assets: {
                src: sourceDir.img.assets,
                dest: destDir.img.assets,
                destCss: "src/json/assets.json"
            }
        },

        // STYLES
        less: {
            dev: {
                options: {
                },
                files: {
                    [destDir.css]: sourceDir.css
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    [destDir.css]: sourceDir.css
                }
            }
        },

        // SCRIPTS
        uglify: {
            dev: {
                options: {
                    mangle: false,
                    beautify: true,
                    sourceMap: true,
                    compress: {
                        sequences: false,
                        drop_debugger: false,
                        keep_fnames: true,
                        global_defs: {
                            IS_DEV: true,
                            VERSION: VERSION
                        }
                    }
                },
                files: {
                    [destDir.js]: sourceDir.js
                }
            },
            prod: {
                options: {
                    wrap: "window",
                    compress: {
                        global_defs: {
                            IS_DEV: false,
                            VERSION: VERSION,
                            IS_BETA: IS_BETA
                        }
                    }
                },
                files: {
                    [destDir.js]: sourceDir.js
                }
            }
        },

        // DATA
        jsonify: {
            main: {
                files: {
                    [destDir.json]: sourceDir.json
                }
            }
        },

        // AUDIO
        audiosprite: {
            main: {
                files: {
                    [destDir.audio]: sourceDir.audio
                },
                options: {
                    export: "ogg",
                    gap: 0,
                    json: srcBase + "json/audiosprite.json"
                }
            }
        },

        // RUN
        connect: {
            dev: {
                options: {
                    open: true
                }
            }
        },
        watch: {
            iconsCSS: {
                files: sourceDir.img.icons,
                tasks: ["icons"]
            },
            assets: {
                files: sourceDir.img.assets,
                tasks: ["assets"]
            },
            less2css: {
                files: sourceDir.css,
                tasks: ["css"]
            },
            jsbuild: {
                files: sourceDir.js,
                tasks: ["js"]
            },
            jsonCopy: {
                files: sourceDir.json,
                tasks: ["jsonify"]
            }
        },

        // LINTING
        eslint: {
            target: sourceDir.js,
            options: {
                quiet: true
            }
        },
        lesslint: {
            src: sourceDir.css,
            options: {
                csslint: {
                    csslintrc: ".csslintrc"
                }
            }
        },

        // VERSION
        bump: {
            options: {
                pushTo: "origin",
                globalReplace: true,
                tagMessage: "Release of the version %VERSION%.",
                prereleaseName: "beta"
            }
        },
        "gh-pages": {
            src: ["index.html", "favicon.png", "dist/**/*", "!dist/**/*.map"],
            options: {
                message: "Auto-commit: push to prod."
            }
        },

        // TESTS
        jasmine: {
            options: {
                specs: "tests/**/*Test.js",
                template: require('grunt-template-jasmine-istanbul'),
                templateOptions: {
                    coverage: "tests/report/coverage.json",
                    report: "tests/report"
                },
                polyfills: [
                    "tests/res/mock.js",
                    "node_modules/es6-shim/es6-shim.min.js",
                    "node_modules/es7-shim/dist/es7-shim.min.js"
                ]
            },
            src: {
                src: sourceDir.js
            },
            built: {
                src: destDir.js
            }
        }
    });

    // JS linting
    grunt.registerTask("check", ["eslint", "lesslint"]);

    // Sources building
    grunt.registerTask("icons", ["sprite:icons"]);
    grunt.registerTask("assets", ["sprite:assets"]);
    grunt.registerTask("images", ["icons", "assets"]);
    grunt.registerTask("js", ["uglify:dev", "jsonify"]);
    grunt.registerTask("css", ["less:dev"]);
    grunt.registerTask("audio", ["audiosprite"]);

    grunt.registerTask("build:dev", ["images", "audio", "js", "css"]);
    grunt.registerTask("build:prod", ["images", "audio", "uglify:prod", "jsonify", "less:prod"]);
    grunt.registerTask("build", ["build:dev"]);

    grunt.registerTask("default", ["build", "connect", "watch"]); // (default)

    grunt.registerTask("pushtoprod", ["build:prod", "gh-pages", "build"]);

    grunt.registerTask("patch", ["bump:patch", "pushtoprod"]);
    grunt.registerTask("release", ["bump:minor", "pushtoprod"]);

    grunt.registerTask("test", ["jasmine:src"]);
    grunt.registerTask("test:built", ["uglify:dev", "jasmine:built"]);
};
