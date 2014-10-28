Contribute to node-proto2json
=============================


It is simple to contribute: fork this repository, write some code and tests,
ensure that tests passes, lint code
and then send a pull request to [me](https://github.com/Sannis) on Github.
I'll be glad to see your forks and commits in them :) Thanks!


Run tests
---------

All functions and possible use cases should have tests, placed in `tests` sub-folder.
`node-proto2json` uses `mocha` as testing tool. If you contributing something,
you should check that your changes do not breakes tests.

If you change some code you should regenerate parser from source:

    $> make parser

and run tests after that:

    $> make test

You can [go to Travis CI site to view current tests results](http://travis-ci.org/Sannis/node-proto2json).


Coding style
------------

Code style based on [Node.js code styles](http://github.com/ry/node/wiki/contributing).

1. Discuss large changes before coding (this is good idea in collaborative development)
2. Javascript code should follow [Douglas Crockford code conventions for the javascript programming language](http://javascript.crockford.com/code.html) and be run through [Nodelint](http://github.com/tav/nodelint). And:
    * Code should has two space indention
    * Multi-line <code>if</code> statements must have braces
3. All code must be MIT licensed

You can lint `node-proto2json` code by executing:

    $> make lint
