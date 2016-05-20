"use strict";
import FEATURES from './features';

export default function matches(rules, config) {
    return rules.filter(rule=>!rule.type || (FEATURES[rule.type](rule.value, config) && rule.not));
};