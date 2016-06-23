import {Platform, Dimensions} from 'react-native';
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import listen from './listen';

const whiteRe = /\s+?/;
const commaRe = /,\s*/;

export const classNamesWithPsuedos = (classNames = [], psuedos)=> {

    const all = ['__current', ...classNames];
    if (!psuedos || psuedos.length === 0) {
        return all
    }

    return all.concat(all.reduce((ret, name)=> {
        for (const pseudo of psuedos) {
            ret.push(`${name}:${pseudo}`);
        }
        return ret;
    }, []));
};

export const isObjectEmpty = (value) => {
    if (value == null) return true;
    //noinspection LoopStatementThatDoesntLoopJS,JSUnusedLocalSymbols

    for (var key in value) {
        return false;
    }
    return true;
};

export const toggle = (all, str)=> {
    const parts = all ? all.split(',') : [];
    const idx = parts.indexOf(str);
    if (idx === -1) {
        parts.push(str);
    } else {
        parts.splice(idx, 1);
    }
    return parts;
};

const lastStyle = (styles, key)=> {
    if (!styles) return;
    for (let i = styles.length - 1; i != -1; i--) {
        if (styles[i][key])
            return styles[i][key];
    }
};

export const calculate = (c, dyna = {}, classNames = [], styles = [], psuedos = [], prevState) => {
    //noinspection JSUnusedLocalSymbols
    const {x, y, width, height} = (c && c.layout) || {};


    const config = Object.assign({}, WINDOW, {clientHeight: height, clientWidth: width});
    const ret = {config, pseudos: psuedos.join(',')};
    let transition;
    for (const className of classNamesWithPsuedos(classNames, psuedos)) {

        if (className in dyna) {
            const {__animation, __transition, __style} = dyna[className](config);

            if (!isObjectEmpty(__style)) {
                (ret.style || (ret.style = [])).push(__style);
            }
            if (!isObjectEmpty(__animation)) {
                (ret.animation || (ret.animation = [])).push(__animation);
            }
            if (!isObjectEmpty(__transition)) {
                //noinspection JSUnusedAssignment
                transition = Object.assign(transition || {}, __transition);
            }
        }
    }
    if (transition) {
        Object.keys(transition).forEach((key)=> {
            const from = lastStyle(prevState.style, key), to = lastStyle(ret.style, key);
            if (from == null || to == null) {
                return;
            }
            const t = transition[key];
            const r = ret.transition || (ret.transition = {});
            const re = Object.assign(r[key] || (r[key] = {}), t);
            re.from = from;
            re.to = to;
        });
    }

    return ret;

};
export const asArray = (val)=> {
    if (val == null) return;
    if (!Array.isArray(val)) return [val];
    return val;
};
export const splitClass = (str)=> {
    if (!str) return;
    if (typeof str === 'string') {
        return str.split(whiteRe);
    }
    return str;
};


export const splitComma = (str)=> {
    return str ? str.split(commaRe) : [];
};
export const WINDOW = {
    vendor: Platform.OS
};

export const window = listen();

RCTDeviceEventEmitter.addListener('didUpdateDimensions', () => {
    Object.assign(WINDOW, Dimensions.get('window'));
    window();
});
