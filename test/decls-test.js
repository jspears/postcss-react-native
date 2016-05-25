"use strict";

import {parse} from '../src/decls';
import {expect} from 'chai';


describe('decls', function () {

    describe('variations of parse', function () {
        for (const [test, result] of [
            [[1], {top: {value: 1}, right: {value: 1}, bottom: {value: 1}, left: {value: 1}}],
            [[1, 2], {top: {value: 1}, right: {value: 2}, bottom: {value: 1}, left: {value: 2}}],
            [[1, 2, 3], {top: {value: 1}, right: {value: 2}, bottom: {value: 3}, left: {value: 2}}],
            [[1, 2, 3, 4], {top: {value: 1}, right: {value: 2}, bottom: {value: 3}, left: {value: 4}}]
        ]) {
            it(`should parse ${test} `, function () {
                const t = parse('margin', test.join(' '));
                //.values.map(v=>v.value);
                expect(t.values).to.eql(result);

            })
        }
    });

    it('should return decls', function () {


        const ret = parse('margin', '10px 3% 1em');
        expect(ret).to.eql({
            type: 'margin',
            vendor: false,
            values: {
                top: {value: 10},
                right: {value: 3, unit: '%'},
                bottom: {value: 1, unit: 'em'},
                left: {value: 3, unit: '%'}
            }
        })
    });
    it('should parse specific', function () {
        const {type, vendor, values:{top, left, bottom, right}} = parse('-ios-margin-left', '5px');
        expect(type).to.eql('margin');
        expect(vendor).to.eql('ios');
        expect(top).to.not.exist;
        expect(bottom).to.not.exist;
        expect(right).to.not.exist;

        expect(left).to.eql({value: 5});
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