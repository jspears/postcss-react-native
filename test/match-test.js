"use strict";

import {expect} from 'chai';
import {parse as _parse} from '../src/decls';
import match from '../src/match';
const parse = (value)=> {
    const {values} =  _parse(...value.split(':', 2));
    return values;
};
describe('match-transition', function () {
    const matcher = (prop, src, dest, eql) => () => {
        return expect(match(prop, parse(src), parse(dest))).to.eql(eql);
    };

    it('should match height', matcher('height', 'height:10px', 'height:5px', {
        height: ['10px', '5px']
    }));
    it('should match width', matcher('width', 'width:10px', 'width:5px', {
        width: ['10px', '5px']
    }));
    it('should match opacity', matcher('opacity', 'opacity:1', 'opacity:0', {
        opacity: ['1', '0']
    }));

    it('should match margin', matcher('margin', 'margin:10px', 'margin:5px', {
        "margin": {
            "bottom": [
                "10px",
                "5px"
            ],
            "left": [
                "10px",
                "5px"
            ],
            "right": [
                "10px",
                "5px"
            ],
            "top": [
                "10px",
                "5px"
            ]
        }
    }));

    it('should match margin-right', matcher('margin-right', 'margin:10px', 'margin-right:5px', {
        "margin": {
            "right": [
                "10px",
                "5px"
            ]
        }
    }));

    it('should match border-top', matcher('border-top', 'border-top:10px solid red', 'border:5px solid green', {
        "border": {
            "top": {
                "width": [
                    "10px",
                    "5px"
                ],
                "color": [
                    "red",
                    "green"
                ]
            }
        }
    }));
    it('should match border', matcher('border', 'border:10px solid red', 'border:5px solid green', {
        "border": {
            "top": {
                "width": [
                    "10px",
                    "5px"
                ],
                "color": [
                    "red",
                    "green"
                ]
            },
            "right": {
                "width": [
                    "10px",
                    "5px"
                ],
                "color": [
                    "red",
                    "green"
                ]
            },
            "bottom": {
                "width": [
                    "10px",
                    "5px"
                ],
                "color": [
                    "red",
                    "green"
                ]
            },
            "left": {
                "width": [
                    "10px",
                    "5px"
                ],
                "color": [
                    "red",
                    "green"
                ]
            }
        }
    }))
});
