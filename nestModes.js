// multimode.js

// What does 'flat' mean, architecturally?
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
let toEscape = /[.*+\-?^${}()|[\]\\]/g;
function escapeRegExp( string ) {
  return string.replace( toEscape, '\\$&' ); // $& means the whole matched string
}

/*
1. Can take functions that will be given:
   1. the stream,
   1. the state,
   1. the token
   and will return
   1. Whether to back up or not
   1. Extra token types for delimiters
   1. Which new mode to start? The new mode itself?
   1. New stream, state, and token?
or
1. extra styles for delimeters
1. extra outer styles
1. extra inner styles
from outer mode, multiples of (in order of preference)
1. Prepping point
   1. Type of tag
   1. regex
   1. Starting point (same 2 items)
Maybe prepping points are nested until you reach
a starting point.
from inner mode
1. just regex to end? look for tags? that doesn't make sense
1. whether to back up? that doesn't make sense either
1. Need conditionals here, though, too
1. maybe they have their own state object?
*/

/*
Options for things for dev func to return/be:
1. string to match in whole line
    Then there has to be a `closerKey`
1. regex to test whole line
    Then there has to be a `closerKey`
1. bool
    Then there has to be a `closerKey`
1. array of test config objs to run on the next `.token()`
    Named tests? Like closers are named?
1. the `closerKey` itself...?
    Then can't return a string to match in line and
    that's not super intuitive.

How to indicate it's passed the test and needs the closerKey?
1. True and no further tests?
1. Return a closer key?
1. Have a closerKey prop?
1. A flag?

Can `closerKey` be `closerKeys`? Would they be:
1. All run on one go to see which one(s) matched?
    Could multiples match? How?
1. Run on consecutive `.token()` calls?

testerConfig
.tester:
1. > regex to match within whole line
1. > string to match within whole line
1. > function that returns a boolean
.nextTokenTests (or maybe openers):
1. > Array of testConfigs
1. > null
1. > function returning array of test configs?
    Useful if person wants to keep testing new lines themselves
    indefinitely
.innerConfigKey
1. > string
1. > null
1. regex?
1. config?
1. function returning others?
.closerKey
1. > string
1. > null
1. regex?
1. Actual closer
1. function returning others?

maybe add state.configState
*/

// How can this deal with checking things like indentation?
let indentation = 0; // or

let config = {
  state: { indentation: 0 },
  configsObj: {
    starterName: 'yaml',
    mode:           CodeMirror.getMode( {}, 'yaml' ),
    // delimeterStyle: null,
    yaml: {
      mode: CodeMirror.getMode( {}, 'yaml' ),
      // obj to be consistent
      openers: [ //{
        // Map?
        // needs key names?
        // code: {
        // python: {
        {
          innerConfigName:    null,
          // Have just a tester that's a function
          // that can test everything?
          // If they want multiple, they can do nested tests
          tokenTypeMatcher:   'atom',
          // Just use the key of the parent? Or will they need
          // to use the same type multiple times?
          closerKey:          null,
          tokenStringMatcher: function ({ stream, tokenTypes, state }) {
            let regex       = /\s*code/;
            let currString  = stream.current();
            let wasFound    = regex.test( currString );
            if ( wasFound ) indentation = stream.indentation();
            // or if we're doing this statefully
            if ( wasFound ) state.indentation = stream.indentation();
            return regex;
            // return wasFound;
          },  // /\s*code/
          // Add current string? Whole line? As separate arguments.
          tester: function ({ stream, tokenTypes, state }) {
            let regex       = /\s*code/;
            let currString  = stream.current();
            let wasFound    = regex.test( currString );
            if ( wasFound ) indentation = stream.indentation();
            // or if we're doing this statefully
            if ( wasFound ) state.indentation = stream.indentation();
            return wasFound;
            // return wasFound;
          },
          // These have to be run on each successive `.token()` call
          // They can't be looped in the same `.token()`
          nextTokenTests: [//{
            // withPipe: {
            {
              innerConfigName:    null,
              tokenTypeMatcher:   null,
              closerKey:          null,
              tester:             /^\s*code\s*:\s+\|\s*$/,
              tokenStringMatcher: null,
              nextTokenTests: [//{
                // What about: ifNotFound: 'end'/'invalid', 'loop' (to the end of the line)
                // Or just always loop? I think you could always loop since the previous
                // searches would know what was coming up...? But what if there are two of
                // the same character? Like double brackets? Maybe coder makes two nested
                // of the same kind? Should this keep looking through multiple new lines?
                // Coder can handle that too, though, with nesting, though not
                // recursively...? Maybe /\n*/ would do that? Or "\n*"? Maybe a multiline
                // flag? How would _I_ be able to detect that in their regex? Is that even
                // needed?
                // Also, only loop for tokenStringMatcher or tokenTypeMatcher            // withPipe: {
                {
                  innerConfigName:    'python',
                  tokenTypeMatcher:   'meta',
                  closerKey:          null,
                  tokenStringMatcher: /\s*\|\s*/,
                  tester: function ( stream, tokenType, state ) {
                    if ( /\bmeta\b/.test( tokenType )) {
                      if ( /\s*\:\s*/.stream.current ) return true;
                    }
                    return false;
                  },
                  nextTokenTests: [
                    {
                      innerConfigName:    'python',
                      tokenTypeMatcher:   'meta',
                      closerKey:          'withPipe',
                      tokenStringMatcher: /\s*\|\s*/,
                      tester: function ( stream, tokenType, state ) {
                        if ( /\bmeta\b/.test( tokenType )) {
                          if ( /\s*\|\s*/.stream.current ) return true;
                        }
                        return false;
                      },
                      nextTokenTests: null,
                    },
                  ],
                },
              ],//},  // ends .next
            },
            // withPipeAndComment: {
            {
              // mode:               null,
              innerConfigName:    null,
              tokenTypeMatcher:   null,
              closerKey:          null,
              tester:             /^\s*code\s*:\s+\|\s*#.*$/,
              tokenStringMatcher: null,
              nextTokenTests: [//{
                // withPipeAndComment: {
                {
                  innerConfigName:    'python',
                  tokenTypeMatcher:   null,
                  closerKey:          'withPipeAndComment',
                  tester:             '\n',
                  // Allow '\n' this one too?
                  tokenStringMatcher: null,
                  nextTokenTests: null,
                },
              ],//},  // ends .next
            },
            // noPipe: {
            {
              mode:               null,
              tokenTypeMatcher:   null,
              closerKey:          null,
              tester:             /^\s*code\s*:\s+[^\|][\s\S]+$/,
              tokenStringMatcher: null,
              nextTokenTests: [//{
                // noPipe: {
                {
                  innerConfigName:    'python',
                  tokenTypeMatcher:   'meta',
                  closerKey:          'noPipe',
                  tokenStringMatcher: /\s*:\s*/,
                  tester: function ( stream, tokenType, state ) {
                    if ( /\bmeta\b/.test( tokenType )) {
                      if ( /\s*:\s*/.test( stream.current )) return true;
                    }
                    return false;
                  }, 
                  nextTokenTests: null,
                },
              ],//},  // ends .nextTokenTests
            },  // ends `.noPipe` openers sub-types
          ],//},  // ends `.nextTokenTests` sub-types ('code' atom)
        },  // ends `.code` type
      ],//},  // ends openers
    },  // ends yaml
    python: {
      mode:    CodeMirror.getMode( {}, 'python' ),
      // Need to be able to have nested closers?
      closers: {
        // // Needed? Or just go for the deepest nesting?
        // code: {
        //   openType: 'code',  // Needed?
        //   wholeLineMatcher: /\*/,
        //   next: 
        // },  // ends closers types
        withPipe: {
          openType:        'withPipe',  // Needed?
          // Can't use `this` in an object
          tester: function ({ stream, tokenTypes, state }) {
            let regex     = new RegExp( `^\\s{0,${indentation}}\\S` );
            let didMatch  = regex.test( stream.string );
            return didMatch;
          },
          // tokenStringMatcher: null,
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:    true,
          nextTokenTests: null,
        },
        withPipeAndComment: {
          openType:        'withPipeAndComment',  // Needed?
          tester: function ({ stream, tokenTypes, state }) {
            let regex     = new RegExp( `^\\s{0,${indentation}}\\S` );
            let didMatch  = regex.test( stream.string );
            return didMatch;
          },
          // tokenStringMatcher: null,
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:     true,
          nextTokenTests: null,
        },
        noPipe: {
          openType:         'noPipe',  // Needed?
          tester:           '\n',
          // tokenStringMatcher: null,
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:     true,
          nextTokenTests: null,
        },
      },  // ends closers
    },  // ends python
  },  // ends configsObj
};  // ends config

// fyi
// /\n*/.test(/\n/)
// true
// /\n*/.test(/\*/)
// true
// /\n*/.test(/\./)
// true
// /\n*/.test(/\\./)
// true
// /[\n*]/.test(/\n/)
// false
// /\n|\*/.test(/\n/)
// false
// Yay!!!!!!!!
// /\\n|\*/.test(/\n/.toString())
// true


// Sure, I could do it all in `.defineMode()`, but then
// how would I dream of making it into a proper module
// someday?
// (keep in here with config for now)
CodeMirror.defineMode( "yamlmixed", function(){
  // let modeNester = new CodeMirror.ModeNester();
  // return modeNester.nestModes( config );
  return CodeMirror.nestModes( config );
});

// CodeMirror.ModeNester = class ModeNester {
//   nestModes ( config ) {
//     return CodeMirror.nestModes( config );
//   }
// };  // Ends ModeNester


/*
  move towards:
  if activeConfig.openers
    flag if it needs to open

  if not needs to open
    if activeConfig.closers
      run through the closing stuff
*/
CodeMirror.nestModes = function( config ) {

  let yamlMode    = CodeMirror.getMode( {}, 'yaml' );
  let pythonMode  = CodeMirror.getMode( {}, 'python' );

  // Avoid repeated expensive regex creation in loop
  let atomTokenRegex = /\batom\b/;
  let metaTokenRegex = /\bmeta\b/;
  // Do these need to be lazy?
  let codeDefinitionRegex = /\s*code/;
  // if has pipe, can't have any non-whitespace character after...
  let withPipeRegex = /^\s*code\s*:\s+\|\s*$/;
  // ...except a comment, which we need to deal with differently
  let withPipeAndCommentRegex = /^\s*code\s*:\s+\|\s*#.*$/;
  // This should work to catch both of the above but doesn't:
  // /^\s*code\s*:\s+\|\s*(?:(?=#).*|\s*)$/
  // We need them separate anyway, though.
  // This behaves differently in regex101 depending on what line
  // the the input is on:
  // ^\s*code\s*:\s+\|\s*(?:(?=#).*|(?![^#])\s*)$
  // Move the third line to the bottom:
  // code: |  # The below should appear with python syntax
  // code: |  #
  // code: |
  // code: | The below should appear with python syntax
  // code: |       
  // If doesn't have pipe, can have code on the same line.
  let noPipeRegex = /^\s*code\s*:\s+[^\|][\s\S]+$/;
  let pipeRegex   = /\|/;


  let configsObj    = config.configsObj,
      starterConfig = configsObj[ configsObj.starterName ],
      devState      = config.state;  // will matter later

  // q: if only 50 lines of code, how handle this?
  // plugin for editor: meta+d/meta+alt+g for all open files,
  // exposed files (in columns/panes), or for selected files.
  return {
    startState: function() {

      // if mode is string, make mode
      let startMode   = starterConfig.mode,
          startState  = CodeMirror.startState( startMode );
      let outerConfig = {
        ...starterConfig,
        state: startState,
      };

      let state = {
        prevConfigs: [],
        outerConfig:  outerConfig,
        activeConfig: outerConfig,
        activeMode:   startMode,
        activeState:  startState,
        tester:       null,

        closerKey:        null,
        isValidCodeBlock: false,
        hasPipe:          null,
        hasComment:       null,
      };
      return state;
    },

    copyState: function( state ) {

      // Not sure why this stuff is necessary, but multiplex.js
      // does it, and that was written by someone who knows
      let outer     = state.outerConfig;
      outer.state   = CodeMirror.copyState( outer.mode, outer.state );
      let active    = state.activeConfig;
      active.state  = CodeMirror.copyState( active.mode, active.state );

      let newState = {
        prevConfigs:  state.prevConfigs,
        outerConfig:  outer,
        activeConfig: active,
        activeMode:   state.activeMode,
        activeState:  CodeMirror.copyState( state.activeMode, state.activeState ),
        tester:       state.tester,

        closerKey:        state.closerKey,
        isValidCodeBlock: state.isValidCodeBlock,
        hasPipe:          state.hasPipe,
        hasComment:       state.hasComment,
      };

      // let mostRecent   = newState.prevConfigs[ newState.prevConfigs.length - 1 ];
      // mostRecent.state = CodeMirror.copyState( mostRecent.mode, mostRecent.state );

      return newState;
    },

    token: function( stream, state ) {

      let outerConfig   = state.outerConfig;
      let activeConfig  = state.activeConfig

      // Look for modes to open
      if ( activeConfig.openers ) {

        // moves the parser forward
        let tokenTypes    = state.activeMode.token( stream, state.activeState );
        let tokenStr      = stream.current();
        let wholeLineStr  = stream.string;

        let openers = activeConfig.openers;
        seekInnerMode({ stream, state, tokenTypes, openers });

        let tokenIsAtom = atomTokenRegex.test( tokenTypes );
        let tokenIsMeta = metaTokenRegex.test( tokenTypes );

        // if atom is 'code' with possible whitespace before it
        if ( tokenIsAtom && codeDefinitionRegex.test( tokenStr ) ) {

          let wholeLineStr  = stream.string;

          // Do these need to be lazy
          // Test if valid code block declaration and remember if has pipe or not
          if ( withPipeRegex.test( wholeLineStr )) {
            state.closerKey         = 'withPipe';
            state.hasPipe           = true;
            state.hasComment        = false;
            state.isValidCodeBlock  = true;
            indentation = stream.indentation();
          } else if ( withPipeAndCommentRegex.test( wholeLineStr )) {
            state.closerKey         = 'withPipeAndComment';
            state.hasPipe           = true;
            state.hasComment        = true;
            state.isValidCodeBlock  = true;
            indentation = stream.indentation();
          } else if ( noPipeRegex.test( wholeLineStr )) {
            state.closerKey         = 'noPipe';
            state.hasPipe           = false;
            state.hasComment        = null;
            state.isValidCodeBlock  = true;
            indentation = null;
          }

          // if it's a valid code block, we'll know to
          // start python after meta tokens pass by

        } else if ( state.isValidCodeBlock ) {

          let shouldStartPython = false;
          let isPipe            = pipeRegex.test( tokenStr );

          // If it has a comment, wait till we've reached the end of the line
          if ( state.hasComment && stream.eol() ) {
            shouldStartPython = true;
          // Either ':' or '|'
          } else if ( !state.hasComment && tokenIsMeta ) {
            // Single line code, start withthe first 'meta' (':')
            if ( !state.hasPipe ) shouldStartPython = true;
            // Skip past the ':' the first time around, but catch it on the '|'
            else if ( state.hasPipe && isPipe ) shouldStartPython = true;
          }  // ends wait for the starting pistol

          if ( shouldStartPython ) {
            // ---
            // Signifcant parts of multiplex.js (names rewritten)
            // if changing
            // state.activeConfigOrNull = oneCoderConfig;  // for us this is 'mode'
            // state.someUncustomizedCMStateOrNull = CodeMirror.startState(oneCoderConfig.mode, outerIndent);

            // always if in yaml (outside of this if statement)
            // var outerToken = outerMode.token(stream, state.outerState);
            // return outerToken;
            // ---
            state.activeMode    = pythonMode;
            state.activeState   = CodeMirror.startState( state.activeMode );
            state.activeConfig  = configsObj[ 'python' ];
          }  // ends if shouldStartPython

        }  // ends stages of takeoff

        return tokenTypes;

      // if python mode, search for end of python
      } else if ( activeConfig.closers ) {

        // Can't get `string.current` without getting the token
        let tokenTypes  = state.activeMode.token( stream, state.activeState );
        let closeConfig = activeConfig.closers
        let closeTester = closeConfig[ state.closerKey ].tester;

        let wasFound = false;
        // Give them their state too
        if ( typeof closeTester === 'function' ) {
          wasFound = closeTester({ stream, tokenTypes, state: config.state });
          // todo: allow them to run their own test instead of
          // returning regex or string? Check for bool?
        } else {
          
          // Turn strings into a regular expression with proper escaping.
          // Not sure about this. What if they've made an already escaped string?
          // Should this really be handled? But then why wouldn't they have just
          // made it regex? Leave it for the docs?
          // TODO: handle bool too?
          if ( typeof closeTester === 'string' ) {
            closeTester = escapeRegExp( closeTester );
            closeTester = new RegExp( closeTester );
          };

          // Now get a string. I know, I know. But this is the
          // easiest way I've wasFound to test these various cases.
          // Can be flipped back and forth between RegExp and
          // string with no problems. Weird. Anyway, have to turn
          // this to a string to test its new-line-ness.
          let testerStr = closeTester.toString();

          // Deal with the idea of new line searchers
          // considering codemirror evaluates one line at a time.
          // How to make sure there's nothing after the new line, etc?
          // i.e. ^\n or \n$ are fine, but if they do \nxyz then
          // there's more checking to do. todo.
          if ( /\\n/.test( testerStr ) || /\n/.test( testerStr )) {
            if ( stream.eol() ) wasFound = true;
          
          } else {
            // Otherwise match the closing case normally
            let wholeLineStr  = stream.string;
            wasFound          = closeTester.test( wholeLineStr );
          }
        }  // ends tester type

        if ( wasFound ) {
          state.activeMode        = outerConfig.mode;
          state.activeState       = CodeMirror.startState( state.activeMode );
          state.activeConfig  = configsObj[ 'yaml' ];
          // There was probably a way to do this without getting
          // the token, but string parsing is fragile
          stream.backUp( stream.current().length );  // Undo gobbling up this token.

          // Reset everything for the next go around.
          state.isValidCodeBlock  = false;
          state.hasPipe           = null;
          state.hasComment        = null;
          state.closerKey         = null;
        }

        // If stopping python, `tokenTypes` won't matter because
        // we already jumped back and the token will be re-processed anyway.
        tokenTypes += ' python';  // 'python' class == more examinable

        return tokenTypes;
      }  // ends which mode
    },  // Ends .token()
  };  // ends return
};

const seekInnerMode = function ({ stream, state, tokenTypes, openers }) {

  let innerConfigName = null;
  for ( let oneOpener of openers ) {

    // Have a `tester` that is just a function that can
    // handle everything itself?
    let matchedTokenTypes = matchesTokenType( tokenTypes, oneOpener.tokenTypeMatcher );
    let matchedWholeLine  = true;
    let matchedCurrString = true;

    // If doesn't pass any tests, no inner mode found
    if ( !matchedTokenTypes
      && !matchedWholeLine
      && !matchedCurrString ) {
      return null;
    }

    // todo: check for regex?
    if ( typeof oneOpener.innerConfigName === 'string' ) {
      return oneOpener.innerConfigName;

    } else if ( oneOpener.nextTokenTests ) {
      innerConfigName = seekInnerMode({
        stream,
        state,
        tokenTypes,
        openers: oneOpener.nextTokenTests,
      });
    }

    // if not null, break?
  }  // ends for all openers

  return innerConfigName;

};  // Ends seekInnerMode()

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

  // The other functions return regex right now...
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

// const didMatchWholeLine = function ( tokenTypes, wholeLine, tests ) {

// };  // Ends didMatchWholeLine()

// const didMatchCurrString = function ( tokenTypes, currString, tests ) {

// };  // Ends didMatchCurrString()

});
