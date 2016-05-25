"use strict";
import {allUnit, isBorderUnit} from './unit';
import prefill, {trbl, TRBL} from './fill';

const PROPS = ['width', 'style', 'color'];

const _set = (obj, prop) => {
    if (Object.hasOwnProperty(prop)) {
        return obj[prop];
    }
    return (obj[prop] = {});
};
const border = (side, prop, values, obj)=> {

    if (side && prop) {
        _set(obj, side)[prop] = trbl(values, side);
    } else if (prop) {
        TRBL.forEach((s)=> {
            border(s, prop, values, obj);
        })
    } else if (side) {
        PROPS.reduce((ret, p, i)=> {
            if (i < values.length) {
                (ret[side] || (ret[side] = {}))[p] = values[i];
            }
            return ret;
        }, obj);
    } else {
        const units = allUnit(values,isBorderUnit);
        if (units) {
            TRBL.forEach(s => _set(obj, s).width = trbl(units, s));
        } else {
            TRBL.forEach(s => PROPS.forEach((p, i)=> (i < values.length) && ((obj[s] || (obj[s] = {}))[p] = values[i])));
        }
    }
    return obj;
};

/*
 border-top-left-radius: 0
 border-top-right-radius: 0
 border-bottom-right-radius: 0
 border-bottom-left-radius: 0
 */

const radius = (side, corner, values, obj = {})=> {

    if (side && corner) {
        obj[`${side}-${corner}-radius`] = prefill(values, 0);
    } else if (side) {
        switch (side) {
            case 'left':
            case 'right':
                radius('top', side, prefill(values, 0), obj);
                radius('bottom', side, prefill(values, 1), obj);
                break;
            case 'top':
            case 'bottom':
                radius(side, 'left', prefill(values, 0), obj);
                radius(side, 'right', prefill(values, 1), obj);
                break;
        }
    } else if (corner) {
        radius('top', corner, prefill(values, 0), obj);
        radius('bottom', corner, prefill(values, 1), obj);
    } else {
        let i = 0;
        for (let [s,c] of [['top', 'left'], ['top', 'right'], ['bottom', 'right'], ['bottom', 'left']]) {
            radius(s, c, prefill(values, i++), obj);
        }
    }
    return obj;
};

const handle = (type, values, obj = {})=> {
    const [ , side, corner, prop] = /border(?:-(top|right|bottom|left))?(?:-(right|left))?(?:-(width|style|color|radius))?$/.exec(type);
    if (prop === 'radius') {
        return radius(side, corner, values);
    } else {
        return border(side, prop, values, obj);
    }
};

const parse = (str) => {
    const [decl, stuff] = str.split(/\s*:\s*/, 2);
    const value = stuff.split(/\s+?/);


    return handle(decl, value);
};


export default function toStyle(values) {

    return parse(Array.isArray(values) ? values.join(' ') : values);
}