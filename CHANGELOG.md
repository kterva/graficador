# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-01

### Añadido
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
- Solucionado problema donde las líneas de ajuste exponencial, logarítmico y potencial no se mostraban en la gráfica.
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
