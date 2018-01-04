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
                tasks: ["jsonify"]
            }
        },

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
            indent: 0
        });

        function format (size) {
            return `\u001b[32m${size} kB\u001b[39m`;
        }

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
                    grunt.log.ok(`Successfully wrote ${dest} ${format(sizeBefore)} → ${format(sizeAfter)}`);
                }
                catch (e) {
                    grunt.log.warn(`The file ${filePath} is not a valid JSON.`);
                }
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
