(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

// Sure, I could do it all in `.defineMode()`, but then
// how would I dream of making it into a proper module
// someday?
CodeMirror.defineMode( "yamlmixed", function(){
  return CodeMirror.yamlmixedMode();
});

CodeMirror.yamlmixedMode = function() {

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
  // If doesn't have pipe, can have code on the same line.
  let noPipeRegex = /^\s*code\s*:\s+[^\|][\s\S]+$/;
  let pipeRegex   = /\|/;

  return {
    startState: function() {
      let state = {
        yamlState:        CodeMirror.startState( yamlMode ),
        activeMode:       yamlMode,
        activeState:      null,

        isValidCodeBlock: false,
        hasPipe:          null,
        hasComment:       null,
        numIndentationSpaces: null,
      };
      return state;
    },

    copyState: function( state ) {
      let newState = {
        yamlState:        CodeMirror.copyState( yamlMode, state.yamlState ),
        activeMode:       state.activeMode,
        activeState:      state.activeState,

        isValidCodeBlock: state.isValidCodeBlock,
        hasPipe:          state.hasPipe,
        hasComment:       state.hasComment,
        numIndentationSpaces: state.numIndentationSpaces,
      };
      return newState;
    },

    token: function( stream, state ) {

      // if yaml mode, search for start of python
      if ( state.activeMode.name === 'yaml' ) {

        // moves the parser forward
        let tokenType = state.activeMode.token( stream, state.yamlState );
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
            state.activeMode  = pythonMode;
            state.activeState = CodeMirror.startState( state.activeMode );
          }  // ends if shouldStartPython

        }  // ends stages of takeoff

        return tokenType;

      // if python mode, search for end of python
      } else if ( state.activeMode.name === 'python' ) {

        let stopPython = false;

        // Can't get `string.current` without getting the token
        let tokenType = state.activeMode.token( stream, state.activeState );

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
          state.activeMode        = yamlMode;
          state.activeState       = CodeMirror.startState( state.activeMode );
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
