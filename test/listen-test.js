import listen from '../src/listen';
import {expect} from 'chai';

describe("listen", function () {

    it('should update property', function () {
        const fn1 = i => i + 1;
        const f = listen();
        const obj = {};
        const s1 = f.property(obj, 'stuff', fn1);
        f(2);
        expect(obj).to.eql({stuff:3});
        f(3);
        expect(obj).to.eql({stuff:4});
        s1();
        f(2);
        expect(obj).to.eql({stuff:4});

    });

    it('should listen', ()=> {
        let count = 0;
        const fn1 = (i)=>count = (count + 1), fn2 = (i)=>count = (count + (i * 2));
        const f = listen();
        const s1 = f.subscribe(fn1), s2 = f.subscribe(fn2);
        expect(count).to.eql(0);
        f(1);
        expect(count).to.eql(3);
        f(2);
        expect(count).to.eql(8);
        s1();
        s2();
        f(1);
        expect(count).to.eql(8);
        const s3 = f.subscribe(fn1);
        f(1);
        f(2);
        expect(count).to.eql(10);
        s3();
        f(1);
        expect(count).to.eql(10);

    });

    it('should listen not share state', ()=> {
        let c1 = 0, c2 = 0;
        const fn1 = (i)=>c1 = i, fn2 = (i)=>c2 = i;

        const f1 = listen(), f2 = listen();
        const s1 = f1.subscribe(fn1);
        const s2 = f2.subscribe(fn2);

        expect((f1(1), c1)).to.eql(1);
        expect((f2(1), c2)).to.eql(1);
        expect((s2(), f2(2), c1)).to.eql(1);
        expect((s1(), f1(2), c2)).to.eql(1);


    });
});