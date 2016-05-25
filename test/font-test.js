"use strict";

import font from '../src/font';
import {expect} from 'chai';

describe('font', function () {

    const testFont = (decl, eql, fn = it)=>it(`should ${decl}`, ()=>expect(font(...decl), `:"${decl}"`).to.eql(eql));

    testFont(['', '2em "Open Sans", sans-serif'], {
        "family": [
            "Open Sans",
            "sans-serif"
        ],
        "size": "2em"
    });

    testFont(['size', '2em'], {
        "size": "2em"
    });
    testFont(['family', '"Open Sans", sans-serif'], {
        "family": "\"Open Sans\", sans-serif"
    });
});