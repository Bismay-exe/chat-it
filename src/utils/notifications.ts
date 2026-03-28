const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

class NotificationService {
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio(NOTIFICATION_SOUND_URL);
      this.audio.load();
    }
  }

  play() {
    if (this.audio) {
      // Create a fresh instance or reset to start to allow overlapping sounds
      const playPromise = this.audio.cloneNode() as HTMLAudioElement;
      playPromise.play().catch(err => {
        console.warn('Audio playback failed (usually due to user interaction policy):', err);
      });
    }
  }
}

export const notificationService = new NotificationService();
