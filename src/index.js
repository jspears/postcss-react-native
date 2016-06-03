"use strict";

import postcss  from 'postcss';
import selectorParser from 'postcss-selector-parser';
import {parse} from './decls';
import {parseMedia} from './mediaSelector';
import source from './source';

const parser = selectorParser();
const importRe = /^\s*(?:url\(([^)]*)\)|"([^"]*)"|'([^']*)')(?:\s*(.*)?)$/;
const DEFAULT_OPTS = {
    toJSON(obj, {source:{input:{file='rules'}}}){
        return source(obj);
    },
    toStyleSheet(obj, {source:{input:{file='rules'}}}){
    }
};
const createWalker = ({css, tags})=> {

    return (rule) => {
        const selector = parser.process(rule.selector).res;
        let decls, tag;
        selector.walk(function ({type, value, ns}) {
            switch (type) {
                case 'tag':
                {
                    tag = tags[value] || ( tags[value] = {css: {}, decls: []});
                    if (ns) {
                        tag.namespace = ns.replace('|', '');
                    }
                    decls = tag.decls;
                    break;
                }
                case 'class':
                {
                    if (tag) {
                        tag.css[value] = decls || (decls = []);
                    } else {
                        css[value] = decls || (decls = []);
                    }
                    break;
                }
                case 'selector':
                    break;
                default:
                    console.warn(`selectors of type ${type} are not supported yet`);
            }

        });

        rule.walkDecls((decl)=> {
            decls && decls.push(parse(decl.prop, decl.value))
        });

    };
};
module.exports = postcss.plugin('postcss-react-native', function (opts) {
    opts = Object.assign({}, DEFAULT_OPTS, opts);

    return (src, result) => {

        const ro = {css: {}, tags: {}};
        const root = {
            rules: [ro],
            namespaces: {},
            imports: []
        };
        const walker = createWalker(ro);
        src.walkRules((rule)=> {
            if (rule.parent.type !== 'root') {
                return;
            }
            walker(rule);
        });
        src.walkAtRules((atrule)=> {

            if (atrule.name === 'media') {
                const aro = {css: {}, tags: {}, expressions: parseMedia(atrule.params)};
                root.rules.push(aro);
                atrule.walkRules(createWalker(aro));
            } else if (atrule.name === 'namespace') {
                const [prefix, ns] = postcss.list.space(atrule.params);
                const pns = JSON.parse(ns);
                root.namespaces[pns ? prefix : pns] = pns;
            } else if (atrule.name === 'import') {
                const [match, url, squote, quote, params] = importRe.exec(atrule.params);
                root.imports.push({url: url || squote || quote, params});
            }
        });

        opts.toStyleSheet(opts.toJSON(root, src, result), src, result);
    }
})
;
