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

test('getSlopeRange: no eligible series (linear/linearOrigin) falls back to a fixed range', () => {
    setSeries([{ fitType: 'poly2', data: [{ x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }] }]);
    assert.deepEqual(getSlopeRange(), { min: -10, max: 10 });
});

test('getSlopeRange: a series with fewer than 2 points is ignored (can\'t fit a slope)', () => {
    setSeries([{ fitType: 'linearOrigin', data: [{ x: 2, y: 10 }] }]);
    assert.deepEqual(getSlopeRange(), { min: -10, max: 10 });
});

test('getSlopeRange: uses the fitted slope for "linear", ignoring the intercept', () => {
    // y = 3x + 100 -> la pendiente es 3, sin importar lo grande que sea b.
    setSeries([{
        fitType: 'linear',
        data: [{ x: 1, y: 103 }, { x: 2, y: 106 }, { x: 3, y: 109 }, { x: 4, y: 112 }]
    }]);
    const { min, max } = getSlopeRange();
    closeTo((min + max) / 2, 3);
});

test('getSlopeRange: uses the fitted slope for "linearOrigin"', () => {
    setSeries([{
        fitType: 'linearOrigin',
        data: [{ x: 1, y: 9.8 }, { x: 2, y: 19.6 }, { x: 3, y: 29.4 }]
    }]);
    const { min, max } = getSlopeRange();
    assert.ok(max - min > 1, `range should not be degenerate, got [${min}, ${max}]`);
    closeTo((min + max) / 2, 9.8, 1e-6);
});

test('getSlopeRange: combines slopes from multiple eligible series ("linear" and "linearOrigin")', () => {
    setSeries([
        { fitType: 'linear', data: [{ x: 0, y: 10 }, { x: 1, y: 14 }, { x: 2, y: 18 }] }, // slope 4
        { fitType: 'linearOrigin', data: [{ x: 1, y: 5 }, { x: 2, y: 10 }] } // slope 5
    ]);
    const { min, max } = getSlopeRange();
    closeTo(min, 3.7);
    closeTo(max, 5.3);
});

test('getSlopeRange: ignores series with a fitType other than "linear"/"linearOrigin"', () => {
    setSeries([
        { fitType: 'poly2', data: [{ x: 1, y: 1000 }, { x: 2, y: 4000 }, { x: 3, y: 9000 }] },
        { fitType: 'linearOrigin', data: [{ x: 1, y: 5 }, { x: 2, y: 10 }] }
    ]);
    const { min, max } = getSlopeRange();
    closeTo((min + max) / 2, 5, 1);
});

test('getSlopeRange: a "linearOrigin" series with all X ~0 (undefined slope) is skipped, not NaN', () => {
    setSeries([
        { fitType: 'linearOrigin', data: [{ x: 0, y: 1 }, { x: 0, y: 2 }] },
        { fitType: 'linearOrigin', data: [{ x: 1, y: 5 }, { x: 2, y: 10 }] }
    ]);
    const { min, max } = getSlopeRange();
    assert.ok(Number.isFinite(min) && Number.isFinite(max));
    closeTo((min + max) / 2, 5, 1);
});
