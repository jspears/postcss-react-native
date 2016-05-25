"use strict";
var utils = require('./utils');
var DEF_SELECTORS = ['enter', 'leave', 'appear'];
var transition = require('./transition');
var animation = require('./animation');


module.exports = function cssLocalsTransition(locals, opts) {

    opts = opts || utils.EMPTY_OBJ;

    var localOpts = opts['transition'] || utils.EMPTY_OBJ;
    var updateLocal = localOpts.updateLocal || opts.localUpdate || utils.localUpdate;
    var selectors = localOpts.selectors || opts.selectors || utils.selectors;

    var selectorsMap = Object.keys(locals).filter(function (key) {
        //only selectors we care about.
        return selectors.indexOf(key) > -1
    }).reduce(function (ret, key) {
        ret[locals[key]] = key;
        return ret;
    }, {});

    // Work with options here
    var re = utils.classToRegexp(Object.keys(selectorsMap));

    return function cssLocalsTransition$postCssPlugin(css, result) {
        css.walkRules(re, function (s) {
            var prop = selectorsMap[s.selector.replace(/^\./, '')];
            var trans = transition(), anim = animation();

            s.walkDecls(/^transition.*/, function (node) {
                trans[node.prop](node.value);
            });

            s.walkDecls(/^animation.*/, function (node) {
                anim[node.prop](node.value)
            });

            var max = Math.max(anim.timeout(), trans.timeout());
            if (max > 0) {
                updateLocal(locals, prop, 'timeout', max);
            }
        });

    };
};