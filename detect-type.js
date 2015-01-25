'use strict';

var isObject = require('is-object');
var console = require('console');

var KNOWN_JSON_SCHEMA_KEYS =
    require('./known-json-schema-keys.js');

var JSON_SCHEMA_TYPES = {
    'struct': 'struct',
    'stringLiteral': 'stringLiteral',
    'enumString': 'enumString',
    'objectLiteral': 'objectLiteral',
    'objectUnion': 'objectUnion',
    'enumNumber': 'enumNumber',
    'objectIntersection': 'objectIntersection',
    'array': 'array',
    'numberLiteral': 'numberLiteral',
    'objectPattern': 'objectPattern',
    'booleanLiteral': 'booleanLiteral',
    'integerLiteral': 'integerLiteral',
    'emptyObject': 'emptyObject',
    'null': 'null'
};

module.exports = detectType;

function detectType(jsonSchema) {
    // jsonSchema.type can be an array, special case it.
    if (jsonSchema.type &&
        Array.isArray(jsonSchema.type)
    ) {
        return 'MULTIPLE_TYPES';
    }

    if (Object.keys(jsonSchema).length === 0) {
        return JSON_SCHEMA_TYPES.emptyObject;
    }

    if (jsonSchema.type === 'object' &&
        isObject(jsonSchema.properties) &&
        schemaLength(jsonSchema, [
            'required'
        ]) === 2
    ) {
        return JSON_SCHEMA_TYPES.struct;
    }

    if (jsonSchema.type === 'object' &&
        schemaLength(jsonSchema) === 1
    ) {
        return JSON_SCHEMA_TYPES.objectLiteral;
    }

    if (jsonSchema.type === 'object' &&
        Array.isArray(jsonSchema.oneOf) &&
        schemaLength(jsonSchema) === 2
    ) {
        return JSON_SCHEMA_TYPES.objectUnion;
    }

    if (jsonSchema.type === 'object' &&
        Array.isArray(jsonSchema.allOf) &&
        schemaLength(jsonSchema) === 2
    ) {
        return JSON_SCHEMA_TYPES.objectIntersection;
    }

    if (jsonSchema.type === 'object' &&
        isObject(jsonSchema.patternProperties) &&
        schemaLength(jsonSchema) === 2
    ) {
        return JSON_SCHEMA_TYPES.objectPattern;
    }

    if (jsonSchema.type === 'string' &&
        Array.isArray(jsonSchema.enum) &&
        schemaLength(jsonSchema) === 2
    ) {
        return JSON_SCHEMA_TYPES.enumString;
    }

    if (jsonSchema.type === 'string' &&
        schemaLength(jsonSchema) === 1
    ) {
        return JSON_SCHEMA_TYPES.stringLiteral;
    }

    if (jsonSchema.type === 'number' &&
        Array.isArray(jsonSchema.enum) &&
        schemaLength(jsonSchema) === 2
    ) {
        return JSON_SCHEMA_TYPES.enumNumber;
    }

    if (jsonSchema.type === 'number' &&
        schemaLength(jsonSchema) === 1
    ) {
        return JSON_SCHEMA_TYPES.numberLiteral;
    }

    if (jsonSchema.type === 'integer' &&
        schemaLength(jsonSchema) === 1
    ) {
        return JSON_SCHEMA_TYPES.integerLiteral;
    }

    if (jsonSchema.type === 'array' &&
        isObject(jsonSchema.items) &&
        schemaLength(jsonSchema, [
            'minItems', 'uniqueItems'
        ]) === 2
    ) {
        return JSON_SCHEMA_TYPES.array;
    }

    if (jsonSchema.type === 'boolean' &&
        schemaLength(jsonSchema) === 1
    ) {
        return JSON_SCHEMA_TYPES.booleanLiteral;
    }

    if (jsonSchema.type === 'null' &&
        schemaLength(jsonSchema) === 1
    ) {
        return JSON_SCHEMA_TYPES.null;
    }

    /* heuristic

        Allow the { type: ['null', 'object'], ... } pattern.
    */
    if (jsonSchema.type === 'null' &&
        schemaLength(jsonSchema) > 1
    ) {
        return JSON_SCHEMA_TYPES.null;
    }

    console.log('WARN unknown schema type', jsonSchema.type,
        jsonSchema);

    return 'notKnownYet';
}

/* TODO respect additionalProperties.

    When set to `false` it should be { ... }
    When set to `true` it should be Object & { ... }
    When set to `undefined` it should be Object & { ... }

    When set to { ... } it should be Object<..., { ... }>

*/
function schemaLength(jsonSchema, extraKeys) {
    extraKeys = extraKeys || [];
    var keys = Object.keys(jsonSchema);

    keys = keys.filter(isUsefulKey);

    return keys.length;

    function isUsefulKey(key) {
        var value = jsonSchema[key];

        if (key === 'description') {
            return false;
        }
        if (key === 'definitions') {
            return false;
        }
        if (key === 'id') {
            return false;
        }

        if (key === 'additionalProperties') {
            if (typeof value === 'boolean') {
                return false;
            }
        }

        if (extraKeys.indexOf(key) > -1) {
            return false;
        }

        if (KNOWN_JSON_SCHEMA_KEYS.indexOf(key) === -1) {
            return false;
        }

        return true;
    }
}
