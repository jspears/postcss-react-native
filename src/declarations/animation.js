import Animation from '../animation/animation';
export default function (postfix, value, str, tag) {
    if (!tag) {
        console.warn('can only animate type values');
        return;
    }

    (tag.animation || (tag.animation = new Animation()))[`animation${postfix ? '-' + postfix : ''}`](value);

    return
}