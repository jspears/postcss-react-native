"use strict";

import postcss  from 'postcss';
import selectorParser from 'postcss-selector-parser';
import {parse} from './decls';
import {parseMedia} from './mediaSelector';
import source from './source';

const parser = selectorParser();

const DEFAULT_OPTS = {
    toJSON(obj, {source:{input:{file='rules'}}}){
        return source(obj);
    },
    toStyleSheet(obj, {source:{input:{file='rules'}}}){
    }
};
module.exports = postcss.plugin('postcss-react-native', function (opts) {
    opts = Object.assign({}, DEFAULT_OPTS, opts);

    return (css, result) => {
        const root = {};
        const rules = [{css: root}];
        css.walkRules((rule)=> {
            if (rule.parent.type !== 'root') {
                return;
            }
            const selector = parser.process(rule.selector).res;
            let current;
            selector.walkClasses(function (r) {
                current = root[r.value] = (root[r.value] || []);
            });
            rule.walkDecls((decl)=> {
                current && current.push(parse(decl.prop, decl.value))
            });

        });
        css.walkAtRules((atrule)=> {
            const css = {};
            atrule.walkRules(rule=> {
                const selector = parser.process(rule.selector).res;
                let current;
                selector.walkClasses(function (r) {
                    current = css[r.value] = (css[r.value] || []);
                });
                rule.walkDecls((decl)=> {
                    current && current.push(parse(decl.prop, decl.value))
                });
            });
            rules.push({
                rules: parseMedia(atrule.params),
                css
            });
        });

        opts.toStyleSheet(opts.toJSON(rules, css), css);
    }
})
;
