"use strict";

var max = Function.apply.bind(Math.max, Math);
var list = require('postcss').list;
var api = {
    EMPTY_OBJ: Object.freeze({}),
    selectors: ['enter', 'appear', 'leave'],
    classToRegexp(classes){
        return new RegExp('(\\.' + (classes.join('|\\.')) + ')');
    },
    /**
     * Default locals update function.
     * @param locals Object - The object to change.
     * @param prop - {string} - The name of the prop (usually the className).
     * @param propname -{string} - The property that is being insepected.
     * @param declartion -{*} - The css properyt declaration value.
     * @returns {*}
     */
    localUpdate(locals, prop, propname, declartion) {
        return locals['@' + api.camel(prop + '-' + propname)] = declartion;
    },
    /**
     * Basically Math.max, but it accepts an array of numbers.
     */
    max: max,
    /**
     * Given array of values, it finds the position
     * at the array repeating.
     *
     * @param pos
     * @param array
     * @returns {*}
     */

    addAtEnd(arr, value) {
        var idx = arr.indexOf(value);
        if (idx !== -1) {
            arr.splice(idx, 1);
        }
        arr.push(value);
        return arr;
    },
    /**
     * tries to convert from s/ms to seconds.
     * If the seconds representation is shorter than
     * return it.  Otherwise return milliseconds or
     * the original value whichever is shorter.
     *
     * It will also  drop insignificant zeros.
     *
     * @param oval
     * @returns {*}
     */
    toNiceTimeUnits(oval){
        var val = api.toMillis(oval);
        if (val === 0) {
            return val;
        }
        var sval = ('' + (val / 1000)).replace(/^0{1,}/, '') + 's';
        oval = '' + oval;
        val = '' + val;
        if (sval.length < oval.length){
            return val.length <= sval.length ? val : sval;
        }else{
            return val.length < oval.length?  val : oval;
        }

    },
    replaceMillis(to, value) {
        if (typeof value === 'number') {
            return api.replace(to, [value]);
        }
        return api.replace(to, list.comma(value).map(api.toMillis));
    },
    retFirst(val) {
        return val;
    },

    defReplace(arr, fn)
    {
        fn = fn || api.retFirst;
        return function (v) {
            if (arguments.length === 0) {
                return arr.concat();
            }
            api.replace(arr, list.comma(v).map(fn || retFirst));
            return this;
        }
    },
    trueFunc()
    {
        return true;
    }
    ,
    /**
     * replaces the first array with the contents of the second;
     * @param arr
     * @param arr2
     * @returns arr
     */
    replace(arr, arr2)
    {
        arr.length = 0;
        arr.splice.apply(arr, [0, 0].concat(arr2));
        return arr;
    }
    ,
    /**
     *
     * Pass a string it will return a function that compares the string to the first argument.
     * Pass a function and it will pass the value of the into function and return what the function returns.
     * Pass a regex and it will call test on the regex against the value.
     * Pass an array and it will loop through the array of string/function/regexp and return true on the first true.
     * Pass an object and it will match the val to the key and resolve the value against the filter rules above.
     *
     * @param func [string,regexp,object,function, array[string,regex,object, function]]
     * @returns {boolean}
     */
    filter(func)
    {
        if (func == null) {
            return api.trueFunc;
        }
        if (typeof func == 'function') {
            return func;
        }
        if (typeof func == 'string') {
            return function filter$string(val) {
                return val === func;
            }
        }
        if (func instanceof RegExp) {
            return function filter$regex(val) {
                return func.test(val);
            }
        }
        if (Array.isArray(func)) {
            func = func.map(api.filter);
            return function filter$array(val) {
                for (var i = 0, al = func.length; i < al; i++) {
                    if (func[i].apply(null, arguments)) {
                        return true;
                    }
                }
                return false;
            };
        }
        if (typeof func === 'object') {
            var keys = Object.keys(func), l = keys.length, values = keys.map(function (key) {
                return api.filter(func[key]);
            });
            return function filter$object(val) {
                for (var i = 0; i < l; i++) {
                    if (keys[i] === val && values[i].apply(null, arguments)) {
                        return true;
                    }
                }
                return false;
            }
        }
        throw new Error(`unknown filter type ${func}`);
    }
    ,
    camel(prop)
    {
        return prop == null ? prop : prop.replace(/-([\w])/g, function (match, r) {
            return r.toUpperCase();
        });
    }
    ,

    isTiming(v)
    {
        return v == null ? false : /^((\d*?(?:(\.\d+?))?)(?:(ms|s))?)$/.test(v);
    }
    ,
    repeatAt(pos, array, def)
    {
        const len = array.length;
        return len === 0 ? def : array[pos % len];
    }
    ,

    /**
     * Takes a duration/delay timing string and returns the value in milliseconds.
     * @param {string} val - Duration timing string, EX. 100, 100s, 1000ms, 1.2s
     * @returns {number}
     */
    toMillis(val)
    {
        if (val == null) {
            return 0;
        }
        if (typeof val === 'number') {
            return val;
        }
        var parts = /^(\d*(?:\.\d{1,})?)(ms|s)?$/.exec('' + val);

        if (!parts) return 0;
        if (!parts[1]) return 0;
        var v = parts[1];
        switch (parts[2]) {
            case 's':
                return v * 1000;
            default:
                return v * 1;
        }
    }

};

module.exports = api;