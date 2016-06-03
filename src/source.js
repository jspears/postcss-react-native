"use strict";
import unit from './unit';
import FEATURES from './features';

const quote = JSON.stringify.bind(JSON);

const uc = (v = '')=> {
    return v ? v[0].toUpperCase() + v.substring(1) : v;
};

const ucc = (v)=> {
    return v.split('-').map(uc).join('');
};

const camel = (arg, ...args)=> {
    const [a, ...rest] = arg.split('-');
    const r = [a];
    if (rest.length) {
        r.push(...rest.filter(v=>!v).map(ucc));
    }
    if (args.length) {
        r.push(...args.map(ucc));
    }
    return r.join('');
};

const vendorIf = (vendor, str)=> {
    if (vendor) {
        return `if (vendor === ${JSON.stringify(vendor)}){\n${str}\n}`;
    }
    return str;
};

const rhsunit = (u)=> {
    const un = unit(u);
    let ret;
    if (un && typeof un.value === 'number') {
        ret = un.unit ? `(${un.value} * units["${un.unit}"])` : un.value;
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

const isObjectLike = (value)=> {
    if (!value) return false;
    const tofv = typeof value;
    switch (tofv) {
        case 'string':
        case 'boolean':
        case 'number':
            return false;
    }
    if (value instanceof Date || value instanceof RegExp)return false;
    return true;
};

const pdecl = (root, type, values) => {
    if (type === 'transition') {
        return `if (!transition) var transition = []; transition.push.apply(transition, ${JSON.stringify(values)});`;
    }
    if (!isObjectLike(values)) {
        const vvv = rhs(values);
        return `${root}.${camel(type)} = ${vvv};`;
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
                return `${ret}\n  ${root}.${camel(type, key, kv)} = ${rhs(v[kv])};`;
            }, str);
        } else {
            console.log('wtf?', v);
        }
        return str;
    }, '');
    return dstr;
};

const writeDecls = (decls = [], base = '', start = '')=> {
    return decls.reduce((str, decl)=> {
        const declStr = vendorIf(decl.vendor, `${pdecl(base, decl.type, decl.values)}`);
        return `\n${str}\n${declStr}`
    }, start);
};

const writeCSS = (css) => {
    return Object.keys(css).map((key)=> {
        const base = `css[${JSON.stringify(key)}]`;
        const decls = css[key];
        return decls.reduce((str, decl)=> {
            const declStr = vendorIf(decl.vendor, `${pdecl(base, decl.type, decl.values)}`);
            return `\n${str}\n${declStr}`
        }, `if(!${base}) ${base} = {};\n`);
    }).filter(v=>!/^\s*$/.test(v)).join(';\n')
};


const writeExpression = (expr)=> {
    return `(FEATURES['${expr.modifier ? expr.modifier + '-' : ''}${expr.feature}'] && FEATURES['${expr.modifier ? expr.modifier + '-' : ''}${expr.feature}']( ${rhsunit(expr.value)}, config ))\n`;
};

const writeExpressions = ({expressions, inverse})=> {
    const expr = expressions.map(writeExpression).join(' && ');

    return inverse ? `!(${expr})` : expr;
};

const writeSheet = ({css, expressions = []}, idx) => {
    let str = '';
    if (expressions.length) {
        str += `if (${expressions.map(writeExpressions).join(' || ')}){\n${writeCSS(css)}\n}`;
    } else {
        str += `${writeCSS(css)}`;
    }
    return str;
};

export const sheet = (rules = [])=> {
    return `
const css = {}, 
      px = 1, 
      vendor = config.vendor,
      inch = 96,
      vh = config.height / 100,
      vw = config.width / 100, 
      units = {
      px : px,
      vh : vh,
      vw : vw,
      'in':inch, 
      pt:(inch/72), 
      em:1, 
      pc:12 * (inch/72),
      vmin:Math.min(vw, vh),
      vmax: Math.max(vw, vh) };
${rules.map(writeSheet).join('\n')}
`;
};

export const source = ({rules=[], imports, namespace})=> {
    return `
     var listen = require('postcss-react-native/dist/listen');
     var FEATURES = require('postcss-react-native/dist/features');
     
     
     Object.defineProperty(exports, "__esModule", {
            value: true
     });
     const publish = listen();
     const unpublish = listen();

     exports.unsubscribe = unpublish.subscribe(publish.property(exports, 'StyleSheet', ${calculate(rules)}));

     exports.update = publish;
     
     var React = require('react');
     var ReactNative = require('react-native');

     var Dimensions = ReactNative.Dimensions;
     var StyleSheet = ReactNative.StyleSheet;
     var Platform = ReactNative.Platform;
     var config = Dimensions.get('window');
     config.vendor = Platform.OS;
     

     publish(config);
     
     //namespace require
     ${namespaceToRequire(namespace)}
     
     //tagsToType
     ${rules.map(tagsToType).join('\n')}

     //export default
     exports.default = exports.StyleSheet;
  
  `
};


export const calculate = (rules)=> {
    return `function(config){
         ${sheet(rules)}
        return StyleSheet.create(css);
    }`
};

export const namespaceToRequire = (namespaces)=> {
    if (!namespaces) return '';
    const keys = Object.keys(namespaces);
    if (keys.length === 0) {
        return '';
    }
    const str = keys.map((key)=> {
        const [pkg, dots] = namespaces[key].split('.', 2);

        return `pkgs.${key} = require(${JSON.stringify(pkg)})${dots ? '.' + dots : ''}`
    }).join(';\n');


    return `
    if (!pkgs) var pkgs = {};
    if (!React) var React = require('react');
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
export const tagsToType = ({tags})=> {
    if (!tags) return '';
    const keys = Object.keys(tags);
    if (keys.length === 0) {
        return '';
    }
    return keys.map((key)=> {
        const stringKey = quote(key);
        const val = tags[key];
        return `
    (function(exports){
       var StyleSheet = exports.StyleSheet || {}; 
       var _style = ${calculate([{css: {__current: val.decls}}, {css: val.css, expressions:val.expressions}])};
       var _sstyle;
       //keep style in sync with
       publish.subscribe( config =>{
            _sstyle = _style(config);    
       });
        
       function handleClass(start, className){
          return (className || '').split(/\s+?/).reduce(function(ret, name){
             if (StyleSheet[name]) ret.push(StyleSheet[name]);
             if (_sstyle[name]) ret.push(_sstyle[name]);
             return ret;
           },start);
       }
       exports[${stringKey}] = React.createClass({
       displayName: ${stringKey},
       componentWillMount(){
          //forceUpdate when orientation changes.
          this._unlisten = publish.subscribe(this.forceUpdate.bind(this));
       },
       componentWillUnmount(){
          //forceUpdate when orientation changes.
          this._unlisten && this._unlisten();
       },
       render(){
               
            var props = Object.assign({}, this.props);
            delete props.children;
            props.style = handleClass(this.props.className, [_sstyle.__current]);
            return React.createElement(pkgs.${val.namespace}, props, children);  
       }
    
    });
    })(exports);
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