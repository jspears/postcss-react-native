"use strict";
var transition = require('./transition');
var utils = require('./utils');
function isDimension(prop) {
    return /(?:(max|min)-)?(height|width)/.test(prop);
}

module.exports = function cssLocalsDimension(locals, opts) {
    opts = opts || utils.EMPTY_OBJ;
    var localOpts = opts['dimension'] || utils.EMPTY_OBJ;

    var updateLocal = localOpts.updateLocal || opts.localUpdate || utils.localUpdate;

    var selectors = localOpts.selectors || opts.selectors || utils.selectors;

    var classMap = selectors.reduce(function (ret, key) {
        if (key in locals) {
            ret[locals[key]] = key;
        }
        return ret;
    }, {});

    var re = utils.classToRegexp(Object.keys(classMap));

    /**
     * Two cases
     *
     * Transition X to auto.
     * .enter {
     *  transition:height 1s ease;
     *  height:0<-- fine.
     * }
     * .enterActive {
     *   height:auto; <-- this triggers height auto
     * }
     * adds
     * \@enterActiveHeight = 'height 1s ease';
     *
     * Transition from auto to X.
     * .enter {
     *  transition:height 1s ease;
     *  height:auto;<-- this triggers height auto
     * }
     * .enterActive {
     *  height:0;
     * }
     * \@enterHeight = 'height 1s ease';
     */
    return function extractDimensions$return(css, result) {
        css.walkRules(re, function (s) {
            var selectorName = s.selector.replace(/^\./, '');
            var prop = classMap[selectorName];
            var trans = transition();
            s.walkDecls(/^transition.*/, function (node) {
                trans[node.prop](node.value);
            });
            trans.property().forEach(function (propname) {
                if (!isDimension(propname)) {
                    return;
                }
                var found = false;

                s.walkDecls(propname, function (decl) {
                    if (decl.value === 'auto') {
                        //from auto.
                        found = true;
                       // decl.value === '100%';
           //             decl.cloneBefore({ prop: 'max-'+propname, value: '100%' });
                        decl.cloneBefore({ prop:decl.prop, value:'100%'})
                        decl.remove();
//                        const max = new Declaration({ prop: 'color', value: 'black' });
                        updateLocal(locals, prop, propname, trans.description().join(','));
                    }
                });

                var activeProp = locals[prop + 'Active'];
                //so its a to auto.
                if (!found && activeProp) {
                    css.walkRules(utils.classToRegexp([activeProp]), function (activeRule) {
                        activeRule.walkDecls(propname, function (d) {
                            if (d.value === 'auto') {
                                //to auto
                                updateLocal(locals, prop + '-active', propname, trans.description().join(','));
                            }
                        });
                    });
                }
            });

        });
    };
};