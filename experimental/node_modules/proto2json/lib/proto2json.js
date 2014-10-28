/*!
 * Copyright (C) 2012 by Oleg Efimov
 *
 * See license text in LICENSE file
 */

var parser = require('./parser.js');

function normalizeMessage($$) {
  var result = {
    enums: {},
    options: {},
    messages: {},
    fields: {}
  };

  var _enum, _option, _field, ii, jj;

  // Loop over message enums
  for (ii in $$.enums) {
    if ($$.enums.hasOwnProperty(ii)) {
      _enum = $$.enums[ii];
      result.enums[_enum.name] = {};
      // Loop over enum fields
      for (jj in _enum.fields) {
        if (_enum.fields.hasOwnProperty(jj)) {
          result.enums[_enum.name][_enum.fields[jj].name] = _enum.fields[jj].tag;
        }
      }
    }
  }

  // Loop over message options
  for (ii in $$.options) {
    if ($$.options.hasOwnProperty(ii)) {
      _option = $$.options[ii];
      result.options[_option.name] = _option.value;
    }
  }

  // Loop over nested messages
  for (ii in $$.messages) {
    if ($$.messages.hasOwnProperty(ii)) {
      result.messages[$$.messages[ii].name] = normalizeMessage($$.messages[ii]);
    }
  }

  // Loop over message fields
  for (ii in $$.fields) {
    if ($$.fields.hasOwnProperty(ii)) {
      _field = $$.fields[ii];
      result.fields[_field.name] = {
        rule: _field.rule,
        type: _field.type,
        tag: _field.tag,
        options: {}
      };
      // Loop over field options
      for (jj in _field.options) {
        if (_field.options.hasOwnProperty(jj)) {
          _option = _field.options[jj];
          result.fields[_field.name].options[_option.name] = _option.value;
        }
      }
      // Remove empty options section
      if (Object.keys(result.fields[_field.name].options).length === 0) {
        delete result.fields[_field.name].options;
      }
    }
  }

  // Remove empty enums section
  if (Object.keys(result.enums).length === 0) {
    delete result.enums;
  }

  // Remove empty options section
  if (Object.keys(result.options).length === 0) {
    delete result.options;
  }

  // Remove empty messages section
  if (Object.keys(result.messages).length === 0) {
    delete result.messages;
  }

  return result;
}

function normalizeAll($$) {
  var result = {
    enums: {},
    options: {},
    messages: {},
    imports: []
  };

  var _field, _enum, ii, jj;

  // Loop over the collected elements
  for (ii in $$) {
    if ($$.hasOwnProperty(ii)) {
      if ($$[ii].type === 'package') {
        // Package element
        result['package'] = $$[ii].name;
      } else if ($$[ii].type === 'enum') {
        // Enum element
        _enum = {};
        for (jj in $$[ii].fields) {
          if ($$[ii].fields.hasOwnProperty(jj)) {
            _field = $$[ii].fields[jj];
            _enum[_field.name] = _field.tag;
          }
        }
        result.enums[$$[ii].name] = _enum;
      } else if ($$[ii].type === 'option') {
        result.options[$$[ii].name] = $$[ii].value;
      } else if ($$[ii].type === 'message') {
        result.messages[$$[ii].name] = normalizeMessage($$[ii]);
      } else if ($$[ii].type === 'import') {
        result.imports.push($$[ii].name);
      }
    }
  }

  // Remove empty enums section
  if (Object.keys(result.enums).length === 0) {
    delete result.enums;
  }

  // Remove empty options section
  if (Object.keys(result.options).length === 0) {
    delete result.options;
  }

  // Remove empty imports section
  if (result.imports.length === 0) {
    delete result.imports;
  }

  return result;
}

exports.parse = function (proto_source, callback) {
  var $$;
  try {
    $$ = parser.parse(proto_source);
  } catch (err) {
    if (typeof callback === 'function') {
      callback(err);
    }
    return err;
  }
  $$ = normalizeAll($$);
  if (typeof callback === 'function') {
    callback(null, $$);
  }
  return $$;
};
