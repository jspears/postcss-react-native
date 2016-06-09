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
// direction: in|out
// originOrDestination: up|down|left|right
// verticalValue: amplitude for up/down animations
// horizontalValue: amplitude for left/right animations
function getAnimationValueForDirection(direction, originOrDestination, verticalValue, horizontalValue) {
    const isVertical = originOrDestination === 'up' || originOrDestination === 'down';
    const modifier = (isVertical && direction === 'out' ? -1 : 1) * (originOrDestination === 'down' || originOrDestination === 'left' ? -1 : 1);
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
function getAnimationTarget(iteration, direction) {
    switch (direction) {
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
function getAnimationOrigin(iteration, direction) {
    return getAnimationTarget(iteration, direction) ? 0 : 1;
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

const makeInteropolate = (animationValue, keyframe)=> {
    const itop = Object.keys(keyframe).sort(asc).reduce((ret, keyframeKey, i)=> {

        const frame = keyframe[keyframeKey];
        const v = keyframeKey - 0;

        const range = v === 0 ? 0 : v / 100;

        Object.keys(frame).map(fk=> {
            if (fk in frame) {
                const c = ret[fk] || (ret[fk] = { inputRange: [], outputRange: []});
                c.inputRange.push(range);
                c.outputRange.push(frame[fk]);
            }
        });
        return ret;
    }, {});
    return Object.keys(itop).reduce((ret, key)=> {
        ret[key] = animationValue.interpolate(itop[key]);
        return ret;
    }, {});
};
// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
export function createAnimatableComponent(component) {
    const Animatable = Animated.createAnimatedComponent(component);
    return class AnimatableComponent extends Component {
        static propTypes = {
            onAnimationBegin: PropTypes.func,
            onAnimationEnd: PropTypes.func

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
            const config = this.props.animate[0];
            this.state = {
                animationValue: new Animated.Value(getAnimationOrigin(0, config.direction)),
                animationStyle: {},
                transitionStyle: {},
                transitionValues: {},
                currentTransitionValues: {},
            };

            if (props.transition) {
                this.state = {
                    ...this.state,
                    ...this.initializeTransitionState(props.transition),
                };
            }
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
            const {animate, onAnimationBegin, onAnimationEnd} = this.props;
            const conf = animate[0];
            const animation = this.createAnimate(conf);
            const {delay, duration, name} = conf;
            if (animation) {
                if (delay) {
                    this.setState({scheduledAnimation: name});
                    this._timer = setTimeout(() => {
                        onAnimationBegin();
                        this.setState({scheduledAnimation: false}, () => animation().then(onAnimationEnd));
                        this._timer = false;
                    }, delay);
                    return;
                }
                /*  for (let i = LAYOUT_DEPENDENT_ANIMATIONS.length - 1; i >= 0; i--) {
                 if (animation.indexOf(LAYOUT_DEPENDENT_ANIMATIONS[i]) === 0) {
                 this.setState({scheduledAnimation: name});
                 return;
                 }
                 }*/
                onAnimationBegin();
                animation().then(onAnimationEnd);
            }
        }

        componentWillUnmount() {
            if (this._timer) {
                clearTimeout(this._timer);
            }
        }

        componentWillReceiveProps(props) {
            const {animation, duration, easing, transition, onAnimationBegin, onAnimationEnd} = props;

            if (transition) {
                const values = getStyleValues(transition, props.style);
                this.transitionTo(values, duration, easing);
            } else if (animation !== this.props.animation) {
                if (animation) {
                    if (this.state.scheduledAnimation) {
                        this.setState({scheduledAnimation: animation});
                    } else {
                        onAnimationBegin();
                        this[animation](duration).then(onAnimationEnd);
                    }
                } else {
                    this.stopAnimation();
                }
            }
        }

        _handleLayout(event) {
            const {duration, onLayout, onAnimationBegin, onAnimationEnd} = this.props;
            const {scheduledAnimation} = this.state;

            this._layout = event.nativeEvent.layout;
            if (onLayout) {
                onLayout(event);
            }

            if (scheduledAnimation && !this._timer) {
                onAnimationBegin();
                this.setState({scheduledAnimation: false}, () => {
                    this[scheduledAnimation](duration).then(onAnimationEnd);
                });
            }
        }

        createAnimate(conf) {
            const {keyframes} = this.props;
            return ()=> {
                return this.animate(conf, makeInteropolate(this.state.animationValue, keyframes[conf.name]));
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
                scheduledAnimation: false,
                animationStyle: {},
            });
            this.state.animationValue.stopAnimation();
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = false;
            }
        }

        _startAnimation(conf, currentIteration = 0, callback) {
            let {direction='normal', duration=1000, delay=0, iterationCount=1, timingFunction='ease-in-out'} = conf;
            const {animationValue} = this.state;
            const fromValue = getAnimationOrigin(currentIteration, direction);
            const toValue = getAnimationTarget(currentIteration, direction);
            animationValue.setValue(fromValue);

            // This is on the way back reverse
            if ((
                    (direction === 'reverse') ||
                    (direction === 'alternate' && !toValue) ||
                    (direction === 'alternate-reverse' && !toValue)
                ) && timingFunction.match(/^ease\-(in|out)$/)) {
                if (timingFunction.indexOf('-in') !== -1) {
                    timingFunction = timingFunction.replace('-in', '-out');
                } else {
                    timingFunction = timingFunction.replace('-out', '-in');
                }
            }
            Animated.timing(animationValue, {
                toValue: toValue,
                easing: EASING_FUNCTIONS[timingFunction],
                isInteraction: !iterationCount,
                duration,
            }).start(endState => {
                currentIteration++;
                if (endState.finished &&! this.props.transition && (iterationCount === 'infinite' || currentIteration < iterationCount)) {
                    this._startAnimation(conf, currentIteration, callback);
                } else if (callback) {
                    callback(endState);
                }
            });
        }

        transition(fromValues, toValues, duration, easing) {
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
                this._transitionToValues(toValues, duration || this.props.duration, easing);
            });
        }

        transitionTo(toValues, duration, easing) {
            const {currentTransitionValues} = this.state;

            let transitions = {
                from: {},
                to: {},
            };

            Object.keys(toValues).forEach(property => {
                const toValue = toValues[property];

                if (INTERPOLATION_STYLE_PROPERTIES.indexOf(property) === -1 && this.state.transitionStyle[property] && this.state.transitionStyle[property] === this.state.transitionValues[property]) {
                    return this._transitionToValue(this.state.transitionValues[property], toValue, duration, easing);
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
                this.transition(transitions.from, transitions.to, duration, easing);
            }
        }

        _transitionToValues(toValues, duration, easing) {
            Object.keys(toValues).forEach(property => {
                const transitionValue = this.state.transitionValues[property];
                const toValue = toValues[property];
                this._transitionToValue(transitionValue, toValue, duration, easing);
            });
        }

        _transitionToValue(transitionValue, toValue, duration, easing) {
            if (duration || easing) {
                Animated.timing(transitionValue, {
                    toValue: toValue,
                    duration: duration || 1000,
                    easing: EASING_FUNCTIONS[easing || 'ease-in-out'],
                }).start();
            } else {
                Animated.spring(transitionValue, {
                    toValue: toValue,
                }).start();
            }
        }

        render() {
            const {style, children, onLayout, animation, duration, delay, transition, ...props} = this.props;
            if (animation && transition) {
                throw new Error('You cannot combine animation and transition props');
            }
            const {scheduledAnimation} = this.state;
            const hideStyle = (scheduledAnimation && scheduledAnimation.indexOf('In') !== -1 ? {opacity: 0} : false);

            return (
                <Animatable
                    {...props}
                    ref={element => this._root = element}
                    onLayout={event => this._handleLayout(event)}
                    style={[
            style,
            this.state.animationStyle,
            wrapStyleTransforms(this.state.transitionStyle),
            hideStyle,
          ]}
                >{children}</Animatable>
            );
        }
    };
}

export const View = createAnimatableComponent(ReactNative.View);
export const Text = createAnimatableComponent(ReactNative.Text);
export const Image = createAnimatableComponent(ReactNative.Image);
export default View;