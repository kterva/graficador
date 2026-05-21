import { resolveUnit, convert, convertTemperature, detectCategory } from './js/units.js';

console.log(resolveUnit('m', 'length'));
console.log(resolveUnit('km', 'length'));
console.log(resolveUnit('mm', 'length'));
console.log(resolveUnit('μm', 'length'));
console.log(resolveUnit('kV', 'custom'));
console.log(resolveUnit('mg', 'mass'));
console.log(resolveUnit('kg', 'mass'));
console.log(convert(1000, 'mg', 'kg', 'mass'));
console.log(convertTemperature(0, '°C', 'K'));
console.log(detectCategory('mV'));
console.log(detectCategory('ns'));
