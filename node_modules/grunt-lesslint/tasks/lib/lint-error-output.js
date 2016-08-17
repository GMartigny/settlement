(function() {
  var LintErrorOutput, SourceMapConsumer, _, chalk, path, stripPath;

  path = require('path');

  SourceMapConsumer = require('source-map').SourceMapConsumer;

  _ = require('lodash');

  chalk = require('chalk');

  stripPath = require('strip-path');

  LintErrorOutput = (function() {
    function LintErrorOutput(result, options, grunt) {
      this.result = result;
      this.options = options;
      this.grunt = grunt;
    }

    LintErrorOutput.prototype.display = function(importsToLint) {
      var column, file, fileContents, fileLines, filePath, fullRuleMessage, i, isThisFile, issueCounts, len, less, lessSource, line, message, messageGroups, messages, output, ref, rule, ruleMessages, source, sourceMap;
      sourceMap = new SourceMapConsumer(this.result.sourceMap);
      issueCounts = {
        warnings: 0,
        errors: 0
      };
      messages = this.result.lint.messages;
      less = this.result.less;
      file = path.resolve(this.result.file);
      filePath = stripPath(file, process.cwd());
      fileContents = {};
      fileLines = {};
      messages = messages.filter((function(_this) {
        return function(message) {
          var isThisFile, source, sourceArray;
          if (message.line === 0 || message.rollup) {
            return true;
          }
          source = sourceMap.originalPositionFor({
            line: message.line,
            column: message.col
          }).source;
          if (source === null) {
            return false;
          }
          if (source) {
            source = path.resolve(source);
          }
          isThisFile = source === file;
          sourceArray = [stripPath(source, process.cwd()), stripPath(source, process.cwd() + '\\')];
          return isThisFile || _this.grunt.file.isMatch(importsToLint, sourceArray);
        };
      })(this));
      if (messages.length < 1) {
        return issueCounts;
      }
      this.result.lint.messages = messages;
      messageGroups = _.groupBy(messages, function(arg) {
        var fullMsg, message, rule, type;
        message = arg.message, rule = arg.rule, type = arg.type;
        fullMsg = "" + message;
        if ((type != null) && type.length !== 0) {
          fullMsg = "" + fullMsg;
        }
        if (rule.desc && rule.desc !== message) {
          fullMsg += " " + rule.desc;
        }
        return fullMsg;
      });
      this.grunt.log.writeln((chalk.yellow(filePath)) + " (" + messages.length + ")");
      for (fullRuleMessage in messageGroups) {
        ruleMessages = messageGroups[fullRuleMessage];
        rule = ruleMessages[0].rule;
        this.grunt.log.writeln(fullRuleMessage + chalk.grey(" (" + rule.id + ")"));
        for (i = 0, len = ruleMessages.length; i < len; i++) {
          message = ruleMessages[i];
          if (message.type === 'error') {
            issueCounts.errors += 1;
          } else {
            issueCounts.warnings += 1;
          }
          if (message.line === 0 || message.rollup) {
            continue;
          }
          ref = sourceMap.originalPositionFor({
            line: message.line,
            column: message.col
          }), line = ref.line, column = ref.column, source = ref.source;
          isThisFile = source === file;
          message.lessLine = {
            line: line,
            column: column
          };
          if (!fileContents[source]) {
            if (isThisFile) {
              fileContents[source] = less;
            } else {
              fileContents[source] = this.grunt.file.read(source);
            }
            fileLines[source] = fileContents[source].split('\n');
          }
          filePath = stripPath(source, process.cwd());
          lessSource = fileLines[source][line - 1].slice(column);
          output = chalk.gray(filePath + " [Line " + line + ", Column " + (column + 1) + "]:\t") + (" " + (lessSource.trim()));
          if (this.options.failOnError && (message.type === 'error' || this.options.failOnWarning)) {
            this.grunt.log.error(output);
          } else {
            this.grunt.log.writeln("   " + output);
          }
        }
      }
      return issueCounts;
    };

    return LintErrorOutput;

  })();

  module.exports = LintErrorOutput;

}).call(this);
