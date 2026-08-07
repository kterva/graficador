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

    // Nota: el graficador solo soporta incertidumbre a nivel de columna
    // (serie.defaultXError/defaultYError, ver el comentario en renderTable()
    // de ui-handlers.js: "Los errores X/Y se aplican desde la configuración de
    // columna, no desde cada fila"). Los xError/yError por punto de abajo son
    // solo para que el valor de X/Y de ejemplo se vea razonable; el que
    // realmente controla las barras de error y el ajuste ponderado es
    // defaultXError/defaultYError, seteado más abajo al crear la serie.
    const testSets = {
        linear: {
            name: 'Lineal',
            data: [
                { x: 1, y: 2 },
                { x: 2, y: 4 },
                { x: 3, y: 6 },
                { x: 4, y: 8 },
                { x: 5, y: 10 }
            ],
            fitType: 'linear',
            defaultXError: 0.1,
            defaultYError: 0.3
        },
        quadratic: {
            name: 'Cuadrática',
            data: [
                { x: 1, y: 1 },
                { x: 2, y: 4 },
                { x: 3, y: 9 },
                { x: 4, y: 16 },
                { x: 5, y: 25 }
            ],
            fitType: 'poly2',
            defaultXError: 0.1,
            defaultYError: 0.5
        },
        exponential: {
            name: 'Exponencial',
            data: [
                { x: 0, y: 1 },
                { x: 1, y: 2.7 },
                { x: 2, y: 7.4 },
                { x: 3, y: 20.1 },
                { x: 4, y: 54.6 }
            ],
            fitType: 'exponential',
            defaultXError: 0,
            defaultYError: 0.5
        },
        logarithmic: {
            name: 'Logarítmica',
            data: [
                { x: 1, y: 0 },
                { x: 2, y: 0.69 },
                { x: 5, y: 1.61 },
                { x: 10, y: 2.30 },
                { x: 20, y: 3.00 }
            ],
            fitType: 'logarithmic',
            defaultXError: 0,
            defaultYError: 0.1
        },
        power: {
            name: 'Potencial',
            data: [
                { x: 1, y: 1 },
                { x: 2, y: 4 },
                { x: 3, y: 9 },
                { x: 4, y: 16 },
                { x: 5, y: 25 }
            ],
            fitType: 'power',
            defaultXError: 0,
            defaultYError: 0.3
        },
        uncertainty: {
            name: 'Con Incertidumbre',
            data: [
                { x: 1, y: 2.1 },
                { x: 2, y: 3.9 },
                { x: 3, y: 6.2 },
                { x: 4, y: 7.8 },
                { x: 5, y: 10.1 }
            ],
            fitType: 'linear',
            defaultXError: 0.2,
            defaultYError: 0.5
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
        defaultXError: testData.defaultXError,
        defaultYError: testData.defaultYError,
        equation: '',
        r2: null
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
