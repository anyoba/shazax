import { getSettings } from '../../services/concoursLocalStorage.js';

const SOUND_PATTERNS = {
  correct: [660, 880],
  wrong: [220, 160],
  finish: [523, 659, 784],
  badge: [784, 988, 1175],
};

export function playConcoursSound(type) {
  const settings = getSettings();
  if (!settings.soundEnabled || typeof window === 'undefined') return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const pattern = SOUND_PATTERNS[type] || SOUND_PATTERNS.correct;

  pattern.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, context.currentTime + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + index * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.09 + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + index * 0.09);
    oscillator.stop(context.currentTime + index * 0.09 + 0.13);
  });
}
