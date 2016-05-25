"use strict";
import nb from '../src/normalizeBorder';
import {expect} from 'chai';

/**
 border-width: as each of the properties of the shorthand:
 border-top-width: medium
 border-right-width: medium
 border-bottom-width: medium
 border-left-width: medium
 border-style: as each of the properties of the shorthand:
 border-top-style: none
 border-right-style: none
 border-bottom-style: none
 border-left-style: none
 border-color: as each of the properties of the shorthand:
 border-top-color: currentColor
 border-right-color: currentColor
 border-bottom-color: currentColor
 border-left-color: currentColor
 **/

describe('normalizeBorder', function () {
    const borderTest = (test, eql, fn = it)=>fn(`should normalize ${test}`, ()=>expect(nb(test), test).to.eql(eql));
    
    borderTest('border: 1px solid red', {
        top: {width: '1px', style: 'solid', color: 'red'},
        right: {width: '1px', style: 'solid', color: 'red'},
        bottom: {width: '1px', style: 'solid', color: 'red'},
        left: {width: '1px', style: 'solid', color: 'red'}

    });
    borderTest('border: medium', {
        top: {width: 'medium'},
        right: {width: 'medium'},
        bottom: {width: 'medium'},
        left: {width: 'medium'}

    });
    borderTest('border: medium thick', {
        top: {width: 'medium'},
        right: {width: 'thick'},
        bottom: {width: 'medium'},
        left: {width: 'thick'}

    });
    borderTest('border: 1px', {
        top: {width: '1px'},
        right: {width: '1px'},
        bottom: {width: '1px'},
        left: {width: '1px'}
    });

    borderTest('border: 1px 2px', {
        top: {width: '1px'},
        right: {width: '2px'},
        bottom: {width: '1px'},
        left: {width: '2px'}
    });
    borderTest('border: 1px 2px 3px', {
        top: {width: '1px'},
        right: {width: '2px'},
        bottom: {width: '3px'},
        left: {width: '2px'}
    });
    borderTest('border: 1px 2px 3px 4px', {
        top: {width: '1px'},
        right: {width: '2px'},
        bottom: {width: '3px'},
        left: {width: '4px'}
    });
    borderTest('border-left-radius: 2px 1px', {
        "top-left-radius": "2px",
        "bottom-left-radius": "1px"
    });
    borderTest('border-top-radius: 2px', {
        "top-left-radius": "2px",
        "top-right-radius": "2px"
    });
    borderTest('border-top-left-radius: 2px', {
        "top-left-radius": "2px"
    });
    borderTest('border-radius: 2px 3px 4px', {
        "top-left-radius": "2px",
        "top-right-radius": "3px",
        "bottom-right-radius": "4px",
        "bottom-left-radius": "3px"
    });
    borderTest('border-radius: 2px 3px', {
        "top-left-radius": "2px",
        "top-right-radius": "3px",
        "bottom-right-radius": "2px",
        "bottom-left-radius": "3px"
    });
    borderTest('border-radius: 2px', {
        "top-left-radius": "2px",
        "top-right-radius": "2px",
        "bottom-right-radius": "2px",
        "bottom-left-radius": "2px"
    });
    borderTest('border-top-width: 2px', {
        top: {
            width: '2px'
        }
    });
    borderTest('border-top: 2px solid red', {
        top: {
            width: '2px',
            color: 'red',
            style: 'solid'
        }
    });

    borderTest('border-top: 3px solid red', {
        top: {
            width: '3px',
            color: 'red',
            style: 'solid'
        }
    });
    borderTest('border-top: medium solid green', {
        top: {
            width: 'medium',
            color: 'green',
            style: 'solid'
        }
    });


});



