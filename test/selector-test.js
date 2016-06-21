import {expect} from 'chai';
import selector from '../src/selector';
const compare = (str, result)=> {
    expect(selector(str)).to.eql(result);
};
const tester = (...result)=> {
    return function () {
        compare( this.test.title.replace(/.*\"(.*)\"/, '$1'), result);
    }
};

describe('selector', function () {


    it('should parse  ".select, hello.more"', tester({'class': 'select'}, {'tag': 'hello', 'class': 'more'}));
    it('should parse  ".select, .more"', tester({'class': 'select'}, {'class': 'more'}));
    it('should parse  ".select"', tester({'class': 'select'}));
    it('should parse  ".select::before"', tester({'class': 'select', 'pseudo':'::before'}));
});