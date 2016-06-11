import React, {
    Component,
    PropTypes,
} from 'react';

import ReactNative, {
    Animated,
    Easing,
    Dimensions,
    StyleSheet,
} from 'react-native';

import {window, WINDOW} from './componentHelpers';

// Transform an object to an array the way react native wants it for transform styles
// { a: x, b: y } => [{ a: x }, { b: y }]
function createKeyedArray(obj) {
    return Object.keys(obj).map(key => {
        let keyed = {};
        keyed[key] = obj[key];
        return keyed;
    });
}

// Helper function to calculate transform values, args:
// animationDirection: in|out
// originOrDestination: up|down|left|right
// verticalValue: amplitude for up/down animations
// horizontalValue: amplitude for left/right animations
function getAnimationValueForanimationDirection(animationDirection, originOrDestination, verticalValue, horizontalValue) {
    const isVertical = originOrDestination === 'up' || originOrDestination === 'down';
    const modifier = (isVertical && animationDirection === 'out' ? -1 : 1) * (originOrDestination === 'down' || originOrDestination === 'left' ? -1 : 1);
    return modifier * (isVertical ? verticalValue : horizontalValue);
}

// Animations starting with these keywords use element dimensions
// thus, any animation needs to be deferred until the element is measured
const LAYOUT_DEPENDENT_ANIMATIONS = [
    'slide',
    'fade',
    'wobble',
    'lightSpeed',
];

// These styles need to be nested in a transform array
const TRANSFORM_STYLE_PROPERTIES = [
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
    'scale',
    'scaleX',
    'scaleY',
    'translateX',
    'translateY',
    'skewX',
    'skewY',
];

// These styles are not number based and thus needs to be interpolated
const INTERPOLATION_STYLE_PROPERTIES = [
    // Transform styles
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
    'skewX',
    'skewY',
    'transformMatrix',
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
    'textDecorationColor',
];

const EASING_FUNCTIONS = {
    'linear': Easing.linear,
    'ease': Easing.ease,
    'ease-in': Easing.in(Easing.ease),
    'ease-out': Easing.out(Easing.ease),
    'ease-in-out': Easing.inOut(Easing.ease),
};

// Transforms { translateX: 1 } to { transform: [{ translateX: 1 }]}
function wrapStyleTransforms(style) {
    let wrapped = {};
    Object.keys(style).forEach(key => {
        if (TRANSFORM_STYLE_PROPERTIES.indexOf(key) !== -1) {
            if (!wrapped.transform) {
                wrapped.transform = [];
            }
            wrapped.transform.push({
                [key]: style[key],
            });
        } else {
            wrapped[key] = style[key];
        }
    });
    return wrapped;
}

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

function getDefaultStyleValue(key) {
    if (key === 'backgroundColor') {
        return 'rgba(0,0,0,0)';
    }
    if (key === 'color' || key.indexOf('Color') !== -1) {
        return 'rgba(0,0,0,1)';
    }
    if (key.indexOf('rotate') !== -1 || key.indexOf('skew') !== -1) {
        return '0deg';
    }
    if (key === 'fontSize') {
        return 14;
    }
    if (key === 'opacity') {
        return 1;
    }
    return 0;
}

// Returns a flattened version of style with only `keys` values.
function getStyleValues(keys, style) {
    if (!StyleSheet.flatten) {
        throw new Error('StyleSheet.flatten not available, upgrade React Native or polyfill with StyleSheet.flatten = require(\'flattenStyle\');');
    }
    let values = {};
    let flatStyle = Object.assign({}, StyleSheet.flatten(style));
    if (flatStyle.transform) {
        flatStyle.transform.forEach(transform => {
            const key = Object.keys(transform)[0];
            flatStyle[key] = transform[key];
        });
        delete flatStyle.transform;
    }

    (typeof keys === 'string' ? [keys] : keys).forEach(key => {
        values[key] = (key in flatStyle ? flatStyle[key] : getDefaultStyleValue(key));
    });
    return values;
}
const asc = (a, b)=>a - b;
const rangeCheck = ({inputRange, outputRange})=> {
    return (inputRange && outputRange && inputRange.length > 1 && outputRange.length > 1)
};
// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
export function createAnimatableComponent(component, keyframes, name) {
    const Animatable = Animated.createAnimatedComponent(component);
    return class AnimatableComponent extends Component {

        static displayName = `${name}AnimatableComponent`;

        static propTypes = {
            onAnimationBegin: PropTypes.func,
            onAnimationEnd: PropTypes.func,
            animation: PropTypes.arrayOf(PropTypes.object),
            transition: PropTypes.arrayOf(PropTypes.object)

        };

        static defaultProps = {
            iterationCount: 1,
            onAnimationBegin() {
            },
            onAnimationEnd() {
            },
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
                animationValue: new Animated.Value(getAnimationOrigin(0, config.animationanimationDirection)),
                animationStyle: {},
                transitionStyle: {},
                transitionValues: {},
                currentTransitionValues: {},
            };

            if (props.transition) {
                return {
                    ...state,
                    ...this.initializeTransitionState(props.transition),
                };
            }
            return state;
        }

        initializeTransitionState(transitionKeys) {
            let transitionValues = {};
            let styleValues = {};

            const currentTransitionValues = getStyleValues(transitionKeys, this.props.style);
            Object.keys(currentTransitionValues).forEach(key => {
                const value = currentTransitionValues[key];
                if (INTERPOLATION_STYLE_PROPERTIES.indexOf(key) !== -1) {
                    transitionValues[key] = new Animated.Value(0);
                    styleValues[key] = value;
                } else {
                    transitionValues[key] = styleValues[key] = new Animated.Value(value);
                }
            });

            return {
                transitionStyle: styleValues,
                transitionValues: transitionValues,
                currentTransitionValues: currentTransitionValues,
            };
        }

        getTransitionState(keys) {
            const transitionKeys = (typeof transitionKeys === 'string' ? [keys] : keys);
            let {transitionValues, currentTransitionValues, transitionStyle} = this.state;
            const missingKeys = transitionKeys.filter(key => !this.state.transitionValues[key]);
            if (missingKeys.length) {
                const transitionState = this.initializeTransitionState(missingKeys);
                transitionValues = {...transitionValues, ...transitionState.transitionValues};
                currentTransitionValues = {...currentTransitionValues, ...transitionState.currentTransitionValues};
                transitionStyle = {...transitionStyle, ...transitionState.transitionStyle};
            }
            return {transitionValues, currentTransitionValues, transitionStyle};
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
            this.triggerAnimation(this.props);
        }

        triggerAnimation(props) {
            const {animation, onAnimationBegin, onAnimationEnd} = props;
            const conf = animation[0];
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
            const {animation, animationDuration, easing, transition, onAnimationBegin, onAnimationEnd} = props;

            if (transition) {
                const values = getStyleValues(transition, props.style);
                this.transitionTo(values, animationDuration, easing);
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
                        /**
                         *  transform: [{
     translateY: this.state.fadeAnim.interpolate({
       inputRange: [0, 1],
       outputRange: [150, 0]  // 0 : 150, 0.5 : 75, 1 : 0
     }),
   }],
                         */
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
                duration:animationDuration,
            }).start(endState => {
                currentIteration++;
                if (endState.finished && !this.props.transition && (animationIterationCount === 'infinite' || currentIteration < animationIterationCount)) {
                    this._startAnimation(conf, currentIteration, callback);
                } else if (callback) {
                    callback(endState);
                }
            });
        }

        transition(fromValues, toValues, animationDuration, easing) {
            const transitionKeys = Object.keys(toValues);
            let {transitionValues, currentTransitionValues, transitionStyle} = this.getTransitionState(transitionKeys);

            transitionKeys.forEach(property => {
                const fromValue = fromValues[property];
                const toValue = toValues[property];
                let transitionValue = transitionValues[property];
                if (!transitionValue) {
                    transitionValue = new Animated.Value(0);
                }
                transitionStyle[property] = transitionValue;

                if (INTERPOLATION_STYLE_PROPERTIES.indexOf(property) !== -1) {
                    transitionValue.setValue(0);
                    transitionStyle[property] = transitionValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [fromValue, toValue],
                    });
                    currentTransitionValues[property] = toValue;
                    toValues[property] = 1;
                } else {
                    transitionValue.setValue(fromValue);
                }
            });
            this.setState({transitionValues, transitionStyle, currentTransitionValues}, () => {
                this._transitionToValues(toValues, animationDuration || this.props.animationDuration, easing);
            });
        }

        transitionTo(toValues, animationDuration, easing) {
            const {currentTransitionValues} = this.state;

            let transitions = {
                from: {},
                to: {},
            };

            Object.keys(toValues).forEach(property => {
                const toValue = toValues[property];

                if (INTERPOLATION_STYLE_PROPERTIES.indexOf(property) === -1 && this.state.transitionStyle[property] && this.state.transitionStyle[property] === this.state.transitionValues[property]) {
                    return this._transitionToValue(this.state.transitionValues[property], toValue, animationDuration, easing);
                }

                let currentTransitionValue = currentTransitionValues[property];
                if (typeof currentTransitionValue === 'undefined' && this.props.style) {
                    const style = getStyleValues(property, this.props.style);
                    currentTransitionValue = style[property];
                }
                transitions.from[property] = currentTransitionValue;
                transitions.to[property] = toValue;
            });

            if (Object.keys(transitions.from).length) {
                this.transition(transitions.from, transitions.to, animationDuration, easing);
            }
        }

        _transitionToValues(toValues, animationDuration, easing) {
            Object.keys(toValues).forEach(property => {
                const transitionValue = this.state.transitionValues[property];
                const toValue = toValues[property];
                this._transitionToValue(transitionValue, toValue, animationDuration, easing);
            });
        }

        _transitionToValue(transitionValue, toValue, animationDuration, easing) {
            if (animationDuration || easing) {
                Animated.timing(transitionValue, {
                    toValue: toValue,
                    animationDuration: animationDuration || 1000,
                    easing: EASING_FUNCTIONS[easing || 'ease-in-out'],
                }).start();
            } else {
                Animated.spring(transitionValue, {
                    toValue: toValue,
                }).start();
            }
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
            wrapStyleTransforms(this.state.transitionStyle),
          ]}
                >{children}</Animatable>
            );
        }
    };
}
/*

 export const View = createAnimatableComponent(ReactNative.View);
 export const Text = createAnimatableComponent(ReactNative.Text);
 export const Image = createAnimatableComponent(ReactNative.Image);
 export default View;*/
