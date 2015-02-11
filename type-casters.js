'use strict';

var AST = require('jsig/ast');
var assert = require('assert');

var castToJSIG = require('./index.js');

var TYPE_CASTERS = {
    'struct': castStruct,
    'enumString': castEnumString,
    'stringLiteral': castStringLiteral,
    'objectLiteral': castObjectLiteral,
    'objectUnion': castObjectUnion,
    'enumNumber': castEnumNumber,
    'objectIntersection': castObjectIntersection,
    'array': castArray,
    'numberLiteral': castNumberLiteral,
    'objectPattern': castObjectPattern,
    'booleanLiteral': castBooleanLiteral,
    'integerLiteral': castIntegerLiteral,
    'emptyObject': castEmptyObject,
    'null': castNull
};

module.exports = TYPE_CASTERS;

function castStruct(jsonSchema, opts) {
    var properties = jsonSchema.properties;
    var required = jsonSchema.required || [];
    var keys = Object.keys(properties);

    var keyValues = keys.map(function toKeyValue(key) {
        var value = properties[key];
        /*
            heuristic.
            in case someone puts required in properties
        */
        if (key === 'required' && Array.isArray(value)) {
            return null;
        }
        /*
            heuristic.
            in case someone puts additonalProperties in
            properties.
        */
        if (key === 'additionalProperties' &&
            typeof value === 'boolean'
        ) {
            return null;
        }

        return AST.keyValue(
            key,
            castToJSIG(value, opts),
            {
                optional: required.indexOf(key) === -1
            }
        );
    }).filter(Boolean);

    if (opts.structName && jsonSchema.id) {
        keyValues.unshift(AST.keyValue(
            '$$structName',
            AST.value('"' + jsonSchema.id + '"', 'string')
        ));
    }

    return AST.object(keyValues);
}

function castEnumString(jsonSchema) {
    // console.log('enumString', jsonSchema);
    var $enum = jsonSchema.enum;
    var values = $enum.map(function toValue(value) {
        return AST.value('"' + value + '"', 'string');
    });

    return AST.union(values);
}

function castStringLiteral(jsonSchema) {
    // console.log('stringLiteral', jsonSchema);

    return AST.literal('String');
}

function castObjectLiteral(jsonSchema) {
    // console.log('objectLiteral', jsonSchema);

    return AST.literal('Object');
}

function castObjectUnion(jsonSchema, opts) {
    // console.log('objectUnion', jsonSchema);
    var oneOf = jsonSchema.oneOf;

    return AST.union(
        oneOf.map(function toJSIG(subSchema) {
            return castToJSIG(subSchema, opts);
        })
    );
}

function castEnumNumber(jsonSchema) {
    // console.log('enumNumber', jsonSchema);
    var $enum = jsonSchema.enum;
    var values = $enum.map(function toValue(value) {
        return AST.value(String(value), 'number');
    });

    return AST.union(values);
}

function castObjectIntersection(jsonSchema, opts) {
    // console.log('objectIntersection', jsonSchema)
    var allOf = jsonSchema.allOf;

    return AST.intersection(
        allOf.map(function toJSIG(subSchema) {
            return castToJSIG(subSchema, opts);
        })
    );
}

/* TODO
    respect minItems and maxItems
*/
function castArray(jsonSchema, opts) {
    // console.log('array', jsonSchema)
    var items = jsonSchema.items;

    var arr = AST.generic(
        AST.literal('Array'),
        [castToJSIG(items, opts) || AST.literal('Any')]
    );

    return arr;
}

function castNumberLiteral(jsonSchema) {
    // console.log('numberLiteral', jsonSchema)

    return AST.literal('Number');
}

function castObjectPattern(jsonSchema, opts) {
    // console.log('objectPattern', jsonSchema);

    var patternProperties = jsonSchema.patternProperties;
    var patterns = Object.keys(patternProperties);
    assert(patterns.length === 1,
        'do not support multiple patterns');

    var pattern = patterns[0];
    var key;
    if (pattern === '.') {
        key = AST.literal('String');
    } else {
        key = AST.generic(
            AST.literal('Pattern'),
            [
                AST.value('"' + pattern + '"', 'string')
            ]
        );
    }

    return AST.generic(
        AST.literal('Object'),
        [
            key,
            castToJSIG(patternProperties[pattern], opts)
        ]
    );
}

function castBooleanLiteral(jsonSchema) {
    // console.log('booleanLiteral', jsonSchema)

    return AST.literal('Boolean');
}

function castIntegerLiteral(jsonSchema) {
    // console.log('integerLiteral', jsonSchema)

    return AST.literal('Integer');
}

function castEmptyObject(jsonSchema) {
    // console.log('emptyObject', jsonSchema)

    return AST.literal('Any');
}

function castNull(jsonSchema) {
    // console.log('null', jsonSchema)

    return AST.value('null');
}
