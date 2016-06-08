"use strict";
import unit from './unit';
import camel from './util/camel';
import isObjectLike from './util/isObjectLike';

const quote = JSON.stringify.bind(JSON);

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

const writeCSS = (css, i) => {
    return Object.keys(css).map((key)=> {
        const base = `css[${JSON.stringify(key)}]`;
        const decls = css[key];
        return decls.reduce((str, decl)=> {
            if (!decl) {
                console.log('say what?', key, decls);
            }
            const declStr = vendorIf(decl.vendor, `${pdecl(base, decl.type, decl.values)}`);
            return `\n${str}\n${declStr}`
        }, `if (!css) var css = {};\nif(!${base}) ${base} = {};\n`);
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
        //expression check
        str += `if (${expressions.map(writeExpressions).join(' || ')}){\n${writeCSS(css, idx)}\n}`;
    } else {
        str += writeCSS(css, idx);
    }
    return str;
};

export const writeImports = (imports = []) => {
    if (!imports || imports.length == 0) {
        return 'var IMPORTS = []';
    }
    let str = imports.reduce((ret, {url})=> {
        return `
         ${ret}importCss(require(${quote(url)}));\n`;
    }, '');
    return `
          var IMPORTS = [];
          function importCss(imp){
              IMPORTS.push(imp.default);
              Object.keys(imp).map((key)=>{
                 if (key === 'default' || key == 'onChange' || key === 'DimensionComponent' || key == 'unpublish')
                   return;
                 exports[key] = imp[key]; 
              });
          }
          ${str}          
`;
};
export const sheet = (rules = [])=> {
    return `
const px = 1, 
      vendor = config.vendor,
      inch = 96,
      vh = config.height / 100,
      vw = config.width / 100, 
      percentageW = config.componentWidth || config.width,
      percentageH = config.componentHeight || 0,
      units = {
      px : px,
      vh : vh,
      vw : vw,
      '%':()=>{
        return percentageW / 100;
      },
      'in':inch, 
      pt:(inch/72), 
      em:1, 
      pc:12 * (inch/72),
      vmin:Math.min(vw, vh),
      vmax: Math.max(vw, vh) };
${rules.map(writeSheet).join('\n')}
`;
};
export const writeKeyframes = (keyframes)=> {
    if (!keyframes) return '';

    return Object.keys(keyframes).reduce((ret, key)=> {
        const rules = [keyframes[key]];
        return `${ret}
            publish.subscribe((c)=>{
              const keyframe = function(config){ 
                ${sheet(rules)}
                 return css
              }
              keyframes[${JSON.stringify(key)}] = keyframe(c);
            });
        `;
    }, 'var keyframes = {};');
};
export const source = (model)=> {
    return `
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
     
     //keyframes
     ${writeKeyframes(model.keyframes)};
     
     exports.unsubscribe = unpublish.subscribe(publish.property(exports, 'StyleSheet', ${calculate(model.rules)}));

     exports.onChange = publish;
     
     var ReactNative = require('react-native');

     var Dimensions = ReactNative.Dimensions;
     var StyleSheet = ReactNative.StyleSheet;
     var Platform = ReactNative.Platform;
     var React = require('react');
     exports.DimensionComponent = React.createClass({
        componentWillMount:function() {
            var self = this;
            this._listen = publish.subscribe(function(){
              self.forceUpdate()
            });
        },
        componentWillUnmount:function() {
            this._listen && this._listen();
        },
        render(){
          throw new Error("Should implement render");
        }
     });
     
     //
 
     
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

export const calculate = (rules)=> {
    return `function(config){
         if (!css) var css = {};
         ${sheet(rules)}
         
        return StyleSheet.create(flatten(IMPORTS, css));
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
export const tagsToTypes = ({rules = [], keyframes})=> {

    return tagsToType(rules.reduce((ret, {tags, expressions})=> {
        if (tags) {
            return Object.keys(tags).reduce((r, key)=> {
                (r[key] || (r[key] = [])).push({tag: tags[key], expressions});
                return r;
            }, ret);
        }
        return ret;
    }, {}), keyframes);

};


export const tagsToType = (tags, keyframes)=> {
    if (!tags) return '';
    const keys = Object.keys(tags);
    if (keys.length === 0) {
        return '';
    }

    return keys.map((key)=> {
        const stringKey = quote(key);
        let namespace = '';
        let pseudos = {};
        let animations = null;
        const valArray = tags[key].reduce((ret, {tag, css, expressions}) => {
            if (tag.namespace) {
                namespace = tag.namespace;
            }
            if (tag.pseudo) {
                ret.push(... Object.keys(tag.pseudo).map((pk)=> {
                    (pseudos[pk] || (pseudos[pk] = [])).push(tag.pseudo);
                    return {css: {[ `__current${pk}` ]: tag.pseudo[pk]}, expressions: tag.expressions}
                }));

            }


            if (tag.decls) {
                ret.push({css: {__current: tag.decls}, expressions: expressions});
            } else {
                ret.push({css, expressions});

            }
            if (tag.animation) {
                if (!animations) {
                    animations = [];
                }
                animations.push(tag.animation.toJSON());
            }
            return ret;
        }, []);
        const renderStr = animations ? `React.createElement(AnimatedCSS, props, children)` : `React.createElement(pkgs.${namespace}, props, children)`;

        return `
(function(e){
            
       var _style = ${calculate(valArray)};
       var _sstyle;
       //keep style in sync with
       publish.subscribe( config =>{
            _sstyle = _style(config);    
       });
        
       function handleClass(start, className){
          return (className || '').split(/\\s+?/).reduce(function(ret, name){
             if (e.StyleSheet && e.StyleSheet[name]) ret.push(e.StyleSheet[name]);
             if (_sstyle[name]) ret.push(_sstyle[name]);
             return ret;
           },start);
       }
        //animations?
       ${animations ? '//import animation\n var AnimatedCSS = require("postcss-react-native/src/AnimatedCSS").default;' : ''} 
       ${animations ? 'var _animations = ' + JSON.stringify(animations) : ''}

       e[${stringKey}] = React.createClass({
       displayName: ${stringKey},
       componentWillMount(){
          //forceUpdate when orientation changes.
          var forceUpdate = this.forceUpdate.bind(this);
          this._unlisten = publish.subscribe(function(){ 
             forceUpdate()
          });
       },
       componentWillUnmount(){
          //stop forceUpdate when unmounting.
          this._unlisten && this._unlisten();
       },
       onLayout(e){
         console.log('layout', e);
       },
       ${Object.keys(pseudos).map((v=>PSEUDO[v] && PSEUDO[v].handler ? PSEUDO[v].handler(pseudos[v]) : '' )).concat(null).join(',\n')}
       render(){
            
            var children = this.props.children;   
            var props = Object.assign({}, this.props);
            
            delete props.children;
            props.style = handleClass( [_sstyle.__current], this.props.className);
            ${animations ? 'props.animate=_animations;\nprops.keyframes=keyframes;' : ''}
            ${Object.keys(pseudos).map((v=>PSEUDO[v] && PSEUDO[v].prop() ? PSEUDO[v].prop(pseudos[v]) : '')).join(';\n')}
            
            return ${renderStr};  
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