# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-12-05

### Añadido
- **Documentación**: Nuevos archivos `project_context.md` y `quick_start.md` para facilitar el onboarding.
- **Modo Desarrollo**: Flag `IS_DEVELOPMENT` para habilitar herramientas de prueba en rama `develop`.

### Mejorado
- **Interfaz Móvil**: Menú de cabecera tipo "popover" para mejor experiencia en pantallas pequeñas.
- **Layout**: Reorganización de paneles de control (Zoom -> Config -> Cálculo -> Exportar) y unificación de estilos visuales.
- **Estabilidad**:
    - Solucionado "temblor" en slider de tangente (limitación a rango de datos y desactivación de animación).
    - Ejes configurados para mostrar siempre el origen (0,0) al restablecer zoom.


## [1.1.0] - 2025-12-01

### Añadido
- **Gestión de Proyectos**:
    - Guardar proyecto completo en formato JSON (series, datos, configuración).
    - Cargar proyectos previamente guardados.
- **Personalización de Gráfica**:
    - Panel de configuración para título, etiquetas de ejes y límites.
    - Control de visualización de grid.
    - **Ejes con flechas estilo física**: Los ejes X e Y ahora tienen flechas en sus extremos y etiquetas de magnitudes.
- **Introducción Visual**: Sección de bienvenida en la página principal que explica las capacidades del graficador.
- **Diseño Responsive**:
    - Interfaz optimizada para dispositivos móviles (celulares y tablets).
    - Tablas con desplazamiento horizontal y botones táctiles mejorados.
- **Mejoras de Usabilidad**:
    - **Zoom controlado**: Sensibilidad reducida para mayor precisión.
    - **Autoajuste inteligente**: El botón "Restablecer Zoom" ahora recalcula los límites para mostrar todos los puntos, incluso si se cambiaron manualmente.
- **Análisis de Incertidumbre Avanzado**:
    - **Cálculo de Pendiente**: Para ajustes lineales, se muestra el cálculo de $m_{max}$, $m_{min}$ y $\Delta m$ basado en las barras de error.
    - **Visualización Gráfica**: Líneas de pendiente máxima (roja) y mínima (azul) continuas con valores en la leyenda.
    - **Cajas de Error**: Se visualizan los rectángulos de error de los puntos extremos para confirmar la alineación de las pendientes.
    - **Línea de Ajuste**: Negra y continua para mejor contraste con las líneas de incertidumbre.
- **Exportación Avanzada**:
    - Exportación a PDF (además de PNG).
- **Análisis de Incertidumbre**:
    - Soporte para ingresar errores en X e Y (±X, ±Y).
    - Visualización de barras de error en la gráfica.
    - Cálculo de incertidumbre para pendiente e intercepto en regresión lineal (Método de Pendiente Máxima/Mínima).
- **Gestión de Archivos CSV**:
    - Funcionalidad para exportar series individuales a CSV.
    - Funcionalidad para importar datos desde archivos CSV.
- **Mejoras en Tabla de Datos**:
    - Botón "Limpiar" para borrar rápidamente todos los datos de una serie.
    - Navegación por teclado: `Enter` para mover foco abajo/crear fila, flechas para navegar.
- **Documentación**:
    - Ayuda contextual actualizada con explicación de incertidumbres.
    - README.md con instrucciones detalladas.

### Cambiado
- La gráfica ahora se actualiza automáticamente al modificar los datos en la tabla.
- Mejorada la estructura interna de datos para soportar propiedades de error (`xError`, `yError`).

### Corregido
- Solucionado problema donde las líneas de ajuste exponencial, logarítmico y potencial no se mostraban en la gráfica (faltaba `showLine: true` en el dataset).
- Corregido error de compatibilidad en funciones de regresión no lineal que causaba valores `NaN` (agregada función auxiliar `linearRegressionArrays`).
- Agregada validación para evitar errores de cálculo en ajustes logarítmicos y potenciales con valores no positivos.

## [1.0.0] - 2025-12-01

### Añadido
- Versión inicial del Graficador.
- Soporte para múltiples series de datos.
- Tipos de ajuste: Lineal, Polinomial (2 y 3), Exponencial, Logarítmico, Potencial.
- Cálculo de coeficiente R².
- Visualización interactiva con Chart.js.
- Detección de intersecciones.
- Personalización de colores por serie.
