/**
 * ============================================
 * HERRAMIENTAS DE DESARROLLO
 * ============================================
 * 
 * Este archivo contiene funciones y datos exclusivos para desarrollo.
 * Solo se carga cuando IS_DEVELOPMENT = true en index.html
 * 
 * @author Graficador Team
 * @version 2.0.0
 */

// Importar módulos necesarios
import { AppState } from './state.js';
import { updateChart } from './chart-manager.js';
import { renderSeries } from './ui-handlers.js';

/**
 * Carga datos de prueba predefinidos para agilizar el testing
 * @param {string} type - Tipo de datos: 'linear', 'quadratic', 'exponential', 'logarithmic', 'power', 'uncertainty'
 */
export function loadTestData(type) {
    // Limpiar series existentes
    AppState.series = [];
    AppState.nextId = 1;

    const testSets = {
        linear: {
            name: 'Lineal',
            data: [
                { x: 1, y: 2, xError: 0.1, yError: 0.2 },
                { x: 2, y: 4, xError: 0.1, yError: 0.3 },
                { x: 3, y: 6, xError: 0.1, yError: 0.2 },
                { x: 4, y: 8, xError: 0.1, yError: 0.4 },
                { x: 5, y: 10, xError: 0.1, yError: 0.3 }
            ],
            fitType: 'linear'
        },
        quadratic: {
            name: 'Cuadrática',
            data: [
                { x: 1, y: 1, xError: 0.1, yError: 0.2 },
                { x: 2, y: 4, xError: 0.1, yError: 0.3 },
                { x: 3, y: 9, xError: 0.1, yError: 0.5 },
                { x: 4, y: 16, xError: 0.1, yError: 0.8 },
                { x: 5, y: 25, xError: 0.1, yError: 1.0 }
            ],
            fitType: 'poly2'
        },
        exponential: {
            name: 'Exponencial',
            data: [
                { x: 0, y: 1, xError: 0, yError: 0.1 },
                { x: 1, y: 2.7, xError: 0, yError: 0.2 },
                { x: 2, y: 7.4, xError: 0, yError: 0.5 },
                { x: 3, y: 20.1, xError: 0, yError: 1.0 },
                { x: 4, y: 54.6, xError: 0, yError: 2.0 }
            ],
            fitType: 'exponential'
        },
        logarithmic: {
            name: 'Logarítmica',
            data: [
                { x: 1, y: 0, xError: 0, yError: 0.1 },
                { x: 2, y: 0.69, xError: 0, yError: 0.1 },
                { x: 5, y: 1.61, xError: 0, yError: 0.1 },
                { x: 10, y: 2.30, xError: 0, yError: 0.2 },
                { x: 20, y: 3.00, xError: 0, yError: 0.2 }
            ],
            fitType: 'logarithmic'
        },
        power: {
            name: 'Potencial',
            data: [
                { x: 1, y: 1, xError: 0, yError: 0.1 },
                { x: 2, y: 4, xError: 0, yError: 0.2 },
                { x: 3, y: 9, xError: 0, yError: 0.3 },
                { x: 4, y: 16, xError: 0, yError: 0.5 },
                { x: 5, y: 25, xError: 0, yError: 0.7 }
            ],
            fitType: 'power'
        },
        uncertainty: {
            name: 'Con Incertidumbre',
            data: [
                { x: 1, y: 2.1, xError: 0.2, yError: 0.3 },
                { x: 2, y: 3.9, xError: 0.2, yError: 0.4 },
                { x: 3, y: 6.2, xError: 0.2, yError: 0.5 },
                { x: 4, y: 7.8, xError: 0.2, yError: 0.6 },
                { x: 5, y: 10.1, xError: 0.2, yError: 0.7 }
            ],
            fitType: 'linear'
        }
    };

    const testData = testSets[type];
    if (!testData) {
        console.error(`Tipo de datos de prueba desconocido: ${type}`);
        return;
    }

    // Crear nueva serie con datos de prueba
    const serie = {
        id: AppState.nextId++,
        name: testData.name,
        color: AppState.colors[0],
        data: testData.data,
        fitType: testData.fitType,
        equation: '',
        r2: 0
    };

    AppState.series.push(serie);

    // Actualizar UI
    renderSeries();
    updateChart();

    console.log(`🧪 Datos de prueba cargados: ${type}`);
}

// Exponer función al scope global para onclick
window.loadTestData = loadTestData;

console.log('🔧 Herramientas de desarrollo cargadas (modular)');
