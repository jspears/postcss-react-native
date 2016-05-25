"use strict";
import camelCase from 'lodash/string/camelCase';

export default function normalize(style = {}, css) {


    return Object.keys(css).reduce(function (obj, key) {
        css[key].forEach((val)=> {
            const {type, values} = val;
            const current = obj[key] = obj[key] || {}
            Object.keys(values).reduce((ret, kv)=> {
                ret[camelCase(`${type}-${kv}`)] = values[kv];
                return ret;
            }, current);

        });
        return obj;
    }, style);

}