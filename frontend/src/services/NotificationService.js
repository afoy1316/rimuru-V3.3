import notificationNavigationService from './NotificationNavigationService';

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.audioContext = null;
    this.notificationSound = null;
    this.isTabActive = true;
    this.isPlayingSound = false; // Prevent overlapping sounds
    this.init();
  }

  async init() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return;
    }

    // Check current permission
    this.permission = Notification.permission;

    // Initialize audio
    this.initAudio();

    // Track tab visibility
    this.trackTabVisibility();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support desktop notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    // Show user-friendly message before requesting
    if (this.permission === 'default') {
      try {
        // Request permission with user context
        const permission = await Notification.requestPermission();
        this.permission = permission;
        
        if (permission === 'granted') {
          // Show test notification
          this.showTestNotification();
        }
        
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  }

  showTestNotification() {
    // Show a welcome notification to confirm it's working
    setTimeout(() => {
      this.showNotification('🔔 Notifikasi Aktif!', {
        body: 'Anda akan menerima notifikasi untuk semua update penting.',
        type: 'info',
        data: { category: 'info' }
      });
    }, 1000);
  }

  initAudio() {
    try {
      // Create audio element for notification sound
      this.notificationSound = new Audio();
      
      // You can use a base64 encoded sound or external file
      // For now, I'll create a simple beep sound programmatically
      this.createNotificationSound();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  createNotificationSound() {
    try {
      // Create a pleasant and loud notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const createTone = (frequency, duration, startTime = 0) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Make it louder and more pleasant
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + startTime + 0.01); // Increased volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration / 1000);
        
        return new Promise((resolve) => {
          oscillator.onended = () => resolve();
        });
      };

      // Create a pleasant notification chime (single chime to avoid repetition)
      this.playSound = async () => {
        try {
          // Prevent overlapping sounds by checking if already playing
          if (this.isPlayingSound) {
            return;
          }
          this.isPlayingSound = true;
          
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          
          // Single pleasant notification chime - no repetition
          await Promise.all([
            createTone(523.25, 300, 0),    // C5 note (longer duration)
            createTone(659.25, 350, 0.05), // E5 note  
            createTone(783.99, 400, 0.1),  // G5 note (longest for pleasant ending)
          ]);
          
          // Reset playing flag after sound completes
          setTimeout(() => {
            this.isPlayingSound = false;
          }, 600); // Wait for all tones to complete
          
        } catch (error) {
          console.warn('Could not play Web Audio notification:', error);
          // Fallback to audio element
          this.fallbackSound();
        }
      };
    } catch (error) {
      console.warn('Web Audio API not supported, using enhanced fallback');
      this.setupFallbackSound();
    }
  }

  setupFallbackSound() {
    // Enhanced fallback with louder notification sound
    try {
      this.notificationSound = new Audio();
      // Using a more pleasant notification sound (data URL for a nice chime)
      this.notificationSound.src = 'data:audio/wav;base64,UklGRv4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YdoCAAC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4';
      this.notificationSound.volume = 0.8; // Set high volume
      
      this.playSound = () => {
        this.fallbackSound();
      };
    } catch (error) {
      console.warn('Audio fallback initialization failed:', error);
      this.playSound = () => console.warn('No audio playback available');
    }
  }

  fallbackSound() {
    try {
      if (this.notificationSound) {
        this.notificationSound.currentTime = 0;
        this.notificationSound.volume = 0.8; // High volume
        this.notificationSound.play().catch(e => {
          console.warn('Fallback sound play failed:', e);
          // Try system beep as last resort
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            utterance.rate = 10;
            window.speechSynthesis.speak(utterance);
          }
        });
      }
    } catch (error) {
      console.warn('Could not play fallback notification sound:', error);
    }
  }

  trackTabVisibility() {
    // Track if tab/window is active
    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
    });

    window.addEventListener('focus', () => {
      this.isTabActive = true;
    });

    window.addEventListener('blur', () => {
      this.isTabActive = false;
    });
  }

  async showNotification(title, options = {}, shouldPlaySound = true) {
    // Only play sound if requested (prevents overlapping sounds)
    if (shouldPlaySound && this.playSound) {
      try {
        await this.playSound();
      } catch (error) {
        console.warn('Could not play sound:', error);
      }
    }

    // Only show desktop notification if permission granted (in-app notifications removed)
    if (this.permission === 'granted') {
      const defaultOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'rimuru-notification',
        requireInteraction: false,
        silent: true, // We handle sound ourselves
        ...options
      };

      try {
        const notification = new Notification(title, defaultOptions);
        
        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click to focus window
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options.onClick) {
            options.onClick();
          }
        };

        return notification;
      } catch (error) {
        console.error('Failed to show desktop notification:', error);
      }
    }

    return null;
  }

  // In-app notifications removed - only desktop notifications are shown
  showInAppNotification(title, options = {}) {
    // This method is kept for compatibility but no longer shows in-app notifications
    // Only desktop notifications are shown via showNotification method
    console.log('In-app notification disabled:', title, options.body || '');
  }

  // Admin notification
  showAdminNotification(title, message, type = 'info', shouldPlaySound = true, referenceId = null) {
    const options = {
      body: message,
      icon: '/favicon.ico',
      tag: `admin-${type}`,
      data: { type: 'admin', category: type, referenceId },
      silent: !shouldPlaySound, // Control sound via notification options
      onClick: () => {
        notificationNavigationService.handleNotificationClick(type, referenceId, 'admin');
      }
    };

    return this.showNotification(`🔔 ${title}`, options, shouldPlaySound);
  }

  // Client notification  
  showClientNotification(title, message, type = 'info', shouldPlaySound = true, referenceId = null) {
    const options = {
      body: message,
      icon: '/favicon.ico',
      tag: `client-${type}`,
      data: { type: 'client', category: type, referenceId },
      silent: !shouldPlaySound, // Control sound via notification options
      onClick: () => {
        notificationNavigationService.handleNotificationClick(type, referenceId, 'client');
      }
    };

    return this.showNotification(`💬 ${title}`, options, shouldPlaySound);
  }

  // Check if notifications are supported and enabled
  isSupported() {
    return 'Notification' in window;
  }

  isEnabled() {
    return this.permission === 'granted';
  }

  getPermissionStatus() {
    return this.permission;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;