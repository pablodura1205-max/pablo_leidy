/**
 * PATINAJE COGNITIVO - LÓGICA DE JUEGOS Y CONTROLADOR PRINCIPAL
 * Soporte para Cámara Web (Visión Artificial), Pizarra Digital (Toques Gigantes)
 * y Teclado. Evalúa funciones visoespaciales y motrices en niños.
 */

class CognitiveApp {
  constructor() {
    this.profile = {
      name: 'Patinador',
      age: 6,
      hand: 'right',
      cameraEnabled: true
    };

    this.metrics = {
      verticalTrials: 0,
      verticalHits: 0,
      horizontalTrials: 0,
      horizontalHits: 0,
      reactionTimes: [],
      memoryTrials: 0,
      memoryHits: 0,
      memorySpanAchieved: 0,
      matrixTrials: 0,
      matrixHits: 0,
      totalStars: 0
    };

    this.currentScreen = 'welcome';
    
    // Motor de Cámara
    this.motionEngine = null;
    this.isCameraRunning = false;

    // Variables de Circuito de Obstáculos
    this.challengeRound = 0;
    this.challengeMaxRounds = 8;
    this.challengeTarget = null;
    this.challengeStartTime = 0;

    // Variables de Coreografía (Memoria Espacial)
    this.memorySequence = [];
    this.playerSequence = [];
    this.memoryLevel = 2;
    this.isShowingSequence = false;

    // Variables de Laberinto de Conos (Espacio Relativo)
    this.matrixRound = 0;
    this.matrixMaxRounds = 6;
    this.matrixTargetDirection = null;

    this.initCameraEngine();
    this.initEventListeners();
    this.initKeyboardSupport();
  }

  // Inicializar el sistema de visión artificial por cámara
  initCameraEngine() {
    const video = document.getElementById('webcamVideo');
    const canvas = document.getElementById('cameraArCanvas');

    if (video && canvas && window.MotionCameraEngine) {
      this.motionEngine = new window.MotionCameraEngine(video, canvas);
      this.motionEngine.onMotionDetected = (dir) => {
        this.handleUniversalDirectionInput(dir, 'camera');
      };

      // Seguimiento continuo del cuerpo de la persona frente a la cámara
      this.motionEngine.onPoseUpdate = (pose) => {
        if (this.currentScreen === 'screenChallenge' && this.coinTrack && this.coinTrack.isRunning) {
          this.coinTrack.setContinuousPosition(pose.x);
          if (pose.action === 'jump') {
            this.coinTrack.performJump();
          } else if (pose.action === 'crouch') {
            this.coinTrack.performCrouch();
          }
        }
      };
    }
  }

  async toggleCamera(forceState = null) {
    if (!this.motionEngine) return;

    const newState = (forceState !== null) ? forceState : !this.isCameraRunning;
    const globalBtn = document.getElementById('cameraGlobalToggleBtn');
    const inGameBtn = document.getElementById('toggleCameraInGameBtn');
    const hubBadge = document.getElementById('cameraHubBadge');
    const statusText = document.getElementById('cameraDetectionStatus');

    if (newState) {
      const ok = await this.motionEngine.start();
      if (ok) {
        this.isCameraRunning = true;
        const pipVideo = document.getElementById('trackPipVideo');
        if (pipVideo) {
          pipVideo.srcObject = this.motionEngine.stream;
        }

        if (globalBtn) {
          globalBtn.textContent = '📷 Cámara: ACTIVA';
          globalBtn.classList.add('active');
        }
        if (inGameBtn) inGameBtn.textContent = 'Pausar Cámara';
        if (hubBadge) {
          hubBadge.textContent = '🟢 Cámara Activa';
          hubBadge.style.color = '#065F46';
        }
        if (statusText) statusText.textContent = '🟢 Visión Activa: Muévete en las zonas marcadas';
      } else {
        this.isCameraRunning = false;
        if (globalBtn) globalBtn.textContent = '📷 Cámara: Sin Permiso';
        if (hubBadge) hubBadge.textContent = '✋ Modo Pizarra Digital';
        if (statusText) statusText.textContent = '⚠️ Cámara no disponible. Usa toques en la pantalla.';
      }
    } else {
      this.motionEngine.stop();
      this.isCameraRunning = false;
      const pipVideo = document.getElementById('trackPipVideo');
      if (pipVideo) pipVideo.srcObject = null;

      if (globalBtn) {
        globalBtn.textContent = '📷 Cámara: OFF';
        globalBtn.classList.remove('active');
      }
      if (inGameBtn) inGameBtn.textContent = 'Activar Cámara';
      if (hubBadge) hubBadge.textContent = '✋ Modo Pizarra Digital';
      if (statusText) statusText.textContent = '⏸️ Cámara pausada. Toca los botones de la pantalla.';
    }
  }

  // Alternar Modo Pantalla Completa para Pizarras Digitales (Smartboards)
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        document.body.classList.add('whiteboard-mode');
        document.getElementById('fullscreenToggleBtn').textContent = '🗗 Salir Pantalla Completa';
      }).catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          document.body.classList.remove('whiteboard-mode');
          document.getElementById('fullscreenToggleBtn').textContent = '🖥️ Pantalla Completa';
        });
      }
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }
  }

  initEventListeners() {
    // Formulario de bienvenida
    const startForm = document.getElementById('profileForm');
    if (startForm) {
      startForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.soundEngine.initAudioContext();
        window.soundEngine.playClick();

        const nameInput = document.getElementById('childNameInput').value.trim();
        const ageInput = parseInt(document.getElementById('childAgeInput').value) || 6;
        const handInput = document.getElementById('childHandInput').value;
        const camCheckbox = document.getElementById('enableCameraCheckbox').checked;

        this.profile.name = nameInput || "Patinador";
        this.profile.age = ageInput;
        this.profile.hand = handInput;
        this.profile.cameraEnabled = camCheckbox;

        document.getElementById('hubChildName').textContent = this.profile.name;
        document.getElementById('hubChildAge').textContent = `${this.profile.age} años`;

        this.showScreen('screenHub');

        if (this.profile.cameraEnabled) {
          this.toggleCamera(true);
        }

        window.soundEngine.speak(`¡Patinador ${this.profile.name}, bienvenido a la pista! Elige un desafío.`);
      });
    }

    // Botones de cabecera
    document.getElementById('fullscreenToggleBtn')?.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.toggleFullscreen();
    });

    document.getElementById('cameraGlobalToggleBtn')?.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.toggleCamera();
    });

    document.getElementById('toggleCameraInGameBtn')?.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.toggleCamera();
    });

    const muteBtn = document.getElementById('muteToggleBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        document.getElementById('infoModal').classList.add('active');
      });
    }

    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        document.getElementById('infoModal').classList.remove('active');
      });
    }

    // Repetir voz en cualquier pantalla
    document.querySelectorAll('.speech-repeat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        if (this.lastSpokenInstruction) {
          window.soundEngine.speak(this.lastSpokenInstruction);
        }
      });
    });

    // Regresar al Hub
    document.querySelectorAll('.stage-back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        if (this.coinTrack) this.coinTrack.stop();
        document.getElementById('coinSummaryModal')?.classList.remove('active');
        this.showScreen('screenHub');
      });
    });

    // Botones táctiles de apoyo para la Pista de Monedas
    document.getElementById('btnTrackLeft')?.addEventListener('click', () => this.coinTrack?.setLane('left'));
    document.getElementById('btnTrackRight')?.addEventListener('click', () => this.coinTrack?.setLane('right'));
    document.getElementById('btnTrackJump')?.addEventListener('click', () => this.coinTrack?.performJump());
    document.getElementById('btnTrackCrouch')?.addEventListener('click', () => this.coinTrack?.performCrouch());

    // Botones del Modal de Monedas Atrapadas
    document.getElementById('btnPlayAgainTrack')?.addEventListener('click', () => {
      document.getElementById('coinSummaryModal')?.classList.remove('active');
      this.coinTrack?.start();
    });
    document.getElementById('btnViewReportFromSummary')?.addEventListener('click', () => {
      document.getElementById('coinSummaryModal')?.classList.remove('active');
      this.generateAndShowReport();
    });

    // Accesos a Actividades
    document.getElementById('cardLearn')?.addEventListener('click', () => this.startLearnModule());
    document.getElementById('cardChallenge')?.addEventListener('click', () => this.startChallengeModule());
    document.getElementById('cardMemory')?.addEventListener('click', () => this.startMemoryModule());
    document.getElementById('cardMatrix')?.addEventListener('click', () => this.startMatrixModule());

    // Botones del Reporte
    document.getElementById('btnGoReport')?.addEventListener('click', () => this.generateAndShowReport());
    document.getElementById('btnBackToHubFromReport')?.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.showScreen('screenHub');
    });
    document.getElementById('btnRestartAll')?.addEventListener('click', () => {
      window.soundEngine.playClick();
      if (confirm('¿Deseas iniciar una nueva sesión para otro alumno?')) {
        location.reload();
      }
    });

    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
      window.print();
    });

    // Interacción táctil en Pizarra Digital (todos los botones con clase wb-btn)
    document.querySelectorAll('.wb-btn').forEach(btn => {
      const handleTouchOrClick = (e) => {
        e.preventDefault();
        btn.classList.add('active-touch');
        setTimeout(() => btn.classList.remove('active-touch'), 200);
        const dir = btn.dataset.direction;
        if (dir) {
          this.handleUniversalDirectionInput(dir, 'touch');
        }
      };
      btn.addEventListener('click', handleTouchOrClick);
      btn.addEventListener('touchstart', handleTouchOrClick, { passive: false });
    });
  }

  // Soporte de Teclado
  initKeyboardSupport() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dirMap = {
          'ArrowUp': 'up',
          'ArrowDown': 'down',
          'ArrowLeft': 'left',
          'ArrowRight': 'right'
        };
        const dir = dirMap[e.key];
        this.handleUniversalDirectionInput(dir, 'keyboard');
      }
    });
  }

  // Manejador Universal de Direcciones (Cámara + Pizarra Digital + Teclado)
  handleUniversalDirectionInput(dir, source = 'touch') {
    if (this.currentScreen === 'screenLearn') {
      this.handleLearnPress(dir);
    } else if (this.currentScreen === 'screenChallenge') {
      if (this.coinTrack && this.coinTrack.isRunning) {
        if (dir === 'left') this.coinTrack.setLane('left');
        else if (dir === 'right') this.coinTrack.setLane('right');
        else if (dir === 'up') this.coinTrack.performJump();
        else if (dir === 'down') this.coinTrack.performCrouch();
      }
    } else if (this.currentScreen === 'screenMemory' && !this.isShowingSequence) {
      this.handleMemoryInput(dir);
    }
  }

  addStar() {
    this.metrics.totalStars += 1;
    document.getElementById('hubStarsCount').textContent = this.metrics.totalStars;
  }

  showVisualFeedback(isCorrect) {
    const overlay = document.getElementById('feedbackOverlay');
    if (!overlay) return;
    overlay.textContent = isCorrect ? '🌟 ¡Patinada Perfecta!' : '💡 ¡Casi! Sigue patinando';
    overlay.className = `feedback-overlay show ${isCorrect ? 'correct' : 'incorrect'}`;
    setTimeout(() => {
      overlay.classList.remove('show');
    }, 700);
  }

  setInstruction(text, speak = true) {
    this.lastSpokenInstruction = text;
    document.querySelectorAll('.stage-instruction-text').forEach(banner => {
      banner.textContent = text;
    });
    if (speak) {
      window.soundEngine.speak(text);
    }
  }

  /* -------------------------------------------------------------
     MÓDULO 1: ESCUELA DE PATINAJE (CALIBRACIÓN Y TUTORIAL)
     ------------------------------------------------------------- */
  startLearnModule() {
    window.soundEngine.playClick();
    this.showScreen('screenLearn');
    this.setInstruction('Salta, agáchate o inclínate hacia los lados frente a la cámara, o toca los botones de la pizarra.');
  }

  handleLearnPress(dir) {
    const labels = {
      up: '¡Salto de Patinaje! Hacia arriba ⬆️',
      down: '¡Agáchate en cuclillas! Hacia abajo ⬇️',
      left: '¡Patinar a la Izquierda! ⬅️',
      right: '¡Patinar a la Derecha! ➡️'
    };

    if (dir === 'up') window.soundEngine.playSkateJump();
    else if (dir === 'down') window.soundEngine.playSkateCrouch();
    else window.soundEngine.playSkateGlide();

    this.setInstruction(labels[dir]);
    this.addStar();
  }

  /* -------------------------------------------------------------
     MÓDULO 2: PISTA MÁGICA DE MONEDAS EN PATINES (CANVAS 2.5D)
     ------------------------------------------------------------- */
  startChallengeModule() {
    window.soundEngine.playClick();
    this.showScreen('screenChallenge');

    const canvas = document.getElementById('coinRinkCanvas');
    if (canvas && window.CoinSkateTrack) {
      if (!this.coinTrack) {
        this.coinTrack = new window.CoinSkateTrack(canvas, this);
      }
      this.coinTrack.start();

      const pipVideo = document.getElementById('trackPipVideo');
      if (pipVideo && this.motionEngine && this.motionEngine.stream) {
        pipVideo.srcObject = this.motionEngine.stream;
      }
    }

    this.setInstruction('¡Atrapa las monedas moviéndote a los lados con tu cuerpo o tocando la pista!');
  }

  nextChallengeRound() {
    if (this.challengeRound >= this.challengeMaxRounds) {
      window.soundEngine.playFanfare();
      this.setInstruction('¡Genial! Has superado todo el circuito de patinaje.');
      setTimeout(() => {
        this.showScreen('screenHub');
      }, 2000);
      return;
    }

    this.challengeRound++;
    document.getElementById('challengeRoundIndicator').textContent = 
      `Ronda ${this.challengeRound} de ${this.challengeMaxRounds}`;

    const directions = ['up', 'down', 'left', 'right'];
    this.challengeTarget = directions[Math.floor(Math.random() * directions.length)];

    const obstacleEl = document.getElementById('circuitObstacle');
    const skaterEl = document.getElementById('circuitSkater');

    // Restablecer posición neutra del patinador
    if (skaterEl) {
      skaterEl.className = 'skater-hero lane-center';
    }

    // Estímulo visual en la pista según la orden
    const obstacleMap = {
      up: { icon: '🕳️ Charco', desc: '¡SALTA sobre el charco! (ARRIBA)' },
      down: { icon: '🚩 Cinta Baja', desc: '¡AGÁCHATE en cuclillas! (ABAJO)' },
      left: { icon: '⚠️ Cono a la Derecha', desc: '¡PATINA A LA IZQUIERDA para esquivar!' },
      right: { icon: '⚠️ Cono a la Izquierda', desc: '¡PATINA A LA DERECHA para esquivar!' }
    };

    if (obstacleEl) {
      obstacleEl.textContent = obstacleMap[this.challengeTarget].icon;
    }

    this.setInstruction(obstacleMap[this.challengeTarget].desc);
    this.challengeStartTime = performance.now();
  }

  handleChallengeInput(chosenDir) {
    if (!this.challengeTarget) return;

    const reactionTime = Math.round(performance.now() - this.challengeStartTime);
    this.metrics.reactionTimes.push(reactionTime);

    const isCorrect = (chosenDir === this.challengeTarget);

    // Animación física del patinador en la pista
    const skaterEl = document.getElementById('circuitSkater');
    if (skaterEl) {
      if (chosenDir === 'up') {
        skaterEl.className = 'skater-hero lane-center action-jump';
        window.soundEngine.playSkateJump();
      } else if (chosenDir === 'down') {
        skaterEl.className = 'skater-hero lane-center action-crouch';
        window.soundEngine.playSkateCrouch();
      } else if (chosenDir === 'left') {
        skaterEl.className = 'skater-hero lane-left';
        window.soundEngine.playSkateGlide();
      } else if (chosenDir === 'right') {
        skaterEl.className = 'skater-hero lane-right';
        window.soundEngine.playSkateGlide();
      }
    }

    // Registro métrico
    if (this.challengeTarget === 'up' || this.challengeTarget === 'down') {
      this.metrics.verticalTrials++;
      if (isCorrect) this.metrics.verticalHits++;
    } else {
      this.metrics.horizontalTrials++;
      if (isCorrect) this.metrics.horizontalHits++;
    }

    if (isCorrect) {
      window.soundEngine.playSuccess();
      this.showVisualFeedback(true);
      this.addStar();
    } else {
      window.soundEngine.playMistake();
      this.showVisualFeedback(false);
    }

    this.challengeTarget = null;
    setTimeout(() => {
      this.nextChallengeRound();
    }, 1100);
  }

  /* -------------------------------------------------------------
     MÓDULO 3: COREOGRAFÍA DE PISTA (MEMORIA DE TRABAJO MOTRIZ)
     ------------------------------------------------------------- */
  startMemoryModule() {
    window.soundEngine.playClick();
    this.showScreen('screenMemory');
    this.memoryLevel = 2;
    this.playerSequence = [];
    this.startMemoryRound();
  }

  startMemoryRound() {
    this.playerSequence = [];
    this.isShowingSequence = true;
    document.getElementById('memoryLevelIndicator').textContent = 
      `Nivel ${this.memoryLevel - 1} (${this.memoryLevel} movimientos)`;

    const directions = ['up', 'right', 'down', 'left'];
    this.memorySequence = [];
    for (let i = 0; i < this.memoryLevel; i++) {
      this.memorySequence.push(directions[Math.floor(Math.random() * directions.length)]);
    }

    const slotContainer = document.getElementById('memorySlots');
    if (slotContainer) {
      slotContainer.innerHTML = this.memorySequence.map(() => `<div class="seq-slot"></div>`).join('');
    }

    this.setInstruction('Observa y escucha la rutina de patinaje...', false);

    let delay = 900;
    this.memorySequence.forEach((dir, index) => {
      setTimeout(() => {
        this.highlightMemoryButton(dir);
      }, delay);
      delay += 850;
    });

    setTimeout(() => {
      this.isShowingSequence = false;
      this.setInstruction('¡Tu turno! Repite la rutina con tu cuerpo o tocando la pizarra.');
    }, delay);
  }

  highlightMemoryButton(dir) {
    const btn = document.querySelector(`.memory-dpad .wb-btn[data-direction="${dir}"]`);
    if (btn) {
      btn.classList.add('highlighted');
      window.soundEngine.playDirectionTone(dir);
      setTimeout(() => {
        btn.classList.remove('highlighted');
      }, 450);
    }
  }

  handleMemoryInput(chosenDir) {
    this.highlightMemoryButton(chosenDir);
    this.playerSequence.push(chosenDir);
    const stepIdx = this.playerSequence.length - 1;

    const slots = document.querySelectorAll('#memorySlots .seq-slot');
    if (slots[stepIdx]) {
      slots[stepIdx].classList.add('filled');
    }

    if (chosenDir !== this.memorySequence[stepIdx]) {
      window.soundEngine.playMistake();
      this.showVisualFeedback(false);
      this.metrics.memoryTrials++;
      this.setInstruction('¡Casi! Vamos a repetir la rutina.');
      setTimeout(() => {
        this.startMemoryRound();
      }, 1500);
      return;
    }

    if (this.playerSequence.length === this.memorySequence.length) {
      window.soundEngine.playSuccess();
      this.showVisualFeedback(true);
      this.metrics.memoryTrials++;
      this.metrics.memoryHits++;
      this.metrics.memorySpanAchieved = Math.max(this.metrics.memorySpanAchieved, this.memoryLevel);
      this.addStar();
      this.addStar();

      if (this.memoryLevel < 5) {
        this.memoryLevel++;
        this.setInstruction('¡Extraordinario! Sumamos un movimiento más a la coreografía.');
        setTimeout(() => {
          this.startMemoryRound();
        }, 1600);
      } else {
        window.soundEngine.playFanfare();
        this.setInstruction('¡Medalla de Oro! Coreografía de patinaje dominada.');
        setTimeout(() => {
          this.showScreen('screenHub');
        }, 2200);
      }
    }
  }

  /* -------------------------------------------------------------
     MÓDULO 4: LABERINTO DE CONOS (ESPACIO TOPOLÓGICO RELATIVO)
     ------------------------------------------------------------- */
  startMatrixModule() {
    window.soundEngine.playClick();
    this.matrixRound = 0;
    this.showScreen('screenMatrix');

    document.querySelectorAll('.grid-cell:not(.center-cell)').forEach(cell => {
      cell.onclick = () => {
        const relDir = cell.dataset.direction;
        this.handleMatrixInput(relDir);
      };
    });

    this.nextMatrixRound();
  }

  nextMatrixRound() {
    if (this.matrixRound >= this.matrixMaxRounds) {
      window.soundEngine.playFanfare();
      this.setInstruction('¡Magnífico! Has dominado todas las posiciones en la pista.');
      setTimeout(() => {
        this.showScreen('screenHub');
      }, 2000);
      return;
    }

    this.matrixRound++;
    document.getElementById('matrixRoundIndicator').textContent = 
      `Ronda ${this.matrixRound} de ${this.matrixMaxRounds}`;

    const validPositions = ['up', 'down', 'left', 'right'];
    this.matrixTargetDirection = validPositions[Math.floor(Math.random() * validPositions.length)];

    const promptText = {
      up: '¿Cuál cono está ARRIBA de los patines centrales? 🟡',
      down: '¿Cuál cono está ABAJO de los patines centrales? 🟢',
      left: '¿Cuál cono está a la IZQUIERDA de los patines centrales? 🟠',
      right: '¿Cuál cono está a la DERECHA de los patines centrales? 🔵'
    };

    this.setInstruction(promptText[this.matrixTargetDirection]);
  }

  handleMatrixInput(chosenDir) {
    if (!this.matrixTargetDirection) return;

    this.metrics.matrixTrials++;
    const isCorrect = (chosenDir === this.matrixTargetDirection);

    if (isCorrect) {
      this.metrics.matrixHits++;
      window.soundEngine.playSuccess();
      this.showVisualFeedback(true);
      this.addStar();
    } else {
      window.soundEngine.playMistake();
      this.showVisualFeedback(false);
    }

    this.matrixTargetDirection = null;
    setTimeout(() => {
      this.nextMatrixRound();
    }, 1200);
  }

  /* -------------------------------------------------------------
     GENERACIÓN DEL REPORTE FINAL POST-JUEGO
     ------------------------------------------------------------- */
  generateAndShowReport() {
    window.soundEngine.playClick();
    this.showScreen('screenReport');
    if (window.reportGenerator) {
      window.reportGenerator.generate(this.profile, this.metrics);
    }
  }
}

// Iniciar aplicación al cargar
document.addEventListener('DOMContentLoaded', () => {
  window.cognitiveApp = new CognitiveApp();
});
