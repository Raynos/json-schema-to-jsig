'use strict';

var parseArgs = require('minimist');
var jsonBody = require('body/json');
var process = require('process');
var console = require('console');
var serializeJSIG = require('jsig/serialize');

var parseJSONSchema = require('../index.js');

module.exports = main;

if (require.main === module) {
    main(parseArgs(process.argv.slice(2)));
}

function main() {
    jsonBody(process.stdin, onBody);

    function onBody(err, schemaTable) {
        if (err) {
            throw err;
        }

        var ops = Object.keys(schemaTable);
        for (var i = 0; i < ops.length; i++) {
            var spec = schemaTable[ops[i]];

            console.log('request',
                serializeJSIG(parseJSONSchema(spec.request))
            );
            console.log('response',
                serializeJSIG(parseJSONSchema(spec.response))
            );
        }
    }
}
