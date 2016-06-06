import fs from 'fs';
import postcss from 'postcss';
import {expect} from 'chai';
import FEATURES from '../../src/features';
import plugin from '../../src/index';
import source from '../../src/source'
import listen from '../../src/listen'

export const mockReactNative = (dimensions = {height: 500, width: 500, scale: 1}, OS = 'ios') => {
    return {
        StyleSheet: {
            create(o){
                return Object.keys(o).reduce((ret, key, idx)=> {
                    ret[key] = o[key];
                    return ret;
                }, {});
            }
        },
        Dimensions: {
            get: function (str) {
                return dimensions;
            }
        },
        Platform: {
            OS
        }
    }
};
export const MockReact = {
    createClass(...args){
        return args;
    },
    createFactory(...args){
        return args;
    }
};


export const makeRequire = (dimensions, Platform)=> {
    const mockModules = {
        'react-native': mockReactNative(dimensions, Platform),
        'react': MockReact,
        'postcss-react-native/dist/listen': {default: listen},
        'postcss-react-native/dist/features': {default: FEATURES},
        'RCTDeviceEventEmitter': {
            addListener(){
            }
        }
    };
    return (path)=> {
        if (path in mockModules) {
            return mockModules[path];
        }
        return require(path);

    };
};

function compile(sources, require) {
    const src = source(sources);
    try {
        const f = new Function(['require', 'exports'], src);
        f._source = src;
        return ()=> {
            const exports = {};
            try {
                f(require, exports);
            } catch (e) {
                console.log('function', src, '\n\n', e.stack + '');
            }
            return exports;
        }
    } catch (e) {
        console.log('source', src, '\n\n', e.stack + '');
        throw e;
    }
}

export const test = function (name, callback = v => v, toJSON = v=>v) {
    var input = read('test/fixtures/' + name + '.css');
    return postcss(plugin({
        toStyleSheet: function (json, css) {
            callback((dimensions, platform = 'ios')=> {
                return compile(json, makeRequire(dimensions, platform))();
            }, css);

        }, toJSON
    })).process(input, {from: name, to: name});

};
export const testString = function (input, opts) {
    return postcss(plugin(opts)).process(input, process, {from: 'from', to: 'to'});
};
//use for debugging;
export const toJSON = (obj, {source:{input:{file='rules'}}})=> {
    console.log(`export const ${file.split('/').pop()} = ${JSON.stringify(obj, null, 2)}`);
    return obj;
};
export const read = function (path) {
    return fs.readFileSync(path, 'utf-8');
};


export const json = (name)=> {
    return JSON.parse(read(`test/fixtures/${name}.css.json`))
};