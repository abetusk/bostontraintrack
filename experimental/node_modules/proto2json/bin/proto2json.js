#!/usr/bin/env node

/*!
 * Copyright (C) 2012 by Oleg Efimov
 *
 * See license text in LICENSE file
 */

var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  prog: "proto2json",
  description: require('../package.json').description,
  version: require('../package.json').version,
  addHelp: true
});
parser.addArgument(
  [ '-i', '--input' ],
  {
    action: 'store',
    defaultValue: '-',
    type: 'string',
    help: 'Input proto file. Default: read from stdin.'
  }
);
parser.addArgument(
  [ '-o', '--output' ],
  {
    action: 'store',
    defaultValue: '-',
    help: 'Output JSON file. Default: write to stdout.'
  }
);
var args = parser.parseArgs();

var fs = require('fs');
var input_stream;
if (args.input === '-') {
  input_stream = process.stdin;
  process.stdin.resume();
} else {
  input_stream = fs.createReadStream(args.input);
}

var input_buffer = new Buffer('');
input_stream.on('data', function (chunk) {
  input_buffer = Buffer.concat([input_buffer, chunk]);
});

input_stream.on('end', function () {
  var proto2json = require('../');

  proto2json.parse(input_buffer.toString(), function (err ,json) {
    if (err) {
      throw err;
    }

    var data = JSON.stringify(json, null, '  ') + '\n';

    if (args.output === '-') {
      process.stdout.write(data);
    } else {
      fs.writeFile(args.output, data, function (err) {
        if (err) {
          throw err;
        }
      });
    }
  });
});
