import React, {Component} from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    View
} from 'react-native';


const up = (str)=> {
    if (str) {
        return `${str[0].toUpperCase()}${str.substring(1)}`
    }
    return '';
};
const isLikeObj = (v)=> {
    if (!v) return false;
    const tn = typeof v;
    switch (tn) {
        case 'string':
        case 'boolean':
        case 'number':
            return false;
    }
    if (Array.isArray(v)) {
        return false;
    }

    return true;

};

const unit = (v)=> {
    if (!v) return 0;
    return v.replace(/px/, '') - 0;

};

const normalDecls = (prop)=> {
    return prop.reduce((r, {type, values})=> {
        if (isLikeObj(values)) {
            Object.keys(values).forEach((key)=> {
                const val = values[key];
                if (isLikeObj(val)) {
                    Object.keys(val).forEach((kk)=> {
                        r[`${type}${up(key)}${up(kk)}`] = unit(val[kk]);
                    });
                } else {
                    r[`${type}${up(key)}`] = unit(val);
                }
            });
        } else {
            r[type] = unit(values);
        }
        return r;
    }, {});
};

export default class AnimatedCSS extends Component {
    constructor(props, ...args) {
        super(props, ...args);
        const {animate, keyframes} = props;
        this._animateStyle = {};
        console.log('props', props.animate, props.keyframes);
        this.triggerAnimation = Animated.parallel(props.animate.reduce((ret, c)=> {
            Object.keys(c).forEach((keyframeKey)=> {
                const config = c[keyframeKey];
                const keyframe = keyframes[keyframeKey];
                const start = keyframe["0"], end = keyframe["100"];
                if (start && end) {
                    Object.keys(start).forEach((key)=> {
                        if (key in end) {
                            const timing = this._animateStyle[key] = new Animated.Value(start[key]);
                            console.log('duration', config.duration);
                            ret.push(Animated.timing(timing, {
                                toValue: end[key],
                                duration: config.duration,
                                easing: Easing[config.timingFunction] || Easing.linear,
                            }));
                        }
                    });
                }
            });
            return ret;

        }, []));


    }

    componentDidMount() {
        this.triggerAnimation.start();
    }


    getStyle = () => {
        const ret = [].concat(this.props.style, this._animateStyle);


        return ret;
    };

    render() {
        return (
            <Animated.View style={this.getStyle()}>{this.props.children}</Animated.View>
        );
    }
}