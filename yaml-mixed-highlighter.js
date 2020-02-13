(function(mod) {
  if (typeof exports == "object" && typeof module == "object") { // CommonJS
    mod(
      require("codemirror/yaml/yaml"),
      require("codemirror/python/python")
    );
  } else if (typeof define == "function" && define.amd) { // AMD
    define([
      "codemirror/yaml/yaml",
      "codemirror/python/python"
    ], mod);
  } else { // Plain browser env
    mod( CodeMirror );
  }
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("yamlmixed", function(){
    let outer = CodeMirror.getMode( {}, "yaml" );
    let inner = CodeMirror.getMode( {}, "python" );

    let innerOptions = {
      open: /^code: /,
      close: /\n[^\s]/,
      mode: inner,
      // delimStyle: 'delim',
      // innerStyle: 'inner',
    };

    return CodeMirror.yamlmixedMode( outer, innerOptions );
  });

  CodeMirror.defineMIME("text/x-yaml", "yamlmixed");
  CodeMirror.defineMIME("text/yaml", "yamlmixed");
});
