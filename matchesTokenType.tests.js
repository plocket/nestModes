// WARNING
// This file is dead without some serious decisions about
// flatness and what it means.

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
let toEscape = /[.*+\-?^${}()|[\]\\]/g;
function escapeRegExp( string ) {
  return string.replace( toEscape, '\\$&' ); // $& means the whole matched string
}

const doesTestExist = function ( test ) {
  return test !== null && test !== undefined;
};


const matchesTokenType = function ( tokenTypes, tokenTypeMatcher ) {
  // What can `tokenTypes` be?
  // Just an array? Of strings? Of regexps? A string
  // of one or mutliple words separated by spaces?
  // A function?

  // If no tokenTypeMatcher then dev didn't define one,
  // so skip over it.
  let testExists = doesTestExist( tokenTypeMatcher );
  if ( !testExists ) {
    return true;
  }

  if ( typeof tokenTypeMatcher === 'function' ) {
    return tokenTypeMatcher( tokenTypes );
  }

  let matcherRegex = tokenTypeMatcher;
  if ( typeof tokenTypeMatcher === 'string' ) {
    // Could this really need escaping?
    matcherRegex = new RegExp( `\\b${ escapeRegExp( tokenTypeMatcher )}\\b` );
  }

  let passesTest = matcherRegex.test( tokenTypes );
  return passesTest;
};  // Ends matchesTokenType()

// Guide for future jest
let test_matchesTokenType = function () {
  // let expected  = [ true, false, true, false, true, false, true, false, true, true ];
  let expected  = [];
  let actual    = [];
  let test0 = [ 'meta error', 'meta', matchesTokenType( 'meta error', 'meta' )];
  expected.push( true ); actual.push([ expected[ 0 ] === test0[ 2 ], test0 ]);
  let test1 = [ 'atom error', 'meta', matchesTokenType( 'atom error', 'meta' )];
  expected.push( false ); actual.push([ expected[ 1 ] === test1[ 2 ], test1 ]);
  let test2 = [ 'meta error', /meta/, matchesTokenType( 'meta error', /meta/ )];
  expected.push( true ); actual.push([ expected[ 2 ] === test2[ 2 ], test2 ]);
  let test3 = [ 'atom error', /meta/, matchesTokenType( 'atom error', /meta/ )];
  expected.push( false ); actual.push([ expected[ 3 ] === test3[ 2 ], test3 ]);
  let test4 = [ 'meta error', /\bmeta\b/, matchesTokenType( 'meta error', /\bmeta\b/ )];
  expected.push( true ); actual.push([ expected[ 4 ] === test4[ 2 ], test4 ]);
  let test5 = [ 'atom error', /\bmeta\b/, matchesTokenType( 'atom error', /\bmeta\b/ )];
  expected.push( false ); actual.push([ expected[ 5 ] === test5[ 2 ], test5 ]);
  let funcTrue  = function(){ return true; };
  let test6 = [ 'atom error', 'funcTrue', matchesTokenType( 'atom error', funcTrue )];
  expected.push( true ); actual.push([ expected[ 6 ] === test6[ 2 ], test6 ]);
  let funcFalse = function(){ return false; };
  let test7 = [ 'atom error', 'funcFalse', matchesTokenType( 'atom error', funcFalse )];
  expected.push( false ); actual.push([ expected[ 7 ] === test7[ 2 ], test7 ]);
  let test8 = [ 'atom error', null, matchesTokenType( 'atom error', null )];
  expected.push( true ); actual.push([ expected[ 8 ] === test8[ 2 ], test8 ]);
  let test9 = [ 'atom error', 'undefined', matchesTokenType( 'atom error' )];
  expected.push( true ); actual.push([ expected[ 9 ] === test9[ 2 ], test9 ]);

  let allPassed = true;
  for ( let index = 0; index < actual.length; index++ ) {
    if ( !actual[ index ][ 0 ]) {
      allPassed = false;
      console.log( 'test_matchesTokenType test', index, 'failed. expected:', expected[ index ], 'but got:', actual[ index ] );
    }
  }

  return 'test_matchesTokenType allPassed:' + allPassed;
};
// console.log( test_matchesTokenType());


let chai = require('chai');
chai.should();

let tokenTypes = null;

describe('matchesTokenType', function(){
  describe('given the tokenTypes "meta error"', function(){

    beforeEach(function(){ tokenTypes = 'meta error' });

    // let test0 = [ 'meta error', 'meta', matchesTokenType( 'meta error', 'meta' )];
    it('and the matcher "meta" should return true', function(){  // Can't put in variable first...?
      matchesTokenType( tokenTypes, 'meta' ).should.equal( true );
    });

    // let test1 = [ 'atom error', 'meta', matchesTokenType( 'atom error', 'meta' )];
    // let test2 = [ 'meta error', /meta/, matchesTokenType( 'meta error', /meta/ )];
    // let test3 = [ 'atom error', /meta/, matchesTokenType( 'atom error', /meta/ )];
    // let test4 = [ 'meta error', /\bmeta\b/, matchesTokenType( 'meta error', /\bmeta\b/ )];
    // let test5 = [ 'atom error', /\bmeta\b/, matchesTokenType( 'atom error', /\bmeta\b/ )];
    // let funcTrue  = function(){ return true; };
    // let test6 = [ 'atom error', 'funcTrue', matchesTokenType( 'atom error', funcTrue )];
    // let funcFalse = function(){ return false; };
    // let test7 = [ 'atom error', 'funcFalse', matchesTokenType( 'atom error', funcFalse )];
    // let test8 = [ 'atom error', null, matchesTokenType( 'atom error', null )];
    // let test9 = [ 'atom error', 'undefined', matchesTokenType( 'atom error' )];

  });
});

