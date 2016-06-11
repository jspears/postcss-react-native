import {list} from 'postcss';

const funcRe = /^([^(]*)\(([^)]*)\)$/;
const parseFunc = (val)=> {
    const [match, func, unit] = funcRe.exec(val);
    return {[func]: unit};
};
export default function transform(postfix, value, str, container, config){
    if (postfix == null) {
        const parts = list.space(value).map(parseFunc);
        return parts;
    }
    return {[postfix]: value};
}