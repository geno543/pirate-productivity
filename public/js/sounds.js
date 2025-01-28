// Disable autoSuspend so the audio context won't suspend automatically
Howler.autoSuspend = false;

// Sound effects system using Howler.js
const SoundEffects = {
  initialized: false,
  sounds: {},
  audioReady: false,
  initializationInProgress: false,
  soundConfigs: {
    buttonClick:   { src: 'sounds/button-click.mp3',   volume: 0.3 },
    notification:  { src: 'sounds/notification.mp3',   volume: 0.3 },
    questComplete: { src: 'sounds/quest-complete.mp3', volume: 0.4 },
    coinCollect:   { src: 'sounds/coin-collect.mp3',   volume: 0.4 },
    shipMove:      { src: 'sounds/ship-move.mp3',      volume: 0.2 },
    newQuest:      { src: 'sounds/new-quest.mp3',      volume: 0.3 },
    sail:          { src: 'sounds/sail.mp3',           volume: 0.3 },
    storm:         { src: 'sounds/storm.mp3',          volume: 0.3 }
  },

  init() {
    if (this.initialized || this.initializationInProgress) return;
    this.initializationInProgress = true;

    // Configure Howler global settings
    Howler.html5PoolSize = 30;   // Increase audio pool size
    Howler.autoUnlock = false;   // We'll handle unlocking manually

    // Setup audio unlocking and initialization
    const initAudio = async (event) => {
      // Prevent default for touch events
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      if (this.audioReady) {
        this.removeEventListeners(initAudio);
        return;
      }
      
      try {
        // Create audio context if it doesn't exist
        if (!Howler.ctx) {
          Howler.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume audio context
        if (Howler.ctx.state === 'suspended') {
          await Howler.ctx.resume();
          console.log('Audio context resumed');
        }

        // Create and play a short silent sound
        const buffer = Howler.ctx.createBuffer(1, 1, 22050);
        const source = Howler.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(Howler.ctx.destination);
        source.start(0);

        // Initialize sounds after audio context is ready
        await this.initSounds();

        this.audioReady = true;
        console.log('Audio system unlocked');

        // Remove event listeners
        this.removeEventListeners(initAudio);
      } catch (error) {
        console.error('Error initializing audio:', error);
        this.initializationInProgress = false;
      }
    };

    // Add event listeners for user interaction
    this.addEventListeners(initAudio);

    this.initialized = true;
    console.log('Sound system ready for initialization');
  },

  addEventListeners(handler) {
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, handler);
    });
  },

  removeEventListeners(handler) {
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.removeEventListener(event, handler);
    });
  },

  async initSounds() {
    if (Object.keys(this.sounds).length > 0) return; // Prevent double initialization

    const loadPromises = [];

    // Create each sound instance
    Object.entries(this.soundConfigs).forEach(([name, config]) => {
      try {
        const sound = new Howl({
          src: [config.src],
          volume: config.volume,
          preload: true,
          html5: true,     // Force HTML5 Audio for better compatibility
          format: ['mp3'],
          onloaderror: (id, error) => {
            console.error(`Failed to load sound '${name}':`, error);
          },
          onload: () => {
            console.log(`Sound '${name}' loaded successfully`);
          }
        });

        this.sounds[name] = sound;
        
        // Create a promise for this sound's loading
        loadPromises.push(new Promise((resolve, reject) => {
          sound.once('load', resolve);
          sound.once('loaderror', reject);
        }));
      } catch (error) {
        console.error(`Error creating sound '${name}':`, error);
      }
    });

    // Wait for all sounds to load
    try {
      await Promise.all(loadPromises);
      console.log('All sounds loaded successfully');
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  },

  play(soundName) {
    if (!this.initialized || !this.audioReady) {
      console.log('Audio system not ready. Please interact with the page first.');
      return;
    }

    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }

    try {
      sound.play();
    } catch (err) {
      console.error(`Error playing sound '${soundName}':`, err);
    }
  },

  stopAll() {
    if (!this.initialized || !this.audioReady) return;
    Object.values(this.sounds).forEach(sound => {
      if (sound && typeof sound.stop === 'function') {
        sound.stop();
      }
    });
  }
};

// Initialize the sound system on DOM load
document.addEventListener('DOMContentLoaded', () => {
  SoundEffects.init();
});

// Expose globally
window.SoundEffects = SoundEffects;