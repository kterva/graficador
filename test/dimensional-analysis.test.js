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

test('parseExpression: unrecognized tokens fail clearly instead of a misleading partial dimension (E3)', () => {
    assert.equal(parseExpression('velocidad * chocolate'), null); // magnitud desconocida
    assert.equal(parseExpression('masa + tiempo'), null);          // + no soportado
    assert.equal(parseExpression('(masa) * tiempo'), null);        // paréntesis no soportados
    assert.equal(parseExpression('masa tiempo'), null);            // dos magnitudes sin operador
    assert.equal(parseExpression('masa *'), null);                 // operador colgando
    assert.equal(parseExpression('^2'), null);                     // exponente sin base
});
