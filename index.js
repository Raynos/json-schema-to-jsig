'use strict';

var AST = require('jsig/ast');
var isObject = require('is-object');

var JSON_SCHEMA_TYPES = {
    'struct': 'struct',
    'string': 'string',
    'enumString': 'enumString'
};
var JSON_SCHEMA_CASTERS = {
    'struct': castStruct,
    'enumString': castEnumString
};

module.exports = castToJSIG;

function castToJSIG(jsonSchema) {
    var type = getType(jsonSchema);

    if (type === JSON_SCHEMA_TYPES.struct) {
        return JSON_SCHEMA_CASTERS.struct(jsonSchema);
    } else if (type === JSON_SCHEMA_TYPES.enumString) {
        return JSON_SCHEMA_CASTERS.enumString(jsonSchema);
    }

    console.log('WARN implemented caster', type);
}

function getType(jsonSchema) {
    if (jsonSchema.type === 'object' &&
        isObject(jsonSchema.properties)
    ) {
        return JSON_SCHEMA_TYPES.struct;
    }

    if (jsonSchema.type === 'string' &&
        Array.isArray(jsonSchema.enum)
    ) {
        return JSON_SCHEMA_TYPES.enumString;
    }

    if (jsonSchema.type === 'string') {
        return JSON_SCHEMA_TYPES.string;
    }

    console.log('WARN unknown schema type', jsonSchema.type,
        jsonSchema);
}

function castStruct(jsonSchema) {
    // console.log('struct', jsonSchema);
    var properties = jsonSchema.properties;
    var required = jsonSchema.required || [];
    var keys = Object.keys(properties);

    var keyValues = keys.map(function toKeyValue(key) {
        return AST.keyValue(
            key,
            castToJSIG(properties[key]),
            {
                optional: required.indexOf(key) === -1
            }
        );
    });

    return AST.object(keyValues);
}

function castEnumString(jsonSchema) {
    console.log('enumString', jsonSchema);

    var $enum = jsonSchema.enum;
    var values = $enum.map(function toValue() {

    });

    return AST.union();
}
