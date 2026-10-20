# ⛸️ Patinaje Cognitivo: Pista Interactiva en Pizarra Digital y Cámara Web

Una aplicación web interactiva de psicomotricidad y neurodesarrollo que permite medir, enseñar y fortalecer la **ubicación espacial (arriba, abajo, izquierda, derecha)** a través de una **temática de patinaje**, con **detección de movimiento corporal por cámara web** y soporte táctil para **pizarras digitales interactivas (Smartboards)**.

---

## 🌟 Tres Modos de Interacción para el Aula y la Pista

1. **📷 Visión por Cámara Web en Tiempo Real (Motion AR):**
   - El niño se sitúa frente a la cámara (a 1.5 - 2 metros).
   - Un sistema de visión artificial analiza el movimiento corporal en 4 zonas dinámicas tipo espejo:
     - **⬆️ Salto (Arriba):** Saltar o levantar los brazos sobre la cabeza.
     - **⬇️ Cuclillas (Abajo):** Agacharse o descender el centro de gravedad.
     - **⬅️ Inclinación / Patinada Izquierda:** Mover el cuerpo hacia el lado izquierdo.
     - **➡️ Inclinación / Patinada Derecha:** Mover el cuerpo hacia el lado derecho.
2. **🖥️ Pizarra Digital Interactiva (Smartboard / Pizarra Táctil):**
   - Botón directo de **"Pantalla Completa"** para proyectar en pizarras interactivas (Promethean, SMART Board, ViewSonic, etc.).
   - Botones táctiles extragrandes con alto contraste para ser presionados con la mano, pies o lápiz óptico.
3. **🎹 Teclado y Control Asistido:**
   - Flechas del teclado (`↑`, `↓`, `←`, `→`) activas para profesores, terapeutas o niños en ordenadores portátiles.

---

## 🎮 Módulos de Patinaje Cognitivo

| Módulo | Dinámica de Patinaje | Área Cognitiva Evaluada |
| :--- | :--- | :--- |
| **🧭 1. Escuela de Patinaje** | Calibración de movimientos corporales frente a la cámara y reconocimiento de las 4 direcciones. | Esquema corporal, autopercepción y lateralidad básica. |
| **🏁 2. Circuito de Obstáculos** | Patinar por 3 carriles esquivando conos, saltando charcos (arriba) y agachándose bajo cintas (abajo). | Velocidad de reacción motriz (ms), atención selectiva y control inhibitorio. |
| **🎵 3. Coreografía de Pista** | Memorizar y reproducir secuencias de pasos y giros de patinaje de 2 a 5 movimientos. | Memoria de trabajo visoespacial y planificación motriz secuencial. |
| **🛼 4. Laberinto de Conos** | Identificar la posición relativa de los conos respecto a los patines centrales en una matriz 3x3. | Relaciones espaciales proyectadas y descentración cognitiva. |

---

## 📊 Aporte Post-Juego: Informe Psicomotriz y Cognitivo

Al terminar de jugar (o pulsando **"Ver Reporte Cognitivo y Motriz"**), se genera automáticamente un informe profesional:

* **Ficha del Alumno**: Nombre, edad, dominancia lateral y fecha.
* **Métricas Cuantitativas (KPIs)**:
  * Precisión total en pista (%).
  * Nivel de consolidación de lateralidad (*Consolidada*, *En consolidación*, *Requiere apoyo*).
  * Dominio del eje vertical (Saltos / Cuclillas).
  * Velocidad de reacción motriz en segundos.
* **Gráfico de Radar sobre Canvas (5 Dimensiones Psicomotrices)**:
  1. Eje Vertical (Saltos y Cuclillas)
  2. Lateralidad y Giros
  3. Memoria Coreográfica
  4. Velocidad de Reacción
  5. Percepción Visoespacial Relativa
* **Diagnóstico Interpretativo según Edad**:
  * Análisis pedagógico basado en hitos del neurodesarrollo (4 a 10 años).
* **Plan de Estimulación Práctico**:
  * Actividades con conos en pista de patinaje, pulseras distintivas en el patín dominante, ejercicios de psicomotricidad vivenciada y dinámicas para pizarra digital en clase.
* **Impresión / Exportación a PDF**:
  * Estilos de impresión (`@media print`) preparados para generar una ficha formal lista para compartir con familias o terapeutas.

---

## 🚀 ¿Cómo Abrir la Aplicación?

1. No requiere instalación de programas adicionales ni terminales.
2. Abre la carpeta del proyecto en tu computadora:  
   `c:\Users\Aprendiz\Downloads\repositorio`
3. Haz **doble clic en el archivo [**`index.html`**](file:///c:/Users/Aprendiz/Downloads/repositorio/index.html)**. Se abrirá en tu navegador (Google Chrome, Edge, Firefox, etc.).
4. Si deseas usar la cámara, pulsa **"Permitir"** en el aviso del navegador para activar la detección corporal en vivo. Para usar en pizarra digital, pulsa **"🖥️ Pantalla Completa"**.

---

## 📁 Estructura del Proyecto

- [**`index.html`**](file:///c:/Users/Aprendiz/Downloads/repositorio/index.html): Interfaz principal con pista de patinaje, cámara web y controles para pizarra digital.
- [**`camera.js`**](file:///c:/Users/Aprendiz/Downloads/repositorio/camera.js): Motor de visión artificial en tiempo real con detección de movimiento corporal en 4 zonas espaciales y realidad aumentada en espejo.
- [**`styles.css`**](file:///c:/Users/Aprendiz/Downloads/repositorio/styles.css): Estilos visuales de pista de hielo/ruedas, botones gigantes táctiles, diseño responsivo y hoja de impresión para PDF.
- [**`audio.js`**](file:///c:/Users/Aprendiz/Downloads/repositorio/audio.js): Efectos sonoros de patinaje (deslizamiento, saltos, cuclillas) y síntesis de voz en español con Web Speech API.
- [**`game.js`**](file:///c:/Users/Aprendiz/Downloads/repositorio/game.js): Lógica de pistas, cronómetro de reflejos en milisegundos, animaciones de patinador y atajos de teclado.
- [**`report.js`**](file:///c:/Users/Aprendiz/Downloads/repositorio/report.js): Motor de evaluación psicomotriz, gráfico de radar en Canvas HTML5 y diagnósticos pedagógicos.
