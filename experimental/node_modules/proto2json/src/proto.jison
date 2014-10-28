// Google Protocol Buffers .proto files FLEX grammar
// Based on https://groups.google.com/forum/#!topic/protobuf/HMz8YkzWEto

%lex

rule  ("required"|"optional"|"repeated")

name           ([A-Za-z_][A-Za-z_0-9]*)
name_with_dots ([A-Za-z_][A-Za-z_0-9\-\.]+)

dec    ([1-9][0-9]*)
hex    (0[xX][A-Fa-f0-9]+)
oct    (0[0-7]+)
float  (\d+(\.\d+)?([Ee][\+-]?\d+)?)
bool   ("true"|"false")

quote         (['"])
hex_escape    (\\[Xx][A-Fa-f0-9]{1,2})
oct_escape    (\\0?[0-7]{1,3})
char_escape   (\\[abfnrtv\\/'"])
non_escaped   ([^\0\n])

%{
parser.protobufCharUnescape = function (chr) {
  if (chr[0] !== "\\") {
    return chr;
  }

  chr = chr.substr(1);

  var quotes = {
    '"':  '"',
    '\'': '\''
  };

  if (quotes[chr]) {
    if (chr === parser.protobufCharUnescapeCurrentQuote) {
      return quotes[chr];
    } else {
      return '\\' + quotes[chr];
    }
  }

  var escapee = {
    '\\': '\\',
    '/':  '/',
    b:    '\b',
    f:    '\f',
    n:    '\n',
    r:    '\r',
    t:    '\t',
    v:    '\v'
  };

  if (escapee[chr]) {
    return escapee[chr];
  }

  chr = String.fromCharCode(chr);

  return chr;
};
%}

%x INITIAL package import
%x message message_body message_field_type message_field_after_type
%x message_field_options message_field_option message_field_option_value
%x enum enum_body enum_field string_quoted_content option option_value

%%

// End of file match
<*><<EOF>>          return 'EOF';

// Import state
<INITIAL>"import"        this.begin('import'); return 'IMPORT';
<import>{name_with_dots} return 'NAME';
<import>{quote}          this.begin('string_quoted_content'); parser.protobufCharUnescapeCurrentQuote = this.match; return 'QUOTE';
<import>";"              this.popState(); return ';';

// Package state
<INITIAL>"package"        this.begin('package'); return 'PACKAGE';
<package>{name_with_dots} return 'NAME';
<package>";"              this.popState(); return ';';

// Message state
<INITIAL>"message"  this.begin('message'); return 'MESSAGE';

// Message state lexems
<message>{name}     return 'NAME';

// Message body state
<message>"{"                  this.begin('message_body'); return '{';
<message_body>"}"             this.popState(); this.popState(); return '}';

// Message body state lexems
<message_body>"enum"          this.begin('enum'); return 'ENUM';
<message_body>"option"        this.begin('option'); return 'OPTION';
<message_body>"message"       this.begin('message'); return 'MESSAGE';
<message_body>{rule}          this.begin('message_field_type'); return 'RULE';

// Message field state lexems
<message_field_type>{name_with_dots}  this.begin('message_field_after_type'); return 'TYPE';
<message_field_after_type>{name}      return 'NAME';
<message_field_after_type>"="         return '=';
<message_field_after_type>{dec}       return 'DEC';
<message_field_after_type>{hex}       return 'HEX';
<message_field_after_type>{oct}       return 'OCT';
<message_field_after_type>{float}     return 'FLOAT';
<message_field_after_type>{bool}      return 'BOOL';
<message_field_after_type>";"         this.popState(); this.popState(); return ';';

// Message field options state lexems
<message_field_after_type>"["            this.begin('message_field_options'); return '[';


// Message field options state lexems
<message_field_options>{name}          this.begin('message_field_option'); return 'NAME';
<message_field_option>"="              this.begin('message_field_option_value'); return '=';
<message_field_option_value>{float}    return 'FLOAT';
<message_field_option_value>{dec}      return 'DEC';
<message_field_option_value>{hex}      return 'HEX';
<message_field_option_value>{oct}      return 'OCT';
<message_field_option_value>{bool}     return 'BOOL';
<message_field_option_value>{name}     return 'NAME';
<message_field_option_value>{quote}    this.begin('string_quoted_content'); parser.protobufCharUnescapeCurrentQuote = this.match; return 'QUOTE';
<message_field_option_value>","        this.popState(); this.popState(); return ',';
<message_field_option_value>"]"        this.popState(); this.popState(); this.popState(); return ']';

// Quoted string state lexems
<string_quoted_content>\s+             return 'NON_ESCAPED';
<string_quoted_content>{hex_escape}    return 'HEX_ESCAPE';
<string_quoted_content>{oct_escape}    return 'OCT_ESCAPE';
<string_quoted_content>{char_escape}   return 'CHAR_ESCAPE';
<string_quoted_content>{quote}         if (parser.protobufCharUnescapeCurrentQuote === this.match) { this.popState(); return 'QUOTE'; } else { return 'NON_ESCAPED'; }
<string_quoted_content>{non_escaped}   return 'NON_ESCAPED';

// Enum state
<INITIAL>"enum"  this.begin('enum'); return 'ENUM';

// Enum state lexems
<enum>{name}     return 'NAME';

// Enum body state
<enum>"{"                  this.begin('enum_body'); return '{';
<enum_body>"}"             this.popState(); this.popState(); return '}';

// Enum body lexems | Enum field state
<enum_body>{name}          this.begin('enum_field'); return 'NAME';
<enum_field>";"            this.popState(); return ';';

// Enum field lexems
<enum_field>"="            return '=';
<enum_field>{dec}          return 'DEC';
<enum_field>{hex}          return 'HEX';
<enum_field>{oct}          return 'OCT';

// Option state
<INITIAL>"option"          this.begin('option'); return 'OPTION';
<option_value>";"          this.popState(); this.popState(); return ';';

// Option state lexems
<option>{name}             return 'NAME';
<option>"="                this.begin('option_value'); return '=';
<option_value>{float}      return 'FLOAT';
<option_value>{dec}        return 'DEC';
<option_value>{hex}        return 'HEX';
<option_value>{oct}        return 'OCT';
<option_value>{bool}       return 'BOOL';
<option_value>{name}       return 'NAME';
<option_value>{quote}      this.begin('string_quoted_content'); parser.protobufCharUnescapeCurrentQuote = this.match; return 'QUOTE';

<*>"/*"(.|\r|\n)*?"*/" %{
                        if (yytext.match(/\r|\n/) && parser.restricted) {
                            parser.restricted = false;
                            this.unput(yytext);
                            return ";";
                        }
                    %}

<*>"//".*($|\r|\n) %{
                            if (yytext.match(/\r|\n/) && parser.restricted) {
                                parser.restricted = false;
                                this.unput(yytext);
                                return ";";
                            }
                        %}

// Skip whitespaces in other states
<*>\s+  /* skip whitespaces */

// All other matches are invalid
<*>.    return 'INVALID'

/lex

%start file

%%

file
  : file_elements EOF { return $$; }
  ;

file_elements
  : element { $$ = [$1]; }
  | file_elements element { $$ = $1; $$.push($2); }
  ;

element
  : package
  | import
  | message
  | enum
  | option
  ;

package
  : PACKAGE NAME ';' %{
    $$ = {
      type: 'package',
      name: $2
    };
  }%
  ;

import
  : IMPORT constant ';' %{
    $$ = {
      type: 'import',
      name: $2
    };
  }%
  ;

message
  : MESSAGE NAME '{' message_body '}' %{
    $$ = {
      type: 'message',
      name: $2,
      enums: $4.enums,
      options: $4.options,
      messages: $4.messages,
      fields: $4.fields
    };
  }%
  ;

message_body
  : /* empty */ { $$ = {enums: [], options: [], messages: [], fields: []}; }
  | message_body enum { $$ = $1; $$.enums.push($2); }
  | message_body option { $$ = $1; $$.options.push($2); }
  | message_body message { $$ = $1; $$.messages.push($2); }
  | message_body message_field { $$ = $1; $$.fields.push($2); }
  ;

message_field
  : RULE TYPE NAME '=' int message_field_options ';' %{
    $$ = {
      rule: $1,
      type: $2,
      name: $3,
      tag: parseInt($5),
      options: $6
    };
  }%
  ;

int
  : DEC
  | HEX
  | OCT
  ;

message_field_options
  : /* empty */ { $$ = []; }
  | '[' message_field_options_list ']' { $$ = $2; }
  ;

message_field_options_list
  : message_field_option { $$ = [$1]; }
  | message_field_options_list ',' message_field_option { $$ = $1; $$.push($3); }
  ;

message_field_option
  : NAME '=' constant %{
    $$ = {
      type: 'option',
      name: $1,
      value: $3
    };
  }%
  ;

constant
  : FLOAT  { $$ = parseFloat($1); }
  | int    { $$ = parseInt($1); }
  | BOOL   { $$ = ($1 == 'true'); }
  | NAME   { $$ = $1; }
  | string { $$ = $1; }
  ;

string
  : QUOTE string_quoted QUOTE { $$ = $2; }
  ;

string_quoted
  : string_quoted_char { $$ = $1; }
  | string_quoted string_quoted_char { $$ = $1 + $2; }
  ;

string_quoted_char
  : HEX_ESCAPE   { $$ = parser.protobufCharUnescape($1); }
  | OCT_ESCAPE   { $$ = parser.protobufCharUnescape($1); }
  | CHAR_ESCAPE  { $$ = parser.protobufCharUnescape($1); }
  | NON_ESCAPED  { $$ = $1; }
  | NAME         { $$ = $1; } /* because it is valid char sequence and may be matched here*/
  ;

enum
  : ENUM NAME '{' enum_fields '}' %{
    $$ = {
      type: 'enum',
      name: $2,
      fields: $4
    };
  }%
  ;

enum_fields
  : enum_field { $$ = [$1]; }
  | enum_fields enum_field { $$ = $1; $$.push($2); }
  ;

enum_field
  : NAME '=' int ';' %{
    $$ = {};
    $$.name = $1;
    $$.tag  = parseInt($3);
  }%
  ;

option
  : OPTION NAME '=' constant ';'%{
    $$ = {
      type: 'option',
      name: $2,
      value: $4
    };
  }%
  ;
