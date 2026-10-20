/**
 * GENERADOR DE REPORTE COGNITIVO Y PSICOMOTRIZ (PATINAJE Y ESPACIO)
 * Evalúa las métricas motrices y de orientación espacial recolectadas
 * a través de la interacción con cámara web, pizarra digital y dinámicas de patinaje.
 */

class CognitiveReportGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  generate(profile, metrics) {
    this.renderProfile(profile);
    this.renderKPIs(metrics, profile);
    this.drawRadarChart(metrics);
    this.renderSkillsBreakdown(metrics);
    this.renderPedagogicalDiagnosis(profile, metrics);
    this.renderRecommendations(profile, metrics);
  }

  renderProfile(profile) {
    const nameEl = document.getElementById('reportChildName');
    const ageEl = document.getElementById('reportChildAge');
    const handEl = document.getElementById('reportChildHand');
    const dateEl = document.getElementById('reportDate');

    if (nameEl) nameEl.textContent = profile.name || "Patinador Explorador";
    if (ageEl) ageEl.textContent = `${profile.age || 6} años`;
    
    let handText = "No especificada";
    if (profile.hand === "right") handText = "Diestro (Mano/Pierna Derecha)";
    else if (profile.hand === "left") handText = "Zurdo (Mano/Pierna Izquierda)";
    else if (profile.hand === "ambidextrous") handText = "En definición / Ambidiestro";
    if (handEl) handEl.textContent = handText;

    const today = new Date();
    if (dateEl) dateEl.textContent = today.toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  }

  renderKPIs(metrics, profile) {
    // 1. Precisión Global en Pista
    const totalTrials = metrics.verticalTrials + metrics.horizontalTrials + metrics.matrixTrials;
    const totalHits = metrics.verticalHits + metrics.horizontalHits + metrics.matrixHits;
    const globalAccuracy = totalTrials > 0 ? Math.round((totalHits / totalTrials) * 100) : 0;
    
    const kpiGlobal = document.getElementById('kpiGlobalScore');
    if (kpiGlobal) kpiGlobal.textContent = `${globalAccuracy}%`;

    // 2. Lateralidad en Patinaje (Izquierda / Derecha)
    const horizAccuracy = metrics.horizontalTrials > 0 
      ? Math.round((metrics.horizontalHits / metrics.horizontalTrials) * 100) 
      : 0;
    const kpiLateral = document.getElementById('kpiLateralScore');
    const kpiLateralBadge = document.getElementById('kpiLateralBadge');
    if (kpiLateral) kpiLateral.textContent = `${horizAccuracy}%`;
    if (kpiLateralBadge) {
      if (horizAccuracy >= 80) {
        kpiLateralBadge.textContent = "Consolidada";
        kpiLateralBadge.className = "badge-status badge-green";
      } else if (horizAccuracy >= 55) {
        kpiLateralBadge.textContent = "En Consolidación";
        kpiLateralBadge.className = "badge-status badge-yellow";
      } else {
        kpiLateralBadge.textContent = "Requiere Apoyo";
        kpiLateralBadge.className = "badge-status badge-blue";
      }
    }

    // 3. Eje Vertical (Salto Arriba / Cuclillas Abajo)
    const vertAccuracy = metrics.verticalTrials > 0 
      ? Math.round((metrics.verticalHits / metrics.verticalTrials) * 100) 
      : 0;
    const kpiVertical = document.getElementById('kpiVerticalScore');
    const kpiVerticalBadge = document.getElementById('kpiVerticalBadge');
    if (kpiVertical) kpiVertical.textContent = `${vertAccuracy}%`;
    if (kpiVerticalBadge) {
      if (vertAccuracy >= 85) {
        kpiVerticalBadge.textContent = "Excelente";
        kpiVerticalBadge.className = "badge-status badge-green";
      } else {
        kpiVerticalBadge.textContent = "En desarrollo";
        kpiVerticalBadge.className = "badge-status badge-yellow";
      }
    }

    // 4. Velocidad de Reacción Motriz
    const avgReaction = metrics.reactionTimes.length > 0 
      ? Math.round(metrics.reactionTimes.reduce((a, b) => a + b, 0) / metrics.reactionTimes.length) 
      : 0;
    const kpiSpeed = document.getElementById('kpiSpeedScore');
    const kpiSpeedBadge = document.getElementById('kpiSpeedBadge');
    if (kpiSpeed) kpiSpeed.textContent = avgReaction > 0 ? `${(avgReaction / 1000).toFixed(2)}s` : '--';
    if (kpiSpeedBadge) {
      if (avgReaction > 0 && avgReaction < 1800) {
        kpiSpeedBadge.textContent = "Reflejos Ágiles";
        kpiSpeedBadge.className = "badge-status badge-green";
      } else if (avgReaction >= 1800 && avgReaction <= 3200) {
        kpiSpeedBadge.textContent = "Ritmo Adecuado";
        kpiSpeedBadge.className = "badge-status badge-yellow";
      } else {
        kpiSpeedBadge.textContent = "Reflexivo / Pausado";
        kpiSpeedBadge.className = "badge-status badge-blue";
      }
    }
  }

  // Gráfico de radar sobre Canvas HTML5
  drawRadarChart(metrics) {
    this.canvas = document.getElementById('cognitiveRadarCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 50;

    this.ctx.clearRect(0, 0, width, height);

    // Métricas normalizadas de 0 a 100
    const vertScore = metrics.verticalTrials > 0 ? (metrics.verticalHits / metrics.verticalTrials) * 100 : 80;
    const horizScore = metrics.horizontalTrials > 0 ? (metrics.horizontalHits / metrics.horizontalTrials) * 100 : 75;
    const memScore = metrics.memorySpanAchieved > 0 ? Math.min(100, (metrics.memorySpanAchieved / 5) * 100) : 70;
    const totalTrials = metrics.verticalTrials + metrics.horizontalTrials + metrics.matrixTrials;
    const totalHits = metrics.verticalHits + metrics.horizontalHits + metrics.matrixHits;
    const attScore = totalTrials > 0 ? (totalHits / totalTrials) * 100 : 75;
    
    let speedScore = 75;
    if (metrics.reactionTimes.length > 0) {
      const avg = metrics.reactionTimes.reduce((a, b) => a + b, 0) / metrics.reactionTimes.length;
      speedScore = Math.max(25, Math.min(100, 100 - ((avg - 1000) / 3000) * 60));
    }

    const categories = [
      { label: "Eje Vertical (Saltos/Bajo)", value: vertScore },
      { label: "Lateralidad (Patinada Izq/Der)", value: horizScore },
      { label: "Memoria Coreográfica", value: memScore },
      { label: "Velocidad de Reacción", value: speedScore },
      { label: "Percepción Visoespacial", value: attScore }
    ];

    const numAxes = categories.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    // Círculos guía concéntricos
    const levels = 4;
    this.ctx.strokeStyle = "#E2E8F0";
    this.ctx.lineWidth = 1.5;
    for (let i = 1; i <= levels; i++) {
      const r = (radius / levels) * i;
      this.ctx.beginPath();
      for (let a = 0; a < numAxes; a++) {
        const angle = a * angleSlice - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (a === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    }

    // Dibujar radios y etiquetas
    categories.forEach((cat, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x, y);
      this.ctx.strokeStyle = "#CBD5E1";
      this.ctx.stroke();

      this.ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif";
      this.ctx.fillStyle = "#0C4A6E";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      const labelDist = radius + 22;
      const lx = centerX + Math.cos(angle) * labelDist;
      const ly = centerY + Math.sin(angle) * labelDist;
      this.ctx.fillText(cat.label, lx, ly);
    });

    // Dibujar polígono de datos
    this.ctx.beginPath();
    categories.forEach((cat, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const currentRadius = (cat.value / 100) * radius;
      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;

      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.closePath();

    this.ctx.fillStyle = "rgba(2, 132, 199, 0.35)";
    this.ctx.fill();
    this.ctx.strokeStyle = "#0284C7";
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Puntos en los vértices
    categories.forEach((cat, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const currentRadius = (cat.value / 100) * radius;
      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = "#0369A1";
      this.ctx.fill();
      this.ctx.strokeStyle = "#FFFFFF";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  renderSkillsBreakdown(metrics) {
    const list = [
      { id: 'barVertical', hits: metrics.verticalHits, trials: metrics.verticalTrials, textId: 'textVertical' },
      { id: 'barHorizontal', hits: metrics.horizontalHits, trials: metrics.horizontalTrials, textId: 'textHorizontal' },
      { id: 'barMemory', hits: metrics.memoryHits, trials: metrics.memoryTrials, textId: 'textMemory' },
      { id: 'barMatrix', hits: metrics.matrixHits, trials: metrics.matrixTrials, textId: 'textMatrix' }
    ];

    list.forEach(item => {
      const bar = document.getElementById(item.id);
      const text = document.getElementById(item.textId);
      const pct = item.trials > 0 ? Math.round((item.hits / item.trials) * 100) : 0;
      if (bar) bar.style.width = `${pct}%`;
      if (text) text.textContent = `${pct}% (${item.hits}/${item.trials})`;
    });
  }

  // Diagnóstico Psicomotriz y Cognitivo basado en movimiento corporal de patinaje
  renderPedagogicalDiagnosis(profile, metrics) {
    const container = document.getElementById('pedagogicalAnalysisText');
    if (!container) return;

    const age = parseInt(profile.age) || 6;
    const name = profile.name || "El patinador";
    const vertPct = metrics.verticalTrials > 0 ? (metrics.verticalHits / metrics.verticalTrials) * 100 : 0;
    const horizPct = metrics.horizontalTrials > 0 ? (metrics.horizontalHits / metrics.horizontalTrials) * 100 : 0;
    const memSpan = metrics.memorySpanAchieved || 2;

    let diagnosis = `<p><strong>Aporte del Patinaje en el Neurodesarrollo:</strong> El patinaje y los movimientos motrices amplios activan el sistema vestibular y la propiocepción, lo cual acelera la consolidación del esquema corporal a los <strong>${age} años</strong>.</p>`;

    // Eje Vertical
    if (vertPct >= 80) {
      diagnosis += `<p>• <strong>Eje Vertical (Saltos vs Cuclillas):</strong> ${name} demostró un control motor y discriminación excelente (${Math.round(vertPct)}% de precisión). Reconoce con inmediatez la altura corporal, facilitando la postura erguida y la noción de espacio tridimensional.</p>`;
    } else {
      diagnosis += `<p>• <strong>Eje Vertical:</strong> Se registraron vacilaciones en los cambios de nivel arriba/abajo (${Math.round(vertPct)}%). Es recomendable seguir reforzando juegos de saltar y agacharse con estímulos sonoros.</p>`;
    }

    // Lateralidad
    if (age <= 5) {
      if (horizPct >= 70) {
        diagnosis += `<p>• <strong>Lateralidad y Giros (Izquierda / Derecha):</strong> Nivel sobresaliente para sus ${age} años. Aunque a esta edad la dominancia hemisférica sigue moldeándose, muestra una discriminación de lados (${Math.round(horizPct)}%) muy precoz y organizada.</p>`;
      } else {
        diagnosis += `<p>• <strong>Lateralidad:</strong> Desempeño acorde a la etapa preescolar (${age} años). Las dudas entre izquierda y derecha son completamente normales; el patinaje con estímulos visuales en pizarra digital estimula fuertemente este proceso.</p>`;
      }
    } else if (age >= 6 && age <= 7) {
      if (horizPct >= 80) {
        diagnosis += `<p>• <strong>Lateralidad:</strong> Lateralidad dinámica consolidada (${Math.round(horizPct)}%). ${name} orienta su cuerpo con precisión a izquierda y derecha, hito crucial para prevenir la escritura en espejo y apoyar la coordinación de pies en patinaje.</p>`;
      } else {
        diagnosis += `<p>• <strong>Lateralidad:</strong> Se encuentra en fase activa de afianzamiento (${Math.round(horizPct)}%). La práctica con cámara y pizarra digital resulta ideal en este momento para fijar la dominancia lateral definitiva.</p>`;
      }
    } else { // 8+ años
      if (horizPct >= 85) {
        diagnosis += `<p>• <strong>Lateralidad:</strong> Consolidación óptima tanto corporal como proyectada (${Math.round(horizPct)}%). Capacidad de ejecutar giros y desplazamientos complejos sin confusión.</p>`;
      } else {
        diagnosis += `<p>• <strong>Lateralidad:</strong> Presenta confusiones esporádicas entre flancos. Conviene entrenar la orientación cruzada (mano derecha toca rodilla izquierda).</p>`;
      }
    }

    // Memoria Coreográfica
    diagnosis += `<p>• <strong>Memoria de Rutina Motriz:</strong> Retuvo y ejecutó secuencias de hasta <strong>${memSpan} movimientos consecutivos</strong>. Esta función ejecutiva es indispensable tanto en secuencias de patinaje como en la planificación motriz y la atención en el aula.</p>`;

    container.innerHTML = diagnosis;
  }

  renderRecommendations(profile, metrics) {
    const listContainer = document.getElementById('recommendationsList');
    if (!listContainer) return;

    const horizPct = metrics.horizontalTrials > 0 ? (metrics.horizontalHits / metrics.horizontalTrials) * 100 : 0;
    const memSpan = metrics.memorySpanAchieved || 2;

    const recommendations = [];

    // Recomendación 1: Patinaje y circuitos con conos
    recommendations.push({
      title: "⛸️ Circuitos de Patinaje con Conos Coloridos",
      desc: "Colocar conos en la pista o patio: conos amarillos a la izquierda y conos rojos a la derecha. Pedir al niño esquivar los conos cantando la dirección en voz alta para reforzar la conexión motora-verbal."
    });

    // Recomendación 2: Uso en Pizarra Digital Interactiva
    recommendations.push({
      title: "🖥️ Dinámicas en Pizarra Digital Grupal",
      desc: "Proyectar la aplicación en la pizarra digital del aula. Invitar a 2 niños por turnos: uno ejecuta la orden con toque gigante en la pantalla y el otro realiza el salto o inclinación física en el aula."
    });

    // Recomendación 3: Lateralidad corporal y pulseras
    if (horizPct < 80) {
      recommendations.push({
        title: "🛼 Distintivo en el Patín Dominante",
        desc: "Colocar una cinta reflectante o cordón llamativo en el patín o zapatilla derecha. Servirá como ancla propioceptiva: 'la pierna de la cinta azul es mi derecha'."
      });
    } else {
      recommendations.push({
        title: "🔄 Giros Cruzados y Equilibrio",
        desc: "Practicar deslizamientos en un solo pie alternando izquierda y derecha en líneas rectas pintadas con tiza en el suelo."
      });
    }

    // Recomendación 4: Coreografías de pasos
    if (memSpan <= 3) {
      recommendations.push({
        title: "🎵 Coreografías Cortas con Música",
        desc: "Armar pequeñas secuencias rítmicas: 'Patinada izquierda -> Salto -> Patinada derecha' siguiendo el ritmo de una canción favorita."
      });
    } else {
      recommendations.push({
        title: "🏆 Desafíos de Patinaje en Laberinto",
        desc: "Dibujar con tiza en el suelo una pista en cuadrícula para patinar siguiendo flechas y coordenadas trazadas."
      });
    }

    listContainer.innerHTML = recommendations.map(rec => `
      <div class="rec-card">
        <h5>${rec.title}</h5>
        <p>${rec.desc}</p>
      </div>
    `).join('');
  }
}

window.reportGenerator = new CognitiveReportGenerator();
