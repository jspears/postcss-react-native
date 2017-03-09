"use strict";
import unit from './unit';
import camel from './util/camel';
import isObjectLike from './util/isObjectLike';

const quote = JSON.stringify.bind(JSON);

const vendorIf = (vendor, str)=> {
    if (vendor) {
        return `if (vendor === 'native' || vendor === ${JSON.stringify(vendor)}){\n${str}\n}`;
    }
    return str;
};

const rhsunit = (u)=> {
    const un = unit(u);
    let ret;
    if (un && typeof un.value === 'number') {
        if (un.unit == 'deg') {
            ret = `'${un.value} deg'`
        } else {
            ret = un.unit ? `(${un.value} * units["${un.unit}"])` : un.value;
        }
    } else {
        ret = quote(u);
    }

    return ret;
};


const rhs = (val)=> {
    if (typeof val === 'number' || typeof val == 'boolean') {
        return val;
    } else {
        return rhsunit(val);
    }
};

const writeNakedObj = (obj, unit = rhs)=> {
    return `{${Object.keys(obj).map(v=>`${quote(v)}:${unit(obj[v])}`).join(',\n')}}`;
};
const writeArray = (root, type, values)=> {
    const rt = `${root}.${type}`;
    return `
       if (!${rt}) ${rt} = [];
       ${values.map((v)=>`${rt}.push(${writeNakedObj(v)})`).join(';\n')}
  `
};

const pdecl = (root, type, values) => {
    if (!isObjectLike(values)) {
        const vvv = rhs(values);
        return `${root}.${camel(type)} = ${vvv};`;
    }
    if (type === 'transform' && Array.isArray(values)) {
        return writeArray(root, type, values);
    }
    if (type === 'transition' && Array.isArray(values)) {
        return values.map((v)=> {
            const prop = quote(camel(v.property));
            const tr = `${root}[${prop}]`;
            return `
                if (!${tr}) ${tr} = {};
                ${tr}.delay = ${v.delay};
                ${tr}.duration = ${v.duration};
                ${tr}.timingFunction = ${quote(v['timing-function'])};
                ${tr}.property = ${prop};
            `

        }).join('\n');

    }
    const dstr = Object.keys(values).reduce((str, key)=> {
        const v = values[key];
        if (!isObjectLike(v)) {
            const ct = camel(type, key);
            return `${str}\n ${root}.${ct} = ${rhs(v)};`;
        } else if (Array.isArray(v)) {
            return `${str}\n ${root}.${camel(type, key)} = ${v.map(rhs).join(',')};`;
        } else if (typeof v === 'object') {
            return Object.keys(v).reduce((ret, kv)=> {
                if (type === 'border' && kv === 'style') {
                    //does not support different styles on different sides.
                    return `${ret}\n  ${root}.${camel(type, kv)} = ${rhs(v[kv])};`;
                }
                return `${ret}\n  ${root}.${camel(type, key, kv)} = ${rhs(v[kv])};`;
            }, str);
        } else {
            console.log('wtf?', v);
        }
        return str;
    }, '');
    return dstr;
};

const writeRule = ({css, expressions = []}) => {

    const src = Object.keys(css).map((key)=> {

        const decls = css[key];
        const qkey = JSON.stringify(key);
        const bases = {};
        const strDecls = decls.map((decl)=> {
            const type = decl.prefix || (decl.type == 'animation' || decl.type == 'transition') ? decl.type : 'style';
            const cbase = `current.__${type}`;
            bases[cbase] = true;
            return vendorIf(decl.vendor, `${pdecl(cbase, decl.type, decl.values)}`);
        }).join('\n');

        return `
        internals[${qkey}] = function (parent, config){
          const current = parent &&  parent(config) || {};
          ${Object.keys(bases).map(base=>`if (!${base}) ${base}={}`).join(';\n')};
          ${writeVars()}
          ${writeSheet(strDecls, expressions)}
           return current;
            }.bind(null, internals[${qkey}])`
    }).filter(v=>!/^\s*$/.test(v)).join(';\n');

    return src;
};


const writeExpression = (expr)=> {
    return `(FEATURES['${expr.modifier ? expr.modifier + '-' : ''}${expr.feature}'] && FEATURES['${expr.modifier ? expr.modifier + '-' : ''}${expr.feature}']( ${rhsunit(expr.value)}, config ))\n`;
};

const writeExpressions = ({expressions, inverse})=> {
    const expr = expressions.map(writeExpression).join(' && ');

    return inverse ? `!(${expr})` : expr;
};

const writeSheet = (cssStr, expressions = []) => {
    if (expressions.length) {
        return `
          if (${expressions.map(writeExpressions).join(' || ')}){\n${cssStr}\n}
          `;
    } else {
        return `
          ${cssStr}
          `;
    }
};

export const writeVars = ()=> {
    return `const px = 1,
        vendor = config.vendor,
        inch = 96,
        vh = config.height / 100,
        vw = config.width / 100,
        percentageW = config.clientWidth || config.width,
        percentageH = config.clientHeight|| 0,
        units = {
            px : px,
            vh : vh,
            vw : vw,
            '%':!percentageW ? 0 : percentageW / 100,
            'in':inch,
            pt:(inch/72),
            em:1,
            pc:12 * (inch/72),
            vmin:Math.min(vw, vh),
            vmax: Math.max(vw, vh)
        };`;
};

export const writeKeyframes = (keyframes)=> {
    if (!keyframes) return 'var keyframes = {};';

    return Object.keys(keyframes).reduce((ret, key)=> {
        const rules = [keyframes[key]];
        return `${ret}
              keyframes[${JSON.stringify(key)}] = function(){
               const internals = {};
              ${join(rules, writeRule)}
                 return internals
              }
           ;
           
        `;
    }, 'var keyframes = {};');
};

const join = (array, fn, char = '\n')=> {
    return array ? array.map(fn).join(char) : '';
};


export const writeImports = (imports = []) => {
    const setup = `
    const IMPORTS = [];
    let importedInternals = {};
    `;
    if (!imports || imports.length == 0) {
        return setup;
    }
    let str = imports.reduce((ret, {url})=> {
        return `
         ${ret}importCss(require(${quote(url)}));\n`;
    }, '');
    return `
          ${setup}
          function importCss(imp){
              IMPORTS.push(imp.default);
              importedInternals = imp.internals(importedInternals);
              Object.keys(imp).map((key)=>{
                 if (key === 'default' || key == 'onChange' || key == 'internal' || key === 'DimensionComponent' || key == 'unpublish')
                   return;
                 exports[key] = imp[key]; 
              });
          }
          ${str}          
`;
};

export const writeExports = (exportsObj = {}) => {
    return Object.keys(exportsObj).map(
      key => `exports['${key}'] = '${exportsObj[key]}';`).join('\n');
};

export const rulesAreEqual = (ruleA, ruleB) => {
    const ruleAProps = Object.keys(ruleA);
    const ruleBProps = Object.keys(ruleB);
    return ruleAProps.every(key => ruleAProps[key] === ruleBProps[key]) &&
      ruleAProps.length === ruleBProps.length;
};

export const optimizeBorderRule = (rule) => {
  const keys = Object.keys(rule.values);
  if (rule.values.top && rule.values.bottom && rule.values.left && rule.values.right) {
      if (keys.every(side => rulesAreEqual(rule.values[side], rule.values.top))) {
          rule.values = rule.values.top;
      }
  }
  return rule;
};

const OPTIMIZE_HANDLERS = {
    border: optimizeBorderRule
};

export const optimizeCssRule = (cssRule) => {
  cssRule.forEach((rule, index) => {
      if (OPTIMIZE_HANDLERS.hasOwnProperty(rule.type)) {
          const optimizeHandler = OPTIMIZE_HANDLERS[rule.type];
          cssRule[index] = optimizeHandler(rule);
      }
  });
  return cssRule;
};

export const optimizeCssRules = (cssRules) => {
    Object.keys(cssRules).forEach(rule => {
       cssRules[rule] = optimizeCssRule(cssRules[rule]);
    });
    return cssRules;
};

export const optimizeRules = (rules) => {
    rules.forEach(rule => {
        rule.css = optimizeCssRules(rule.css);
    });
    return rules;
};

export const source = (model)=> {
    return `
     "use strict";
     var listen = require('postcss-react-native/src/listen').default;
     var FEATURES = require('postcss-react-native/src/features').default;
     var flatten = require('postcss-react-native/src/flatten').default;
     var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
     
     const publish = listen();
     const unpublish = listen();
     function makeConfig(){
          var c = Dimensions.get('window');
          c.vendor = Platform.OS;
          return c;
     }
     RCTDeviceEventEmitter.addListener('didUpdateDimensions', function(update) {
         publish(makeConfig());
     });

     Object.defineProperty(exports, "__esModule", {
            value: true
     });

     //imports
     ${writeImports(model.imports)}
     
     //exports
     ${writeExports(model.exports)}
    
     //internals
     exports.internals = function(_internals){
        const internals = _internals || {};
        //rules
        ${join(optimizeRules(model.rules), writeRule)}
        
        return internals;
     
     };

     
     
     //keyframes
     ${writeKeyframes(model.keyframes)};
    
     exports.unsubscribe = unpublish.subscribe(publish.property(exports, 'StyleSheet', 
       (config)=>{
         const internals = exports.internals(importedInternals);
         return StyleSheet.create(Object.keys(internals).reduce((ret,internal)=>{
           const value = internals[internal](config).__style;
           if (typeof (value) !== 'undefined') {
             ret[internal] = value;
           }
           return ret;
         }, {}));
     }));

     exports.onChange = publish;
     
     var ReactNative = require('react-native');

     var Dimensions = ReactNative.Dimensions;
     var StyleSheet = ReactNative.StyleSheet;
     var Platform = ReactNative.Platform;
     var React = require('react');
  
     
     //namespace require
     ${namespaceToRequire(model.namespaces)}
     
     //tagsToType
     ${tagsToTypes(model)}

     //publish current config;
     publish(makeConfig());
     //export default
     exports.default = exports.StyleSheet;
  
  `
};

export const PSEUDO = {
    ':checked': {
        handler(){
            return `
            handleChecked(){
                this.setState({checked:!(this.state && this.state.checked)});
            }`
        },
        prop(){
            return `
            props.onPress = this.handleChecked;
            if (this.state && this.state.checked){
              
                props.style = handleClass(props.style, '__current:checked');
            }
            `
        }

    },
    ':before': {},
    ':after': {}
};


export const namespaceToRequire = (namespaces)=> {
    if (!namespaces) return '';
    const keys = Object.keys(namespaces);
    if (keys.length === 0) {
        return '';
    }
    const str = keys.map((key)=> {
        const [pkg, dots] = namespaces[key].split('.', 2);

        return `pkgs.${key} = require(${JSON.stringify(pkg)})${dots ? '.' + dots : ''};`
    }).join('\n');


    return `
    var pkgs = {};
    ${str}
 `
};
export const buildAnimationSrc = (transition)=> {
    if (!transition) return;
    return transition.reduce((ret, val)=> {
        Object.assign(ret[val.property] || (ret[val.property] = {}), val);
        return ret;
    }, {});
};
/**
 * Any rule may have a tag in it.  If it does, than
 * we need to collapse them. This little dusy does that.
 * @param rules
 */
export const tagsToTypes = ({rules = []})=> {

    const ret = {};

    rules.forEach(({tags, expressions})=> {
        Object.keys(tags).forEach((tagKey)=> {
            const rtag = ret[tagKey] || (ret[tagKey] = []);
            const css = tags[tagKey];
            rtag.push({css, expressions})
        });
    });

    const str = tagsToType(ret);
    return str;


};


export const tagsToType = (conf)=> {
    if (!conf) return '';
    const keys = Object.keys(conf);
    if (keys.length === 0) {
        return '';
    }

    return keys.map((key)=> {
        const [namespace, name] = key.split('|', 2);
        const stringKey = quote(name);
        return `
exports[${stringKey}] = (function(){
     const styler = ()=>{
            const internals = exports.internals();
            ${join(conf[key], writeRule)}     
            return internals;
     }           
     return require('postcss-react-native/src/DimensionComponent').default(pkgs.${namespace}, styler, keyframes, ${stringKey}); 
    })();
`
    }).join(';\n')
};
export const omit = (obj, ...props)=> {
    if (!obj) return;
    if (props.length === 0) return Object.assign({}, obj);
    return Object.keys(obj).reduce((ret, key)=> {
        if (props.indexOf(key) === -1) {
            ret[key] = obj[key];
        }
        return ret;
    }, {});


};

export default source;