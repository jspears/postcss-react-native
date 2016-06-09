"use strict";

import postcss  from 'postcss';
import selectorParser from 'postcss-selector-parser';
import {parse} from './decls';
import {parseMedia} from './mediaSelector';
import source from './source';
import unescape from './util/unescape';

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
                    tag = tags[value] || ( tags[value] = {css: {}, decls: [], transitions: []});
                    if (ns) {
                        tag.namespace = ns.replace('|', '');
                    }
                    decls = tag.decls;
                    break;
                }
                case 'pseudo':
                    if (tag) {
                        tag.pseudo = tag.pseudo || (tag.pseudo = {});
                        decls = tag.pseudo[value] || (tag.pseudo[value] = []);
                    }
                    break;
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
            const d = parse(decl.prop, decl.value, tag, decl);
            if (d != null)
                decls && decls.push(d);
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
            const {name, params} = atrule;
            switch (name) {
                case 'media':
                {
                    const aro = {css: {}, tags: {}, expressions: parseMedia(params)};
                    root.rules.push(aro);
                    atrule.walkRules(createWalker(aro));
                    break;
                }
                case 'namespace':
                {
                    const [prefix, ns] = postcss.list.space(params);
                    const pns = unescape(ns);
                    root.namespaces[pns ? prefix : pns] = pns;
                    break;
                }
                case 'import':
                {
                    const [match, url, squote, quote, tparam] =importRe.exec(params);
                    root.imports.push({url: url || squote || quote, params: tparam});
                    break;

                }
                case 'keyframes':
                {
                    const keyframes = root.keyframes || (root.keyframes = {});
                    const aro = keyframes[params] || (keyframes[params] = {css: {}});
                    atrule.walkRules((rule)=> {
                        const selector = rule.selector.split(/\,\s*/);
                        rule.walkDecls((decl)=> {
                            const val = parse(decl.prop, decl.value, null, decl);
                            for (const s of selector) {
                                let n;
                                switch (s) {
                                    case 'from':
                                        n = '0';
                                        break;
                                    case 'to':
                                        n = '100';
                                        break;
                                    default:
                                        n = s.replace(/%$/, '');
                                }
                                if (!aro.css[n]) aro.css[n] = [];
                                aro.css[n].push(val);
                            }
                        })
                    });
                    break;
                }
                default:
                    console.warn(`unimplemented atrule ${name} ${params}`);
            }
        });

        return opts.toStyleSheet(opts.toJSON(root, src, result), src, result);
    }
});