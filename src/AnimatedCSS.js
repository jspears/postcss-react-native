import React, {
    Component,
    PropTypes,
} from 'react';

import  {
    Animated,
    Easing,
    Dimensions,
    StyleSheet,
} from 'react-native';

import {WINDOW} from './componentHelpers';

// These styles are not number based and thus needs to be interpolated
const INTERPOLATION_STYLE_PROPERTIES = [

    // View styles
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'shadowColor',
    // Text styles
    'color',
    'textDecorationColor'
];

const EASING_FUNCTIONS = {
    'linear': Easing.linear,
    'ease': Easing.ease,
    'ease-in': Easing.in(Easing.ease),
    'ease-out': Easing.out(Easing.ease),
    'ease-in-out': Easing.inOut(Easing.ease),
};


// Determine to what value the animation should tween to
function getAnimationTarget(iteration, animationDirection) {
    switch (animationDirection) {
        case 'reverse':
            return 0;
        case 'alternate':
            return (iteration % 2) ? 0 : 1;
        case 'alternate-reverse':
            return (iteration % 2) ? 1 : 0;
        case 'normal':
        default:
            return 1;
    }
}

// Like getAnimationTarget but opposite
function getAnimationOrigin(iteration, animationDirection) {
    return getAnimationTarget(iteration, animationDirection) ? 0 : 1;
}

const asc = (a, b)=>a - b;

const rangeCheck = ({inputRange, outputRange})=> {
    return (inputRange && outputRange && inputRange.length > 1 && outputRange.length > 1)
};

// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
export function createAnimatableComponent(component, keyframes, name) {
    const Animatable = Animated.createAnimatedComponent(component);
    return class AnimatableComponent extends Component {

        static displayName = `${name || component.displayName || component.name}AnimatableComponent`;

        static propTypes = {
            onAnimationBegin: PropTypes.func,
            onAnimationEnd: PropTypes.func,
            animation: PropTypes.arrayOf(PropTypes.object),
            transition: PropTypes.object

        };

        static defaultProps = {
            iterationCount: 1,
            onAnimationBegin() {
            },
            onAnimationEnd() {
            }
        };

        constructor(props) {
            super(props);
            this.state = this.createState(props);

        }

        createState(props) {
            const config = props.animation && props.animation[0];
            if (!config) {
                return {};
            }
            const state = {
                animationValue: new Animated.Value(getAnimationOrigin(0, config.animationDirection)),
                animationStyle: {},
                transitionStyle: {},
                transitionValues: {},
                currentTransitionValues: {}
            };
            return state;
        }


        setNativeProps(nativeProps) {
            if (this._root) {
                this._root.setNativeProps(nativeProps);
            }
        }

        componentDidMount() {
            if (!this.state) {
                this.setState(this.createState(this.props));
            }
            if (this.props.transition) {
                this.transitionTo(this.props.transition);
            } else {
                this.triggerAnimation(this.props);
            }
        }

        triggerAnimation(props) {
            const {animation, onAnimationBegin, onAnimationEnd} = props;
            const conf = animation && animation[0];
            if (!conf) return;
            const runAnimation = this.createAnimate(conf);
            const {animationDelay, animationName} = conf;
            if (animationName) {
                if (animationDelay) {
                    this.setState({animationName});
                    this._timer = setTimeout(() => {
                        onAnimationBegin();
                        this.setState({animationName: false}, () => runAnimation().then(onAnimationEnd));
                        this._timer = false;
                    }, animationDelay);
                    return;
                }
                /*  for (let i = LAYOUT_DEPENDENT_ANIMATIONS.length - 1; i >= 0; i--) {
                 if (animation.indexOf(LAYOUT_DEPENDENT_ANIMATIONS[i]) === 0) {
                 this.setState({animationName: name});
                 return;
                 }
                 }*/
                onAnimationBegin();
                runAnimation().then(onAnimationEnd);
            }
        }

        componentWillUnmount() {
            if (this._timer) {
                clearTimeout(this._timer);
            }
        }

        componentWillReceiveProps(props) {
            const {animation, transition, onAnimationBegin, onAnimationEnd} = props;

            if (transition) {
                this.transitionTo(transition);
            } else if (animation !== this.props.animation) {
                if (animation[0]) {
                    if (this.state.animationName) {
                        this.setState({animationName: animation[0].animationName});
                    } else {
                        this.triggerAnimation(props);
                    }
                } else {
                    this.stopAnimation();
                }
            }
        }

        _handleLayout(event) {
            const {onLayout} = this.props;
            if (!this.state) return;
            const {animationName} = this.state;

            this._layout = event.nativeEvent.layout;
            if (onLayout) {
                onLayout(event);
            }

            if (animationName && !this._timer) {
                this.setState({animationName: false}, () => {
                    this.triggerAnimation(this.props);
                });
            }
        }

        makeInteropolate(animationValue, keyframe) {
            const itop = Object.keys(keyframe).sort(asc).reduce((ret, keyframeKey, i)=> {

                const frame = keyframe[keyframeKey];
                const v = keyframeKey - 0;

                const range = v === 0 ? 0 : v / 100;

                Object.keys(frame).map(fk=> {
                    if (fk in frame) {
                        if (fk === 'transform') {
                            const c = ret[fk] || (ret[fk] = {});
                            for (const transform of frame[fk]) {
                                for (const transformKey of Object.keys(transform)) {
                                    const tc = c[transformKey] || (c[transformKey] = {
                                            inputRange: [],
                                            outputRange: []
                                        } );
                                    tc.inputRange.push(range);
                                    tc.outputRange.push(transform[transformKey]);
                                }
                            }
                        } else {
                            const c = ret[fk] || (ret[fk] = {inputRange: [], outputRange: []});
                            c.inputRange.push(range);
                            c.outputRange.push(frame[fk]);
                        }
                    }
                });
                return ret;
            }, {});
            return Object.keys(itop).reduce((ret, key)=> {
                const itk = itop[key];
                if (key === 'transform') {
                    Object.keys(itk).forEach((transformKey)=> {
                        if (rangeCheck(itk[transformKey])) {
                            const tr = ret[key] || (ret[key] = []);
                            tr.push({[transformKey]: animationValue.interpolate(itk[transformKey])})
                        }
                    });
                } else if (rangeCheck(itk)) {
                    ret[key] = animationValue.interpolate(itk);
                }
                return ret;
            }, {});
        }

        createAnimate(conf) {
            const mix = this._layout ? Object.assign({
                clientHeight: this._layout.height,
                clientWidth: this._layout.width
            }, WINDOW) : WINDOW;
            const kf = keyframes[conf.animationName](mix);
            const ref = Object.keys(kf).reduce((ret, key)=> {
                ret[key] = kf[key](mix).__style;
                return ret;
            }, {});
            return ()=> {
                return this.animate(conf, this.makeInteropolate(this.state.animationValue, ref));
            }
        }

        animate(conf, animationStyle) {
            return new Promise(resolve => {
                this.setState({animationStyle}, () => {
                    this._startAnimation(conf, 0, resolve);
                });
            });
        }

        stopAnimation() {
            this.setState({
                animationName: false,
                animationStyle: {},
            });
            this.state.animationValue.stopAnimation();
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = false;
            }
        }

        _startAnimation(conf, currentIteration = 0, callback) {
            let {animationDirection='normal', animationDuration=1000, animationDelay=0, animationIterationCount=1, animationTimingFunction='ease-in-out'} = conf;
            const {animationValue} = this.state;
            const fromValue = getAnimationOrigin(currentIteration, animationDirection);
            const toValue = getAnimationTarget(currentIteration, animationDirection);
            animationValue.setValue(fromValue);

            // This is on the way back reverse
            if ((
                    (animationDirection === 'reverse') ||
                    (animationDirection === 'alternate' && !toValue) ||
                    (animationDirection === 'alternate-reverse' && !toValue)
                ) && animationTimingFunction.match(/^ease\-(in|out)$/)) {
                if (animationTimingFunction.indexOf('-in') !== -1) {
                    animationTimingFunction = animationTimingFunction.replace('-in', '-out');
                } else {
                    animationTimingFunction = animationTimingFunction.replace('-out', '-in');
                }
            }
            Animated.timing(animationValue, {
                toValue: toValue,
                easing: EASING_FUNCTIONS[animationTimingFunction],
                isInteraction: !animationIterationCount,
                duration: animationDuration,
            }).start(endState => {
                currentIteration++;
                if (endState.finished && !this.props.transition && (animationIterationCount === 'infinite' || currentIteration < animationIterationCount)) {
                    this._startAnimation(conf, currentIteration, callback);
                } else if (callback) {
                    callback(endState);
                }
            });
        }


        transitionTo(transit) {
            const {transitionStyle, transitionValues} = this.state;

            let doTransition = false;

            Object.keys(transit).forEach(property => {
                if (transitionStyle && transitionValues && INTERPOLATION_STYLE_PROPERTIES.indexOf(property) === -1 && transitionStyle[property] && transitionStyle[property] === transitionValues[property]) {
                    return this._transitionToValue(transitionValues[property], transit[property]);
                } else {
                    doTransition = true;
                }
            });

            if (doTransition) {
                this.transition(transit);
            }
        }

        transition(transit) {
            const {transitionValues={}, currentTransitionValues={}, transitionStyle={}} = this.state;
            Object.keys(transit).forEach(property => {
                const fromValue = transit[property].from;
                const toValue = transit[property].to;
                const transitionValue = transitionValues[property] || ( transitionValues[property] = new Animated.Value(0));
                transitionStyle[property] = transitionValue;
                if (property == 'transform') {
                    transitionValue.setValue(0);
                    transitionStyle.transform = fromValue.reduce((r, fv, i)=> {
                        const tv = toValue[i];
                        Object.keys(fv).forEach(transformKey => {
                            r.push({
                                [transformKey]: transitionValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [fv[transformKey], tv[transformKey]]
                                })
                            });
                        });
                        return r;
                    }, []);
                    currentTransitionValues[property] = toValue;
//                    toValues[property] = 1;
                } else if (INTERPOLATION_STYLE_PROPERTIES.includes(property)) {
                    transitionValue.setValue(0);
                    transitionStyle[property] = transitionValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [fromValue, toValue]
                    });
                } else {
                    transitionValue.setValue(fromValue);
                }
            });

            this.setState({
                transitionValues,
                transitionStyle,
                currentTransitionValues
            }, this._transitionToValues.bind(this, transit));
        }

        _transitionToValues(transit) {
            const {transitionValues={}} = this.state;
            Object.keys(transit).forEach(property => {
                this._transitionToValue(transitionValues[property], transit[property]);
            });
        }

        _transitionToValue(transitionValue, {toValue = 1, duration = 1000, timingFunction = 'ease-in-out'}) {
            Animated.timing(transitionValue, {
                toValue,
                duration,
                easing: EASING_FUNCTIONS[timingFunction]
            }).start();
        }

        render() {
            const {style, children, onLayout, animation, animationDuration, animationDelay, transition, ...props} = this.props;
            if (animation && transition) {
                throw new Error('You cannot combine animation and transition props');
            }

            return (
                <Animatable
                    {...props}
                    ref={element => this._root = element}
                    onLayout={event => this._handleLayout(event)}
                    style={[
                        style,
                        this.state.animationStyle,
                        this.state.transitionStyle
                    ]}>{children}</Animatable>
            );
        }
    };
}
/*

 export const View = createAnimatableComponent(ReactNative.View);
 export const Text = createAnimatableComponent(ReactNative.Text);
 export const Image = createAnimatableComponent(ReactNative.Image);
 export default View;*/
