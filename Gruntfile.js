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
    });

    var sourceDir = {
        js: ["src/js/utils/utils.js", "src/js/utils/**/*.js",
            "src/js/views/view.js", "src/js/models/model.js",
            "src/js/models/resource.js",
            "src/js/**/*.js"], // Load in order
        json: ["src/json/**/*.json"],
        css: ["src/css/**/*.less"],
        img: {
            icons: ["src/img/icons/**/*.png"],
            assets: ["src/img/assets/**/*.png"]
        }
    };
    var destDir = {
        js: "dist/js/script.js",
        json: "dist/json/",
        css: "dist/css/style.css",
        img: {
            icons: "dist/img/icons.png",
            assets: "dist/img/assets.png"
        }
    };
    var VERSION = "v" + grunt.file.readJSON('package.json').version;
    var IS_BETA = VERSION.includes("v0.");

    grunt.initConfig({
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
                tasks: ["uglifyJSON"]
            }
        },

        eslint: {
            target: sourceDir.js
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
            src: ["index.html", "favicon.png", "dist/**/*", "!dist/**/*.map"],
            options: {
                message: "Auto-commit: push to prod."
            }
        },

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
        },
        
        jsonify: {
            main: {
                files: {
                    [destDir.json]: sourceDir.json
                }
            }
        }
    });

    grunt.registerMultiTask("jsonify", "Minify and copy json to dist folder", function () {
        var options = this.options({
            indent: 0,
            compress: false
        });

        function compress (key, value) {
            if (typeof this === "object" && !this.length) {
                var undf = undefined;
                var result;

                if (Array.isArray(value)) {
                    result = value.length > 0 ? value : undf;
                }
                else if (typeof value === "object") {
                    result = value && Object.keys(value).length > 0 ? value : undf;
                }
                else if (Number.isInteger(+value)) {
                    result = +value !== 0 ? value : undf;
                }
                else {
                    result = !!value ? value : undf;
                }
                return result;
            }
            else {
                return value;
            }
        }

        var origin = "./";

        this.files.forEach(function (target) {
            var dest = target.dest;

            target.src.forEach(function (filePath) {
                var name = filePath.substr(filePath.lastIndexOf("/") + 1);
                var json = grunt.file.readJSON(origin + filePath);
                var src = JSON.stringify(json, (options.compress && compress), options.indent);
                grunt.file.write(dest + name, src);
                grunt.log.ok("Successfully wrote " + name);
            });
        });
    });

    // JS linting
    grunt.registerTask("check", ["eslint", "lesslint"]);

    // Sources building
    grunt.registerTask("icons", ["sprite:icons"]);
    grunt.registerTask("assets", ["sprite:assets"]);
    grunt.registerTask("images", ["icons", "assets"]);
    grunt.registerTask("js", ["uglify:dev", "jsonify:main"]);
    grunt.registerTask("css", ["less:dev"]);

    grunt.registerTask("build:dev", ["images", "js", "css"]);
    grunt.registerTask("build:prod", ["images", "uglify:prod", "jsonify:main", "less:prod"]);
    grunt.registerTask("build", ["build:dev"]); // (default)

    grunt.registerTask("default", ["build", "watch"]);

    grunt.registerTask("pushtoprod", ["build:prod", "gh-pages", "build"]);

    grunt.registerTask("patch", ["bump:patch", "pushtoprod"]);
    grunt.registerTask("release", ["bump:minor", "pushtoprod"]);

    grunt.registerTask("test", ["jasmine:src"]);
    grunt.registerTask("test:built", ["uglify:dev", "jasmine:built"]);
};
