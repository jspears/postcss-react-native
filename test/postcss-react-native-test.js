import fs from 'fs';
import postcss from 'postcss';
import {expect} from 'chai';
import FEATURES from '../src/features';
import plugin from '../src/index';

const test = function (name, toStyleSheet) {
    var input = read('test/fixtures/' + name + '.css');
//    var output = read('test/fixtures/' + name + '.out.js');

    return postcss(plugin({toStyleSheet})).process(input, {from: name, to: name});
    //.then(result=> expect(result).css.to.eql(output));
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
         * Initial value	as each of the properties of the shorthand:
         transition-delay: 0s
         transition-duration: 0s
         transition-property: all
         transition-timing-function: ease
         */
        return testString('.t1 { transition: margin-left 4s, border 1s ease-in, opacity 30 linear 1s}', {
            toJSON(css, input){
                expect(css).to.eql([
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
                        }
                    }
                ]);
            },
            toStyleSheet(json, input){

            }
        })
    });

    it('media query stuff for ios', function () {
        return test('media', (f, source)=> {
            const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'ios'});
            expect(css).to.eql({
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
                    "borderTopColor": "green"
                },
                "other": {
                    "opacity": 0.5
                }
            });
        });
    });

    it('media query stuff for android', function () {
        return test('media', (f, source)=> {
            const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'android'});
            expect(css).to.eql({
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
                    "borderTopColor": "green"
                },
                "other": {
                    "opacity": 0.5
                }
            });
        });
    });
    it('should parse font', ()=> {
        return test('font', (f, source)=> {
            const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'android'});
            expect(css).to.eql({
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
            const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'android'});
            expect(css).to.eql({
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
});
