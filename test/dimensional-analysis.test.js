import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseExpression, DIMENSIONS } from '../js/dimensional-analysis.js';

test('parseExpression: simple multiplication combines dimensions', () => {
    const result = parseExpression('fuerza * distancia');
    assert.ok(result.equals(DIMENSIONS.energy));
});

test('parseExpression: division combines dimensions', () => {
    const result = parseExpression('distancia / tiempo');
    assert.ok(result.equals(DIMENSIONS.velocity));
});

test('parseExpression: exponent applies power to the dimension (previously silently ignored)', () => {
    // velocidad^2 -> [L²·T⁻²], the dimension of specific kinetic energy (E/m)
    const result = parseExpression('velocidad^2');
    assert.ok(result.equals(DIMENSIONS.velocity.power(2)));
    assert.equal(result.L, 2);
    assert.equal(result.T, -2);
});

test('parseExpression: negative exponent', () => {
    const result = parseExpression('tiempo^-1');
    assert.ok(result.equals(DIMENSIONS.time.power(-1)));
});
