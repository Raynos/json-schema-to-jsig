'use strict';

var test = require('tape');

var castToJSIG = require('../index.js');

test('castToJSIG is a function', function t(assert) {
    assert.equal(typeof castToJSIG, 'function');
    assert.end();
});
