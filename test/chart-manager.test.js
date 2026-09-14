import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSlopeRange } from '../js/chart-manager.js';
import { AppState } from '../js/state.js';

function closeTo(actual, expected, tolerance = 1e-6) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `expected ${actual} to be close to ${expected} (tolerance ${tolerance})`
    );
}

function setSeries(series) {
    AppState.series = series;
}

test('getSlopeRange: no series with fitType linearOrigin falls back to a fixed range', () => {
    setSeries([{ fitType: 'linear', data: [{ x: 1, y: 5 }] }]);
    assert.deepEqual(getSlopeRange(), { min: -10, max: 10 });
});

test('getSlopeRange: ignores series that are not fitType linearOrigin', () => {
    setSeries([
        { fitType: 'linear', data: [{ x: 1, y: 1000 }] },
        { fitType: 'linearOrigin', data: [{ x: 2, y: 10 }] }
    ]);
    const { min, max } = getSlopeRange();
    // Sólo el punto (2,10) -> ratio 5 -> debe centrar cerca de 5, no de 1000.
    closeTo((min + max) / 2, 5, 1);
});

test('getSlopeRange: centers on the shared ratio even with floating-point noise (19.6/2 !== 29.4/3 exactly)', () => {
    setSeries([{
        fitType: 'linearOrigin',
        data: [{ x: 1, y: 9.8 }, { x: 2, y: 19.6 }, { x: 3, y: 29.4 }]
    }]);
    const { min, max } = getSlopeRange();
    // Antes de la corrección, el ruido de punto flotante producía un rango casi
    // nulo (min ≈ max ≈ 9.8) en vez de un slider usable centrado ahí.
    assert.ok(max - min > 1, `range should not be degenerate, got [${min}, ${max}]`);
    closeTo((min + max) / 2, 9.8, 1e-6);
    assert.ok(min < 9.8 && max > 9.8);
});

test('getSlopeRange: pads a non-degenerate range by 30% on each side', () => {
    setSeries([{
        fitType: 'linearOrigin',
        data: [{ x: 1, y: 4 }, { x: 2, y: 10 }] // ratios: 4 y 5
    }]);
    const { min, max } = getSlopeRange();
    closeTo(min, 3.7);
    closeTo(max, 5.3);
});

test('getSlopeRange: ignores points with x = 0 (undefined ratio)', () => {
    setSeries([{
        fitType: 'linearOrigin',
        data: [{ x: 0, y: 999 }, { x: 2, y: 10 }]
    }]);
    const { min, max } = getSlopeRange();
    closeTo((min + max) / 2, 5, 1);
});
