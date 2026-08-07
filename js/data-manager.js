/**
 * ============================================
 * GESTIÓN DE DATOS
 * ============================================
 * 
 * Módulo para gestionar series de datos y puntos individuales.
 * Maneja operaciones CRUD (Create, Read, Update, Delete).
 * 
 * @module data-manager
 */

import { AppState, getNextColor, findSerieById } from './state.js';
import { parseDecimal, normalizeDecimalInput } from './utils.js';

/**
 * Agrega una nueva serie de datos
 * @returns {number} ID de la serie creada
 */
export function addSerie() {
    const id = AppState.nextId++;
    const color = getNextColor();

    const serie = {
        id: id,
        name: `Serie ${id}`,
        color: color,
        data: [{ x: '', y: '' }],
        fitType: 'none',
        equation: '',
        r2: null
    };

    AppState.series.push(serie);
    return id;
}

/**
 * Elimina una serie por su ID
 * @param {number} id - ID de la serie a eliminar
 * @returns {boolean} true si se eliminó, false si no se encontró
 */
export function removeSerie(id) {
    const initialLength = AppState.series.length;
    AppState.series = AppState.series.filter(s => s.id !== id);
    return AppState.series.length < initialLength;
}

/**
 * Agrega una fila (punto de datos) a una serie
 * @param {number} serieId - ID de la serie
 * @returns {boolean} true si se agregó, false si no se encontró la serie
 */
export function addRow(serieId) {
    const serie = findSerieById(serieId);
    if (!serie) return false;

    serie.data.push({ x: '', y: '' });
    return true;
}

/**
 * Elimina una fila (punto de datos) de una serie
 * @param {number} serieId - ID de la serie
 * @param {number} index - Índice de la fila a eliminar
 * @returns {boolean} true si se eliminó, false si no se pudo
 */
export function removeRow(serieId, index) {
    const serie = findSerieById(serieId);
    if (!serie) return false;

    if (serie.data.length > 1) {
        serie.data.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Actualiza un punto de datos
 * @param {number} serieId - ID de la serie
 * @param {number} index - Índice del punto
 * @param {string} axis - Eje a actualizar ('x' o 'y')
 * @param {string|number} value - Nuevo valor
 * @returns {boolean} true si se actualizó, false si no se encontró
 */
export function updatePoint(serieId, index, axis, value) {
    const serie = findSerieById(serieId);
    if (!serie || !serie.data[index]) return false;

    serie.data[index][axis] = value;
    return true;
}

/**
 * Actualiza el color de una serie
 * @param {number} serieId - ID de la serie
 * @param {string} color - Nuevo color en formato hex
 * @returns {boolean} true si se actualizó, false si no se encontró
 */
export function updateSerieColor(serieId, color) {
    const serie = findSerieById(serieId);
    if (!serie) return false;

    serie.color = color;
    return true;
}

/**
 * Actualiza el tipo de ajuste de una serie
 * @param {number} serieId - ID de la serie
 * @param {string} fitType - Tipo de ajuste ('none', 'linear', 'poly2', etc.)
 * @returns {boolean} true si se actualizó, false si no se encontró
 */
export function updateFitType(serieId, fitType) {
    const serie = findSerieById(serieId);
    if (!serie) return false;

    serie.fitType = fitType;
    return true;
}

/**
 * Limpia todos los datos de una serie
 * @param {number} serieId - ID de la serie
 * @returns {boolean} true si se limpió, false si no se encontró
 */
export function clearTable(serieId) {
    const serie = findSerieById(serieId);
    if (!serie) return false;

    serie.data = [{ x: '', y: '' }];
    return true;
}

/**
 * Exporta los datos de una serie a formato CSV
 * @param {number} serieId - ID de la serie
 * @returns {boolean} true si se exportó, false si no se encontró
 */
export function exportCSV(serieId) {
    const serie = findSerieById(serieId);
    if (!serie) return false;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "X,Y\n";

    serie.data.forEach(p => {
        if (p.x !== '' && p.y !== '') {
            csvContent += `${p.x},${p.y}\n`;
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${serie.name.replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
}

/**
 * Importa datos desde un archivo CSV
 * @param {number} serieId - ID de la serie
 * @param {File} file - Archivo CSV a importar
 * @param {Function} callback - Función a llamar después de importar
 */
export function importCSVFile(serieId, file, callback) {
    const serie = findSerieById(serieId);
    if (!serie) {
        if (callback) callback(false);
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');

        // Clear existing data
        serie.data = [];

        lines.forEach((line, index) => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            // Skip header if it contains letters
            if (index === 0 && /[a-zA-Z]/.test(cleanLine)) return;

            const parts = cleanLine.split(',');
            // Si tiene 2 columnas separadas por coma, puede ser X,Y o "1,5","2,3" (coma decimal)
            // Detectar si la línea usa punto y coma como separador de columnas
            const partsSemicolon = cleanLine.split(';');
            const usedParts = partsSemicolon.length >= 2 ? partsSemicolon : parts.length >= 2 ? parts : null;
            if (usedParts && usedParts.length >= 2) {
                serie.data.push({
                    x: normalizeDecimalInput(usedParts[0]),
                    y: normalizeDecimalInput(usedParts[1])
                });
            }
        });

        if (serie.data.length === 0) {
            serie.data.push({ x: '', y: '' });
        }

        if (callback) callback(true);
    };
    reader.readAsText(file);
}

/**
 * Obtiene todos los datos válidos de una serie (filtra valores vacíos)
 * @param {number} serieId - ID de la serie
 * @returns {Array|null} Array de puntos válidos o null si no se encontró
 */
export function getValidData(serieId) {
    const serie = findSerieById(serieId);
    if (!serie) return null;

    return serie.data
        .filter(p => p.x !== '' && p.y !== '')
        .map(p => ({
            x: parseDecimal(p.x),
            y: parseDecimal(p.y)
        }));
}
