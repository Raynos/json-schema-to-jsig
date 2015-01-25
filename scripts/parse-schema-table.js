'use strict';

var parseArgs = require('minimist');
var jsonBody = require('body/json');
var process = require('process');
var console = require('console');
var serializeJSIG = require('jsig/serialize');
var chalk = require('chalk');
var util = require('util');

var parseJSONSchema = require('../index.js');

module.exports = main;

if (require.main === module) {
    main(parseArgs(process.argv.slice(2)));
}

function main(argv) {
    jsonBody(process.stdin, onBody);

    function onBody(err, schemaTable) {
        if (err) {
            throw err;
        }

        var ops = Object.keys(schemaTable);
        for (var i = 0; i < ops.length; i++) {
            var spec = schemaTable[ops[i]];

            if (argv.schema) {
                console.log('JSON schema request\n' +
                    chalk.red(util.inspect(spec.request, {
                        depth: Infinity
                    }))
                );
            }
            console.log('JSIG request\n' +
                chalk.green(toJSIGStr(spec.request))
            );

            if (argv.schema) {
                console.log('JSON schema response\n' +
                    chalk.red(util.inspect(spec.response, {
                        depth: Infinity
                    }))
                );
            }
            console.log('JSIG response\n' +
                chalk.green(toJSIGStr(spec.response))
            );
        }
    }
}

function toJSIGStr(schema) {
    return serializeJSIG(parseJSONSchema(schema));
}
