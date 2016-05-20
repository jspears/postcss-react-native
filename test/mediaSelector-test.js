"use strict";
import mediaSelector from '../src/mediaSelector';
import {expect} from 'chai'
describe('mediaSelector', function () {
    const css = {
        'test': {
            'hello': 1
        }
    }, change = {
        'test': {
            'hello': 2
        }
    }, merge = {
        'test': {
            more: 1
        }
    };
    it('should match rules', function () {

        const result = mediaSelector([{
            css
        }, {
            type: 'min-width',
            value: 700,
            css: change

        }, {
            type: 'max-height',
    //        not: true,
            value: 5350,
            css: merge
        }], {height: 500, width: 600, density: 1.5});

        expect(result).to.exist;
        expect(result[0].css).to.eq(css);
        expect(result[1].css).to.eq(merge);
        expect(result.length).to.eq(2);
    });

});