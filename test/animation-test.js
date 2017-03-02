import {testString, read, testTransform, test, json} from './support';
import {expect} from 'chai';
import source from '../src/source';
describe('animation', function () {
    it('should parse animation', function () {
        return testString(read('test/fixtures/animation.css'), {
            toJSON(f, css){
                
                expect(f).to.exist;
                return f;
            }
        });

    });

});