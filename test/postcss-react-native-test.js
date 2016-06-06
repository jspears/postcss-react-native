import {testString, test, json} from './support';
import {expect} from 'chai';

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
        return test('component', (f, source)=> {
            const ret = f({height: 1024, width: 768, scale: 1});
            expect(ret).to.exist;
        });
    });

    it('should parse clazz-pseudo', function () {
        return test('clazz-pseudo', (f, source)=> {
            const ret = f({height: 1024, width: 768, scale: 1});
            expect(ret).to.exist;
        });
    });
});