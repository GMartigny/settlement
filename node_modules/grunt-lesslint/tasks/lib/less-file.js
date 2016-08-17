(function() {
  var CssLinter, LessCachedFile, LessFile, LessImportFile, LessParser, LintCache, chalk, crypto, sharedImportsContents,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  crypto = require('crypto');

  LessParser = require('./less-parser');

  CssLinter = require('./css-linter');

  LintCache = require('./lint-cache').LintCache;

  chalk = require('chalk');

  LessFile = (function() {
    function LessFile(filePath, options, grunt) {
      this.filePath = filePath;
      this.options = options != null ? options : {};
      this.grunt = grunt;
    }

    LessFile.prototype.lint = function(callback) {
      return this.getCss((function(_this) {
        return function(err, css, sourceMap) {
          if (err) {
            return callback(new Error("Error parsing " + (chalk.yellow(_this.filePath)) + ": " + err.message));
          }
          return _this.lintCss(css, function(err, lintResult) {
            var ref, result;
            if (err) {
              return callback(new Error("Error linting " + (chalk.yellow(_this.filePath)) + ": " + err.message));
            }
            result = {
              file: _this.filePath,
              less: _this.getContents(),
              css: css,
              sourceMap: sourceMap
            };
            if ((lintResult != null ? (ref = lintResult.messages) != null ? ref.length : void 0 : void 0) > 0) {
              result.lint = lintResult;
            }
            return callback(null, result);
          });
        };
      })(this));
    };

    LessFile.prototype.lintCss = function(css, callback) {
      var linter;
      linter = new CssLinter(this.options, this.grunt);
      return linter.lint(css, callback);
    };

    LessFile.prototype.getContents = function(forced) {
      if ((this.contents != null) && !forced) {
        return this.contents;
      }
      return this.contents = this.grunt.file.read(this.filePath);
    };

    LessFile.prototype.getDigest = function() {
      if (this.digest) {
        return this.digest;
      }
      this.digest = crypto.createHash('sha256').update(this.getContents()).digest('base64');
      return this.digest;
    };

    LessFile.prototype.getCss = function(callback) {
      var contents, parser;
      contents = this.getContents();
      if (!contents) {
        return callback(null, '');
      }
      parser = new LessParser(this.filePath, this.options);
      return parser.render(contents, callback);
    };

    return LessFile;

  })();

  sharedImportsContents = {};

  LessImportFile = (function(superClass) {
    extend(LessImportFile, superClass);

    function LessImportFile() {
      return LessImportFile.__super__.constructor.apply(this, arguments);
    }

    LessImportFile.prototype.getContents = function() {
      var contents, name, ref;
      if ((ref = sharedImportsContents[this.filePath]) != null ? ref.contents : void 0) {
        return sharedImportsContents[this.filePath].contents;
      }
      contents = LessImportFile.__super__.getContents.call(this);
      sharedImportsContents[name = this.filePath] || (sharedImportsContents[name] = {});
      return sharedImportsContents[this.filePath].contents = contents;
    };

    LessImportFile.prototype.getDigest = function() {
      var digest, name, ref;
      if ((ref = sharedImportsContents[this.filePath]) != null ? ref.digest : void 0) {
        return sharedImportsContents[this.filePath].digest;
      }
      digest = LessImportFile.__super__.getDigest.call(this);
      sharedImportsContents[name = this.filePath] || (sharedImportsContents[name] = {});
      return sharedImportsContents[this.filePath].digest = digest;
    };

    return LessImportFile;

  })(LessFile);

  LessCachedFile = (function(superClass) {
    extend(LessCachedFile, superClass);

    function LessCachedFile(filePath, options, grunt) {
      this.filePath = filePath;
      this.options = options != null ? options : {};
      this.grunt = grunt;
      LessCachedFile.__super__.constructor.apply(this, arguments);
      this.cache = new LintCache(this.options.cache);
    }

    LessCachedFile.prototype.lint = function(callback) {
      var hash;
      hash = this.getDigest();
      return this.cache.hasCached(hash, (function(_this) {
        return function(isCached, cachedPath) {
          if (isCached) {
            _this.grunt.event.emit('lesslint.cache.hit', _this.filePath, cachedPath, hash);
            return callback();
          }
          return LessFile.prototype.lint.call(_this, function(err, result, less, css) {
            if (err) {
              return callback(err);
            }
            if (result.lint != null) {
              return callback(null, result, less, css);
            }
            return _this.cache.addCached(hash, function(err, cachedAddPath) {
              if (err) {
                return callback(err);
              }
              _this.grunt.event.emit('lesslint.cache.add', _this.filePath, hash, cachedAddPath);
              return callback(null, result, less, css);
            });
          });
        };
      })(this));
    };

    LessCachedFile.prototype.getDigest = function() {
      var importsContents, myHash;
      myHash = LessCachedFile.__super__.getDigest.call(this);
      if (this.options.imports == null) {
        return myHash;
      }
      importsContents = this.getImportsContents();
      return crypto.createHash('sha256').update(myHash).update(importsContents.join('')).digest('base64');
    };

    LessCachedFile.prototype.getImportsContents = function() {
      var i, importFilePath, len, ref, results;
      ref = this.grunt.file.expand(this.options.imports);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        importFilePath = ref[i];
        results.push(new LessImportFile(importFilePath, {}, this.grunt).getDigest());
      }
      return results;
    };

    return LessCachedFile;

  })(LessFile);

  module.exports = {
    LessFile: LessFile,
    LessImportFile: LessImportFile,
    LessCachedFile: LessCachedFile
  };

}).call(this);
