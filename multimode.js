// multimode.js
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
          // mode here or bottom level of nesting?
          // mode:               null,
          innerConfigName:    null,
          // Have just a tester that's a function
          // that can test everything?
          tester:             null,
          // If they want multiple, they can do nested tests
          tokenTypeMatcher:   'atom',
          // Just use the key of the parent? Or will they need
          // to use the same type multiple times?
          closeKey:           null,
          wholeLineSearch:    null,
          tokenStringSearch:  function ( stream, tokenTypes, state ) {

            let regex       = /\s*code/;
            let currString  = stream.current();
            let wasFound    = regex.test( currString );
            if ( wasFound ) indentation = stream.indentation();
            // or if we're doing this statefully
            if ( wasFound ) state.indentation = stream.indentation();
            return regex;
            // return wasFound;
          },  // /\s*code/
          nextTestsToLoopThrough: [//{
            // withPipe: {
            {
              // mode:               null,
              innerConfigName:    null,
              tokenTypeMatcher:   null,
              closeKey:           null,
              wholeLineSearch:    /^\s*code\s*:\s+\|\s*$/,
              tokenStringSearch:  null,
              nextTestsToLoopThrough: [//{
                // What about: ifNotFound: 'end'/'invalid', 'loop' (to the end of the line)
                // Or just always loop? I think you could always loop since the previous
                // searches would know what was coming up...? But what if there are two of
                // the same character? Like double brackets? Maybe coder makes two nested
                // of the same kind? Should this keep looking through multiple new lines?
                // Coder can handle that too, though, with nesting, though not
                // recursively...? Maybe /\n*/ would do that? Or "\n*"? Maybe a multiline
                // flag? How would _I_ be able to detect that in their regex? Is that even
                // needed?
                // Also, only loop for tokenStringSearch or tokenTypeMatcher            // withPipe: {
                {
                  // mode:               CodeMirror.getMode( {}, 'python' ),
                  innerConfigName:    'python',
                  tokenTypeMatcher:   'meta',
                  closeKey:           'withPipe',
                  wholeLineSearch:    null,
                  tokenStringSearch:  /\s*\|\s*/,
                  nextTestsToLoopThrough: null,
                },
              ],//},  // ends .next
            },
            // withPipeAndComment: {
            {
              // mode:               null,
              innerConfigName:    null,
              tokenTypeMatcher:   null,
              closeKey:           null,
              wholeLineSearch:    /^\s*code\s*:\s+\|\s*#.*$/,
              tokenStringSearch:  null,
              nextTestsToLoopThrough: [//{
                // withPipeAndComment: {
                {
                  // mode:               CodeMirror.getMode( {}, 'python' ),
                  innerConfigName:    'python',
                  tokenTypeMatcher:   null,
                  closeKey:           'withPipeAndComment',
                  wholeLineSearch:    '\n',
                  // Allow '\n' this one too?
                  tokenStringSearch:  null,
                  nextTestsToLoopThrough: null,
                },
              ],//},  // ends .next
            },
            // noPipe: {
            {
              mode:               null,
              tokenTypeMatcher:   null,
              closeKey:           null,
              wholeLineSearch:    /^\s*code\s*:\s+[^\|][\s\S]+$/,
              tokenStringSearch:  null,
              nextTestsToLoopThrough: [//{
                // noPipe: {
                {
                  // mode:               CodeMirror.getMode( {}, 'python' ),
                  innerConfigName:    'python',
                  tokenTypeMatcher:   'meta',
                  closeKey:           'noPipe',
                  wholeLineSearch:    null,
                  tokenStringSearch:  /\s*:\s*/,
                  nextTestsToLoopThrough: null,
                },
              ],//},  // ends .nextTestsToLoopThrough
            },  // ends `.noPipe` openers sub-types
          ],//},  // ends `.nextTestsToLoopThrough` sub-types ('code' atom)
        },  // ends `.code` type
      ],//},  // ends openers
    },  // ends yaml
    python: {
      mode:    CodeMirror.getMode( {}, 'python' ),
      closers: {
        // // Needed? Or just go for the deepest nesting?
        // code: {
        //   openType: 'code',  // Needed?
        //   wholeLineSearch: /\*/,
        //   next: 
        // },  // ends closers types
        withPipe: {
          openType:        'withPipe',  // Needed?
          // Can't use `this` in an object
          wholeLineSearch: function ( stream, tokenTypes, state ) {
            return new RegExp(`^\\s{0,${indentation}}\\S`);
          },
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:    true,
          nextTestsToLoopThrough: null,
        },
        withPipeAndComment: {
          openType:        'withPipeAndComment',  // Needed?
          wholeLineSearch: function ( stream, tokenTypes, state ) {
            return new RegExp(`^\\s{0,${indentation}}\\S`);
          },
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:     true,
          nextTestsToLoopThrough: null,
        },
        noPipe: {
          openType:         'noPipe',  // Needed?
          wholeLineSearch:  "\n",
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:     true,
          nextTestsToLoopThrough: null,
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
CodeMirror.defineMode( "yamlmixed", function(){
  return CodeMirror.yamlmixedMode( config );
});


/*
  move towards:
  if activeConfig.openers
    flag if it needs to open

  if not needs to open
    if activeConfig.closers
      run through the closing stuff
*/
CodeMirror.yamlmixedMode = function( config ) {

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

        closeKey:         null,
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

        closeKey:         state.closeKey,
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
        let tokenTypes     = state.activeMode.token( stream, state.activeState );
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
            state.closeKey          = 'withPipe';
            state.hasPipe           = true;
            state.hasComment        = false;
            state.isValidCodeBlock  = true;
            indentation = stream.indentation();
          } else if ( withPipeAndCommentRegex.test( wholeLineStr )) {
            state.closeKey          = 'withPipeAndComment';
            state.hasPipe           = true;
            state.hasComment        = true;
            state.isValidCodeBlock  = true;
            indentation = stream.indentation();
          } else if ( noPipeRegex.test( wholeLineStr )) {
            state.closeKey          = 'noPipe';
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

        let closeInner  = false;

        // Can't get `string.current` without getting the token
        let tokenTypes   = state.activeMode.token( stream, state.activeState );
        let closeConfig = activeConfig.closers
        let closeTester = closeConfig[ state.closeKey ].wholeLineSearch;

        // Give them their state too
        if ( typeof closeTester === 'function' ) {
          closeTester = closeTester( stream, tokenTypes, config.state );
          // todo: allow them to run their own test instead of
          // returning regex or string? Check for bool?
        }

        // Turn strings into a regular expression with proper escaping.
        // Not sure about this. What if they've made an already escaped string?
        // Should this really be handled? But then why wouldn't they have just
        // made it regex? Leave it for the docs?
        // TODO: handle bool too?
        if ( typeof closeTester === 'string' ) {
          closeTester = escapeRegExp( closeTester );
          closeTester = new RegExp( closeTester );
        }
        
        // Now get a string. I know, I know. But this is the
        // easiest way I've found to test these various cases.
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
          if ( stream.eol() ) closeInner = true;
  
        } else {
          // Otherwise match the closing case normally
          let wholeLineStr  = stream.string;
          closeInner        = closeTester.test( wholeLineStr );
        }

        if ( closeInner ) {
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
          state.closeKey          = null;
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
    let matchedTokenTypes = didMatchTokenType( tokenTypes, oneOpener.tokenTypeMatcher );
    let matchedWholeLine  = true;
    let matchedCurrString = true;

    // If doesn't pass any tests, no inner mode found
    if ( !matchedTokenTypes
      && !matchedWholeLine
      && !matchedCurrString ) {
      return null;
    }

    // if ( oneOpener.tokenTypes ) {
    //   let tokenTypesMatcher = oneOpener.tokenTypes;
    //   let tokenTypeRegex   = tokenTypeMatcher;
    //   if ( typeof tokenTypeMatcher === 'string' ) {
    //     tokenTypeRegex = new Regexp(`\\b${tokenTypeMatcher}\\b`);
    //   }
    // }

    // todo: check for regex?
    if ( typeof oneOpener.innerConfigName === 'string' ) {
      return oneOpener.innerConfigName;

    } else if ( oneOpener.nextTestsToLoopThrough ) {
      innerConfigName = seekInnerMode({
        stream,
        state,
        tokenTypes,
        openers: oneOpener.nextTestsToLoopThrough,
      });
    }

    // if not null, break?
  }  // ends for all openers

  return innerConfigName;

};  // Ends seekInnerMode()

// // Assumes it is give the right input
// const stringToWordBreakRegex = function ( strOrNot ) {
//   if ( strOrNot && typeof strOrNot === 'string' ) {
//     // Not sure this needs escaping...
//     return new RegExp( `\\b${ escapeRegExp( strOrNot )}\\b` );
//   } else {
//     return strOrNot;
//   }
// };  // Ends stringToWordBreakRegex()

const didMatchTokenType = function ( tokenTypes, tokenTypeMatcher ) {
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
  console.log( passesTest, tokenTypes );
  return passesTest;
};  // Ends didMatchTokenType()

// const didMatchWholeLine = function ( tokenTypes, wholeLine, tests ) {

// };  // Ends didMatchWholeLine()

// const didMatchCurrString = function ( tokenTypes, currString, tests ) {

// };  // Ends didMatchCurrString()


const doesTestExist = function ( test ) {
  return test !== null && test !== undefined;
};

});
