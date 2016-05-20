"use strict";
import FEATURES from './features';

export default function matches(rules = [], config = {}) {
    return rules.filter((rule)=> {
        if (!rule.type) {
            return true
        }

        const matched = FEATURES[rule.type](rule.value, config);
        const ret = ( matched && !rule.not);
        return ret;
    });
};