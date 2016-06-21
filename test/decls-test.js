"use strict";

import {parse} from '../src/decls';
import {expect} from 'chai';


describe('decls', function () {

    describe('variations of parse', function () {
        for (const [test, result] of [
            [[1], {
                "top": "1",
                "right": "1",
                "bottom": "1",
                "left": "1"
            }],
            [[1, 2], {
                "top": "1",
                "right": "2",
                "bottom": "1",
                "left": "2"
            }],
            [[1, 2, 3], {
                "top": "1",
                "right": "2",
                "bottom": "3",
                "left": "2"
            }],
            [[1, 2, 3, 4], {
                "top": "1",
                "right": "2",
                "bottom": "3",
                "left": "4"
            }]
        ]) {
            it(`should parse ${test} `, function () {
                const t = parse('margin', test.join(' '));
                //.values.map(v=>v.value);
                expect(t.values).to.eql(result);

            })
        }
    });

    it('should return decls', function () {
        expect(parse('margin', '10px 3% 1em')).to.eql({
            "type": "margin",
            "values": {
                "bottom": "1em",
                "left": "3%",
                "right": "3%",
                "top": "10px"
            },
            "vendor": false
        })
    });
    it('should parse specific', function () {
        const {type, vendor, values} = parse('-ios-margin-left', '5px');
        expect(type).to.eql('margin');
        expect(values).to.eql({
            left: '5px'
        });
    });

    it('should parse border radius', function () {
        const ret = parse('border-radius', '5px');
        expect(ret).to.eql({
            type: 'border',
            vendor: false,
            values: {
                "bottom-left-radius": "5px",
                "bottom-right-radius": "5px",
                "top-left-radius": "5px",
                "top-right-radius": "5px"
            }
        })
    });

    it('should parse border radius-top-radius', function () {
        const ret = parse('border-top-left-radius', '5px');
        expect(ret).to.eql({
            type: 'border',
            vendor: false,
            values: {
                "top-left-radius": "5px"
            }
        })
    });
    it('should parse border-top-left-radius', function () {
        const ret = parse('border-top-left-radius', '5px');
        expect(ret).to.eql({
            type: 'border',
            vendor: false,
            values: {
                "top-left-radius": "5px"
            }
        })
    });
    it('should parse border-bottom-right-radius', function () {
        expect(parse('border-bottom-right-radius', '5px')).to.eql({
            "type": "border",
            "values": {
                "bottom-right-radius": "5px"
            },
            "vendor": false
        });

    });

});