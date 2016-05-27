"use strict";

const TRBL = ['top', 'right', 'bottom', 'left'];
const has = Function.call.bind(Object.prototype.hasOwnProperty);


function handler(depth, parts, src, dest, obj) {
    if (!(src && dest)) return obj;
    const first = parts.length != 0 ? [parts.shift()] : depth[0];
    const second = parts.length != 0 ? [parts.shift()] : depth[1];
    for (const f of first) {
        let csrc = src[f], cdest = dest[f];
        for (const s of second) {
            if (csrc && cdest && has(csrc, s) && has(cdest, s) && csrc[s] != cdest[s]) {
                (obj[f] || (obj[f] = {}))[s] = [csrc[s], cdest[s]];
            }
        }
    }
    return obj;
}
function handlerSingle(depth, parts, src, dest, obj) {
    if (!(src && dest)) return obj;
    const second = parts.length != 0 ? [parts.shift()] : depth[0];
    let csrc = src, cdest = dest;
    for (const s of second) {
        if (csrc && cdest && has(csrc, s) && has(cdest, s) && csrc[s] != cdest[s]) {
            obj[s] = [csrc[s], cdest[s]];
        }
    }
    return obj;
}
function normalize(depth, parts) {
    if (!parts || parts.length === 0) return depth.concat();
    const ret = [];
    for (let i = 0, l = depth.length; i < l; i++) {
        if (parts.length) {
            ret.push([parts.shift()]);
        } else {
            ret.push(depth[i])
        }
    }
    return ret;
}
const handle = (parts, src, dest, obj)=> {
    return [src, dest];
};

const DECLS = ['height', 'width', 'opacity'].reduce((ret, k)=> {
    ret[k] = handle;
    return ret;
}, {
    border: handler.bind(null, [TRBL, ['width', 'color', 'style']]),
    margin: handlerSingle.bind(null, [TRBL]),
});

export default function match(transition, src, dest) {
    const parts = transition.split('-');
    const p1 = parts.shift();
    return {[p1]: DECLS[p1](parts, src, dest, {})};


}