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

let config = {
  state: { indentation: 0 },
  startName: 'yaml',
  yaml: null,
  python: {
    mode: CodeMirror.getMode( {}, 'python' ),
  }
};
window.nestedModesConfig = config;

config.yaml = {
  mode:           CodeMirror.getMode( {}, 'yaml' ),
  nextTokenTests:        [
    {
      innerConfigName: null,
      tester: function ({ stream, tokenTypes, state }) {
        if ( /\batom\b/.test( tokenTypes )) {
          let regex       = /\s*code/;
          let currString  = stream.current();
          let wasFound    = regex.test( currString );
          if ( wasFound ) state.indentation = stream.indentation();
          return wasFound;
        } else {
          return false;
        }
      },
      nextTokenTests: [
        {
          // With ': |' (pipe)
          innerConfigName:  null,
          tester:           function ({ stream, tokenType, state }) {
            if (  /^\s*code\s*:\s+\|\s*$/.test( stream.string )) {
              if ( /\bmeta\b/.test( tokenType )) {
                if ( /\s*\:\s*/.stream.current ) return true;
              }
            }
            return false;
          },
          nextTokenTests:   [
            {
              innerConfigName:    'python',
              tester: function ({ stream, tokenType, state }) {
                if ( /\bmeta\b/.test( tokenType )) {
                  if ( /\s*\|\s*/.stream.current ) return true;
                }
                return false;
              },
              // Start closers
              nextTokenTests: null,
            },
          ],  // ends next after '|'
        },  // ends with '|'
        {
          // With '|' and '#' (pipe and comment)
          innerConfigName:  null,
          tester:           function ({ stream, tokenType, state }) {
            if (  /^\s*code\s*:\s+\|\s*#.*$/.test( stream.string )) {
              if ( /\bmeta\b/.test( tokenType )) {
                if ( /\s*\:\s*/.stream.current ) return true;
              }
            }
            return false;
          },
          nextTokenTests:   [{
            innerConfigName:  'python',
            tester:           '\n',
            // Start closers
            nextTokenTests:   null,
          }],
        },  // ends with '|' and '#'
        {
          // Without pipe (same line)
          innerConfigName:  'python',
          tester:           function ({ stream, tokenType, state }) {
            if ( /^\s*code\s*:\s+[^\|][\s\S]+$/.test( stream.string )) {
              if ( /\bmeta\b/.test( tokenType )) {
                if ( /\s*:\s*/.test( stream.current )) return true;
              }
            }
            return false;
          },
          // Start closers
          nextTokenTests: null,
        },  // ends same line
      ],  // ends next after 'code'
    }
  ],
};





{
  constructor: { indentation: 0 },
  configsObj: {
    starterName: 'yaml',
    mode:           CodeMirror.getMode( {}, 'yaml' ),
    yaml: {
      mode: CodeMirror.getMode( {}, 'yaml' ),
      openers: [
        {
          innerConfigName:    null,
          // Add current string? Whole line? As separate arguments.
          tester: function ({ stream, tokenTypes, state }) {
            if ( /\batom\b/.test( tokenTypes )) {
              let regex       = /\s*code/;
              let currString  = stream.current();
              let wasFound    = regex.test( currString );
              if ( wasFound ) state.indentation = stream.indentation();
              return wasFound;
            } else {
              return false;
            }
          },
          // These have to be run on each successive `.token()` call
          // They can't be looped in the same `.token()`
          // nextTokenTests: [//{
          openers: [//{
            // withPipe: {
            {
              innerConfigName:    null,
              tester:             /^\s*code\s*:\s+\|\s*$/,
              // nextTokenTests: [//{
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
                  tester: function ( stream, tokenType, state ) {
                    if ( /\bmeta\b/.test( tokenType )) {
                      if ( /\s*\:\s*/.stream.current ) return true;
                    }
                    return false;
                  },
                  // nextTokenTests: [
                  openers: [
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
                      // nextTokenTests: null,
                      openers: null,
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
              // nextTokenTests: [//{
              openers: [//{
                // withPipeAndComment: {
                {
                  innerConfigName:    'python',
                  tokenTypeMatcher:   null,
                  closerKey:          'withPipeAndComment',
                  tester:             '\n',
                  // Allow '\n' this one too?
                  tokenStringMatcher: null,
                  // nextTokenTests: null,
                  openers: null,
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
              // nextTokenTests: [//{
              openers: [//{
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
                  // nextTokenTests: null,
                  openers: null,
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


});
