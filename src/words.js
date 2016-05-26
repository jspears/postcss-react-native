"use strict";

import valueparser from 'postcss-value-parser';

export default function (str) {
    const rest = [];
    if (!str) return rest;

    valueparser(str).walk((node, pos, nodes)=> {
        if (node.type === 'word') {
            rest.push(node.value);
        }
    });

    return rest;
};
