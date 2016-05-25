import {expect} from 'chai';
import source from '../src/source';
import FEATURES from '../src/features';
const sample =  [
    {
        "css": {
            "stuff": [
                {
                    "type": "margin",
                    "vendor": false,
                    "values": {
                        "top": "20px",
                        "right": "10px",
                        "bottom": "5px",
                        "left": "2px"
                    }
                },
                {
                    "type": "border",
                    "vendor": false,
                    "values": {
                        "top": {
                            "width": "3px"
                        }
                    }
                },
                {
                    "type": "border",
                    "vendor": false,
                    "values": {
                        "bottom": {
                            "width": "5pt"
                        }
                    }
                },
                {
                    "type": "color",
                    "vendor": false,
                    "values": "blue"
                },
                {
                    "type": "color",
                    "vendor": "android",
                    "values": "purble"
                },
                {
                    "type": "color",
                    "vendor": "ios",
                    "values": "yellow"
                }
            ],
            "other": [
                {
                    "type": "opacity",
                    "vendor": false,
                    "values": ".5"
                }
            ]
        }
    },
    {
        "rules": [
            {
                "inverse": false,
                "type": "screen",
                "expressions": [
                    {
                        "modifier": "min",
                        "feature": "device-width",
                        "value": "768px"
                    },
                    {
                        "modifier": "max",
                        "feature": "device-width",
                        "value": "1024px"
                    }
                ]
            }
        ],
        "css": {
            "stuff": [
                {
                    "type": "margin",
                    "vendor": false,
                    "values": {
                        "top": "20px",
                        "right": "10px",
                        "bottom": "5px",
                        "left": "2px"
                    }
                },
                {
                    "type": "border",
                    "vendor": false,
                    "values": {
                        "top": {
                            "width": "3px"
                        }
                    }
                },
                {
                    "type": "border",
                    "vendor": false,
                    "values": {
                        "bottom": {
                            "width": "5pt"
                        }
                    }
                },
                {
                    "type": "color",
                    "vendor": false,
                    "values": "blue"
                },
                {
                    "type": "color",
                    "vendor": "android",
                    "values": "purble"
                },
                {
                    "type": "color",
                    "vendor": "ios",
                    "values": "yellow"
                }
            ],
            "other": [
                {
                    "type": "opacity",
                    "vendor": false,
                    "values": ".5"
                }
            ]
        }
    }
];


describe('source', function () {

    it('should compile', function () {
        const f = source(sample);
        expect(f).to.exist;
        const css = f(FEATURES, {height: 500, width: 500, scale: 1, vendor: 'android'});
        expect(css).to.eql({
            "stuff": {
                "marginTop": 20,
                "marginRight": 10,
                "marginBottom": 5,
                "marginLeft": 2,
                "color": "purble"
            },
            "other": {
                "opacity": 0.5
            }
        });
    });
    it('should compile with expression ios', function () {
        const f = source(sample);
        expect(f).to.be.func;
        const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'ios'});
        expect(css).to.eql({
            "stuff": {
                "marginTop": 20,
                "marginRight": 10,
                "marginBottom": 5,
                "marginLeft": 2,
                "color": "yellow"
            },
            "other": {
                "opacity": 0.5
            }
        });
    });
    it('should compile with expression android', function () {
        const f = source(sample);
        expect(f).to.be.func;
        const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'android'});
        expect(css).to.eql({
            "stuff": {
                "marginTop": 20,
                "marginRight": 10,
                "marginBottom": 5,
                "marginLeft": 2,
                "color": "yellow"
            },
            "other": {
                "opacity": 0.5
            }
        });
    })
});