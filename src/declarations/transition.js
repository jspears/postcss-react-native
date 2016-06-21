"use strict";

import {
    repeatAt,
    toNiceTimeUnits,
    replace,
    replaceMillis,
    isTiming,
    addAtEnd,
    toMillis,
    filter
} from '../animation/utils';

var list = require('postcss').list;

const PROPS = ['delay', 'duration', 'property', 'timing-function'];
const te = new RegExp(`^(?:transition)?(?:-(${PROPS.join('|')}))?\s*:\s*(.+?)$|^(.*)$`, 'i');
/**
 * An object|object factory that returns
 * a transition object.   Meant to be called in the
 * order that the properties in css are exposed to
 * accurately calculate timeouts and expressions.
 *
 * @param trans
 * @returns {Transition}
 * @constructor
 */
function Transition(...trans) {
    if (!(this instanceof Transition)) {
        return new Transition(...trans);
    }

    //holds the settings.
    let property = [];
    let duration = [];
    let delay = [];
    let timingFunction = [];
    let transitionTo;
    /**
     * Returns an array of transition css objects.
     * @returns {Array}
     */
    this.toJSON = ()=> {
        return property.map((transitionProperty, i)=> {
            var obj = {
                transitionProperty: transitionProperty,
                transitionDuration: toNiceTimeUnits(repeatAt(i, duration, 0))
            }, tf, d;

            if ((tf = repeatAt(i, timingFunction))) {
                obj.transitionTimingFunction = tf;
            }
            if ((d = repeatAt(i, delay))) {
                obj.transitionDelay = toNiceTimeUnits(d);
            }
            return obj;
        });
    };
    this.toCSS = (f)=> {
        return property.filter(filter(f)).map(function (property, i) {
            return {
                property,
                duration: repeatAt(i, duration, 0),
                'timing-function': repeatAt(i, timingFunction),
                delay: repeatAt(i, delay)
            };
        });
    };
    this.description = (f)=> {
        return property.filter(filter(f)).map(function (prop, i) {

            var def = [
                prop,
                toNiceTimeUnits(repeatAt(i, duration, 0))
            ];

            var tf = repeatAt(i, timingFunction);

            if (tf) {
                def.push(tf);
            }

            var d = repeatAt(i, delay);
            if (d != null && d != 0) {
                def.push(toNiceTimeUnits(d));
            }
            return def.join(' ');
        });
    };

    this.timeout = (f) => {
        var iter = f ? property.filter(filter(f)) : delay.length > duration.length ? delay : duration;
        return iter.length === 0 ? 0 : max(iter.map(function timeout$map(prop, i) {
            return repeatAt(i, duration, 0) + repeatAt(i, delay, 0);
        }))
    };

    this.toString = ()=> {
        return 'transition: ' + (this.description().join(', '));
    };
    /**
     * {
     *   type:'margin
     * 
     * }
     * @param toProps
     * @returns {*}
     */
    this.transitionTo = (toProps)=> {
        return Object.keys(toProps).reduce((ret, tprop)=> {

        });
    };

    this.transition = (_property, value) => {
        if (!(_property || value)) {
            return this;
        }
        if (_property) {
            this[_property](value);
            return this;
        }

        let transition;

        if (value) {

            const [,tProp, tPropValue, tValue ] = te.exec(value);
            if (tProp) {
                this[tProp](tPropValue);
                return this;
            } else {
                transition = tPropValue || tValue;
            }
        }
        //is this correct, chrome resets on transition delcaration.
        //reset
        duration.length = delay.length = timingFunction.length = property.length = 0;
        /*
         transition: opacity 1s ease 2s, height
         ----
         transition-delay 2s, 0s
         transition-duration 1s, 0s
         transition-property opacity, height
         transition-timing-function ease, ease
         */
        list.comma(transition).forEach(function (c) {
            var parts = list.space(c);
            if (parts.length === 0) return;
            addAtEnd(property, parts.shift());

            if (parts[0]) {
                duration.push(toMillis(parts.shift()));
                if (!parts[0]) {
                    delay.push(0);
                    timingFunction.push(Transition.defaultTimingFunction)
                }
            } else {
                duration.push(0);
                delay.push(0);
                timingFunction.push(Transition.defaultTimingFunction)
            }
            if (isTiming(parts[0])) {
                timingFunction.push(Transition.defaultTimingFunction);
                delay.push(toMillis(parts.shift()));
            } else if (parts[0]) {
                timingFunction.push(parts.shift());
                delay.push(parts[0] ? toMillis(parts.shift()) : 0);
            }

        });
        return this;
    };

    this.property = (props) => {
        if (arguments.length !== 0) {
            list.comma(props).forEach(addAtEnd.bind(utils, property));
            return this;
        }
        return property.concat();
    };

    this['timing-function'] = this.timingFunction = (tfs)=> {
        if (arguments.length !== 0) {
            replace(timingFunction, list.comma(tfs));
            return this;
        }
        return timingFunction.concat();
    };
    this.delay = (delays)=> {
        if (arguments.length !== 0) {
            replaceMillis(delay, delays);
            return this;
        }
        return delay.concat();
    };
    this.duration = (durations)=> {
        if (arguments.length !== 0) {
            replaceMillis(duration, durations);
            return this;
        }
        return duration.concat();
    };

    this.fromJSON = Transition.fromJSON;

    if (trans.length) {
        this.transition(...trans);
    }
}
Transition.defaultTimingFunction = 'ease';

Transition.fromJSON = function (obj) {
    if (obj == null) return;

    obj = Array.isArray(obj) ? obj : [obj];

    var transition = this instanceof Transition ? this : new Transition();

    obj.forEach(function (o) {
        Object.keys(o).forEach(function (key) {
            var f = key.replace(/^transition([A-Z])/, function (match, letter) {
                return letter.toLowerCase();
            });
            transition[f](o[key]);
        });
    });
    return transition;
};

export const transition = Transition;

export default function (postfix, value, str, container, config) {
    config.prefix = 'transition';
    const ret = Transition(postfix, value).toCSS();
    return ret;
}