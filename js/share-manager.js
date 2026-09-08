/**
 * ============================================
 * GESTIÓN DE COMPARTIR (URL COMPARTIBLE)
 * ============================================
 * 
 * Módulo para generar y cargar URLs compartibles con datos
 * 
 * @module share-manager
 */

import { AppState, sanitizeImportedSeries } from './state.js';
import { renderSeries } from './ui-handlers.js';
import { updateChart } from './chart-manager.js';
import { updateChartConfig } from './chart_config.js';
import { PROJECT_FILE_FORMAT_VERSION } from './utils.js';
import { showNotification } from './notifications.js';

/**
 * Genera una URL compartible con el estado actual
 * @returns {string} URL completa con datos codificados
 */
export function generateShareURL() {
    const state = {
        version: PROJECT_FILE_FORMAT_VERSION,
        series: AppState.series.map(s => ({
            id: s.id,
            name: s.name,
            data: s.data,
            color: s.color,
            fitType: s.fitType,
            units: s.units || null
        })),
        config: {
            title: document.getElementById('chartTitle')?.value || '',
            xLabel: document.getElementById('labelX')?.value || 'X',
            yLabel: document.getElementById('labelY')?.value || 'Y',
            xUnit: document.getElementById('unitX')?.value || '',
            yUnit: document.getElementById('unitY')?.value || '',
            xMin: document.getElementById('minX')?.value || '',
            xMax: document.getElementById('maxX')?.value || '',
            yMin: document.getElementById('minY')?.value || '',
            yMax: document.getElementById('maxY')?.value || ''
        }
    };

    // Convertir a JSON y comprimir con base64
    const json = JSON.stringify(state);
    const compressed = btoa(encodeURIComponent(json));

    // Generar URL
    const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;

    return url;
}

/**
 * Carga datos desde URL si existe el parámetro 'data'
 * @returns {boolean} true si se cargaron datos, false si no
 */
export function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('data');

    if (!compressed) return false;

    try {
        // Descomprimir y parsear
        const json = decodeURIComponent(atob(compressed));
        const state = JSON.parse(json);

        // Validar versión (opcional, por ahora solo advertir)
        if (state.version && state.version !== PROJECT_FILE_FORMAT_VERSION) {
            console.warn(`URL generada con versión ${state.version}, actual: ${PROJECT_FILE_FORMAT_VERSION}`);
        }

        // Cargar series
        if (state.series && Array.isArray(state.series)) {
            AppState.series = sanitizeImportedSeries(state.series);

            // Actualizar contador de IDs
            const maxId = AppState.series.reduce((max, s) => Math.max(max, s.id), 0);
            AppState.nextId = maxId + 1;
        }

        // Cargar configuración
        if (state.config) {
            if (state.config.title) document.getElementById('chartTitle').value = state.config.title;
            if (state.config.xLabel) document.getElementById('labelX').value = state.config.xLabel;
            if (state.config.yLabel) document.getElementById('labelY').value = state.config.yLabel;
            if (state.config.xUnit) document.getElementById('unitX').value = state.config.xUnit;
            if (state.config.yUnit) document.getElementById('unitY').value = state.config.yUnit;
            if (state.config.xMin) document.getElementById('minX').value = state.config.xMin;
            if (state.config.xMax) document.getElementById('maxX').value = state.config.xMax;
            if (state.config.yMin) document.getElementById('minY').value = state.config.yMin;
            if (state.config.yMax) document.getElementById('maxY').value = state.config.yMax;

            updateChartConfig();
        }

        // Renderizar UI y actualizar gráfica
        renderSeries();
        updateChart();

        // Mostrar notificación
        showNotification('✓ Datos cargados desde URL compartida', 'success');

        return true;
    } catch (error) {
        console.error('Error al cargar desde URL:', error);
        showNotification('✗ Error al cargar datos de la URL', 'error');
        return false;
    }
}

/**
 * Copia la URL compartible al clipboard
 */
// Límite práctico de longitud de URL: muchos navegadores/servidores truncan
// alrededor de los 8000 caracteres y varias apps de mensajería rompen el link antes.
const SHARE_URL_WARN_LENGTH = 8000;

export async function copyShareURL() {
    try {
        const url = generateShareURL();

        // Copiar al clipboard
        await navigator.clipboard.writeText(url);

        if (url.length > SHARE_URL_WARN_LENGTH) {
            showNotification(
                `⚠️ El link es muy largo (${(url.length / 1024).toFixed(1)} KB) y puede truncarse al abrirlo. ` +
                `Para proyectos grandes usá "Guardar" y compartí el archivo .json.`,
                'error'
            );
        } else {
            showNotification('✓ URL copiada al portapapeles', 'success');
        }

        // Mostrar modal con la URL
        showShareModal(url);

    } catch (error) {
        console.error('Error al copiar URL:', error);
        showNotification('✗ Error al copiar URL', 'error');
    }
}

/**
 * Muestra modal con la URL compartible
 */
function showShareModal(url) {
    // Crear modal si no existe
    let modal = document.getElementById('shareModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <h2 style="margin-top: 0; color: #667eea;">🔗 Compartir Gráfica</h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                    Comparte esta URL para que otros puedan ver tu gráfica con los datos actuales:
                </p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; word-break: break-all; font-family: monospace; font-size: 14px;">
                    <span id="shareURLText"></span>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button data-on-click="copyShareURLAgain"
                        style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        📋 Copiar de nuevo
                    </button>
                    <button data-on-click="closeShareModal"
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeShareModal();
            }
        });
    }

    // Actualizar URL en el modal
    document.getElementById('shareURLText').textContent = url;
    modal.style.display = 'flex';
}

/**
 * Cierra el modal de compartir
 */
export function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Copia la URL de nuevo desde el modal
 */
export function copyShareURLAgain() {
    const urlText = document.getElementById('shareURLText').textContent;
    navigator.clipboard.writeText(urlText).then(() => {
        showNotification('✓ URL copiada', 'success');
    });
}

// Inicializar: cargar desde URL si existe
export function initShareManager() {
    // Intentar cargar desde URL al iniciar
    const loaded = loadFromURL();

    if (loaded) {
        console.log('📊 Datos cargados desde URL compartida');
    }
}
