"use strict";

var list = require('postcss').list;
var pu = require('./utils');
var defReplace = pu.defReplace;

/**
 * An object|object factory that returns
 * a transition object.   Meant to be called in the
 * order that the properties in css are exposed to
 * accurately calculate timeouts and expressions.
 *
 * @param trans
 * @returns {Animation}
 * @constructor
 */


function toIntOrInfinite(v) {
    if (v == 'infinite') {
        return v;
    }
    return parseFloat(v);
}
function isIteration(v) {
    if (v == 'infinite') {
        return true;
    }
    return !isNaN(parseFloat(v));
}

function Animation(anim) {
    if (!(this instanceof Animation)) {
        return new Animation(anim);
    }
    //holds the settings.
    var property = [];
    var name = [];
    var duration = [];
    var delay = [];
    var timingFunction = [];
    var iterationCount = [];
    var fillMode = [];
    var playState = [];
    var direction = [];

    this.description = function description(filter) {
        return name.filter(pu.filter(filter)).map(function (prop, i) {
            //    duration | timing-function | delay | iteration-count | direction | fill-mode | play-state | name
            return [
                pu.toNiceTimeUnits(pu.repeatAt(i, duration, Animation.defaultDuration)),
                pu.repeatAt(i, timingFunction, Animation.defaultTimingFunction),
                pu.toNiceTimeUnits(pu.repeatAt(i, delay, Animation.defaultDelay)),
                pu.repeatAt(i, iterationCount, Animation.defaultIterationCount),
                pu.repeatAt(i, direction, Animation.defaultDirection),
                pu.repeatAt(i, fillMode, Animation.defaultFillMode),
                pu.repeatAt(i, playState, Animation.defaultPlayState),
                prop
            ].join(' ');
        });
    };

    this.timeout = function _timeout(filter) {
        var iter = filter ? name.filter(pu.filter(filter)) : delay.length > duration.length ? delay : duration;

        return iter.length === 0 ? 0 : pu.max(iter.map(function timeout$map(prop, i) {
            var ic = pu.repeatAt(i, iterationCount, Animation.defaultIterationCount);
            if (ic === 'infinite') {
                return 0;
            }
            var dur = pu.repeatAt(i, duration, Animation.defaultDuration);
            var del = pu.repeatAt(i, delay, Animation.defaultDelay);
            return (dur + del ) * ic;
        }))
    };

    this.toString = function () {
        return `animation: ${this.description().join(', ')}`;
    };

    this.animation = function _addAnimation(anim) {
        //is this correct, chrome resets on transition delcaration.
        //reset
        duration.length = delay.length = timingFunction.length = name.length = iterationCount.length = direction.length = fillMode.length = playState.length = 0;
        /*
         duration | timing-function | delay | iteration-count | direction | fill-mode | play-state | name
         animation: 3s        ease-in         | 1s    | 2               | reverse   | both      | paused     | slidein;
         animation: 3s linear 1s slidein;
         animation: 3s slidein;

         ----
         *  animation-duration: as specified
         *  animation-timing-function: as specified
         *  animation-delay: as specified
         *  animation-direction: as specified
         *  animation-iteration-count: as specified
         *  animation-fill-mode: as specified
         *  animation-play-state: as specified
         *  animation-name: as specified
         */
        list.comma(anim).forEach(function (c) {
            var parts = list.space(c);
            var _duration, _timingFunction, _delay, _iterationCount, _direction, _fillMode, _playState, _name;

            if (parts[0]) {
                _duration = pu.toMillis(parts.shift());
            }
            _name = parts.pop();
            if (parts[0]) {
                _timingFunction = parts.shift();
            } else {
                _timingFunction = Animation.defaultTimingFunction;
            }

            if (parts[0] && pu.isTiming(parts[0])) {
                _delay = pu.toMillis(parts.shift());
            } else {
                _delay = 0;
            }

            if (parts[0] && isIteration(parts[0])) {
                _iterationCount = toIntOrInfinite(parts.shift());
            } else {
                _iterationCount = 1;
            }
            if (parts[0]) {
                _direction = parts.shift();
            } else {
                _direction = Animation.defaultDirection;
            }
            if (parts[0]) {
                _fillMode = parts.shift();
            } else {
                _fillMode = Animation.defaultFillMode;
            }

            if (parts[0]) {
                _playState = parts.shift();
            } else {
                _playState = Animation.defaultPlayState;
            }

            duration.push(_duration);
            timingFunction.push(_timingFunction);
            delay.push(_delay);
            direction.push(_direction);
            iterationCount.push(_iterationCount);
            fillMode.push(_fillMode);
            playState.push(_playState);
            name.push(_name);

        });
        return this;
    };

    this['animation-name'] = this.name = defReplace(name);
    this['animation-duration'] = this.duration = defReplace(duration, pu.toMillis)
    this['animation-timing-function'] = this.timingFunction = defReplace(timingFunction);
    this['animation-delay'] = this.delay = defReplace(delay, pu.toMillis);
    this['animation-direction'] = this.direction = defReplace(direction, pu.toMillis);
    this['animation-iteration-count'] = this.iterationCount = defReplace(iterationCount, toIntOrInfinite);
    this['animation-fill-mode'] = this.fillMode = defReplace(fillMode);
    this['animation-play-state'] = this.playState = defReplace(playState);

    if (anim) {
        this.animation(anim);
    }
}
Animation.defaultDirection = 'normal';
Animation.defaultFillMode = 'none';
Animation.defaultPlayState = 'running';
Animation.defaultTimingFunction = 'ease';
Animation.defaultDelay = 0;
Animation.defaultDuration = 0;
Animation.defaultIterationCount = 1;
module.exports = Animation;