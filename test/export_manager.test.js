import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCSVField } from '../js/export_manager.js';

test('sanitizeCSVField: plain values pass through unchanged', () => {
    assert.equal(sanitizeCSVField('Tiempo'), 'Tiempo');
    assert.equal(sanitizeCSVField('3.14'), '3.14');
});

test('sanitizeCSVField: neutralizes formula-injection trigger characters', () => {
    assert.equal(sanitizeCSVField('=1+1'), "'=1+1");
    assert.equal(sanitizeCSVField('+1+1'), "'+1+1");
    assert.equal(sanitizeCSVField('-1+1'), "'-1+1");
    assert.equal(sanitizeCSVField('@SUM(A1)'), "'@SUM(A1)");
});

test('sanitizeCSVField: quotes fields containing commas so columns do not shift', () => {
    assert.equal(sanitizeCSVField('Distancia, m'), '"Distancia, m"');
});

test('sanitizeCSVField: escapes embedded quotes per RFC4180', () => {
    assert.equal(sanitizeCSVField('foo"bar'), '"foo""bar"');
});
