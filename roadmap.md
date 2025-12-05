# 📊 Roadmap del Graficador Científico

## 📅 Plan de Trabajo: Siguiente Sprint (v1.5.0)

### Objetivo: Usabilidad y Herramientas Científicas

1.  **📋 Copiar/Pegar (Clipboard):**
    *   Permitir pegar datos directamente desde Excel/Google Sheets a la tabla.
    *   Detectar automáticamente columnas (X, Y, Errores).

2.  **🎯 Cursor Crosshair:**
    *   Mostrar líneas guía (cruz) siguiendo el mouse.
    *   Mostrar coordenadas (X, Y) flotantes o en los ejes.
    *   "Snapping" a puntos de datos cercanos (opcional).

3.  **📈 Escalas Logarítmicas:**
    *   Toggle para escala Log en eje X y/o Y.
    *   Ajuste automático de la visualización de datos.

4.  **🧪 Tests Unitarios (Inicio):**
    *   Configurar Jest o Vitest.
    *   Crear primeros tests para `calculations.js` (asegurar precisión).

---

## 🔮 Roadmap Futuro (v1.6.0+)

- **Exportación a LaTeX:** Generar código para papers/informes.
- **Temas:** Modo Oscuro / Alto Contraste.
- **Más Ajustes:** Sinusoidal, Gaussiana.
- **Undo/Redo:** Historial de acciones.

---

## ✅ Historial de Mejoras Completadas

### v1.4.0 - UI/UX y Estabilidad (2025-12-05)
- ✅ **Interfaz Móvil Mejorada:** Menú popover, layout responsive reorganizado.
- ✅ **Estabilidad:** Fix de "temblor" en tangente, ejes centrados en cero.
- ✅ **Documentación:** Nuevos archivos de contexto y quick start.
- ✅ **Modo Desarrollo:** Workflow de release mejorado.

### v1.3.0 - Sistema de Unidades y Cálculos Físicos (2025-12-03)
- ✅ Sistema de unidades completo
- ✅ Propagación de incertidumbre
- ✅ Menú de herramientas

### v1.2.0 - Refactorización Modular (2025-12-03)
- ✅ Modularización completa

### v1.1.0 - Funcionalidades Avanzadas
- ✅ Exportación PDF, Proyectos, Incertidumbre

### v1.0.0 - Versión Inicial
- ✅ Series, Ajustes, R²
