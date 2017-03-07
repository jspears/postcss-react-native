"use strict";

import postcss  from 'postcss';
import {parse} from './decls';
import {parseMedia} from './mediaSelector';
import source from './source';
import unescape from './util/unescape';
import selector from './selector';

const importRe = /^\s*(?:url\(([^)]*)\)|"([^"]*)"|'([^']*)')(?:\s*(.*)?)$/;
const DEFAULT_OPTS = {
    toJSON(obj, {source:{input:{file='rules'}}}){
        return source(obj);
    },
    toStyleSheet(obj, {source:{input:{file='rules'}}}){
    }
};
const clsName = (name = '__current', pseudo='')=> {
    return `${name}${pseudo}`;
};
const createWalker = ({css, tags})=> {

    return (rule) => {
        const decls = [];
        rule.walkDecls((decl)=> {
            const d = parse(decl.prop, decl.value, decls);
            if (d != null)
                decls && decls.push(d);
        });
        if (decls.length) {
            selector(rule.selector).map((v)=> {
                if (v.tag) {
                    const cName = clsName(v['class'], v.pseudo);
                    const tName = `${v.namespace}|${v.tag}`;
                    const t = tags[tName] || (tags[tName] = {});
                    (t[cName] || (t[cName] = [])).push(...decls);

                } else if (v.class || v.pseudo) {
                    const cName = clsName(v['class'], v.pseudo);
                    (css[cName] || (css[cName] = [])).push(...decls);
                } else {
                    console.log('dunno about this.', v);
                }
            });
        }
    };
};
module.exports = postcss.plugin('postcss-react-native', function (opts) {
    opts = Object.assign({}, DEFAULT_OPTS, opts);

    return (src, result) => {

        const ro = {css: {}, tags: {}};
        const root = {
            rules: [ro],
            namespaces: {},
            imports: [],
            exports: {}
        };
        const walker = createWalker(ro);
        src.walkRules((rule)=> {
            if (rule.selector === ':export') {
                rule.walkDecls(function (decl) {
                    root.exports[decl.prop] = decl.value;
                });
                rule.remove();
                return;
            }
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