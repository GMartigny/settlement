(function() {
  var CSSLint, LessCachedFile, LessFile, LintCache, LintErrorOutput, Parser, _, async, chalk, crypto, defaultLessOptions, findLessMapping, findPropertyLineNumber, getPropertyName, path, ref, ref1, stripPath;

  CSSLint = require('csslint').CSSLint;

  Parser = require('less').Parser;

  ref = require('./lib/lint-utils'), findLessMapping = ref.findLessMapping, findPropertyLineNumber = ref.findPropertyLineNumber, getPropertyName = ref.getPropertyName;

  LintCache = require('./lib/lint-cache').LintCache;

  ref1 = require('./lib/less-file'), LessFile = ref1.LessFile, LessCachedFile = ref1.LessCachedFile;

  LintErrorOutput = require('./lib/lint-error-output');

  async = require('async');

  path = require('path');

  crypto = require('crypto');

  stripPath = require('strip-path');

  _ = require('lodash');

  chalk = require('chalk');

  defaultLessOptions = {
    cleancss: false,
    compress: false,
    dumpLineNumbers: 'comments',
    optimization: null,
    syncImport: true
  };

  module.exports = function(grunt) {
    var writeToFormatters;
    writeToFormatters = function(options, results) {
      var formatters;
      formatters = options.formatters;
      if (!_.isArray(formatters)) {
        return;
      }
      return formatters.forEach(function(arg) {
        var dest, filePath, formatter, formatterOutput, i, id, len, message, ref2, result;
        id = arg.id, dest = arg.dest;
        if (!(id && dest)) {
          return;
        }
        formatter = CSSLint.getFormatter(id);
        if (formatter == null) {
          return;
        }
        formatterOutput = formatter.startFormat();
        for (filePath in results) {
          result = results[filePath];
          ref2 = result.messages;
          for (i = 0, len = ref2.length; i < len; i++) {
            message = ref2[i];
            if (message.lessLine) {
              message.line = message.lessLine.line - 1;
              message.col = message.lessLine.column - 1;
            }
          }
          formatterOutput += formatter.formatResults(result, filePath, {});
        }
        formatterOutput += formatter.endFormat();
        return grunt.file.write(dest, formatterOutput);
      });
    };
    grunt.registerMultiTask('lesslint', 'Validate LESS files with CSS Lint', function() {
      var done, errorCount, fileCount, options, queue, results, warningCount;
      options = this.options({
        less: grunt.config.get('less.options'),
        csslint: grunt.config.get('csslint.options'),
        imports: void 0,
        customRules: void 0,
        cache: false,
        failOnError: true,
        failOnWarning: true
      });
      fileCount = 0;
      errorCount = 0;
      warningCount = 0;
      results = {};
      queue = async.queue(function(file, callback) {
        var lessFile;
        grunt.verbose.write("Linting '" + file + "'");
        fileCount++;
        if (!options.cache) {
          lessFile = new LessFile(file, options, grunt);
        } else {
          lessFile = new LessCachedFile(file, options, grunt);
        }
        return lessFile.lint(function(err, result) {
          var errorOutput, fileLintIssues, lintResult;
          if (err != null) {
            errorCount++;
            grunt.log.writeln(err.message);
            return callback();
          }
          result || (result = {});
          lintResult = result.lint;
          if (lintResult) {
            results[file] = lintResult;
            errorOutput = new LintErrorOutput(result, options, grunt);
            fileLintIssues = errorOutput.display(options.imports);
            errorCount += fileLintIssues.errors;
            warningCount += fileLintIssues.warnings;
          }
          return callback();
        });
      });
      this.filesSrc.forEach(function(file) {
        return queue.push(file);
      });
      done = this.async();
      queue.drain = function() {
        var totalIssueCount;
        writeToFormatters(options, results);
        totalIssueCount = warningCount + errorCount;
        if (totalIssueCount === 0) {
          grunt.log.ok(fileCount + " " + (grunt.util.pluralize(fileCount, 'file/files')) + " lint free.");
          return done();
        } else {
          grunt.log.writeln();
          grunt.log.error(totalIssueCount + " lint " + (grunt.util.pluralize(totalIssueCount, 'issue/issues')) + " in " + fileCount + " " + (grunt.util.pluralize(fileCount, 'file/files')) + " (" + errorCount + " " + (grunt.util.pluralize(errorCount, 'error/errors')) + ", " + warningCount + " " + (grunt.util.pluralize(warningCount, 'warning/warnings')) + ")");
          return done((!options.failOnError || errorCount === 0) && (!options.failOnWarning || warningCount === 0 || !options.failOnError));
        }
      };
      if ((this.filesSrc == null) || this.filesSrc.length === 0) {
        return done();
      }
    });
    return grunt.registerTask('lesslint:clearCache', function() {
      var cache, done;
      done = this.async();
      cache = new LintCache();
      return cache.clear(function(err) {
        if (err) {
          grunt.log.error(err.message);
        }
        return done();
      });
    });
  };

  module.exports.CSSLint = CSSLint;

}).call(this);
