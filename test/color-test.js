import color from 'parse-color';
import {expect} from 'chai';
import {testString} from './support';

describe('color', function(){

    it('should parse purple', ()=>{

        const r = color('purple');
        console.log('r',r);
    });
    it('should parse color decl', ()=>{
      return testString('.c { color:#fff }', {
           toJSON(o){
               expect(o.rules[0].css['c'][0].values).to.eql('rgba(255, 255, 255, 1)');
           }
       })
    });
});