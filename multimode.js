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
let closeRegex = null;

let config = {
  state: { indentation: 0 },
  configsObj: {
    starterName: 'yaml',
    // mode:           CodeMirror.getMode( {}, 'yaml' ),
    // delimeterStyle: null,
    yaml: {
      mode: CodeMirror.getMode( {}, 'yaml' ),
      open: {
        // Map?
        code: {  // needs key name?
        // python: {
          mode:               null,  // mode here or bottom level of nesting?
          tokenType:          'atom',
          wholeStringSearch:  null,
          tokenStringSearch:  function ( stream, state ) {
            let currString  = stream.current();
            let wasFound    = /\s*code/.test( currString );
            if ( wasFound ) indentation = stream.indentation();
            // or
            if ( wasFound ) closeRegex = new RegExp(`^\s{0,${indentation}}\S`);
            // or if we're doing this as a class
            if ( wasFound ) state.indentation = stream.indentation();
            return wasFound;
          },  // /\s*code/,
          nextTestToLoopThrough: {
            withPipe: {
              mode:               null,  // mode here or bottom level of nesting?
              tokenType:          null,
              wholeStringSearch:  /^\s*code\s*:\s+\|\s*$/,
              tokenStringSearch:  null,
              nextTestToLoopThrough: {
                // What about: ifNotFound: 'end'/'invalid', 'loop' (to the end of the line)
                // Or just always loop? I think you could always loop since the previous
                // searches would know what was coming up...? But what if there are two of
                // the same character? Like double brackets? Maybe coder makes two nested
                // of the same kind? Should this keep looking through multiple new lines?
                // Coder can handle that too, though, with nesting, though not
                // recursively...? Maybe /\n*/ would do that? Or "\n*"? Maybe a multiline
                // flag? How would _I_ be able to detect that in their regex? Is that even
                // needed?
                // Also, only loop for tokenStringSearch or tokenType?
                withPipe: {
                  delimeterStyle:     null,
                  mode:               CodeMirror.getMode( {}, 'python' ),  // mode here or bottom level of nesting?
                  tokenType:          'meta',
                  wholeStringSearch:  null,
                  tokenStringSearch:  /\s*\|\s*/,
                  nextTestToLoopThrough: null,
                },
              },  // ends .next
            },
            withPipeAndComment: {
              delimeterStyle:     null,
              mode:               null,  // mode here or bottom level of nesting?
              tokenType:          null,
              wholeStringSearch:  /^\s*code\s*:\s+\|\s*#.*$/,
              tokenStringSearch:  null,
              nextTestToLoopThrough: {
                withPipeAndComment: {
                  delimeterStyle:     null,
                  mode:               CodeMirror.getMode( {}, 'python' ),  // mode here or bottom level of nesting?
                  tokenType:          null,
                  wholeStringSearch:  '\n',
                  tokenStringSearch:  null,  // Allow '\n' here too?
                  nextTestToLoopThrough: null,
                },
              },  // ends .next
            },
            noPipe: {
              tokenType:          null,
              wholeStringSearch:  /^\s*code\s*:\s+[^\|][\s\S]+$/,
              tokenStringSearch:  null,
              nextTestToLoopThrough: {
                noPipe: {
                  delimeterStyle:     null,
                  mode:               CodeMirror.getMode( {}, 'python' ),  // mode here or bottom level of nesting?
                  tokenType:          'meta',
                  wholeStringSearch:  null,
                  tokenStringSearch:  /\s*:\s*/,
                  nextTestToLoopThrough: null,
                },
              },  // ends .next
            },  // ends `.noPipe` open sub-type
          }  // ends `.next` sub-type ('code' atom)
        },  // ends `.code` type
      },  // ends open
      close: {
        // // Needed? Or just go for the deepest nesting?
        // code: {
        //   openType: 'code',  // Needed?
        //   wholeStringSearch: /\*/,
        //   next: 
        // },  // ends close types
        withPipe: {
          openType:           'withPipe',  // Needed?
          // Can't use `this` in an object
          // wholeStringSearch:  new RegExp(`^\s{0,${this.state.indentation}}\S`),  // or
          // wholeStringSearch:  this.state.closeRegex,
          wholeStringSearch:  new RegExp(`^\s{0,${indentation}}\S`),  // or
          wholeStringSearch:  closeRegex,
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:       true,
          nextTestToLoopThrough: null,
        },
        withPipeAndComment: {
          openType:           'withPipeAndComment',  // Needed?
          wholeStringSearch:  new RegExp(`^\s{0,${indentation}}\S`),  // or
          wholeStringSearch:  closeRegex,
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:       true,
          nextTestToLoopThrough: null,
        },
        noPipe: {
          openType:           'noPipe',  // Needed?
          wholeStringSearch:  '\n',
          // Will require the module code to track how many chars to back up
          // to. Will it require going back multiple lines? If so, how?
          // How can the coder indicate what part of this process needs
          // to be backed up?
          shouldBackUp:       true,
          nextTestToLoopThrough: null,
        },
      },  // ends close
    },
  },  // ends yaml
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
  let pipeRegex      = /\|/;


  let configsObj    = config.configsObj,
      starterConfig = configsObj[ configsObj.starterName ],
      devState      = config.state;

  return {
    startState: function() {

      // if mode is string, make mode
      let startMode   = starterConfig.mode,
          startState  = CodeMirror.startState( startMode ),
          prevConfigs = [{
            mode:   startMode,
            state:  startState,
          }],
          outerConfig = prevConfigs[ 0 ];

      let state = {
        prevConfigs:  prevConfigs,
        outerConfig:  outerConfig,
        innerConfig:  { mode: pythonMode, state: null },
        activeConfig: outerConfig,
        outerMode:    startMode,
        outerState:   startState,
        innerMode:    pythonMode,  // temp
        innerState:   null,

        isValidCodeBlock: false,
        hasPipe:          null,
        hasComment:       null,
        numIndentationSpaces: null,
      };
      return state;
    },

    copyState: function( state ) {

      let newState = {
        prevConfigs:  state.prevConfigs,
        outerConfig:  state.outerConfig,
        innerConfig:  state.innerConfig,
        activeConfig: state.activeConfig,
        outerMode:    state.outerMode,
        outerState:   state.outerState,
        innerMode:    state.innerMode,
        innerState:   state.innerState,

        isValidCodeBlock: state.isValidCodeBlock,
        hasPipe:          state.hasPipe,
        hasComment:       state.hasComment,
        numIndentationSpaces: state.numIndentationSpaces,
      };

      let mostRecent   = newState.prevConfigs[ newState.prevConfigs.length - 1 ];
      mostRecent.state = CodeMirror.copyState( mostRecent.mode, mostRecent.state );

      return newState;
    },

    token: function( stream, state ) {

      let outerConfig = state.outerConfig;
      let outerMode   = outerConfig.mode;
      let activeMode  = state.activeConfig.mode

      // if yaml mode, search for start of python
      if ( activeMode.name === outerMode.name ) {

        // moves the parser forward
        let tokenType = activeMode.token( stream, state.prevConfigs[ 0 ].state );
        let tokenStr  = stream.current();

        let tokenIsAtom = atomTokenRegex.test( tokenType );
        let tokenIsMeta = metaTokenRegex.test( tokenType );

        // if atom is 'code' with possible whitespace before it
        if ( tokenIsAtom && codeDefinitionRegex.test( tokenStr ) ) {

          let wholeLineStr  = stream.string;

          // Do these need to be lazy
          // Test if valid code block declaration and remember if has pipe or not
          if ( withPipeRegex.test( wholeLineStr )) {
            state.hasPipe          = true;
            state.hasComment       = false;
            state.isValidCodeBlock = true;
          } else if ( withPipeAndCommentRegex.test( wholeLineStr )) {
            state.hasPipe          = true;
            state.hasComment       = true;
            state.isValidCodeBlock = true;
          } else if ( noPipeRegex.test( wholeLineStr )) {
            state.hasPipe          = false;
            state.hasComment       = null;
            state.isValidCodeBlock = true;
          }

          // Remember num chars of indentation
          // Accounts for spaces vs. tabs (converts to spaces)
          if ( state.isValidCodeBlock ) state.numIndentationSpaces = stream.indentation();

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
            state.activeConfig.mode = pythonMode;
            state.activeConfig.state = CodeMirror.startState( state.activeConfig.mode );
          }  // ends if shouldStartPython

        }  // ends stages of takeoff

        return tokenType;

      // if python mode, search for end of python
      } else if ( activeMode.name === state.innerMode.name ) {

        let stopPython = false;

        // Can't get `string.current` without getting the token
        let tokenType = activeMode.token( stream, state.activeConfig.state );

        // Any new line after a pipe that isn't indented enough isn't in
        // the code block anymore
        if ( state.hasPipe === true ) {
          let isIndentedEnough = stream.indentation() > state.numIndentationSpaces;
          if ( !isIndentedEnough ) stopPython = true;

        // Else, one-liner python should stop at the end of the line
        } else if ( state.hasPipe === false ) {
          if ( stream.eol()) stopPython = true;
          // Don't have to worry about alerting the police of wrong indendation on next line.
          // If next line is indented incorrectly, yaml won't like it either
        }

        if ( stopPython ) {
          state.activeConfig.mode = yamlMode;
          state.activeConfig.state = CodeMirror.startState( state.activeConfig.mode );
          // There was probably a way to do this without getting
          // the token, but string parsing is fragile
          stream.backUp( stream.current().length );  // Undo gobbling up this token.

          // Reset everything for the next go around.
          state.numIndentationSpaces = null;
          state.isValidCodeBlock  = false;
          state.hasPipe           = null;
          state.hasComment        = null;
        }

        // If stopping python, `tokenType` won't matter because
        // we already jumped back and the token will be re-processed anyway.
        tokenType += ' python';  // 'python' class == more examinable

        return tokenType;
      }  // ends which mode
    },  // Ends .token()
  };  // ends return
};

});
