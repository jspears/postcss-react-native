"use strict";
import {parseMedia} from '../src/mediaSelector';
import {expect} from 'chai';

describe('parseMedia', function () {

    for (let [rule, valid] of [
        [`(min-width: 700px)`, [{
            "expressions": [
                {
                    "feature": "width",
                    "modifier": "min",
                    "value": "700px"
                }
            ],
            "inverse": false,
            "type": "all"
        }]],
        [`(min-width: 700px) and (orientation: landscape)`, [{
            "inverse": false,
            "type": "all",
            "expressions": [{"modifier": "min", "feature": "width", "value": "700px"}, {
                "feature": "orientation",
                "modifier": void(0),
                "value": "landscape"
            }]
        }]],
        [`(min-width: 700px), handheld and (orientation: landscape)`, [{
            "inverse": false,
            "type": "all",
            "expressions": [{"modifier": "min", "feature": "width", "value": "700px"}]
        }, {
            "inverse": false,
            "type": "handheld",
            "expressions": [{"feature": "orientation", "modifier": void(0), "value": "landscape"}]
        }]],
        [`screen and (min-aspect-ratio: 1/1) `, [{
            "inverse": false,
            "type": "screen",
            "expressions": [{"modifier": "min", "feature": "aspect-ratio", "value": "1/1"}]
        }]],
        [`screen and (device-aspect-ratio: 16/9), screen and (device-aspect-ratio: 16/10)`, [{
            "inverse": false,
            "type": "screen",
            "expressions": [{"feature": "device-aspect-ratio", "modifier": void(0), "value": "16/9"}]
        }, {
            "inverse": false,
            "type": "screen",
            "expressions": [{"feature": "device-aspect-ratio", "modifier": void(0), "value": "16/10"}]
        }]]
    ]) {

        it(`should parse rule ${rule}`, function () {
            expect(parseMedia(rule)).to.eql(valid);
        })
    }

});