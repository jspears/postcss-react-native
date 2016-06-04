import fs from 'fs';
import postcss from 'postcss';
import {expect} from 'chai';
import FEATURES from '../src/features';
import plugin from '../src/index';
import source from '../src/source'
import listen from '../src/listen'

const mockReactNative = (dimensions = {height: 500, width: 500, scale: 1}, OS = 'ios') => {
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
const MockReact = {
    createClass(...args){
        return args;
    },
    createFactory(...args){
        return args;
    }
};


const makeRequire = (dimensions, Platform)=> {
    const mockModules = {
        'react-native': mockReactNative(dimensions, Platform),
        'react': MockReact,
        'postcss-react-native/dist/listen': {default: listen},
        'postcss-react-native/dist/features': {default: FEATURES}
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

const test = function (name, callback = v => v, toJSON = v=>v) {
    var input = read('test/fixtures/' + name + '.css');
    return postcss(plugin({
        toStyleSheet: function (json, css) {
            callback((dimensions, platform = 'ios')=> {
                return compile(json, makeRequire(dimensions, platform))();
            }, css);

        }, toJSON
    })).process(input, {from: name, to: name});

};
const testString = function (input, opts) {
    return postcss(plugin(opts)).process(input, process, {from: 'from', to: 'to'});
};
//use for debugging;
const toJSON = (obj, {source:{input:{file='rules'}}})=> {
    console.log(`export const ${file.split('/').pop()} = ${JSON.stringify(obj, null, 2)}`);
    return obj;
};
var read = function (path) {
    return fs.readFileSync(path, 'utf-8');
};

describe('postcss-react-native', function () {
    /*
     transition: margin-left 4s;
     transition: margin-left 4s 1s;
     transition: margin-left 4s ease-in-out 1s;
     transition: margin-left 4s, color 1s;
     transition: all 0.5s ease-out;

     */
    it('should parse transition', function () {
        /**
         * TODO - Make transition conform to dela, duration, property,timing-function
         * Initial value    as each of the properties of the shorthand:
         transition-delay: 0s
         transition-duration: 0s
         transition-property: all
         transition-timing-function: ease
         */
        return testString('.t1 { transition: margin-left 4s, border 1s ease-in, opacity 30 linear 1s}', {
            toJSON(css, input){
                expect(css).to.eql({
                    "rules": [
                        {
                            "css": {
                                "t1": [
                                    {
                                        "type": "transition",
                                        "vendor": false,
                                        "values": [
                                            {
                                                "property": "margin-left",
                                                "duration": 4000,
                                                "timing-function": "ease",
                                                "delay": 0
                                            },
                                            {
                                                "property": "border",
                                                "duration": 1000,
                                                "timing-function": "ease-in",
                                                "delay": 0
                                            },
                                            {
                                                "property": "opacity",
                                                "duration": 30,
                                                "timing-function": "linear",
                                                "delay": 1000
                                            }
                                        ]
                                    }
                                ]
                            },
                            "tags": {}
                        }
                    ],
                    "namespaces": {},
                    "imports": []
                });
            },
            toStyleSheet(json, input){

            }
        })
    });

    it('media query stuff for ios', function () {
        return test('media', (f, source)=> {
            const css = f({height: 1024, width: 768, scale: 1}, 'ios');

            expect(css.StyleSheet).to.eql({
                "stuff": {
                    "borderBottomWidth": 6.666666666666666,
                    "borderTopWidth": 3,
                    "marginTop": 20,
                    "marginRight": 10,
                    "marginBottom": 5,
                    "marginLeft": 2,
                    "color": "yellow",
                    "borderLeftWidth": 5,
                    "borderRightWidth": 5,
                    "borderTopColor": "green",
                    "borderStyle": "solid"
                },
                "other": {
                    "opacity": 0.5
                }
            });
        }, v=>v, {});
    });
    it('media should parse import', function () {
        return test('import', v=>v, (f, source)=> {

            expect(f).to.exist;
            return f;

        });
    });
    it('media query stuff for android', function () {
        return test('media', (f, source)=> {
            const css = f({height: 1024, width: 768, scale: 1}, 'android');
            expect(css.default).to.eql({
                "stuff": {
                    "borderBottomWidth": 6.666666666666666,
                    "borderTopWidth": 3,
                    "marginTop": 20,
                    "marginRight": 10,
                    "marginBottom": 5,
                    "marginLeft": 2,
                    "color": "purble",
                    "borderLeftWidth": 5,
                    "borderRightWidth": 5,
                    "borderTopColor": "green",
                    "borderStyle": "solid"

                },
                "other": {
                    "opacity": 0.5
                }
            });
        });
    });
    it('should parse font', ()=> {
        return test('font', (f, source)=> {
            const css = f({height: 1024, width: 768, scale: 1}, 'android');
            expect(css.default).to.eql({
                "font1": {
                    "fontSize": 2,
                    "fontFamily": "Open Sans"
                },
                "font2": {
                    "fontSize": 192
                }
            });
        });
    });
    it('should parse welcome', function () {
        return test('welcome', (f, source)=> {
            const css = f({height: 1024, width: 768, scale: 1}, 'android');
            expect(css.default).to.eql({
                "container": {
                    "flex": 1,
                    "justifyContent": "center",
                    "alignItems": "center",
                    "backgroundColor": "#F5FCFF"
                },
                "welcome": {
                    "fontSize": 20,
                    "textAlign": "center",
                    "marginTop": 10,
                    "marginRight": 10,
                    "marginBottom": 10,
                    "marginLeft": 10
                },
                "instructions": {
                    "textAlign": "center",
                    "color": "#333333",
                    "marginBottom": 5
                }
            });
        });
    });
    it('should compile clazz', ()=> {
        return test('clazz', (f)=> {
            const css = f({height: 1024, width: 768, scale: 1});
            expect(css.default).to.exist;
            expect(css.MyView).to.exist;
            return css;
        });
    });

    it('should parse clazz', function () {
        return test('clazz', v=>v, (css, source)=> {
            expect(css).to.eql(json('clazz'));
            return css;
        });
    });
    it('should parse component', function () {
        return test('component',  (f, source)=> {
            const ret = f({height: 1024, width: 768, scale: 1});
            expect(ret).to.exist;
        });
    });
});
const json = (name)=> {
    return JSON.parse(read(`test/fixtures/${name}.css.json`))
};