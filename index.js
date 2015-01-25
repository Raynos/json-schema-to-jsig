'use strict';

// circular
module.exports = castToJSIG;

var console = require('console');
var extend = require('xtend');

var detectType = require('./detect-type.js');
var TYPE_CASTERS = require('./type-casters.js');

function castToJSIG(jsonSchema) {
    var type = detectType(jsonSchema);

    if (type === 'MULTIPLE_TYPES') {
        var schemaType = jsonSchema.type;

        var schemas = schemaType.map(function getSchema(t) {
            var schema = extend(jsonSchema);
            schema.type = t;

            return schema;
        });

        var newSchema = {
            oneOf: schemas
        };

        return TYPE_CASTERS.objectUnion(newSchema);
    }

    var caster = TYPE_CASTERS[type];
    if (caster) {
        return caster(jsonSchema);
    }

    console.log('WARN unimplemented caster', type);
}
