import React, {Component} from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    View
} from 'react-native';

const interpolate = (keyframe)=> {
    return Object.keys(keyframe).sort(asc).reduce((ret, keyframeKey, i)=> {
        const frame = keyframe[keyframeKey];
        const v = keyframeKey - 0;
        const range = v === 0 ? 0 : v / 100;
        Object.keys(frame).map(fk=> {
            if (frame[fk]) {
                const c = ret[fk] || (ret[fk] = {inputRange: [], outputRange: []});
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
        this._animateStyle = {};
        console.log('props', props.animate, props.keyframes);


        this.triggerAnimation = Animated.parallel(props.animate.reduce((ret, c)=> {


            Object.keys(c).forEach((keyframeKey)=> {


                const config = c[keyframeKey];
                const keyframe = keyframes[keyframeKey];
              //  const interp = interpolate(keyframe);
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