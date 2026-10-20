/**
 * PISTA MÁGICA DE PATINES - ATRAPANDO MONEDAS
 * Motor de juego en Canvas 2.5D con perspectiva de pista infinita.
 * El muñequito patinador se mueve en tiempo real con la persona frente a la cámara,
 * con toques en pizarra digital o con las teclas de flechas.
 */

class CoinSkateTrack {
  constructor(canvasElement, cognitiveApp) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.app = cognitiveApp;

    // Estado del juego
    this.isRunning = false;
    this.animId = null;
    this.speed = 4.8;             // Velocidad de avance de la pista
    this.trackOffset = 0;         // Para animación de líneas continuas
    this.score = 0;
    this.coinsCaught = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.gameTime = 0;
    this.duration = 60;          // Duración de la ronda en segundos
    this.roundStartTime = 0;

    // El Muñequito Patinador
    this.skater = {
      lane: 'center',            // 'left', 'center', 'right'
      targetX: 400,              // Posición X objetivo
      currentX: 400,            // Posición X actual interpolada
      baseY: 380,                // Altura base en la pista
      y: 380,
      jumpY: 0,                  // Desplazamiento por salto
      isJumping: false,
      isCrouching: false,
      tilt: 0,                   // Inclinación al girar
      wheelSpin: 0,
      legPhase: 0,               // Animación de patinada alterna
      sparkleTimer: 0
    };

    // Coordenadas de los 3 carriles en la base
    this.lanes = {
      left: 230,
      center: 400,
      right: 570
    };

    // Objetos en la pista (Monedas, Estrellas altas, Gemas bajas)
    this.items = [];
    this.spawnTimer = 0;
    this.spawnInterval = 55;     // Cuadros entre nuevos objetos

    // Partículas visuales de impacto y chispas
    this.particles = [];
    this.floatingTexts = [];

    // Estadísticas de la sesión actual
    this.stats = {
      leftCaught: 0,
      rightCaught: 0,
      jumpCaught: 0,
      crouchCaught: 0,
      totalSpawned: 0
    };

    this.initTouchSupport();
  }

  // Soporte táctil directo sobre la pista para Pizarras Digitales
  initTouchSupport() {
    const handleTap = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (clientX - rect.left) * (this.canvas.width / rect.width);
      const clickY = (clientY - rect.top) * (this.canvas.height / rect.height);

      // Si toca la mitad superior -> SALTO
      if (clickY < this.canvas.height * 0.40) {
        this.performJump();
      }
      // Si toca la franja inferior muy abajo -> AGACHARSE
      else if (clickY > this.canvas.height * 0.85) {
        this.performCrouch();
      }
      // Si toca a los lados -> Cambiar de carril
      else {
        if (clickX < this.canvas.width * 0.36) {
          this.setLane('left');
        } else if (clickX > this.canvas.width * 0.64) {
          this.setLane('right');
        } else {
          this.setLane('center');
        }
      }
    };

    this.canvas.addEventListener('click', (e) => handleTap(e.clientX, e.clientY));
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault();
        handleTap(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  // Iniciar la carrera
  start() {
    this.isRunning = true;
    this.score = 0;
    this.coinsCaught = 0;
    this.streak = 0;
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.stats = { leftCaught: 0, rightCaught: 0, jumpCaught: 0, crouchCaught: 0, totalSpawned: 0 };
    this.roundStartTime = performance.now();
    this.skater.currentX = this.lanes.center;
    this.skater.targetX = this.lanes.center;
    this.skater.lane = 'center';

    window.soundEngine?.playSkateGlide();
    window.soundEngine?.speak("¡Patinador listo! ¡Atrapa las monedas moviéndote a la izquierda, derecha, saltando y agachándote!");

    this.loop();
  }

  // Detener la carrera
  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  // Control de carriles
  setLane(lane) {
    this.skater.lane = lane;
    this.skater.targetX = this.lanes[lane] || this.lanes.center;
    this.skater.tilt = (lane === 'left') ? -0.25 : (lane === 'right' ? 0.25 : 0);
    window.soundEngine?.playSkateGlide();
  }

  // Mover suavemente según la posición X continua de la cámara (0.0 a 1.0)
  setContinuousPosition(normalizedX) {
    const minX = this.lanes.left;
    const maxX = this.lanes.right;
    this.skater.targetX = minX + normalizedX * (maxX - minX);

    if (normalizedX < 0.35) {
      this.skater.lane = 'left';
      this.skater.tilt = -0.2;
    } else if (normalizedX > 0.65) {
      this.skater.lane = 'right';
      this.skater.tilt = 0.2;
    } else {
      this.skater.lane = 'center';
      this.skater.tilt = 0;
    }
  }

  // Acción de Salto (con la persona saltando frente a la cámara o botón arriba)
  performJump() {
    if (this.skater.isJumping) return;
    this.skater.isJumping = true;
    this.skater.isCrouching = false;
    this.skater.jumpProgress = 0;
    window.soundEngine?.playSkateJump();

    this.createFloatingText("⬆️ ¡SALTO!", this.skater.currentX, this.skater.y - 70, "#38BDF8");
  }

  // Acción de Agacharse (con la persona en cuclillas frente a la cámara o botón abajo)
  performCrouch() {
    this.skater.isCrouching = true;
    window.soundEngine?.playSkateCrouch();
    this.createFloatingText("⬇️ ¡CUCLILLAS!", this.skater.currentX, this.skater.y + 20, "#10B981");

    // Mantener agachado por 800ms antes de levantarse
    clearTimeout(this.crouchTimeout);
    this.crouchTimeout = setTimeout(() => {
      this.skater.isCrouching = false;
    }, 800);
  }

  // Bucle principal a 60 FPS
  loop() {
    if (!this.isRunning) return;

    this.update();
    this.render();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    const now = performance.now();
    this.gameTime = Math.floor((now - this.roundStartTime) / 1000);
    const timeLeft = Math.max(0, this.duration - this.gameTime);

    // Actualizar indicador en pantalla
    const timerEl = document.getElementById('coinGameTimer');
    if (timerEl) timerEl.textContent = `${timeLeft}s`;

    const scoreEl = document.getElementById('coinGameScore');
    if (scoreEl) scoreEl.textContent = `${this.coinsCaught}`;

    // Si termina el tiempo
    if (timeLeft <= 0) {
      this.finishRound();
      return;
    }

    // Avanzar animación de la pista
    this.trackOffset = (this.trackOffset + this.speed) % 60;

    // Interpolación suave del muñequito patinador hacia su carril objetivo
    this.skater.currentX += (this.skater.targetX - this.skater.currentX) * 0.22;
    this.skater.tilt *= 0.90; // Volver al centro poco a poco
    this.skater.wheelSpin += this.speed * 0.25;
    this.skater.legPhase += 0.15;

    // Física del salto
    if (this.skater.isJumping) {
      this.skater.jumpProgress += 0.055;
      this.skater.jumpY = Math.sin(this.skater.jumpProgress * Math.PI) * 115;
      if (this.skater.jumpProgress >= 1.0) {
        this.skater.isJumping = false;
        this.skater.jumpY = 0;
      }
    } else {
      this.skater.jumpY = 0;
    }

    this.skater.y = this.skater.baseY - this.skater.jumpY;

    // Chispas de los patines
    this.skater.sparkleTimer++;
    if (this.skater.sparkleTimer % 4 === 0) {
      this.particles.push({
        x: this.skater.currentX + (Math.random() * 30 - 15),
        y: this.skater.y + 40,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * -2 - 1,
        size: Math.random() * 4 + 2,
        alpha: 1,
        color: '#67E8F9'
      });
    }

    // Generar nuevas monedas y gemas
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnItem();
    }

    // Actualizar items en la pista
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.z -= 0.016 * (this.speed / 5);

      // Calcular coordenadas 2.5D en perspectiva
      const progress = 1 - item.z; // 0 en el horizonte, 1 en el frente
      const horizonY = 120;
      const bottomY = 440;
      item.screenY = horizonY + progress * (bottomY - horizonY);

      // Interpolación de carril en perspectiva cónica
      const centerAtHorizon = this.canvas.width / 2;
      const targetBaseX = this.lanes[item.lane];
      item.screenX = centerAtHorizon + progress * (targetBaseX - centerAtHorizon);

      item.scale = 0.25 + progress * 0.95;
      item.rotation = (item.rotation || 0) + 0.06;

      // Colisión con el patinador cuando el objeto llega al rango del jugador
      if (progress >= 0.78 && progress <= 0.96 && !item.collected) {
        const distHorizontal = Math.abs(item.screenX - this.skater.currentX);
        const horizontalHit = distHorizontal < 55;

        let verticalHit = false;
        if (item.type === 'coin') {
          // Moneda normal: se atrapa si no está saltando demasiado alto
          verticalHit = !this.skater.isJumping || this.skater.jumpY < 50;
        } else if (item.type === 'star_jump') {
          // Estrella alta: solo se atrapa si la persona SALTA
          verticalHit = this.skater.isJumping && this.skater.jumpY > 40;
        } else if (item.type === 'gem_crouch') {
          // Gema baja: solo se atrapa si la persona se AGACHA
          verticalHit = this.skater.isCrouching;
        }

        if (horizontalHit && verticalHit) {
          this.collectItem(item);
        }
      }

      // Eliminar item si pasa de largo
      if (item.z <= 0.05 || item.collected) {
        if (!item.collected) {
          // Si falló la moneda, se resetea la racha
          this.streak = 0;
        }
        this.items.splice(i, 1);
      }
    }

    // Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Actualizar textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.4;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Generador de monedas distribuidas en las 4 direcciones espaciales
  spawnItem() {
    this.stats.totalSpawned++;
    const laneChoices = ['left', 'center', 'right'];
    const chosenLane = laneChoices[Math.floor(Math.random() * laneChoices.length)];

    // Tipos de objeto: 60% moneda normal, 25% estrella de salto, 15% gema baja
    const rand = Math.random();
    let type = 'coin';
    let icon = '🪙';
    let points = 10;
    let label = "+10";

    if (rand > 0.75) {
      type = 'star_jump';
      icon = '⭐';
      points = 30;
      label = "¡SALTO! +30";
    } else if (rand > 0.60) {
      type = 'gem_crouch';
      icon = '💎';
      points = 30;
      label = "¡CUCLILLAS! +30";
    }

    this.items.push({
      lane: chosenLane,
      type: type,
      icon: icon,
      points: points,
      label: label,
      z: 1.0, // Al fondo del horizonte
      screenX: this.canvas.width / 2,
      screenY: 120,
      scale: 0.25,
      rotation: 0,
      collected: false
    });
  }

  // Acción al atrapar una moneda con éxito
  collectItem(item) {
    item.collected = true;
    this.coinsCaught++;
    this.streak++;
    this.maxStreak = Math.max(this.maxStreak, this.streak);

    const bonus = Math.min(5, Math.floor(this.streak / 3)) * 5;
    const earnedPoints = item.points + bonus;
    this.score += earnedPoints;

    // Registrar en métricas cognitivas psicomotoras
    if (this.app && this.app.metrics) {
      this.app.addStar();
      if (item.lane === 'left') {
        this.stats.leftCaught++;
        this.app.metrics.horizontalTrials++;
        this.app.metrics.horizontalHits++;
      } else if (item.lane === 'right') {
        this.stats.rightCaught++;
        this.app.metrics.horizontalTrials++;
        this.app.metrics.horizontalHits++;
      }

      if (item.type === 'star_jump') {
        this.stats.jumpCaught++;
        this.app.metrics.verticalTrials++;
        this.app.metrics.verticalHits++;
      } else if (item.type === 'gem_crouch') {
        this.stats.crouchCaught++;
        this.app.metrics.verticalTrials++;
        this.app.metrics.verticalHits++;
      }
    }

    // Efecto de audio
    if (item.type === 'coin') {
      window.soundEngine?.playCoinCollect();
    } else {
      window.soundEngine?.playGemCollect();
    }

    // Generar destellos de partículas doradas
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: item.screenX,
        y: item.screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        alpha: 1,
        color: item.type === 'coin' ? '#FBBF24' : (item.type === 'star_jump' ? '#60A5FA' : '#34D399')
      });
    }

    // Texto flotante de felicitación
    const textToShow = this.streak > 3 ? `${item.label} 🔥x${this.streak}` : item.label;
    this.createFloatingText(textToShow, item.screenX, item.screenY - 20, '#F59E0B');
  }

  createFloatingText(text, x, y, color) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      color: color,
      alpha: 1
    });
  }

  // Renderizado gráfico completo
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Cielo y fondo de la pista de patinaje
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 130);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.7, '#1E293B');
    skyGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 130);

    // Luces de la pista en el horizonte
    ctx.fillStyle = '#38BDF8';
    for (let i = 0; i < 12; i++) {
      const lx = 40 + i * 65;
      ctx.beginPath();
      ctx.arc(lx, 115, 3 + Math.sin(this.trackOffset * 0.1 + i) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Superficie de la Pista (Hielo reflectante y madera pulida)
    const rinkGrad = ctx.createLinearGradient(0, 120, 0, h);
    rinkGrad.addColorStop(0, '#7DD3FC');
    rinkGrad.addColorStop(0.35, '#BAE6FD');
    rinkGrad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = rinkGrad;
    ctx.fillRect(0, 120, w, h - 120);

    // Bordes laterales de la pista en perspectiva
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0284C7';
    // Borde izquierdo
    ctx.beginPath();
    ctx.moveTo(w * 0.35, 120);
    ctx.lineTo(w * 0.05, h);
    ctx.stroke();

    // Borde derecho
    ctx.beginPath();
    ctx.moveTo(w * 0.65, 120);
    ctx.lineTo(w * 0.95, h);
    ctx.stroke();

    // Rieles de Neón brillantes en las vallas
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38BDF8';
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, 120);
    ctx.lineTo(w * 0.05, h);
    ctx.moveTo(w * 0.65, 120);
    ctx.lineTo(w * 0.95, h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Líneas divisoras de carriles en perspectiva (con movimiento)
    this.renderLanesAndSpeedLines();

    // 4. Dibujar Monedas y Objetos acercándose
    this.renderItems();

    // 5. Dibujar el Muñequito Patinador en tiempo real
    this.renderSkater();

    // 6. Dibujar Partículas y Textos Flotantes
    this.renderFX();

    // 7. HUD de Marcador Arcade en la Pista
    this.renderHUD();
  }

  // Líneas divisorias de carriles con efecto de velocidad
  renderLanesAndSpeedLines() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const horizonY = 120;

    // Líneas continuas punteadas que avanzan
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
    ctx.lineWidth = 3;

    const numDashes = 7;
    for (let i = 0; i < numDashes; i++) {
      const p1 = Math.pow((i + (this.trackOffset / 60)) / numDashes, 2);
      const p2 = Math.pow((i + 0.45 + (this.trackOffset / 60)) / numDashes, 2);

      if (p1 >= 0 && p2 <= 1.1) {
        const y1 = horizonY + p1 * (h - horizonY);
        const y2 = horizonY + p2 * (h - horizonY);

        // Divisoria Carril Izq / Centro
        const x1L = (w * 0.45) + p1 * (w * 0.28 - w * 0.45);
        const x2L = (w * 0.45) + p2 * (w * 0.28 - w * 0.45);
        ctx.beginPath();
        ctx.moveTo(x1L, y1);
        ctx.lineTo(x2L, y2);
        ctx.stroke();

        // Divisoria Carril Centro / Der
        const x1R = (w * 0.55) + p1 * (w * 0.72 - w * 0.55);
        const x2R = (w * 0.55) + p2 * (w * 0.72 - w * 0.55);
        ctx.beginPath();
        ctx.moveTo(x1R, y1);
        ctx.lineTo(x2R, y2);
        ctx.stroke();
      }
    }
  }

  // Renderizar Monedas y Estrellas
  renderItems() {
    const ctx = this.ctx;

    this.items.forEach(item => {
      ctx.save();
      ctx.translate(item.screenX, item.screenY);
      ctx.scale(item.scale, item.scale);

      // Sombra en el suelo de la pista
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (item.type === 'coin') {
        // Moneda Dorada 3D brillante con reflejos
        ctx.rotate(Math.sin(item.rotation) * 0.25);
        
        // Borde exterior dorado
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Cara dorada brillante
        const coinGrad = ctx.createRadialGradient(-5, -6, 2, 0, 0, 20);
        coinGrad.addColorStop(0, '#FEF08A');
        coinGrad.addColorStop(0.6, '#F59E0B');
        coinGrad.addColorStop(1, '#B45309');
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo de estrella central en la moneda
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);

      } else if (item.type === 'star_jump') {
        // Estrella Alta Flotante (Requiere SALTO)
        ctx.translate(0, -50); // Flota alto en el aire
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 0, 0);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('¡SALTA!', 0, -32);

      } else if (item.type === 'gem_crouch') {
        // Gema Baja bajo Arco (Requiere AGACHARSE)
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 28, Math.PI, 0); // Arco
        ctx.stroke();

        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💎', 0, 8);

        ctx.fillStyle = '#065F46';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('¡CUCLILLAS!', 0, -30);
      }

      ctx.restore();
    });
  }

  // DIBUJAR AL MUÑEQUITO PATINADOR EN TIEMPO REAL
  renderSkater() {
    const ctx = this.ctx;
    const x = this.skater.currentX;
    const y = this.skater.y;
    const tilt = this.skater.tilt;
    const isJumping = this.skater.isJumping;
    const isCrouching = this.skater.isCrouching;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    // Sombra del patinador en la pista
    const shadowScale = isJumping ? Math.max(0.4, 1 - (this.skater.jumpY / 150)) : (isCrouching ? 1.3 : 1.0);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 48 + (isJumping ? this.skater.jumpY : 0), 32 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Posición del cuerpo según acción (normal, salto, agachado)
    let bodyY = 0;
    let bodyScaleY = 1.0;
    if (isCrouching) {
      bodyY = 18;
      bodyScaleY = 0.65;
    }

    ctx.save();
    ctx.translate(0, bodyY);
    ctx.scale(1.0, bodyScaleY);

    // 1. Patines en los pies
    const skateOffset = Math.sin(this.skater.legPhase) * 6;
    this.drawSkate(ctx, -18, 38 + skateOffset);
    this.drawSkate(ctx, 18, 38 - skateOffset);

    // 2. Piernas con rodilleras protectoras
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(-16, 12, 10, 26);
    ctx.fillRect(6, 12, 10, 26);

    // Rodilleras
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-11, 24, 7, 0, Math.PI * 2);
    ctx.arc(11, 24, 7, 0, Math.PI * 2);
    ctx.fill();

    // 3. Torso / Jersey de patinador
    const jerseyGrad = ctx.createLinearGradient(-22, -25, 22, 15);
    jerseyGrad.addColorStop(0, '#38BDF8');
    jerseyGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = jerseyGrad;
    ctx.beginPath();
    ctx.roundRect(-22, -22, 44, 35, 10);
    ctx.fill();

    // Número o estrella en la camiseta
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ 1', 0, -5);

    // 4. Brazos con coderas
    ctx.fillStyle = '#0369A1';
    if (isJumping) {
      // Brazos levantados al celebrar el salto
      ctx.fillRect(-30, -35, 9, 26);
      ctx.fillRect(21, -35, 9, 26);
    } else {
      // Brazos patinando rítmicamente
      ctx.fillRect(-30, -15, 9, 24);
      ctx.fillRect(21, -15, 9, 24);
    }

    // 5. Cabeza con Casco de Patinaje
    ctx.fillStyle = '#FBBF24'; // Piel sonriente
    ctx.beginPath();
    ctx.arc(0, -35, 16, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa y ojos del muñequito
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-5, -36, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -36, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -32, 6, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Casco deportivo aerodinámico con visera
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, -42, 17, Math.PI, 0);
    ctx.lineTo(19, -38);
    ctx.lineTo(-19, -38);
    ctx.closePath();
    ctx.fill();

    // Franja blanca reflectante en el casco
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -43, 14, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

    ctx.restore(); // Restaurar escala de cuerpo
    ctx.restore(); // Restaurar rotación y posición
  }

  // Dibujar un patín en línea con ruedas brillantes
  drawSkate(ctx, sx, sy) {
    // Bota del patín
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(sx - 7, sy - 10, 14, 14, 4);
    ctx.fill();

    // Guía del chasis de los patines
    ctx.fillStyle = '#64748B';
    ctx.fillRect(sx - 10, sy + 3, 20, 3);

    // 4 Ruedas de patinaje con giro de neón
    const wheelColors = ['#F59E0B', '#38BDF8', '#F59E0B', '#38BDF8'];
    for (let i = 0; i < 4; i++) {
      const wx = sx - 9 + i * 6;
      const wy = sy + 7;
      ctx.fillStyle = wheelColors[i];
      ctx.beginPath();
      ctx.arc(wx, wy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Renderizar chispas y textos flotantes
  renderFX() {
    const ctx = this.ctx;

    // Partículas
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Textos de monedas
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  // HUD estilo Arcade en el Canvas
  renderHUD() {
    const ctx = this.ctx;

    // Caja de Monedas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(16, 14, 190, 50, 14);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#FEF08A';
    ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${this.coinsCaught} Monedas`, 28, 46);

    // Caja de Racha / Combo si es mayor a 1
    if (this.streak > 1) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.beginPath();
      ctx.roundRect(220, 14, 150, 50, 14);
      ctx.fill();
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`🔥 Racha x${this.streak}`, 234, 46);
    }

    // Cronómetro superior
    const timeLeft = Math.max(0, this.duration - this.gameTime);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width - 150, 14, 134, 50, 14);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${timeLeft}s`, this.canvas.width - 83, 46);
  }

  // Finalizar la ronda y mostrar resultados
  finishRound() {
    this.stop();
    window.soundEngine?.playFanfare();
    window.soundEngine?.speak(`¡Excelente patinada! Atrapaste ${this.coinsCaught} monedas en la pista.`);

    const modal = document.getElementById('coinSummaryModal');
    if (modal) {
      document.getElementById('summaryCoinsCount').textContent = this.coinsCaught;
      document.getElementById('summaryMaxStreak').textContent = `x${this.maxStreak}`;
      document.getElementById('summaryLeftCoins').textContent = this.stats.leftCaught;
      document.getElementById('summaryRightCoins').textContent = this.stats.rightCaught;
      document.getElementById('summaryJumpCoins').textContent = this.stats.jumpCaught;
      document.getElementById('summaryCrouchCoins').textContent = this.stats.crouchCaught;
      modal.classList.add('active');
    }
  }
}

window.CoinSkateTrack = CoinSkateTrack;
