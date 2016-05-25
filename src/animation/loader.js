"use strict";

var postcss = require('postcss');
var localsLoad = require('./locals-load');
var loaderUtils = require("loader-utils");

module.exports = function (source, map) {
    if (this.cacheable) {
        this.cacheable();
    }

    var query = typeof this.query === 'string' ? loaderUtils.parseQuery(this.query) : this.query;

    var cssLocalPlugins = this.options && this.options.cssLocals
        ? this.options.cssLocals : [require('./css-locals-transition')];


    var exports = {
        push(id){
            this.css = id[1];
        },
        locals: {}
    };

    var callback = this.async();

    var fakeRequire = function (_mod) {
        exports.mod = _mod;
        return function () {
            return exports;
        }
    };

    var _module = {};

    //yeah, I know should use child compiler, but damn that is a lot of work.
    (new Function(['exports', 'module', 'require'], source))(null, _module, fakeRequire);

    postcss(localsLoad(cssLocalPlugins, exports.locals, query)).process(exports.css).then(function (result) {

        var str = 'exports = module.exports = require(' + JSON.stringify(exports.mod) + ')();\n\n';
        str += '// imports\n\n';
        str += 'exports.push([module.id, ' + JSON.stringify(result + '') + ', ""]);\n\n';
        str += '// exports\nexports.locals = ' + (exports.locals ? JSON.stringify(exports.locals) : null) + ';';
        callback(null, str);
    }).catch(callback);
};