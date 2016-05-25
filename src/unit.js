"use strict";

import valueParser from 'postcss-value-parser';


const re = /^unset|inherit|auto|revert$|^(\d*(?:\.\d+?)?)(em|ex|ch|rem|vh|vw|vmin|vmax|px|mm|cm|in|pc|%)?$/i;
//`${re.source}{1,4}$|${re.source}(?:\s+?(\w+?))(?:\s+?(\w+?))$/i;

/*
 /^(((\d*(?:\.\d+?)?)(em|ex|ch|rem|vh|vw|vmin|vmax|px|mm|cm|in|pc)\s*){1,4})$|^((\d*(?:\.\d+?)?)(em|ex|ch|rem|vh|vw|vmin|vmax|px|mm|cm|in|pc)(?:\s+?(solid|dashed|hidden|double|dotted|groove|ridge|inset|outset))?)(\s+?\w+?)?$/.
 */
export function isUnit(val) {
    if (re.test(val)) {
        return val;
    }
    return false;
}
export function isBorderUnit(val) {
    if (isUnit(val)) return val;
    return /^medium|thin|thick$/.test(val) ? val : false;
}
export const allUnit = (vals, _isUnit = isUnit)=> {
    const ret = [];
    for (const val of vals) {
        const u = _isUnit(val);
        if (u === false) {
            return false;
        }
        ret.push(u);
    }
    return ret.length === 0 ? false : ret;
};

export function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

export default function (value) {

    if (value === 'auto') {
        return null;
    }

    let {number, unit} =valueParser.unit(value);

    if (unit) {
        number = parseFloat(number);
        if (unit == 'px') {
            return {value: number};
        }
        return {
            unit,
            value: number
        }
    }
    return isNumeric(value) ? {value: parseFloat(value)} : {value};

}