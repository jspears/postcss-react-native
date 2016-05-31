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
        const tags = {};
        const namespaces = {};
        const rules = [{css: root, tags, namespaces}];
        css.walkRules((rule)=> {
            if (rule.parent.type !== 'root') {
                return;
            }
            const selector = parser.process(rule.selector).res;
            let current, tag;
            selector.walk(function (t) {
                if (t.type === 'tag') {
                    tag = tags[t.value] || ( tags[t.value] = {classes: []});
                    if (t.ns) {
                        tag.namespace = t.ns.replace('|', '');
                    }
                } else if (t.type == 'class') {
                    root[t.value] = current || (current = []);
                    if (tag) {
                        tag.classes.push(t.value);
                    }
                } else if (t.type == 'combinator') {
                    console.warn('combinators are not supported (yet)');
                }
            });
            if (tag && !current) {
                tag.decls = current = [];
            }
            rule.walkDecls((decl)=> {
                current && current.push(parse(decl.prop, decl.value))
            });

        });
        css.walkAtRules((atrule)=> {
            const css = {};
            if (atrule.name === 'media') {
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
            } else if (atrule.name === 'namespace') {
                const [prefix, ns] = postcss.list.space(atrule.params);
                const pns = JSON.parse(ns);
                namespaces[pns ? prefix : pns] = pns;
            } else if (atrule.name === 'import'){
                console.log('import', atrule.type);

            }
        });

        opts.toStyleSheet(opts.toJSON(rules, css), css);
    }
})
;
