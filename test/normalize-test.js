import normalize from '../src/normalize';
import {expect} from 'chai';

const sample = [{
    "css": {
        "stuff": [{
            "type": "margin",
            "vendor": false,
            "values": {"top": {"value": 20}, "right": {"value": 20}, "bottom": {"value": 20}, "left": {"value": 20}}
        }]
    }
}, {
    "rules": [{
        "inverse": false,
        "type": "screen",
        "expressions": [{"modifier": "min", "feature": "device-width", "value": "768px"}, {
            "modifier": "max",
            "feature": "device-width",
            "value": "1024px"
        }]
    }],
    "css": {
        "stuff": [{
            "type": "margin",
            "vendor": false,
            "values": {"top": {"value": 20}, "right": {"value": 20}, "bottom": {"value": 20}, "left": {"value": 20}}
        }]
    }
}];


describe('normalize', function () {

    it('should normalize', ()=> {
        expect(normalize(sample)).to.eql({});

    });
});