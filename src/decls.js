"use strict";
import valueparser from 'postcss-value-parser';
import {border} from './normalizeBorder';
import prefill from './fill';
import font from './font';
/**
 *
 * 1->1 1 1 1
 * 1 2 -> 1 2 1 2
 * 1 2 3 -> 1 2 3 2
 *
 * @param values
 */

const toMap = (o, v, i)=> {
    o[v] = i;
    return o
};


const RTRBLV = ['top', 'right', 'bottom', 'left', 'vertical'];
const TRBL = RTRBLV.reduce(toMap, {});

const RTLBR = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
const TLBR = RTLBR.reduce(toMap, {});

const TRBLV = Object.assign({}, TRBL, {
    vertical: 4
});

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
const postfixWrap = (postfix, value)=> {
    return {postfix, value};
};

function _unit(value) {

    if (value === 'auto') {
        return null;
    }

    let {number, unit} =valueparser.unit(value);

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
const words = (str) => {
    const rest = [];
    if (!str) return rest;

    valueparser(str).walk((node, pos, nodes)=> {
        if (node.type === 'word') {
            rest.push(node.value);
        }
    });

    return rest;
};

function _box(postfix, values, table = TRBLV, rtable = RTRBLV) {
    const v0 = values.splice(0, 1)[0];
    if (!v0) {
        return values;
    }
    if (postfix && postfix in table) {
        values[table[postfix]] = v0;
    } else if (values.length === 0) {
        values.push(v0, v0, v0, v0);
    } else if (values.length === 1) {
        values.unshift(v0);
        values.push(values[0], values[1]);
    } else if (values.length === 2) {
        values.unshift(v0);
        values.push(values[1]);
    } else if (values.length === 3) {
        values.unshift(v0);
    }

    return values.reduce((obj, val, idx)=> {
        if (val) {
            obj[rtable[idx]] = val;
        }
        return obj;
    }, {});
}
function box(postfix, values, prefix, table = TRBLV) {
    return _box(postfix, words(values), table);
}
const color = postfixWrap.bind(null, 'color');


const unit = (postfix, value)=>unit(value);
const value = (postfix, value)=>value;
const enumer = (...enums)=>postfixWrap;
const first = (postfix, value)=> {
    return prefill(value, 0);
};
export const HANDLERS = {
    width: unit,
    height: unit,
    top: unit,
    left: unit,
    right: unit,
    bottom: unit,
    margin: box,
    padding: box,
    color: first,
    border,
    shadow: enumer('color', 'offset', 'opacity', 'radius'),
    position: enumer('absolute', 'relative'),
    flex(postfix, value){
        switch (postfix) {
            case 'direction':
                return enumer('row',
                    'column')(postfix, value);
            case 'wrap':
                return enumer('wrap',
                    'nowrap')(postfix, value);
            case '':
                return value;
        }
    },
    justify(postfix, value){
        switch (postfix) {
            case 'content':
                return enumer('flex-start',
                    'flex-end',
                    'center',
                    'space-between',
                    'space-around')(postfix, value);
        }
    },

    align(postfix, value){
        switch (postfix) {
            case 'items':
                return enumer('flex-start',
                    'flex-end',
                    'center',
                    'stretch')(postfix, value);
            case 'self':
                return enumer('auto',
                    'flex-start',
                    'flex-end',
                    'center',
                    'stretch')(postfix, value);
        }
    },
    opacity: first,
    tint(postfix, value){
        switch (postfix) {
            case 'color':
                return color(value)
        }
    },
    overlay(postfix, value){
        switch (postfix) {
            case 'color':
                return color(value);
        }
    },
    transform(postfix, value){
        switch (postfix) {
            case 'matrix':
                return postfixWrap(postfix, value);

        }
        return value;
    },
    overflow: enumer('visible', 'hidden'),
    backface: enumer('visiblility'),
    font,
    text(postfix, value){
        switch (postfix) {
            case 'shadow-offset':
            case 'shadow-radius':
            case 'shadow-color':
            case 'align':
            case 'align-vertical':
            case 'decoration-line':
            case 'decoration-style':
            case 'decoration-color':
                return postfixWrap(postfix, value);
        }
    },
    writing(postfix, value){
        switch (postfix) {
            case 'direction':
                return postfixWrap(postfix, value);
        }
    }
};
const VENDORS = ['mox', 'ie', 'ios', 'android', 'native', 'webkit', 'o', 'ms'];
const declRe = new RegExp('^(?:-(' + (VENDORS.join('|')) + ')-)?(.+?)(?:-(.+?))?$');
export function parse(decl, str) {
    const ret = {};
    const [match, vendor=false, type, postfix] = declRe.exec(decl);
    const handler = HANDLERS[type];
    if (!handler) {
        console.warn('unknown type', type, postfix);
        return;
    }
    return {type, vendor, values: handler(postfix, str, vendor)}
}

export default ({parse});