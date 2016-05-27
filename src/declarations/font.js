"use strict";

import pcf from 'parse-css-font';

/**
 *    as each of the properties of the shorthand:
 font-style: normal
 font-variant: normal
 font-weight: normal
 font-stretch: normal
 font-size: medium
 line-height: normal
 font-family: depends on user agent
 * @param postfix
 * @param values
 */
export default function font(postfix, values) {

    if (postfix) {
        switch (postfix) {
            case 'family':
            case 'size':
            case 'style':
            case 'weight':
            case 'line-height':
            case 'color':
                return {
                    [postfix]: values
                };
        }
        console.warn('should not get here', postfix, values);
    }
    const ret = pcf(values);
    return Object.keys(ret).reduce((r, k)=> {
        const v = ret[k];
        if (v == 'normal') return r;

        if (k == 'lineHeight') {
            k = 'line-height';
        }
        r[k] = v;
        return r;
    }, {});
}