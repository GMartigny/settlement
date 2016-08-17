(function() {
  var CSSLint, CssLinter, RuleLoader, _, stripJsonComments;

  CSSLint = require('csslint').CSSLint;

  _ = require('lodash');

  RuleLoader = require('./rule-loader');

  stripJsonComments = require('strip-json-comments');

  module.exports = CssLinter = (function() {
    function CssLinter(options, grunt) {
      this.options = options;
      this.grunt = grunt;
    }

    CssLinter.prototype.lint = function(css, callback) {
      var cssLintOptions, disabledRules, enabled, externalOptions, i, id, len, ref, result, rules;
      if (!css) {
        return callback(null, []);
      }
      externalOptions = {};
      disabledRules = RuleLoader.getRuleLoader(this.grunt).configureRules(this.options);
      rules = _.reduce(CSSLint.getRules(), function(memo, arg) {
        var id;
        id = arg.id;
        memo[id] = 1;
        return memo;
      }, {});
      cssLintOptions = this.options.csslint;
      if (cssLintOptions != null ? cssLintOptions.csslintrc : void 0) {
        externalOptions = JSON.parse(stripJsonComments(this.grunt.file.read(cssLintOptions.csslintrc)));
        delete cssLintOptions.csslintrc;
      }
      _.extend(cssLintOptions, externalOptions);
      for (id in cssLintOptions) {
        enabled = cssLintOptions[id];
        if (cssLintOptions[id]) {
          rules[id] = cssLintOptions[id];
        } else {
          delete rules[id];
        }
      }
      for (i = 0, len = disabledRules.length; i < len; i++) {
        id = disabledRules[i];
        if (id in rules) {
          delete rules[id];
        }
      }
      result = CSSLint.verify(css, rules);
      if (((ref = result.messages) != null ? ref.length : void 0) > 0) {
        return callback(null, result);
      } else {
        return callback();
      }
    };

    return CssLinter;

  })();

}).call(this);
