(function() {
  var CacheSwap, LintCache, _, grunt, packageInfo, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  grunt = require('grunt');

  CacheSwap = require('cache-swap');

  path = require('path');

  _ = require('lodash');

  packageInfo = grunt.file.readJSON(path.resolve(path.join(__dirname, '..', '..', 'package.json')));

  LintCache = (function(superClass) {
    extend(LintCache, superClass);

    LintCache.category = 'lesshashed';

    function LintCache(opts) {
      if (!_.isObject(opts)) {
        opts = {};
      }
      LintCache.__super__.constructor.apply(this, arguments);
      this.options.cacheDirName = "lesslint-" + packageInfo.version;
    }

    LintCache.prototype.clear = function(done) {
      return LintCache.__super__.clear.call(this, LintCache.category, done);
    };

    LintCache.prototype.hasCached = function(hash, done) {
      return LintCache.__super__.hasCached.call(this, LintCache.category, hash, done);
    };

    LintCache.prototype.getCached = function(hash, done) {
      return LintCache.__super__.getCached.call(this, LintCache.category, hash, done);
    };

    LintCache.prototype.addCached = function(hash, done) {
      return LintCache.__super__.addCached.call(this, LintCache.category, hash, '', done);
    };

    return LintCache;

  })(CacheSwap);

  module.exports = {
    LintCache: LintCache
  };

}).call(this);
