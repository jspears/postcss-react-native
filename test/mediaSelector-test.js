"use strict";
import {match, mergeCss} from '../src/mediaSelector';
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
        },
        'test3': {
            what: 2
        }
    };
    it('should match rules', function () {
        const rules = [
            {
                expressions: [{
                    type: 'max-height',
                    value: 600
                }
                    ,
                    {
                        type: 'min-width',
                        value: 700
                    }]
            },
            {
                expressions: [
                    {
                        type: 'height',
                        value: 888
                    },
                    {
                        type: 'color',
                        value: 1,
                        not: true
                    }]
            }
        ];
        let result = match(rules[0], {height: 500, width: 600, density: 1});
        expect(result).to.eql([]);

    });
    it('should merge rules', function () {
        const media = [
            {
                css: css
            },
            {

                css: merge,
                rules: [
                    {
                        type: 'max-height',
                        value: 600
                    },

                    {
                        type: 'min-width',
                        value: 700
                    }]
            },
            {
                css: change,
                rules: [
                    {
                        type: 'height',
                        value: 888
                    }
                ]
            }
        ];

        const result = mergeCss(media);
    });
})
;