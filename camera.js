/**
 * MOTOR DE VISIÓN ARTIFICIAL Y DETECCIÓN DE MOVIMIENTO EN TIEMPO REAL
 * Utiliza la cámara web para detectar movimientos corporales del niño
 * en 4 zonas espaciales: ARRIBA (Salto), ABAJO (Cuclillas), IZQUIERDA y DERECHA (Patinadas).
 * Optimizado para funcionar 100% en el navegador sin dependencias externas.
 */

class MotionCameraEngine {
  constructor(videoElement, overlayCanvas) {
    this.video = videoElement;
    this.canvas = overlayCanvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null;

    // Canvas oculto de procesamiento matemático
    this.procCanvas = document.createElement('canvas');
    this.procCanvas.width = 160;
    this.procCanvas.height = 120;
    this.procCtx = this.procCanvas.getContext('2d', { willReadFrequently: true });

    this.stream = null;
    this.isActive = false;
    this.prevFrame = null;
    this.animId = null;

    // Sensibilidad y debounce de movimiento
    this.threshold = 28;       // Diferencia de brillo por píxel para considerarlo movimiento
    this.motionRatioTrigger = 0.07; // Porcentaje de píxeles activos en la zona para disparar acción
    this.lastTriggerTime = 0;
    this.cooldownMs = 600;     // Tiempo de enfriamiento para evitar falsos positivos repetidos
    this.onMotionDetected = null;

    // Estados visuales de las zonas
    this.zoneTriggers = {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  // Iniciar la cámara web
  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("La cámara web no es compatible en este navegador.");
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.isActive = true;

      // Configurar dimensiones del canvas overlay
      if (this.canvas) {
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
      }

      this.prevFrame = null;
      this.processLoop();
      return true;
    } catch (err) {
      console.warn("Permiso de cámara no concedido o cámara no disponible:", err);
      this.isActive = false;
      return false;
    }
  }

  // Detener cámara
  stop() {
    this.isActive = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Ciclo principal de procesamiento por visión artificial
  processLoop() {
    if (!this.isActive) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.analyzeMotion();
    }

    this.animId = requestAnimationFrame(() => this.processLoop());
  }

  analyzeMotion() {
    const pw = this.procCanvas.width;
    const ph = this.procCanvas.height;

    // Dibujar el fotograma en espejo (mirror effect natural para niños)
    this.procCtx.save();
    this.procCtx.scale(-1, 1);
    this.procCtx.drawImage(this.video, -pw, 0, pw, ph);
    this.procCtx.restore();

    const currImgData = this.procCtx.getImageData(0, 0, pw, ph);
    const currData = currImgData.data;

    // Si es el primer fotograma, guardar y continuar
    if (!this.prevFrame) {
      this.prevFrame = new Uint8Array(currData.length / 4);
      for (let i = 0, j = 0; i < currData.length; i += 4, j++) {
        this.prevFrame[j] = (currData[i] * 0.299 + currData[i + 1] * 0.587 + currData[i + 2] * 0.114);
      }
      return;
    }

    // Definición de las 4 zonas espaciales en la cuadrícula de baja resolución
    // [x1, y1, x2, y2]
    const zones = {
      up:    { x1: Math.floor(pw * 0.25), y1: 0,                   x2: Math.floor(pw * 0.75), y2: Math.floor(ph * 0.35) },
      down:  { x1: Math.floor(pw * 0.25), y1: Math.floor(ph * 0.65), x2: Math.floor(pw * 0.75), y2: ph },
      left:  { x1: 0,                   y1: Math.floor(ph * 0.25), x2: Math.floor(pw * 0.30), y2: Math.floor(ph * 0.75) },
      right: { x1: Math.floor(pw * 0.70), y1: Math.floor(ph * 0.25), x2: pw,                   y2: Math.floor(ph * 0.75) }
    };

    const motionCounts = { up: 0, down: 0, left: 0, right: 0 };
    const zoneSizes = {
      up: (zones.up.x2 - zones.up.x1) * (zones.up.y2 - zones.up.y1),
      down: (zones.down.x2 - zones.down.x1) * (zones.down.y2 - zones.down.y1),
      left: (zones.left.x2 - zones.left.x1) * (zones.left.y2 - zones.left.y1),
      right: (zones.right.x2 - zones.right.x1) * (zones.right.y2 - zones.right.y1)
    };

    // Calcular diferencia de flujo y movimiento
    let idx = 0;
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++, idx++) {
        const offset = idx * 4;
        const gray = (currData[offset] * 0.299 + currData[offset + 1] * 0.587 + currData[offset + 2] * 0.114);
        const diff = Math.abs(gray - this.prevFrame[idx]);

        // Guardar para el siguiente fotograma
        this.prevFrame[idx] = gray;

        if (diff > this.threshold) {
          // Clasificar en cuál zona ocurrió el movimiento
          if (x >= zones.up.x1 && x <= zones.up.x2 && y >= zones.up.y1 && y <= zones.up.y2) {
            motionCounts.up++;
          } else if (x >= zones.down.x1 && x <= zones.down.x2 && y >= zones.down.y1 && y <= zones.down.y2) {
            motionCounts.down++;
          } else if (x >= zones.left.x1 && x <= zones.left.x2 && y >= zones.left.y1 && y <= zones.left.y2) {
            motionCounts.left++;
          } else if (x >= zones.right.x1 && x <= zones.right.x2 && y >= zones.right.y1 && y <= zones.right.y2) {
            motionCounts.right++;
          }
        }
      }
    }

    // Determinar qué zona superó el umbral de movimiento
    const ratios = {
      up: motionCounts.up / zoneSizes.up,
      down: motionCounts.down / zoneSizes.down,
      left: motionCounts.left / zoneSizes.left,
      right: motionCounts.right / zoneSizes.right
    };

    // Detectar el pico dominante
    let maxDir = null;
    let maxRatio = this.motionRatioTrigger;

    for (const [dir, ratio] of Object.entries(ratios)) {
      this.zoneTriggers[dir] = ratio > this.motionRatioTrigger;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxDir = dir;
      }
    }

    const now = performance.now();
    if (maxDir && (now - this.lastTriggerTime > this.cooldownMs)) {
      this.lastTriggerTime = now;
      if (typeof this.onMotionDetected === 'function') {
        this.onMotionDetected(maxDir);
      }
    }

    // Dibujar la interfaz de Realidad Aumentada sobre el video
    this.renderAROverlay(ratios);
  }

  // Renderizar zonas interactivas estilo Patinaje sobre el canvas de la cámara
  renderAROverlay(ratios) {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // Zonas en coordenadas reales de pantalla
    const visualZones = [
      { id: 'up', label: '⬆️ SALTO', x: w * 0.22, y: 15, w: w * 0.56, h: h * 0.28, color: '#3B82F6', triggered: this.zoneTriggers.up },
      { id: 'down', label: '⬇️ AGACHARSE', x: w * 0.22, y: h * 0.70, w: w * 0.56, h: h * 0.27, color: '#10B981', triggered: this.zoneTriggers.down },
      { id: 'left', label: '⬅️ PATINAR IZQ', x: 15, y: h * 0.22, w: w * 0.26, h: h * 0.56, color: '#F59E0B', triggered: this.zoneTriggers.left },
      { id: 'right', label: 'PATINAR DER ➡️', x: w * 0.72, y: h * 0.22, w: w * 0.26, h: h * 0.56, color: '#EF4444', triggered: this.zoneTriggers.right }
    ];

    visualZones.forEach(zone => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 16);

      if (zone.triggered) {
        this.ctx.fillStyle = `${zone.color}77`; // Más opaco al activarse
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = zone.color;
        this.ctx.shadowBlur = 20;
      } else {
        this.ctx.fillStyle = `${zone.color}25`; // Translúcido en reposo
        this.ctx.strokeStyle = zone.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([8, 6]);
      }

      this.ctx.fill();
      this.ctx.stroke();

      // Texto de la zona
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 6;
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + zone.h / 2);

      this.ctx.restore();
    });
  }
}

window.MotionCameraEngine = MotionCameraEngine;
