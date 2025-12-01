# 📊 Graficador con Ajustes de Funciones

Una aplicación web interactiva para visualizar datos, realizar ajustes de curvas y análisis de incertidumbre. Ideal para estudiantes, científicos e ingenieros que necesitan herramientas rápidas y precisas para el análisis de datos experimentales.

## 🚀 Características Principales

### 📈 Análisis y Ajustes
*   **Múltiples Series de Datos**: Trabaja con varios conjuntos de datos simultáneamente.
*   **Tipos de Ajuste**:
    *   Lineal ($y = ax + b$)
    *   Polinomial (Grado 2 y 3)
    *   Exponencial ($y = ae^{bx}$)
    *   Logarítmico ($y = a \ln(x) + b$)
    *   Potencial ($y = ax^b$)
*   **Cálculo de R²**: Evalúa la calidad de cada ajuste.

### 🔬 Análisis de Incertidumbre
*   **Barras de Error**: Visualiza la incertidumbre en los ejes X e Y.
*   **Incertidumbre en Parámetros**: Cálculo automático de la incertidumbre en la pendiente ($m$) y ordenada al origen ($b$) para ajustes lineales utilizando el método de pendiente máxima y mínima.

### 💾 Gestión de Datos
*   **Importar/Exportar CSV**: Guarda tus proyectos y carga datos desde otras herramientas (Excel, Python, etc.).
*   **Edición Avanzada**: Tabla interactiva con navegación por teclado y limpieza rápida de datos.

### 🛠️ Herramientas Adicionales
*   **Zoom Interactivo**: Explora tus gráficas con detalle.
*   **Intersecciones**: Encuentra puntos de cruce entre curvas.
*   **Ayuda Contextual**: Explicaciones detalladas de cada ecuación y sus parámetros.

## 💻 Cómo Usar

1.  **Abrir la aplicación**: Simplemente abre el archivo `index.html` en tu navegador web moderno favorito.
2.  **Ingresar Datos**:
    *   Escribe los valores X e Y en la tabla.
    *   Opcionalmente, agrega los errores (±X, ±Y).
    *   Usa `Enter` para agregar nuevas filas rápidamente.
3.  **Graficar**: Haz clic en "Graficar" (o espera la actualización automática al editar).
4.  **Ajustar**: Selecciona el tipo de ajuste deseado en el menú desplegable de cada serie.
5.  **Exportar**: Usa los botones de exportar para guardar tus datos o descarga la gráfica como imagen.

## 🛠️ Tecnologías

*   **HTML5 / CSS3**: Interfaz moderna y responsiva.
*   **JavaScript (Vanilla)**: Lógica de la aplicación sin dependencias pesadas.
*   **Chart.js**: Librería potente para la visualización de gráficas.
*   **Chart.js Plugin Zoom**: Funcionalidad de zoom y paneo.

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y profesional.