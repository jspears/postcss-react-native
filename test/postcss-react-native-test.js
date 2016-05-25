import fs from 'fs';
import postcss from 'postcss';
import {expect} from 'chai';
import FEATURES from '../src/features';
import plugin from '../src/index';

const test = function (name, toStyleSheet) {
    var input = read('test/fixtures/' + name + '.css');
    var output = read('test/fixtures/' + name + '.out.js');

    return postcss(plugin({toStyleSheet})).process(input, {from: name, to: name});
    //.then(result=> expect(result).css.to.eql(output));
};
const testString = function (input, output, opts) {
    return postcss(plugin(opts)).process(input).then(resp=>expect(resp.to.eql(output)));
};
//use for debugging;
const toJSON = (obj, {source:{input:{file='rules'}}})=> {
    console.log(`export const ${file.split('/').pop()} = ${JSON.stringify(obj, null, 2)}`);
    return obj;
};
var read = function (path) {
    return fs.readFileSync(path, 'utf-8');
};

describe('postcss-react-native', function () {


    /*
     it('simple', function () {
     test('simple');
     });

     */
    it('media query stuff for ios', function () {
        return test('media', (f, source)=> {
            const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'ios'});
            expect(css).to.eql({
                "stuff": {
                    "marginTop": 20,
                    "marginRight": 10,
                    "marginBottom": 5,
                    "marginLeft": 2,
                    "color": "yellow"
                },
                "other": {
                    "opacity": 0.5
                }
            });
        });
    });

    it('media query stuff for android', function () {
        return test('media', (f, source)=> {
            const css = f(FEATURES, {height: 1024, width: 768, scale: 1, vendor: 'android'});
            expect(css).to.eql({
                "stuff": {
                    "borderBottomWidth": 6.666666666666666,
                    "borderTopWidth": 3,
                    "marginTop": 20,
                    "marginRight": 10,
                    "marginBottom": 5,
                    "marginLeft": 2,
                    "color": "purble"
                },
                "other": {
                    "opacity": 0.5
                }
            });
        });
    });
});
