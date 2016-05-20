"use strict";
import mediaSelector from '../src/mediaSelector';
import {expect} from 'chai'
describe('mediaSelector', function () {
    const css = {
        'test': {
            'css': 1
        }
    }, change = {
        'test': {
            'css': 2
        }
    }, merge = {
        'test': {
            merge: 1
        }
    };
    it('should match rules', function () {
        const rules = [
            {
                type: 'max-height',
                value: 600,
                css: merge
            },
            {
                css
            },
            {
                type: 'min-width',
                value: 700,
                css: change

            }
        ];
        const result = mediaSelector(rules, {height: 500, width: 600, density: 1.5});

        expect(result).to.exist;
        expect(result[0]).to.eq(rules[0])
        expect(result[1]).to.eq(rules[1])
        expect(result.length).to.eq(2);
    });

});