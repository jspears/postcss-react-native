"use strict";
import FEATURES from './features';
import mq from 'css-mediaquery';
const mergeCss$reduce = (ret, {css={}})=> {
    return Object.keys(css).reduce((obj, key)=> {
        if (obj[key]) {
            obj[key] = Object.assign({}, obj[key], css[key]);
        } else {
            obj[key] = css[key];
        }

        return obj;
    }, ret);
};

export const mergeCss = (rules)=>rules.reduce(mergeCss$reduce, {});


export function match({css, rules = []}, config = {}) {

    return rules.filter(rule=>matchExpression(rule, config));

}

export function matchExpression({expressions=[], invert=false},  config) {

    for (const expr of expressions) {
        if (FEATURES[expr.modifier ? `${expr.modifier}-${expr.feature}` : expr.feature](expr.value, config) !== true && !invert) {
            return false;
        }
    }
    return true;

}

export const parseMedia = mq.parse.bind(mq);

/*
 [`(min-width: 700px), handheld and (orientation: landscape)`, [{
 "inverse": false,
 "type": "all",
 "expressions": [{"modifier": "min", "feature": "width", "value": "700px"}]
 }, {
 "inverse": false,
 "type": "handheld",
 "expressions": [{"feature": "orientation", "modifier": void(0), "value": "landscape"}]
 }]],
 */
export default function (rule, style, config) {
    return mergeCss(match(rules, config));
}
