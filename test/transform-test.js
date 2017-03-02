import {expect} from 'chai';
import {testString} from './support';

describe('transform', function () {

    it('should parse', ()=> {
        return testString(
            `.t1 {
    transform: translate(100px) rotate(20deg);
    transform-origin: 0 -250px;
}
`, {
                toJSON(o){
                    expect(o).to.exist;
                    return o;
                },
                toStyleSheet(...args){
                }
            })
    });
});