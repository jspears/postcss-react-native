"use strict";
import DECLS from './declarations';
import words from './words';
import parseColor from 'parse-color';
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
const TRBLV = Object.assign({}, TRBL, {
    vertical: 4
});

const postfixWrap = (postfix, value)=> {
    return postfix ? {[postfix]: value} : value;
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
function box(postfix, values, prefix, tag, table = TRBLV) {
    return _box(postfix, words(values), table);
}
const color = (postfix, value)=> {
    const c = `rgba(${parseColor(value)['rgba'].join(', ')})`;
    return postfix ? {[postfix]: c} : c;
};

//const color = postfixWrap.bind(null, 'color');

const unit = (postfix, value)=>value;
const enumer = (...enums)=>postfixWrap;
const first = (postfix, value)=> {
    return value;
};
export const HANDLERS = Object.assign({}, DECLS, {
    width: unit,
    height: unit,
    top: unit,
    left: unit,
    right: unit,
    bottom: unit,
    margin: box,
    padding: box,
    color,
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
            case 'grow':
            case 'shrink':
            case 'basis':

        }
        return {
            ['']: value
        };
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

    overflow: enumer('visible', 'hidden'),
    backface: enumer('visiblility'),
    background(postfix, value){
        switch (postfix) {
            case 'color':
                return color(postfix, value);
        }
    },
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
});
const VENDORS = ['mox', 'ie', 'ios', 'android', 'native', 'webkit', 'o', 'ms'];
const declRe = new RegExp('^(?:-(' + (VENDORS.join('|')) + ')-)?(.+?)(?:-(.+?))?$');

export function parse(decl, str, tag) {
    const [match, vendor=false, type, postfix] = declRe.exec(decl);
    const handler = HANDLERS[type];
    if (!handler) {
        console.warn('unknown type', type, postfix);
        return;
    }
    const values = handler(postfix, str, vendor, tag);
    return values == null ? null : {type, vendor, values};
}

export default ({parse});