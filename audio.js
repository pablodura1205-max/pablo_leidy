/**
 * MOTOR DE AUDIO Y VOZ SINTETIZADA (WEB AUDIO API & WEB SPEECH API)
 * Totalmente autónomo sin dependencias externas ni archivos MP3.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.speechEnabled = true;
    this.selectedVoice = null;

    // Inicializar síntesis de voz
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoice();
      };
      this.loadVoice();
    }
  }

  // Inicializar el contexto de audio tras el primer clic del usuario (requisito de navegadores modernos)
  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  loadVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Priorizar voces en español amigables
    this.selectedVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Sabina') || v.name.includes('Helena') || v.name.includes('Google'))) 
      || voices.find(v => v.lang.startsWith('es')) 
      || null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  // Reproducir tono musical puro
  playTone(frequency, type = 'sine', duration = 0.25, gainLevel = 0.15) {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainLevel, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Tono de clic táctil
  playClick() {
    this.playTone(600, 'triangle', 0.08, 0.1);
  }

  // Sonido de Acierto (Arpegio alegre)
  playSuccess() {
    if (this.isMuted) return;
    this.initAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do agudo
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.18);
      }, idx * 70);
    });
  }

  // Sonido de Fallo (Amigable, suave)
  playMistake() {
    if (this.isMuted) return;
    this.initAudioContext();
    const notes = [320, 260];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.22, 0.12);
      }, idx * 110);
    });
  }

  // Sonido de deslizamiento de patines (ruedas / cuchilla)
  playSkateGlide() {
    if (this.isMuted) return;
    this.playTone(480, 'sine', 0.28, 0.12);
  }

  // Sonido de salto de patinaje
  playSkateJump() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch(e) {}
  }

  // Sonido de agacharse en patines
  playSkateCrouch() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.audioCtx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.22);
    } catch(e) {}
  }

  // Tono específico por dirección para memoria espacial
  playDirectionTone(direction) {
    const tones = {
      up: 587.33,     // Re
      right: 493.88,  // Si
      down: 392.00,   // Sol
      left: 440.00    // La
    };
    const freq = tones[direction] || 440;
    this.playTone(freq, 'sine', 0.35, 0.2);
  }

  // Fanfarria al completar una misión
  playFanfare() {
    if (this.isMuted) return;
    const fanfareNotes = [
      { f: 523, d: 150 },
      { f: 659, d: 150 },
      { f: 784, d: 150 },
      { f: 1046, d: 450 }
    ];
    let time = 0;
    fanfareNotes.forEach(n => {
      setTimeout(() => {
        this.playTone(n.f, 'triangle', n.d / 1000, 0.2);
      }, time);
      time += n.d;
    });
  }

  // Sintetizador de voz guiada para niños
  speak(text, callback) {
    if (this.isMuted || !this.speechEnabled || !('speechSynthesis' in window)) {
      if (callback) callback();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Detener pronunciaciones previas
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;  // Un toque más pausado para fácil comprensión infantil
      utterance.pitch = 1.15; // Tono ligeramente más cálido y animado
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      if (callback) {
        utterance.onend = callback;
        utterance.onerror = callback;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (callback) callback();
    }
  }
}

// Instancia global
window.soundEngine = new SoundEngine();
