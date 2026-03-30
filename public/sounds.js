class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.bgmEnabled = false;
    this.volume = 0.5;
    this.bgmTimeout = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  startBGM() {
    if (!this.bgmEnabled) return;
    this.init();
    this.playBGMLoop();
  }

  playBGMLoop() {
    if (!this.bgmEnabled) return;
    
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
    const note = notes[Math.floor(Math.random() * notes.length)];
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, this.audioContext.currentTime);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume * 0.08, this.audioContext.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.8);
    
    this.bgmTimeout = setTimeout(() => this.playBGMLoop(), 1000 + Math.random() * 2000);
  }

  stopBGM() {
    this.bgmEnabled = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
    }
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }
}

const soundManager = new SoundManager();