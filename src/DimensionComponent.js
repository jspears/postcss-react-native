import React, {Component, PropTypes} from 'react';
import {View, Dimensions, PixelRatio, Platform} from 'react-native';
import {calculate, asArray, splitClass, splitComma, toggle, WINDOW, window} from './componentHelpers';
import listen from './listen';
import {createAnimatableComponent} from './AnimatedCSS';

export default function create(Wrapped, dynaStyles, keyframes, name) {

    const _styles = dynaStyles();

    let Animated;

    return class DimensionComponent extends Component {
        static displayName = `${name}DimensionComponent`;

        static propTypes = {
            onResize: PropTypes.func,
            onAnimationBegin: PropTypes.func,
            onAnimationEnd: PropTypes.func,
            className: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
        };

        static defaultProps = {
            onResize(e){
                console.log('onResize', e);
            }
        };
        state = {config: WINDOW};

        constructor(props, ...args) {
            super(props, ...args);
            this.handleProps(props);
        }

        handleProps(props) {
            this._className = splitClass(props.className);
            this._styles = asArray(props.style);
        }

        componentWillReceiveProps(props) {
            this.handleProps(props);
        }

        componentWillMount() {
            this._resize = listen();
            this._listenWindow || (this._listenWindow = window.subscribe(this.recalc));
            //     this._listenChildResize = this._resize.subscribe(this.recalc, this.props.onResize);
            this.recalc(this.state.config);
        }

        componentWillUnmount() {
            this._listenChildResize && this._listenChildResize();
            this._listenWindow && this._listenWindow();
        }

        recalc = (config) => {
            config = config || this.state.config;
            this.setState(calculate(config, _styles, this._className, this._styles, splitComma(this.state.pseudos), this.state));
        };

        handlePress = (e)=> {
            this.setState(calculate(this.state.config, _styles, this._className, this._styles, toggle(this.state.pseudos, 'checked'), this.state));
        };

        render() {
            
            const {children, onResize, className, ...props} = this.props;

            const {animation, transition, config, pseudos, ...state} = this.state;
            let DynaC = Wrapped;
            if (animation || transition) {
                DynaC = (Animated || (Animated = createAnimatableComponent(Wrapped, keyframes)));
                props.animation = animation;
                props.transition = transition;
            }
            return <DynaC  {...state} onPress={this.handlePress} onLayout={this._resize} {...props}>
                {children}
            </DynaC>
        }

    }
}