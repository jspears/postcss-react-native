var StyleSheet = require('react-native').StyleSheet;
var Dimensions = require('react-native').Dimensions;
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');


function update({height, width, scale}) {
    var vw = width / 100,
        vh = height / 100,
        vmin = Math.min(vw, vh),
        vmax = Math.max(vw, vh);


    var ret = {
        'stuff': {
            marginLeft: 10,
            marginRight: 10,
            marginTop: 5,
            marginBottom: 5,
            height: 50 * vh,
        }
    };
    var media = [{
        minDeviceWidth: 768,
        maxDeviceWidth: 1024,
        css: {
            stuff: {
                marginLeft: 20,
                marginRight: 20,
                marginTop: 10,
                marginBottom: 10,
                height: 100 * vh,
            }
        }
    }];

    function match(v) {
        if (v.width && width !== v.width) {
            return false;
        }
        if (v.height && height !== v.height) {
            return false;
        }
        if (v.minDeviceWidth && width < v.minDeviceWidth) {
            return false;
        }
        if (v.maxDeviceWidth && width > v.maxDeviceWidth) {
            return false;
        }
        if (v.minDeviceHeight && height < v.minDeviceHeight) {
            return false;
        }
        if (v.maxDeviceHeight && height > v.maxDeviceHeight) {
            return false;
        }
        return true;

    }

    var result = Object.assign.apply(Object, {}, media.filter(match).map(v=>v.css))
}

var _cb;
RCTDeviceEventEmitter.addListener('didUpdateDimensions', function (dimensions) {
    console.log('dimension update', dimensions);
    _cb == _cb(update(dimensions))
});

return function (cb) {
    _cb = cb;
    return update(Dimensions.get('window'))
};
