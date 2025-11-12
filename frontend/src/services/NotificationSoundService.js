/**
 * Notification Sound Service
 * Provides sound effects for notifications
 * Admin: Plays custom MP3 sound with loop until notification opened
 */
class NotificationSoundService {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 1.0; // Maximum volume for admin
    this.adminAudio = null; // Audio element for admin notification
    this.isLooping = false; // Track if admin notification is looping
    this.initAudioContext();
    this.initAdminAudio();
  }

  async initAudioContext() {
    try {
      // Use Web Audio API for better cross-browser support
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Initialize admin notification audio
  initAdminAudio() {
    try {
      // Add cache busting timestamp to ensure fresh audio file
      const cacheBuster = new Date().getTime();
      this.adminAudio = new Audio(`/sounds/admin_notification.mp3?v=${cacheBuster}`);
      this.adminAudio.volume = 1.0; // Maximum volume
      this.adminAudio.loop = true; // Loop until stopped
      
      // Handle audio load events
      this.adminAudio.addEventListener('loadeddata', () => {
        console.log('✅ Admin notification sound loaded successfully:', this.adminAudio.duration + 's');
      });
      
      this.adminAudio.addEventListener('error', (e) => {
        console.error('❌ Failed to load admin notification sound:', e);
      });
      
      // Preload audio
      this.adminAudio.load();
    } catch (error) {
      console.warn('Could not initialize admin notification audio:', error);
    }
  }

  // Generate notification sound using Web Audio API (fallback for client)
  generateNotificationSound(frequency = 800, duration = 200, type = 'new') {
    if (!this.audioContext || !this.enabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sounds for different notification types
      if (type === 'new') {
        // New notification: pleasant chime
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime + 0.1);
      } else if (type === 'success') {
        // Success: ascending tone
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime + 0.1);
      } else if (type === 'update') {
        // Status update: gentle ding
        oscillator.frequency.setValueAtTime(frequency * 1.2, this.audioContext.currentTime);
      }

      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Play new notification sound (Admin: MP3 with loop, Client: generated sound)
  playNewNotification(userType = 'client') {
    console.log('🎵 playNewNotification called for:', userType);
    
    // For ADMIN: play custom MP3 with loop (NO FALLBACK to generated sound)
    if (userType === 'admin' && this.adminAudio) {
      // If already looping, restart it
      if (this.isLooping) {
        console.log('🔄 Sound already looping, restarting...');
        this.adminAudio.pause();
        this.adminAudio.currentTime = 0;
      }
      
      try {
        this.adminAudio.currentTime = 0; // Reset to start
        this.adminAudio.volume = 1.0; // Maximum volume
        this.adminAudio.loop = true; // Enable loop
        
        console.log('🔔 Playing admin notification sound from MP3...');
        
        // Play with promise handling for autoplay policy
        const playPromise = this.adminAudio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Admin notification sound playing (looping) - Duration:', this.adminAudio.duration + 's');
              this.isLooping = true;
            })
            .catch(error => {
              console.warn('⚠️ Autoplay prevented, will play on next user interaction:', error);
              // Try to play on next user interaction
              document.addEventListener('click', () => {
                console.log('🖱️ User clicked, playing sound now...');
                this.adminAudio.play();
                this.isLooping = true;
              }, { once: true });
            });
        }
      } catch (error) {
        console.error('❌ Could not play admin notification sound:', error);
        console.error('Error details:', error.message);
        // DO NOT fallback to generated sound for admin
      }
    } else if (userType === 'client') {
      // For client: use generated sound
      console.log('🔊 Using generated sound for client');
      this.generateNotificationSound(800, 300, 'new');
    }
  }

  // Stop admin notification sound (call when notification opened)
  stopAdminNotification() {
    if (this.adminAudio && this.isLooping) {
      try {
        this.adminAudio.pause();
        this.adminAudio.currentTime = 0;
        this.isLooping = false;
        console.log('🔕 Admin notification sound stopped');
      } catch (error) {
        console.warn('Could not stop admin notification sound:', error);
      }
    }
  }

  // Play status update sound
  playStatusUpdate() {
    this.generateNotificationSound(600, 200, 'update');
  }

  // Play success sound
  playSuccess() {
    this.generateNotificationSound(900, 400, 'success');
  }

  // Play click sound
  playClick() {
    this.generateNotificationSound(400, 100, 'click');
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }

  // Set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('notificationVolume', this.volume.toString());
  }

  // Load settings from localStorage
  loadSettings() {
    const savedEnabled = localStorage.getItem('notificationSoundsEnabled');
    const savedVolume = localStorage.getItem('notificationVolume');
    
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }
    
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  // Resume audio context if suspended (required by some browsers)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }
  }
}

// Create singleton instance
const notificationSoundService = new NotificationSoundService();

// Load settings on initialization
notificationSoundService.loadSettings();

// Resume audio context on user interaction (required by browsers)
document.addEventListener('click', () => {
  notificationSoundService.resumeAudioContext();
}, { once: true });

export default notificationSoundService;