import Animation from '../animation/animation';
import {toMillis} from '../animation/utils';

const TIMING = {
    'duration': toMillis,
    'delay': toMillis
};
//(postfix, str, vendor, tag, config)
export default function (postfix, value, vendor, tag, config) {
    config.prefix == 'animations';
    if (postfix) {
        return {
            [postfix]: TIMING[postfix] ? TIMING[postfix](value) : value
        }
    } else if (value) {
        const anim = new Animation();
        anim.animation(value);
        const ret = anim.toJSON();
        return ret[0];
    }
}