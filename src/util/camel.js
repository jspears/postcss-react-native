const uc = (v = '')=> {
    return v ? v[0].toUpperCase() + v.substring(1) : v;
};

const ucc = (v = '')=> {
    return v.split('-').map(uc).join('');
};

export default function (arg, ...args) {
    const [a, ...rest] = arg.split('-');
    const r = [a];
    if (rest.length) {
        r.push(...rest.filter(Boolean).map(ucc));
    }
    if (args.length) {
        r.push(...args.map(ucc));
    }
    return r.join('');
};
