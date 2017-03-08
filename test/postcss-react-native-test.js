import {testString, testTransform, test, json} from './support';
import {expect} from 'chai';

describe('postcss-react-native', function () {
    /*
     transition: margin-left 4s;
     transition: margin-left 4s 1s;
     transition: margin-left 4s ease-in-out 1s;
     transition: margin-left 4s, color 1s;
     transition: all 0.5s ease-out;

     */
    it('should parse simple-component', ()=> {
        return test('simple-component', (f)=> {
            const css = f({height: 1024, width: 768, scale: 1});
            expect(css.default).to.exist;
            expect(css.StyledText).to.exist;
            return css;
        });
    });

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
                                        "prefix": "transition",
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
                    "imports": [],
                    "exports": {}
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
                    "color": "rgba(255, 255, 0, 1)",
                    "borderWidth": 5,
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
        return test('import', v=>v=> {
            return v;
        }, (f, source)=> {

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
                    "borderWidth": 5,
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
                    "backgroundColor": "rgba(192, 192, 192, 1)"
                },
                "welcome": {
                    "fontSize": 20,
                    "fontFamily": "Thonburi",
                    "textAlign": "center",
                    "marginTop": 0,
                    "marginRight": 0,
                    "marginBottom": 0,
                    "marginLeft": 0
                },
                "instructions": {
                    "textAlign": "center",
                    "color": "rgba(51, 51, 51, 1)",
                    "marginBottom": 5,
                    "borderWidth": 1,
                    "borderStyle": "solid",
                    "borderColor": "green"
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
    it('should parse component', function (done) {
        return testTransform('component', (f, source)=> {
            return f({height: 1024, width: 768, scale: 1}).then((ret, css, src)=> {
                expect(ret).to.exist;
                done();
            }, done);
        });
    });

    it('should parse clazz-pseudo', function (done) {
        return testTransform('clazz-pseudo', (f, source)=> {
            return f({height: 1024, width: 768, scale: 1}).then((ret, css, src)=> {
                expect(ret).to.exist;
                done();
            }, done);
        });
    });
    it('should parse real-import', function (done) {
        return testTransform('real-import', (f)=> {
            return f({height: 1024, width: 768, scale: 1}).then((ret, css, src)=> {
                expect(ret).to.exist;
                done();
            }, done);
        });
    });

    it('should parse :export selector', function () {
        return test('exports', (f, source) => {
            const css = f({height: 1024, width: 768, scale: 1}, 'android');
            expect(css.color).to.eql('#FF0000');
            expect(css.default).to.eql({
                "other": {
                    "opacity": 0.5
                }
            });
        });
    });
});