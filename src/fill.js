"use strict";
export const TRBL = ['top', 'right', 'bottom', 'left'];
//trbl
//0123
export default function prefill(values, pos) {
    values = values ? Array.isArray(values) ? values : [values] : [];
    const ln = values.length;
    if (pos < ln || ln === 0) {
        return values[pos];
    }
    if (pos == 1) {
        return values[0];
    }
    if (pos == 2) {
        return prefill(values, 0);
    }
    if (pos == 3) {
        return prefill(values, 1);
    }
}

export const table = (values, side, table)=> prefill(values, table.indexOf(side));

export const trbl = (values, side)=>table(values, side, TRBL);