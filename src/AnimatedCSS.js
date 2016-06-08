import React, {Component} from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    View
} from 'react-native';

const EASING_FUNCTIONS = {
    'linear': Easing.linear,
    'ease': Easing.ease,
    'ease-in': Easing.in(Easing.ease),
    'ease-out': Easing.out(Easing.ease),
    'ease-in-out': Easing.inOut(Easing.ease)
};

const interpolate = (keyframe)=> {
    return Object.keys(keyframe).sort(asc).reduce((ret, keyframeKey, i)=> {
        const frame = keyframe[keyframeKey];
        const v = keyframeKey - 0;
        const range = v === 0 ? 0 : v / 100;
        Object.keys(frame).map(fk=> {
            if (fk in frame) {
                const c = ret[fk] || (ret[fk] = {extrapolate: 'clamp', inputRange: [], outputRange: []});
                c.inputRange.push(range);
                c.outputRange.push(frame[fk]);
            }
        });
        return ret;
    }, {});
};

const asc = (a, b)=>a - b;
export default class AnimatedCSS extends Component {
    constructor(props, ...args) {
        super(props, ...args);
        const {animate, keyframes} = props;
        const animatedStyle = this._animateStyle = {};
        console.log('props', props.animate, props.keyframes);


        this.triggerAnimation = Animated.parallel(props.animate.reduce((ret, c)=> {

            Object.keys(c).forEach((keyframeKey)=> {
                const config = c[keyframeKey];
                const keyframe = keyframes[keyframeKey];
                const interp = interpolate(keyframe);
                Object.keys(interp).forEach((ikey)=> {
                    const iterpValue = interp[ikey];
                    if (iterpValue.inputRange.length > 1) {
                        const value = animatedStyle[ikey] = new Animated.Value(iterpValue.outputRange.shift());
                        ret.push(Animated.timing(value, {
                            duration: config.duration,
                            toValue:iterpValue.outputRange.pop(),
                            easing: EASING_FUNCTIONS[config.timingFunction] || Easing.linear,
                            delay: config.delay
                        }));
                    } else {
                        console.log("only 1 interop for ", keyframeKey, ikey);
                    }
                })
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