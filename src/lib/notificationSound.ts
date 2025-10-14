// src/lib/notificationSound.ts

/**
 * Alarm sound manager - works like iPhone alarm clock
 * Keeps playing until manually stopped
 */
class AlarmSoundManager {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start playing alarm sound (loops until stopped)
   */
  start() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playAlarmCycle();

    // Repeat every 2 seconds
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playAlarmCycle();
      }
    }, 2000);
  }

  /**
   * Stop playing alarm sound
   */
  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  /**
   * Play one cycle of the alarm sound
   */
  private playAlarmCycle() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;

      // Create new context for each cycle
      const audioContext = new AudioContextClass();
      this.audioContext = audioContext;

      // Create alarm tone (similar to iOS alarm)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency for alarm-like sound
      oscillator.frequency.value = 880; // A5 note - pleasant wake-up tone
      oscillator.type = "sine";

      // Volume envelope - crescendo effect like iPhone alarm
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.5);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 1.0);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

      // Play the tone
      oscillator.start(now);
      oscillator.stop(now + 1.5);

      // Cleanup this cycle after it finishes
      setTimeout(() => {
        if (audioContext.state !== "closed") {
          audioContext.close().catch(() => {});
        }
      }, 1600);
    } catch (error) {
      console.error("Error playing alarm cycle:", error);
    }
  }

  /**
   * Check if alarm is currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

// Export singleton instance
export const alarmSound = new AlarmSoundManager();

/**
 * Legacy function - now uses alarm manager
 */
export function playNotificationSound() {
  alarmSound.start();
}

/**
 * Stop notification sound
 */
export function stopNotificationSound() {
  alarmSound.stop();
}

/**
 * Alternative: Play system notification sound using HTML5 Audio
 * This uses a data URI for a simple beep sound
 */
export function playSimpleBeep() {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKrj77hlHQU2kdfy0HotBSB1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUugc7y2Ik2CBxqvfDjnE4MDk6o4/C5Zx4FNpHX8tB6LQUfccXv45ZDCxFYrOnnrVoXCEKb3PLDcCYFLoHO8tmJNggcab3w5ZxODA5NqOPwumgeBTWR1/LQei0FH3HF7+OWRAsSV6zp6K5bGQdBmtzy"
    );
    audio.volume = 0.5;
    audio.play().catch((err) => console.error("Error playing sound:", err));
  } catch (error) {
    console.error("Error playing beep:", error);
  }
}
