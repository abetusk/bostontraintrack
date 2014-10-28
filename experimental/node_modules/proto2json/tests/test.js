/*!
 * Copyright (C) 2012 by Oleg Efimov
 *
 * See license text in LICENSE file
 */

/*global describe, it*/

var fs         = require('fs');
var assert     = require('assert');
var difflet    = require('difflet')({indent: 2, comment: true});
var proto2json = require('../');

// Patch assert.deepEqual
var originalDeepEqual = assert.deepEqual;

assert.deepEqual = function (actual, expected, message) {
  try {
    originalDeepEqual.apply(null, arguments);
  } catch (err) {
    var diff = difflet.compare(expected, actual);
    err.toString = function () { return 'AssertionError: ' + diff; };
    throw err;
  }
};

// Create tests for all fixtures files
var files = fs.readdirSync(__dirname + '/fixtures')
              .filter(function (file) { return file.match(/\.proto$/); })
              .sort();

describe('proto.jison', function () {
  it('should be parsable', function () {
    var jison_source = fs.readFileSync(__dirname + '/../src/proto.jison', 'utf8');

    assert.doesNotThrow(function () {
      require("ebnf-parser").parse(jison_source);
    });
  });
});

describe('proto2json', function () {
  files.forEach(function (file) {
    var name = file.replace(/\.proto$/, '');

    var proto = fs.readFileSync(__dirname + '/fixtures/' + name + '.proto', 'utf8');
    var json  = fs.readFileSync(__dirname + '/fixtures/' + name + '.json',  'utf8');

    json = JSON.parse(json);

    it('should properly parse ' + name + '.proto', function (done) {
      proto2json.parse(proto, function (err, parse_result) {
        if (err) {
          throw err;
        }

        assert.deepEqual(parse_result, json);

        done();
      });
    });
  });
});
