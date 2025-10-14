// src/lib/notificationSound.ts

/**
 * Play notification sound for reminders
 * Uses a pleasant notification tone
 */
export function playNotificationSound() {
  try {
    // Create AudioContext
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();

    // Create oscillators for a pleasant two-tone notification
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequencies for a pleasant notification sound
    oscillator1.frequency.value = 800; // Higher tone
    oscillator2.frequency.value = 600; // Lower tone
    oscillator1.type = "sine";
    oscillator2.type = "sine";

    // Set volume envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Play first tone
    oscillator1.start(now);
    oscillator1.stop(now + 0.15);

    // Play second tone slightly delayed
    oscillator2.start(now + 0.1);
    oscillator2.stop(now + 0.25);

    // Cleanup
    setTimeout(() => {
      audioContext.close();
    }, 500);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
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
