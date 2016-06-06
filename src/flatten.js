import {StyleSheet} from 'react-native';

export default function _flatten(flatten, css) {
    if (!flatten || flatten.length == 0) return css;

    const merged = flatten.concat(css).reduce((ret, style)=> {
        for (const key of Object.keys(style)) {
            (ret[key] || (ret[key] = [])).push(style[key]);
        }
        return ret;
    }, {});

    return Object.keys(merged).reduce((ret, key)=> {
        ret[key] = StyleSheet.flatten(merged[key]);
        return ret;
    }, {});

}